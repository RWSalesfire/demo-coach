import type { ProspectPersona } from '../types/roleplay';

export const PERSONAS: ProspectPersona[] = [
  {
    id: 'sarah-fashion',
    name: 'Sarah Mitchell',
    title: 'Marketing Director',
    company: 'Fashion Forward',
    industry: 'fashion',
    companySize: 'midmarket',
    personality: 'friendly',
    difficulty: 'easy',
    background: `Sarah has been Marketing Director at Fashion Forward for 3 years. They're a growing DTC fashion brand doing about £8M/year online. They use Klaviyo for email marketing and Shopify Plus as their platform. Sarah is generally open to new ideas and likes to stay current with marketing tech.`,
    painPoints: [
      'Struggling to identify returning visitors who browse anonymously',
      'Email list growth has plateaued in the last 6 months',
      'High cart abandonment rate (around 72%)',
      'Difficulty measuring true marketing attribution',
    ],
    objections: [
      "We're already using Klaviyo for email, isn't that enough?",
      "I'd need to check with our ecom manager first",
      "What's the implementation time? We're heading into peak season",
    ],
    buyingSignals: [
      "That's interesting, how does the cross-device tracking work?",
      "What kind of results have similar fashion brands seen?",
      "Could you show me what the dashboard looks like?",
    ],
    avatar: '👩‍💼',
    color: 'pink',
  },
  {
    id: 'mike-gatekeeper',
    name: 'Mike Thompson',
    title: 'Executive Assistant',
    company: 'HomeStyle Living',
    industry: 'home_garden',
    companySize: 'midmarket',
    personality: 'gatekeeper',
    difficulty: 'medium',
    background: `Mike is the EA to the CMO at HomeStyle Living, a home and garden ecommerce retailer. His job is to filter calls and protect his boss's time. He's heard every sales pitch and is naturally skeptical, but will pass along genuinely relevant opportunities.`,
    painPoints: [
      'Gets dozens of sales calls daily',
      'CMO is frustrated with irrelevant vendor pitches',
      'Previous tools promised results but underdelivered',
    ],
    objections: [
      "She's in meetings all day, can you send an email?",
      "We're not looking at any new vendors right now",
      "What company did you say you're from again?",
      "Is this a sales call?",
    ],
    buyingSignals: [
      "Actually, she did mention wanting to look at this area",
      "Let me check her calendar... she might have 15 minutes Thursday",
      "Can you send me something I can forward to her?",
    ],
    avatar: '👨‍💼',
    color: 'slate',
  },
  {
    id: 'rachel-beauty',
    name: 'Rachel Kim',
    title: 'Chief Marketing Officer',
    company: 'Glow Cosmetics',
    industry: 'beauty',
    companySize: 'enterprise',
    personality: 'busy',
    difficulty: 'medium',
    background: `Rachel is the CMO at Glow Cosmetics, a premium beauty brand doing £50M+ annually. She's extremely time-poor and sits in back-to-back meetings. She's smart and decisive - if you can quickly prove value, she'll engage, but she has zero patience for waffle.`,
    painPoints: [
      'Board pressure to improve marketing efficiency',
      'Customer acquisition costs have doubled in 2 years',
      'Struggling with iOS privacy changes impact on Meta ads',
      'Need better first-party data strategy',
    ],
    objections: [
      "I've got about 2 minutes, what's the quick pitch?",
      "We've looked at similar tools before",
      "Send me something and I'll look when I can",
      "What's the ROI timeline?",
    ],
    buyingSignals: [
      "Okay, that's actually relevant to something we're working on",
      "Who else in beauty are you working with?",
      "What would a pilot look like?",
    ],
    avatar: '👩‍🦰',
    color: 'purple',
  },
  {
    id: 'james-electronics',
    name: 'James Chen',
    title: 'Head of Ecommerce',
    company: 'TechGear Direct',
    industry: 'electronics',
    companySize: 'enterprise',
    personality: 'analytical',
    difficulty: 'hard',
    background: `James leads a team of 12 at TechGear Direct, a consumer electronics retailer doing £100M+ online. He reports to the CMO and is responsible for the entire ecommerce P&L. He's extremely data-driven and will challenge every claim. He's been burned by vendors who overpromised.`,
    painPoints: [
      'Attribution is a nightmare across their marketing stack',
      'Multiple tools not integrating properly',
      'Board wants better ROI tracking on marketing spend',
      'High competition from Amazon eroding margins',
    ],
    objections: [
      "How does this integrate with our Salesforce and GA4 setup?",
      "We tried something similar 18 months ago and it didn't work",
      "What's the implementation timeline? We're mid-platform migration",
      "Can you break down exactly how you calculate the ROI figures?",
      "I'd need to see case studies from electronics retailers specifically",
    ],
    buyingSignals: [
      "Can you send me the technical documentation?",
      "Who on your team would be involved in implementation?",
      "What does your data security certification look like?",
    ],
    avatar: '👨‍💻',
    color: 'blue',
  },
];

export function getPersonaById(id: string): ProspectPersona | undefined {
  return PERSONAS.find(p => p.id === id);
}

export function getPersonasByDifficulty(difficulty: ProspectPersona['difficulty']): ProspectPersona[] {
  return PERSONAS.filter(p => p.difficulty === difficulty);
}
