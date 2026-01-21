import { useState, useCallback } from 'react';
import { analyzeDemo } from '../services/claudeApi';
import type { FormState } from '../types/form';
import type { AnalysisResult } from '../types/analysis';

interface UseAnalysisResult {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  analyze: (formData: FormState) => Promise<void>;
  reset: () => void;
}

export function useAnalysis(): UseAnalysisResult {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (formData: FormState) => {
    setIsLoading(true);
    setError(null);

    try {
      const analysisResult = await analyzeDemo(formData);
      setResult(analysisResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during analysis';
      setError(message);
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    isLoading,
    error,
    analyze,
    reset,
  };
}
