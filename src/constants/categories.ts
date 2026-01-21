import { Target, BarChart3, Users, TrendingUp, AlertTriangle, Zap, Clock } from 'lucide-react';

export const CATEGORIES = [
  {
    name: 'Discovery Quality',
    key: 'discovery',
    icon: Target,
    description: 'Did they dig deep enough? Get specific metrics?',
  },
  {
    name: 'Demo Structure',
    key: 'structure',
    icon: BarChart3,
    description: 'Followed Salesfire flow?',
  },
  {
    name: 'Personalisation',
    key: 'personalisation',
    icon: Users,
    description: "Connected to prospect's specific situation?",
  },
  {
    name: 'ROI & Value Articulation',
    key: 'roi',
    icon: TrendingUp,
    description: 'Controlled the maths? Framed value before price?',
  },
  {
    name: 'Objection Handling',
    key: 'objections',
    icon: AlertTriangle,
    description: 'How were objections addressed?',
  },
  {
    name: 'Close Strength',
    key: 'close',
    icon: Zap,
    description: 'Clear next steps? POC criteria?',
  },
  {
    name: 'Engagement & Pacing',
    key: 'engagement',
    icon: Clock,
    description: 'Talk/listen ratio? Check-ins?',
  },
] as const;
