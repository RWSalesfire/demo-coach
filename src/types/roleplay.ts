// Prospect persona types
export type Industry =
  | 'fashion'
  | 'home_garden'
  | 'sports'
  | 'beauty'
  | 'electronics'
  | 'food_beverage'
  | 'health_wellness';

export type PersonalityType =
  | 'skeptical'    // Challenges everything, needs proof
  | 'busy'         // Impatient, wants to get off the call
  | 'friendly'     // Open and chatty, easy to build rapport
  | 'analytical'   // Asks detailed questions, wants data
  | 'gatekeeper';  // Not the decision maker, needs convincing

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ProspectPersona {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: Industry;
  companySize: 'startup' | 'smb' | 'midmarket' | 'enterprise';
  personality: PersonalityType;
  difficulty: Difficulty;
  background: string;
  painPoints: string[];
  objections: string[];
  buyingSignals: string[];
  avatar: string;
  color: string;
}

// Transcript types
export interface TranscriptEntry {
  id: string;
  speaker: 'sdr' | 'prospect';
  text: string;
  timestamp: number;
  isFinal: boolean;
}

// Call session state
export interface RoleplaySession {
  id: string;
  personaId: string;
  startTime: number;
  endTime?: number;
  transcript: TranscriptEntry[];
  status: 'connecting' | 'active' | 'ending' | 'ended' | 'error';
}

// Realtime connection state
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface RealtimeConnectionState {
  status: ConnectionStatus;
  error?: string;
  sessionId?: string;
}

// History entry for roleplay sessions
export interface RoleplayHistoryEntry {
  id: string;
  date: string;
  personaId: string;
  personaName: string;
  callDuration: number;
  overallScore: number;
  results: import('./analysis').AnalysisResult;
  transcript: string;
  feedbackStyle: 'direct' | 'supportive';
}
