import { MessageSquare } from 'lucide-react';
import { Card, Textarea } from '../ui';

interface DiscoveryInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function DiscoveryInput({ value, onChange }: DiscoveryInputProps) {
  return (
    <Card>
      <div className="flex items-start gap-4 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700">
          <MessageSquare className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            SDR Discovery Call
            <span className="text-xs font-normal text-gray-500">Optional</span>
          </h3>
          <p className="text-sm text-gray-400">Helps assess discovery continuation</p>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the SDR's initial call transcript here (optional)..."
        monospace
        style={{ height: '128px' }}
      />
    </Card>
  );
}
