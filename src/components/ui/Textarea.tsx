import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  monospace?: boolean;
}

export function Textarea({
  error,
  monospace = false,
  className = '',
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      <textarea
        className={`w-full rounded-lg bg-gray-800 border px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none ${
          error ? 'border-red-500' : 'border-gray-700'
        } ${monospace ? 'font-mono text-sm' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
