import { OverallScoreCard } from './OverallScoreCard';
import { SummaryColumns } from './SummaryColumns';
import { CategoryCard } from './CategoryCard';
import type { AnalysisResult } from '../../types';

interface ResultsTabProps {
  result: AnalysisResult | null;
}

export function ResultsTab({ result }: ResultsTabProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-xl text-gray-400 mb-2">No analysis yet</p>
        <p className="text-gray-500">
          Enter your demo transcript and click "Analyze Demo" to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <OverallScoreCard result={result} />

      <SummaryColumns
        strengths={result.keyStrengths}
        improvements={result.priorityImprovements}
      />

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Detailed Analysis</h2>
        <div className="space-y-4">
          {result.categories.map((category, index) => (
            <CategoryCard key={index} category={category} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
