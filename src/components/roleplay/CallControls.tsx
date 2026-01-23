import { Mic, MicOff, PhoneOff } from 'lucide-react';

interface CallControlsProps {
  isMuted: boolean;
  onMuteToggle: () => void;
  onEndCall: () => void;
  disabled?: boolean;
}

export function CallControls({ isMuted, onMuteToggle, onEndCall, disabled = false }: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-6">
      {/* Mute button */}
      <button
        onClick={onMuteToggle}
        disabled={disabled}
        className={`p-4 rounded-full transition-all duration-200 ${
          isMuted
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-sf-card text-white hover:bg-sf-border'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>

      {/* End call button */}
      <button
        onClick={onEndCall}
        disabled={disabled}
        className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="End Call"
      >
        <PhoneOff className="w-6 h-6" />
      </button>
    </div>
  );
}
