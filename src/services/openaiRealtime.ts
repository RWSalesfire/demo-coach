import type { TranscriptEntry, RealtimeConnectionState, ConnectionStatus } from '../types/roleplay';

// WebSocket message types
interface SessionConfig {
  modalities: string[];
  instructions: string;
  voice: string;
  input_audio_format: string;
  output_audio_format: string;
  turn_detection: {
    type: string;
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
  };
}

type ServerEvent =
  | { type: 'session.created'; session: { id: string } }
  | { type: 'session.updated' }
  | { type: 'input_audio_buffer.speech_started' }
  | { type: 'input_audio_buffer.speech_stopped' }
  | { type: 'input_audio_buffer.committed' }
  | { type: 'conversation.item.created'; item: { id: string; role: string; content?: Array<{ transcript?: string }> } }
  | { type: 'response.created' }
  | { type: 'response.audio.delta'; delta: string }
  | { type: 'response.audio.done' }
  | { type: 'response.audio_transcript.delta'; delta: string }
  | { type: 'response.audio_transcript.done'; transcript: string }
  | { type: 'response.done' }
  | { type: 'conversation.item.input_audio_transcription.completed'; transcript: string; item_id: string }
  | { type: 'error'; error: { message: string; type?: string; code?: string } };

export interface RealtimeCallbacks {
  onStateChange: (state: RealtimeConnectionState) => void;
  onAudioReceived: (audio: Int16Array) => void;
  onTranscriptUpdate: (entry: TranscriptEntry) => void;
  onUserSpeakingChange: (isSpeaking: boolean) => void;
  onAISpeakingChange: (isSpeaking: boolean) => void;
  onError: (error: Error) => void;
}

export class OpenAIRealtimeClient {
  private ws: WebSocket | null = null;
  private callbacks: RealtimeCallbacks | null = null;
  private sessionId: string | null = null;
  private currentTranscriptId = 0;
  private partialAITranscript = '';

  constructor() {
    // Constructor is empty - configuration happens in connect()
  }

  async connect(systemPrompt: string, callbacks: RealtimeCallbacks): Promise<void> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('Missing OpenAI API key. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    this.callbacks = callbacks;
    this.callbacks.onStateChange({ status: 'connecting' });

    return new Promise((resolve, reject) => {
      try {
        // Connect to OpenAI Realtime API
        const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
        this.ws = new WebSocket(url, [
          'realtime',
          `openai-insecure-api-key.${apiKey}`,
          'openai-beta.realtime-v1',
        ]);

        this.ws.onopen = () => {
          // Configure the session
          const sessionConfig: SessionConfig = {
            modalities: ['text', 'audio'],
            instructions: systemPrompt,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          };

          this.send({
            type: 'session.update',
            session: sessionConfig,
          });
        };

        this.ws.onmessage = (event) => {
          try {
            const data: ServerEvent = JSON.parse(event.data);
            this.handleServerEvent(data, resolve);
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        this.ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          this.callbacks?.onStateChange({ status: 'error', error: 'Connection error' });
          this.callbacks?.onError(new Error('WebSocket connection error'));
          reject(new Error('WebSocket connection error'));
        };

        this.ws.onclose = (event) => {
          if (event.code !== 1000) {
            this.callbacks?.onStateChange({
              status: 'error',
              error: `Connection closed: ${event.reason || 'Unknown reason'}`
            });
          } else {
            this.callbacks?.onStateChange({ status: 'disconnected' });
          }
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (err) {
        this.callbacks?.onStateChange({ status: 'error', error: 'Failed to connect' });
        reject(err);
      }
    });
  }

  private handleServerEvent(event: ServerEvent, onConnected?: () => void): void {
    switch (event.type) {
      case 'session.created':
        this.sessionId = event.session.id;
        this.callbacks?.onStateChange({
          status: 'connected',
          sessionId: this.sessionId
        });
        onConnected?.();
        break;

      case 'session.updated':
        // Session configuration confirmed
        break;

      case 'input_audio_buffer.speech_started':
        this.callbacks?.onUserSpeakingChange(true);
        break;

      case 'input_audio_buffer.speech_stopped':
        this.callbacks?.onUserSpeakingChange(false);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User's speech has been transcribed
        const userEntry: TranscriptEntry = {
          id: `user-${this.currentTranscriptId++}`,
          speaker: 'sdr',
          text: event.transcript,
          timestamp: Date.now(),
          isFinal: true,
        };
        this.callbacks?.onTranscriptUpdate(userEntry);
        break;

      case 'response.created':
        this.callbacks?.onAISpeakingChange(true);
        this.partialAITranscript = '';
        break;

      case 'response.audio.delta':
        // Decode base64 audio and send to player
        const audioData = this.base64ToInt16Array(event.delta);
        this.callbacks?.onAudioReceived(audioData);
        break;

      case 'response.audio.done':
        // Audio stream complete for this response
        break;

      case 'response.audio_transcript.delta':
        // Partial AI transcript
        this.partialAITranscript += event.delta;
        break;

      case 'response.audio_transcript.done':
        // Final AI transcript
        const aiEntry: TranscriptEntry = {
          id: `ai-${this.currentTranscriptId++}`,
          speaker: 'prospect',
          text: event.transcript,
          timestamp: Date.now(),
          isFinal: true,
        };
        this.callbacks?.onTranscriptUpdate(aiEntry);
        this.partialAITranscript = '';
        break;

      case 'response.done':
        this.callbacks?.onAISpeakingChange(false);
        break;

      case 'error':
        console.error('Realtime API error:', event.error);
        this.callbacks?.onError(new Error(event.error.message));
        break;
    }
  }

  sendAudio(audioData: Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Convert Float32Array to Int16Array
    const int16Data = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      const s = Math.max(-1, Math.min(1, audioData[i]));
      int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Convert to base64
    const base64 = this.int16ArrayToBase64(int16Data);

    this.send({
      type: 'input_audio_buffer.append',
      audio: base64,
    });
  }

  interrupt(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Cancel the current response
    this.send({
      type: 'response.cancel',
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'User ended call');
      this.ws = null;
    }
    this.sessionId = null;
    this.callbacks = null;
  }

  private send(message: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private base64ToInt16Array(base64: string): Int16Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
  }

  private int16ArrayToBase64(int16Array: Int16Array): string {
    const bytes = new Uint8Array(int16Array.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionStatus(): ConnectionStatus {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      default:
        return 'disconnected';
    }
  }
}

// Singleton instance
let clientInstance: OpenAIRealtimeClient | null = null;

export function getRealtimeClient(): OpenAIRealtimeClient {
  if (!clientInstance) {
    clientInstance = new OpenAIRealtimeClient();
  }
  return clientInstance;
}

export function resetRealtimeClient(): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}
