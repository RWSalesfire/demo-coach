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

export interface ValuePropCoverage {
  mentioned: string[];
  missed: string[];
  total: number;
}

export interface AnalysisResult {
  overallScore: number;
  keyStrengths: string[];
  priorityImprovements: string[];
  categories: CategoryAnalysis[];
  valuePropCoverage?: ValuePropCoverage;
}

export interface CompanyProfile {
  websiteUrl: string;
  companyName: string;
  productFeatures: string[];
  valueProps: string[];
  differentiators: string[];
  scannedAt: string;
}

export interface HubSpotExportOptions {
  includeStrengths: boolean;
  includePriorities: boolean;
  includeValuePropCoverage: boolean;
  includeDetailedScores: boolean;
  includeTranscriptQuotes: boolean;
}

export interface ShareEmailOptions {
  managerEmail: string;
  note: string;
  includePriorities: boolean;
  includeValuePropCoverage: boolean;
  includeFullAnalysis: boolean;
}
