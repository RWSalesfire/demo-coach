export type FeedbackStyle = 'direct' | 'supportive';
export type CoachType = 'demo' | 'call';

export interface FormState {
  demoTranscript: string;
  prospectUrl: string;
  sdrTranscript: string;
  feedbackStyle: FeedbackStyle;
}

export interface CallFormState {
  callTranscript: string;
  feedbackStyle: FeedbackStyle;
}

export interface FormErrors {
  demoTranscript?: string;
  prospectUrl?: string;
}

export interface CallFormErrors {
  callTranscript?: string;
}
