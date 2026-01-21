import { FileText } from 'lucide-react';
import { Card, Textarea } from '../ui';

interface TranscriptInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TranscriptInput({ value, onChange, error }: TranscriptInputProps) {
  const lineCount = value.split('\n').filter(line => line.trim()).length;

  return (
    <Card>
      <div className="flex items-start gap-4 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
          <FileText className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            Demo Transcript
            <span className="text-xs font-normal text-red-400">Required</span>
          </h3>
          <p className="text-sm text-gray-400">Paste your Zoom transcript</p>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Paste your demo transcript here...

Example format:
00:03:13 Russell: Hello, how are you?
00:03:15 Prospect: Good, thanks...`}
        monospace
        error={error}
        style={{ height: '200px' }}
      />
      <p className="mt-2 text-xs text-gray-500">
        {lineCount} {lineCount === 1 ? 'line' : 'lines'}
      </p>
    </Card>
  );
}
