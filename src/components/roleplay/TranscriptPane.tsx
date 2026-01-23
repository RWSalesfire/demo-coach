import { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '../../types/roleplay';

interface TranscriptPaneProps {
  entries: TranscriptEntry[];
  isAISpeaking?: boolean;
  isUserSpeaking?: boolean;
}

export function TranscriptPane({ entries, isAISpeaking, isUserSpeaking }: TranscriptPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-sf-bg/50 rounded-lg"
    >
      {entries.length === 0 ? (
        <div className="text-center text-sf-muted py-8">
          <p className="text-sm">Waiting for conversation to start...</p>
        </div>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.id}
            className={`flex ${entry.speaker === 'sdr' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                entry.speaker === 'sdr'
                  ? 'bg-sf-green/20 text-sf-green'
                  : 'bg-sf-card text-white'
              } ${!entry.isFinal ? 'opacity-60' : ''}`}
            >
              <div className="text-xs font-medium mb-1 opacity-70">
                {entry.speaker === 'sdr' ? 'You' : 'Prospect'}
              </div>
              <p className="text-sm">
                {entry.text}
                {!entry.isFinal && <span className="animate-pulse">...</span>}
              </p>
            </div>
          </div>
        ))
      )}

      {/* Typing indicators */}
      {isAISpeaking && (
        <div className="flex justify-start">
          <div className="bg-sf-card text-white rounded-lg px-3 py-2">
            <div className="text-xs font-medium mb-1 opacity-70">Prospect</div>
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        </div>
      )}

      {isUserSpeaking && (
        <div className="flex justify-end">
          <div className="bg-sf-green/20 text-sf-green rounded-lg px-3 py-2">
            <div className="text-xs font-medium mb-1 opacity-70">You</div>
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-sf-green/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-sf-green/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-sf-green/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
