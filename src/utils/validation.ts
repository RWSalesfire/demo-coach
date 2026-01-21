import type { FormState, FormErrors } from '../types';

export function validateUrl(url: string): boolean {
  if (!url.trim()) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateForm(formData: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!formData.demoTranscript.trim()) {
    errors.demoTranscript = 'Demo transcript is required';
  }

  if (!formData.prospectUrl.trim()) {
    errors.prospectUrl = 'Prospect website URL is required';
  } else if (!validateUrl(formData.prospectUrl)) {
    errors.prospectUrl = 'Please enter a valid URL (e.g., https://example.com)';
  }

  return errors;
}

export function isFormValid(formData: FormState): boolean {
  return (
    formData.demoTranscript.trim().length > 0 &&
    formData.prospectUrl.trim().length > 0 &&
    validateUrl(formData.prospectUrl)
  );
}
