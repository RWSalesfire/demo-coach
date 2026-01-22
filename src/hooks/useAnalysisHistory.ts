import { useState, useEffect, useCallback } from 'react';
import type { AnalysisResult } from '../types/analysis';

export interface HistoryEntry {
  id: string;
  date: string;
  prospectName: string;
  prospectUrl: string;
  overallScore: number;
  results: AnalysisResult;
  demoTranscript: string;
  sdrTranscript: string;
  feedbackStyle: 'direct' | 'supportive';
}

const HISTORY_KEY = 'demo-coach-history';
const MAX_HISTORY_ITEMS = 20;

function extractProspectName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Remove www. and common TLDs to get a cleaner name
    return hostname
      .replace(/^www\./, '')
      .replace(/\.(com|co\.uk|org|net|io)$/, '')
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  } catch {
    return 'Unknown Prospect';
  }
}

export function useAnalysisHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }, [history]);

  const addToHistory = useCallback((
    results: AnalysisResult,
    prospectUrl: string,
    demoTranscript: string,
    sdrTranscript: string,
    feedbackStyle: 'direct' | 'supportive'
  ) => {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      prospectName: extractProspectName(prospectUrl),
      prospectUrl,
      overallScore: results.overallScore,
      results,
      demoTranscript,
      sdrTranscript,
      feedbackStyle,
    };

    setHistory((prev) => {
      const newHistory = [entry, ...prev].slice(0, MAX_HISTORY_ITEMS);
      return newHistory;
    });

    return entry.id;
  }, []);

  const getHistoryEntry = useCallback((id: string): HistoryEntry | undefined => {
    return history.find((entry) => entry.id === id);
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
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
