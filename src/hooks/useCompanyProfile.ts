import { useState, useEffect, useCallback } from 'react';
import type { CompanyProfile } from '../types/analysis';

const STORAGE_KEY = 'salesfire-company-profile';

export function useCompanyProfile() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const saveProfile = useCallback((newProfile: CompanyProfile) => {
    setProfile(newProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateProfile = useCallback((updates: Partial<CompanyProfile>) => {
    if (profile) {
      const updated = { ...profile, ...updates };
      saveProfile(updated);
    }
  }, [profile, saveProfile]);

  return {
    profile,
    isLoading,
    saveProfile,
    clearProfile,
    updateProfile,
    hasProfile: !!profile
  };
}
