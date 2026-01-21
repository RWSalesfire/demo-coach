import { useState, useCallback, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Header, TabBar } from './components/layout';
import { InputTab } from './components/input';
import { ResultsTab } from './components/results';
import { Button } from './components/ui';
import { useLocalStorage, useAnalysis } from './hooks';
import { validateForm } from './utils/validation';
import type { FormState, FormErrors, FeedbackStyle } from './types';

type TabType = 'input' | 'results';

const DEFAULT_FORM_STATE: FormState = {
  demoTranscript: '',
  prospectUrl: '',
  sdrTranscript: '',
  feedbackStyle: 'supportive',
};

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('input');
  const [formData, setFormData] = useLocalStorage<FormState>('demo-coach-form', DEFAULT_FORM_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const { result, isLoading, error, analyze, reset } = useAnalysis();

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [setFormData, errors]);

  // Handle feedback style change
  const handleFeedbackStyleChange = useCallback((style: FeedbackStyle) => {
    setFormData((prev) => ({ ...prev, feedbackStyle: style }));
  }, [setFormData]);

  // Handle analyze button click
  const handleAnalyze = useCallback(async () => {
    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    await analyze(formData);
  }, [formData, analyze]);

  // Auto-switch to results tab when analysis completes
  useEffect(() => {
    if (result) {
      setActiveTab('results');
    }
  }, [result]);

  // Handle retry after error
  const handleRetry = useCallback(() => {
    reset();
    setActiveTab('input');
  }, [reset]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header
        feedbackStyle={formData.feedbackStyle}
        onFeedbackStyleChange={handleFeedbackStyleChange}
      />

      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasResults={result !== null}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-400">Analysis Failed</p>
                <p className="text-sm text-red-300 mt-1">{error}</p>
              </div>
              <Button variant="secondary" onClick={handleRetry} className="text-sm py-2 px-4">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'input' ? (
          <InputTab
            formData={formData}
            errors={errors}
            isLoading={isLoading}
            onFieldChange={handleFieldChange}
            onAnalyze={handleAnalyze}
          />
        ) : (
          <ResultsTab result={result} />
        )}
      </main>
    </div>
  );
}

export default App;
