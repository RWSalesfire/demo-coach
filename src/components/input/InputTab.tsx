import { TranscriptInput } from './TranscriptInput';
import { UrlInput } from './UrlInput';
import { DiscoveryInput } from './DiscoveryInput';
import { AnalyzeButton } from './AnalyzeButton';
import type { FormState, FormErrors } from '../../types';

interface InputTabProps {
  formData: FormState;
  errors: FormErrors;
  isLoading: boolean;
  onFieldChange: (field: keyof FormState, value: string) => void;
  onAnalyze: () => void;
}

export function InputTab({
  formData,
  errors,
  isLoading,
  onFieldChange,
  onAnalyze,
}: InputTabProps) {
  const hasRequiredFields = formData.demoTranscript.trim() && formData.prospectUrl.trim();

  return (
    <div className="space-y-6">
      <TranscriptInput
        value={formData.demoTranscript}
        onChange={(value) => onFieldChange('demoTranscript', value)}
        error={errors.demoTranscript}
      />
      <UrlInput
        value={formData.prospectUrl}
        onChange={(value) => onFieldChange('prospectUrl', value)}
        error={errors.prospectUrl}
      />
      <DiscoveryInput
        value={formData.sdrTranscript}
        onChange={(value) => onFieldChange('sdrTranscript', value)}
      />
      <AnalyzeButton
        onClick={onAnalyze}
        isLoading={isLoading}
        disabled={!hasRequiredFields || isLoading}
      />
    </div>
  );
}
