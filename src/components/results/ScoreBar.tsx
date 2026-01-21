import { getScoreBgColor } from '../../utils/scoreColors';

interface ScoreBarProps {
  score: number;
  maxScore?: number;
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreBar({
  score,
  maxScore = 10,
  height = 'md',
  showLabel = false,
}: ScoreBarProps) {
  const percentage = (score / maxScore) * 100;
  const bgColor = getScoreBgColor(score);

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      <div className={`w-full rounded-full bg-gray-700 overflow-hidden ${heightClasses[height]}`}>
        <div
          className={`${heightClasses[height]} rounded-full transition-all duration-500 ${bgColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>0</span>
          <span>{maxScore}</span>
        </div>
      )}
    </div>
  );
}
