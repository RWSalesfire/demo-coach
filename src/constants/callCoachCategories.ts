import { Shield, MessageSquare, Users, Target, CheckCircle, Compass, Smile, TrendingUp, AlertTriangle, Zap } from 'lucide-react';

export const CALL_CATEGORIES = [
  {
    name: 'Gatekeeper Handling',
    key: 'gatekeeper',
    icon: Shield,
    description: 'Confident bypass? Got direct dial?',
  },
  {
    name: 'Permission-based Opener',
    key: 'opener',
    icon: MessageSquare,
    description: 'Asked for permission? Earned the right to continue?',
  },
  {
    name: 'Personalisation & Research',
    key: 'personalisation',
    icon: Users,
    description: 'Showed they did their homework?',
  },
  {
    name: 'Discovery & Questioning',
    key: 'discovery',
    icon: Target,
    description: 'Asked good questions? Listened well?',
  },
  {
    name: 'Qualifying Questions',
    key: 'qualifying',
    icon: CheckCircle,
    description: 'Confirmed fit? Right decision-maker?',
  },
  {
    name: 'Call Control',
    key: 'control',
    icon: Compass,
    description: 'Guided the conversation? Comfortable with silence?',
  },
  {
    name: 'Tone & Energy',
    key: 'tone',
    icon: Smile,
    description: 'Confident peer? Smiling on the phone?',
  },
  {
    name: 'Value Proposition & Relevance',
    key: 'value',
    icon: TrendingUp,
    description: 'Tied solution to their problems? Used proof points?',
  },
  {
    name: 'Objection Handling',
    key: 'objections',
    icon: AlertTriangle,
    description: 'Validated first? Asked follow-up questions?',
  },
  {
    name: 'Close & Next Steps',
    key: 'close',
    icon: Zap,
    description: 'Clear ask? Specific time booked?',
  },
] as const;
