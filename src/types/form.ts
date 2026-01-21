export type FeedbackStyle = 'direct' | 'supportive';

export interface FormState {
  demoTranscript: string;
  prospectUrl: string;
  sdrTranscript: string;
  feedbackStyle: FeedbackStyle;
}

export interface FormErrors {
  demoTranscript?: string;
  prospectUrl?: string;
}
