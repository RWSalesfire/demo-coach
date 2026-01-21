import { Send } from 'lucide-react';
import { Button } from '../ui';

interface AnalyzeButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export function AnalyzeButton({ onClick, isLoading, disabled }: AnalyzeButtonProps) {
  return (
    <Button
      onClick={onClick}
      isLoading={isLoading}
      disabled={disabled}
      className="w-full"
    >
      {isLoading ? (
        'Analyzing demo...'
      ) : (
        <>
          Analyze Demo
          <Send className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
