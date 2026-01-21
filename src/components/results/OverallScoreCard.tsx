import { Card } from '../ui';
import { getScoreColor, getScoreBgColor } from '../../utils/scoreColors';
import type { AnalysisResult } from '../../types';

interface OverallScoreCardProps {
  result: AnalysisResult;
}

export function OverallScoreCard({ result }: OverallScoreCardProps) {
  const scoreColor = getScoreColor(result.overallScore);

  return (
    <Card className="text-center">
      <h2 className="text-lg font-semibold text-white mb-2">Overall Demo Score</h2>
      <p className="text-sm text-gray-400 mb-6">Based on Salesfire demo best practices</p>

      <div className={`text-6xl font-bold mb-8 ${scoreColor}`}>
        {result.overallScore.toFixed(1)}
        <span className="text-2xl text-gray-500">/10</span>
      </div>

      <div className="flex items-end justify-center gap-2 h-32">
        {result.categories.map((category, index) => {
          const heightPercent = (category.score / 10) * 100;
          const bgColor = getScoreBgColor(category.score);

          return (
            <div key={index} className="flex flex-col items-center gap-2 flex-1 max-w-12">
              <div className="relative w-full h-24 bg-gray-800 rounded-t-lg overflow-hidden">
                <div
                  className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${bgColor}`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 truncate w-full text-center">
                {category.name.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
