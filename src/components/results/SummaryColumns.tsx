import { CheckCircle, Target } from 'lucide-react';
import { Card } from '../ui';

interface SummaryColumnsProps {
  strengths: string[];
  improvements: string[];
}

export function SummaryColumns({ strengths, improvements }: SummaryColumnsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="font-semibold text-white">Key Strengths</h3>
        </div>
        <ul className="space-y-3">
          {strengths.map((strength, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-300">
              <span className="text-green-500 mt-1">•</span>
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
            <Target className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="font-semibold text-white">Priority Improvements</h3>
        </div>
        <ol className="space-y-3">
          {improvements.map((improvement, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-300">
              <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-orange-500/20 text-orange-500 text-xs font-medium">
                {index + 1}
              </span>
              <span>{improvement}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
