import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { Card } from '../ui';
import { ScoreBar } from './ScoreBar';
import { getScoreColor, getScoreBorderColor } from '../../utils/scoreColors';
import { CATEGORIES } from '../../constants/categories';
import type { CategoryAnalysis } from '../../types';

interface CategoryCardProps {
  category: CategoryAnalysis;
  index: number;
}

export function CategoryCard({ category, index }: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const categoryMeta = CATEGORIES[index];
  const Icon = categoryMeta?.icon;
  const scoreColor = getScoreColor(category.score);
  const borderColor = getScoreBorderColor(category.score);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          {Icon && (
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${borderColor} bg-gray-800`}>
              <Icon className={`h-5 w-5 ${scoreColor}`} />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white">{category.name}</h3>
            <p className="text-sm text-gray-400">{category.summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xl font-bold ${scoreColor}`}>
            {category.score}/10
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      <div className="mt-4">
        <ScoreBar score={category.score} height="sm" />
      </div>

      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-800 space-y-6">
          {category.quotes.map((quote, qIndex) => (
            <div key={qIndex} className="space-y-2">
              <div className="border-l-2 border-gray-600 pl-4">
                <p className="text-gray-300 italic">"{quote.transcript}"</p>
              </div>
              <p className="text-gray-400 text-sm pl-4">
                <span className="text-gray-500 font-medium">Coaching: </span>
                {quote.feedback}
              </p>
            </div>
          ))}

          {category.objections && category.objections.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-300">Objections Handled</h4>
              {category.objections.map((objection, oIndex) => (
                <div key={oIndex} className="bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-medium">"{objection.objection}"</p>
                    <span className={`text-sm font-bold ${getScoreColor(objection.score)}`}>
                      {objection.score}/10
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    <span className="text-gray-500 font-medium">Response: </span>
                    {objection.handling}
                  </p>
                  <p className="text-gray-400 text-sm">
                    <span className="text-gray-500 font-medium">Coaching: </span>
                    {objection.feedback}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-500 mb-1">Next Demo, Try This:</p>
                <p className="text-gray-300">{category.nextDemo}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
