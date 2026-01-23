import { useState, useEffect, useCallback } from 'react';
import type { AnalysisResult } from '../types/analysis';

export interface CallHistoryEntry {
  id: string;
  date: string;
  callLabel: string;
  overallScore: number;
  results: AnalysisResult;
  callTranscript: string;
  feedbackStyle: 'direct' | 'supportive';
}

const CALL_HISTORY_KEY = 'call-coach-history';
const MAX_HISTORY_ITEMS = 20;

function generateCallLabel(transcript: string): string {
  // Try to extract prospect name from transcript
  // Look for patterns like "Hi [Name]" or "Is [Name] available?"
  const namePatterns = [
    /(?:Hi|Hello|Hey)\s+([A-Z][a-z]+)/i,
    /Is\s+([A-Z][a-z]+)\s+available/i,
    /speaking\s+(?:with|to)\s+([A-Z][a-z]+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      return `Call with ${match[1]}`;
    }
  }

  // Fallback to timestamp-based label
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `Call at ${time}`;
}

export function useCallHistory() {
  const [history, setHistory] = useState<CallHistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CALL_HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load call history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CALL_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save call history:', error);
    }
  }, [history]);

  const addToHistory = useCallback((
    results: AnalysisResult,
    callTranscript: string,
    feedbackStyle: 'direct' | 'supportive'
  ) => {
    const entry: CallHistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      callLabel: generateCallLabel(callTranscript),
      overallScore: results.overallScore,
      results,
      callTranscript,
      feedbackStyle,
    };

    setHistory((prev) => {
      const newHistory = [entry, ...prev].slice(0, MAX_HISTORY_ITEMS);
      return newHistory;
    });

    return entry.id;
  }, []);

  const getHistoryEntry = useCallback((id: string): CallHistoryEntry | undefined => {
    return history.find((entry) => entry.id === id);
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(CALL_HISTORY_KEY);
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  return {
    history,
    addToHistory,
    getHistoryEntry,
    clearHistory,
    deleteEntry,
  };
}
