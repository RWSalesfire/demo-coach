export interface Quote {
  transcript: string;
  feedback: string;
}

export interface Objection {
  objection: string;
  handling: string;
  score: number;
  feedback: string;
}

export interface CategoryAnalysis {
  name: string;
  score: number;
  summary: string;
  quotes: Quote[];
  objections?: Objection[];
  nextDemo: string;
}

export interface AnalysisResult {
  overallScore: number;
  keyStrengths: string[];
  priorityImprovements: string[];
  categories: CategoryAnalysis[];
}

export interface CompanyProfile {
  companyName: string;
  userName: string;
  feedbackStyle: 'direct' | 'supportive';
}

export interface HubSpotExportOptions {
  includeStrengths: boolean;
  includePriorities: boolean;
  includeDetailedScores: boolean;
  includeTranscriptQuotes: boolean;
}

export interface ShareEmailOptions {
  managerEmail: string;
  note: string;
  includePriorities: boolean;
  includeFullAnalysis: boolean;
}
