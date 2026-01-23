import { useState, useCallback, useRef, useEffect } from 'react';
import type { ProspectPersona, TranscriptEntry, RealtimeConnectionState } from '../types/roleplay';
import { buildPersonaSystemPrompt } from '../prompts/personaPrompts';
import { getRealtimeClient, resetRealtimeClient } from '../services/openaiRealtime';
import { useMicrophone } from './useMicrophone';
import { useAudioPlayer } from './useAudioPlayer';

export type CallState = 'idle' | 'connecting' | 'ringing' | 'active' | 'ending' | 'ended' | 'error';

export interface UseRealtimeCallReturn {
  // Connection state
  connectionState: RealtimeConnectionState;
  error: string | null;

  // Call state
  callState: CallState;
  callDuration: number;
  isAISpeaking: boolean;
  isUserSpeaking: boolean;
  isMuted: boolean;

  // Transcript
  transcript: TranscriptEntry[];

  // Actions
  startCall: (persona: ProspectPersona) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;

  // For visualization
  userAnalyserNode: AnalyserNode | null;
  aiAnalyserNode: AnalyserNode | null;
}

export function useRealtimeCall(): UseRealtimeCallReturn {
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>({ status: 'disconnected' });
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const callStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const microphone = useMicrophone();
  const audioPlayer = useAudioPlayer();

  // Update call duration every second
  useEffect(() => {
    if (callState === 'active' && callStartTimeRef.current) {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current!) / 1000));
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callState]);

  const startCall = useCallback(async (persona: ProspectPersona) => {
    setError(null);
    setCallState('connecting');
    setTranscript([]);
    setCallDuration(0);

    try {
      // Start microphone capture
      const stream = await microphone.startCapture();
      if (!stream) {
        throw new Error('Failed to access microphone');
      }

      // Build persona prompt
      const systemPrompt = buildPersonaSystemPrompt(persona);

      // Connect to OpenAI Realtime API
      const client = getRealtimeClient();

      await client.connect(systemPrompt, {
        onStateChange: (state) => {
          setConnectionState(state);
          if (state.status === 'connected') {
            setCallState('ringing');
            // Short delay then mark as active
            setTimeout(() => {
              setCallState('active');
              callStartTimeRef.current = Date.now();
            }, 1500);
          } else if (state.status === 'error') {
            setError(state.error || 'Connection error');
            setCallState('error');
          }
        },
        onAudioReceived: (audio) => {
          audioPlayer.playAudioChunk(audio);
        },
        onTranscriptUpdate: (entry) => {
          setTranscript(prev => [...prev, entry]);
        },
        onUserSpeakingChange: (speaking) => {
          setIsUserSpeaking(speaking);
          // Interrupt AI when user starts speaking
          if (speaking && isAISpeaking) {
            audioPlayer.interrupt();
            client.interrupt();
          }
        },
        onAISpeakingChange: (speaking) => {
          setIsAISpeaking(speaking);
        },
        onError: (err) => {
          console.error('Realtime error:', err);
          setError(err.message);
        },
      });

      // Set up audio processing to send mic data
      if (microphone.audioContext && stream) {
        const source = microphone.audioContext.createMediaStreamSource(stream);
        const processor = microphone.audioContext.createScriptProcessor(4096, 1, 1);
        audioProcessorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (callState === 'active' || callState === 'ringing') {
            const inputData = e.inputBuffer.getChannelData(0);
            client.sendAudio(inputData);
          }
        };

        source.connect(processor);
        processor.connect(microphone.audioContext.destination);
      }

    } catch (err) {
      console.error('Failed to start call:', err);
      setError(err instanceof Error ? err.message : 'Failed to start call');
      setCallState('error');
      microphone.stopCapture();
    }
  }, [microphone, audioPlayer, isAISpeaking]);

  const endCall = useCallback(() => {
    setCallState('ending');

    // Stop audio processor
    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current = null;
    }

    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Stop microphone
    microphone.stopCapture();

    // Stop audio player
    audioPlayer.stop();

    // Disconnect from OpenAI
    resetRealtimeClient();

    setConnectionState({ status: 'disconnected' });
    setIsAISpeaking(false);
    setIsUserSpeaking(false);
    setCallState('ended');
  }, [microphone, audioPlayer]);

  const toggleMute = useCallback(() => {
    microphone.toggleMute();
  }, [microphone]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callState !== 'idle' && callState !== 'ended') {
        endCall();
      }
    };
  }, [callState, endCall]);

  return {
    connectionState,
    error,
    callState,
    callDuration,
    isAISpeaking,
    isUserSpeaking,
    isMuted: microphone.isMuted,
    transcript,
    startCall,
    endCall,
    toggleMute,
    userAnalyserNode: microphone.analyserNode,
    aiAnalyserNode: audioPlayer.analyserNode,
  };
}

// Helper to format transcript for Claude scoring
export function formatTranscriptForScoring(transcript: TranscriptEntry[]): string {
  return transcript
    .filter(entry => entry.isFinal && entry.text.trim())
    .map(entry => {
      const speaker = entry.speaker === 'sdr' ? 'SDR' : 'Prospect';
      return `${speaker}: ${entry.text}`;
    })
    .join('\n');
}
