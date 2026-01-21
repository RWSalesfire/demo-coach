import { Globe } from 'lucide-react';
import { Card, Input } from '../ui';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function UrlInput({ value, onChange, error }: UrlInputProps) {
  return (
    <Card>
      <div className="flex items-start gap-4 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
          <Globe className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            Prospect Website
            <span className="text-xs font-normal text-red-400">Required</span>
          </h3>
          <p className="text-sm text-gray-400">Used to assess demo personalisation</p>
        </div>
      </div>
      <Input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://www.prospect-website.com"
        error={error}
      />
    </Card>
  );
}
