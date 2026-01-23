import { ArrowLeft, Phone, AlertCircle } from 'lucide-react';
import type { ProspectPersona, TranscriptEntry } from '../../types/roleplay';
import type { CallState } from '../../hooks/useRealtimeCall';
import { CallTimer } from './CallTimer';
import { CallControls } from './CallControls';
import { TranscriptPane } from './TranscriptPane';
import { AudioVisualizer } from './AudioVisualizer';

interface ActiveCallUIProps {
  persona: ProspectPersona;
  callState: CallState;
  callDuration: number;
  transcript: TranscriptEntry[];
  isAISpeaking: boolean;
  isUserSpeaking: boolean;
  isMuted: boolean;
  error: string | null;
  onMuteToggle: () => void;
  onEndCall: () => void;
  onBack: () => void;
  userAnalyserNode: AnalyserNode | null;
  aiAnalyserNode: AnalyserNode | null;
}

const callStateMessages: Record<CallState, string> = {
  idle: 'Ready to call',
  connecting: 'Connecting...',
  ringing: 'Ringing...',
  active: 'Connected',
  ending: 'Ending call...',
  ended: 'Call ended',
  error: 'Connection error',
};

export function ActiveCallUI({
  persona,
  callState,
  callDuration,
  transcript,
  isAISpeaking,
  isUserSpeaking,
  isMuted,
  error,
  onMuteToggle,
  onEndCall,
  onBack,
  userAnalyserNode,
  aiAnalyserNode,
}: ActiveCallUIProps) {
  const isCallActive = callState === 'active' || callState === 'ringing';
  const showControls = callState === 'active' || callState === 'ringing' || callState === 'connecting' || callState === 'ending';

  return (
    <div className="min-h-screen bg-sf-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sf-border">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sf-muted hover:text-white transition-colors"
          disabled={isCallActive}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <CallTimer seconds={callDuration} isActive={callState === 'active'} />

        <div className="w-20 text-right text-sm text-sf-muted">
          {callStateMessages[callState]}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 gap-6">
        {/* Persona info */}
        <div className="text-center py-6">
          <div className="text-6xl mb-4">{persona.avatar}</div>
          <h2 className="text-2xl font-bold text-white mb-1">{persona.name}</h2>
          <p className="text-sf-muted">{persona.title}</p>
          <p className="text-sf-green font-medium">{persona.company}</p>

          {/* AI speaking visualizer */}
          {(callState === 'active' || callState === 'ringing') && (
            <div className="mt-4 flex justify-center">
              <AudioVisualizer
                analyserNode={aiAnalyserNode}
                isActive={isAISpeaking}
                color="#4AE3B5"
                size="lg"
              />
            </div>
          )}

          {/* Status messages */}
          {callState === 'connecting' && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sf-muted">
              <div className="w-5 h-5 border-2 border-sf-green border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting to {persona.name.split(' ')[0]}...</span>
            </div>
          )}

          {callState === 'ringing' && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sf-green">
              <Phone className="w-5 h-5 animate-pulse" />
              <span>Ringing...</span>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-center justify-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Transcript */}
        <div className="flex-1 min-h-[300px] flex flex-col">
          <h3 className="text-sm font-medium text-sf-muted mb-2">Live Transcript</h3>
          <TranscriptPane
            entries={transcript}
            isAISpeaking={isAISpeaking}
            isUserSpeaking={isUserSpeaking}
          />
        </div>

        {/* User speaking indicator */}
        {showControls && (
          <div className="flex justify-center">
            <div className="flex items-center gap-3 px-4 py-2 bg-sf-card rounded-lg">
              <span className="text-sm text-sf-muted">Your mic</span>
              <AudioVisualizer
                analyserNode={userAnalyserNode}
                isActive={isUserSpeaking && !isMuted}
                color={isMuted ? '#666' : '#4AE3B5'}
                size="sm"
              />
              {isMuted && <span className="text-xs text-red-400">Muted</span>}
            </div>
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="py-4">
            <CallControls
              isMuted={isMuted}
              onMuteToggle={onMuteToggle}
              onEndCall={onEndCall}
              disabled={callState === 'ending'}
            />
          </div>
        )}

        {/* Error state - retry button */}
        {callState === 'error' && (
          <div className="py-4 text-center">
            <button
              onClick={onBack}
              className="px-6 py-2 bg-sf-card text-white rounded-lg hover:bg-sf-border transition-colors"
            >
              Back to Personas
            </button>
          </div>
        )}

        {/* Call ended state */}
        {callState === 'ended' && (
          <div className="py-4 text-center">
            <p className="text-sf-muted mb-4">Analyzing your performance...</p>
            <div className="w-8 h-8 border-2 border-sf-green border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}
