import { Flame } from 'lucide-react';
import { Toggle } from '../ui';
import type { FeedbackStyle } from '../../types';

interface HeaderProps {
  feedbackStyle: FeedbackStyle;
  onFeedbackStyleChange: (style: FeedbackStyle) => void;
}

export function Header({ feedbackStyle, onFeedbackStyleChange }: HeaderProps) {
  const toggleOptions = [
    { value: 'direct', label: 'Direct' },
    { value: 'supportive', label: 'Supportive' },
  ];

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Salesfire Demo Coach</h1>
            <p className="text-sm text-gray-400">AI-powered demo analysis & coaching</p>
          </div>
        </div>
        <Toggle
          options={toggleOptions}
          value={feedbackStyle}
          onChange={(value) => onFeedbackStyleChange(value as FeedbackStyle)}
        />
      </div>
    </header>
  );
}
