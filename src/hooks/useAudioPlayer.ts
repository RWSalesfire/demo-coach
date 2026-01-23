import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseAudioPlayerReturn {
  isPlaying: boolean;
  volume: number;
  analyserNode: AnalyserNode | null;
  playAudioChunk: (audioData: Int16Array) => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  interrupt: () => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isProcessingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  // Initialize audio context lazily
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const ctx = new AudioContext({ sampleRate: 24000 }); // OpenAI outputs 24kHz
      audioContextRef.current = ctx;

      // Create analyser for visualization
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Create gain node for volume control
      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;
      gainNodeRef.current = gainNode;

      // Connect: analyser -> gain -> destination
      analyser.connect(gainNode);
      gainNode.connect(ctx.destination);
    }
    return audioContextRef.current;
  }, [volume]);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const ctx = getAudioContext();

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();
      if (!audioData) continue;

      // Convert Int16Array to Float32Array
      const floatData = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        floatData[i] = audioData[i] / 32768.0; // Convert from 16-bit to -1.0 to 1.0
      }

      // Create audio buffer
      const audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
      audioBuffer.copyToChannel(floatData, 0);

      // Create buffer source
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyserRef.current!);

      // Schedule playback
      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, nextPlayTimeRef.current);
      source.start(startTime);

      // Update next play time
      nextPlayTimeRef.current = startTime + audioBuffer.duration;

      setIsPlaying(true);
    }

    isProcessingRef.current = false;
  }, [getAudioContext]);

  const playAudioChunk = useCallback((audioData: Int16Array) => {
    audioQueueRef.current.push(audioData);
    processQueue();
  }, [processQueue]);

  const stop = useCallback(() => {
    audioQueueRef.current = [];
    nextPlayTimeRef.current = 0;
    setIsPlaying(false);

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
      gainNodeRef.current = null;
    }
  }, []);

  const interrupt = useCallback(() => {
    // Clear the queue and reset timing to stop current playback
    audioQueueRef.current = [];
    nextPlayTimeRef.current = 0;
    setIsPlaying(false);

    // Recreate audio context to immediately stop any playing audio
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
      gainNodeRef.current = null;
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume;
    }
  }, []);

  // Check if still playing based on queue
  useEffect(() => {
    const checkPlaying = setInterval(() => {
      const ctx = audioContextRef.current;
      if (ctx && audioQueueRef.current.length === 0) {
        if (ctx.currentTime >= nextPlayTimeRef.current) {
          setIsPlaying(false);
        }
      }
    }, 100);

    return () => clearInterval(checkPlaying);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isPlaying,
    volume,
    analyserNode: analyserRef.current,
    playAudioChunk,
    stop,
    setVolume,
    interrupt,
  };
}
