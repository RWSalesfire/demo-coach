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
