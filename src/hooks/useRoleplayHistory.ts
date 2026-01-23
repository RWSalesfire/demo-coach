import { useState, useEffect, useCallback } from 'react';
import type { AnalysisResult } from '../types/analysis';

export interface RoleplayHistoryEntry {
  id: string;
  date: string;
  personaId: string;
  personaName: string;
  callDuration: number;
  overallScore: number;
  results: AnalysisResult;
  transcript: string;
  feedbackStyle: 'direct' | 'supportive';
}

const ROLEPLAY_HISTORY_KEY = 'roleplay-coach-history';
const MAX_HISTORY_ITEMS = 20;

export function useRoleplayHistory() {
  const [history, setHistory] = useState<RoleplayHistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ROLEPLAY_HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load roleplay history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(ROLEPLAY_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save roleplay history:', error);
    }
  }, [history]);

  const addToHistory = useCallback((
    personaId: string,
    personaName: string,
    callDuration: number,
    results: AnalysisResult,
    transcript: string,
    feedbackStyle: 'direct' | 'supportive'
  ) => {
    const entry: RoleplayHistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      personaId,
      personaName,
      callDuration,
      overallScore: results.overallScore,
      results,
      transcript,
      feedbackStyle,
    };

    setHistory((prev) => {
      const newHistory = [entry, ...prev].slice(0, MAX_HISTORY_ITEMS);
      return newHistory;
    });

    return entry.id;
  }, []);

  const getHistoryEntry = useCallback((id: string): RoleplayHistoryEntry | undefined => {
    return history.find((entry) => entry.id === id);
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(ROLEPLAY_HISTORY_KEY);
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
