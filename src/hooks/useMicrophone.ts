import { useState, useCallback, useRef, useEffect } from 'react';

export type PermissionState = 'prompt' | 'granted' | 'denied' | null;

export interface UseMicrophoneReturn {
  stream: MediaStream | null;
  isActive: boolean;
  isMuted: boolean;
  error: string | null;
  permissionState: PermissionState;
  requestPermission: () => Promise<boolean>;
  startCapture: () => Promise<MediaStream | null>;
  stopCapture: () => void;
  toggleMute: () => void;
  analyserNode: AnalyserNode | null;
  audioContext: AudioContext | null;
}

export function useMicrophone(): UseMicrophoneReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Check initial permission state
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(result => {
          setPermissionState(result.state as PermissionState);
          result.onchange = () => {
            setPermissionState(result.state as PermissionState);
          };
        })
        .catch(() => {
          // Permissions API not supported
          setPermissionState(null);
        });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop immediately - we just wanted to trigger the permission prompt
      testStream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setPermissionState('denied');
          setError('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError(`Microphone error: ${err.message}`);
        }
      } else {
        setError('Failed to access microphone');
      }
      return false;
    }
  }, []);

  const startCapture = useCallback(async (): Promise<MediaStream | null> => {
    try {
      setError(null);

      // Request audio stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000, // OpenAI Realtime API expects 24kHz
        },
      });

      // Create audio context for analysis
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      // Create analyser for visualization
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Connect stream to analyser
      const source = audioContext.createMediaStreamSource(mediaStream);
      sourceRef.current = source;
      source.connect(analyser);

      setStream(mediaStream);
      setIsActive(true);
      setPermissionState('granted');

      return mediaStream;
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setPermissionState('denied');
          setError('Microphone access denied');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found');
        } else {
          setError(`Microphone error: ${err.message}`);
        }
      } else {
        setError('Failed to start microphone');
      }
      return null;
    }
  }, []);

  const stopCapture = useCallback(() => {
    // Stop all tracks
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Disconnect audio nodes
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setStream(null);
    setIsActive(false);
    setIsMuted(false);
  }, [stream]);

  const toggleMute = useCallback(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  return {
    stream,
    isActive,
    isMuted,
    error,
    permissionState,
    requestPermission,
    startCapture,
    stopCapture,
    toggleMute,
    analyserNode: analyserRef.current,
    audioContext: audioContextRef.current,
  };
}
