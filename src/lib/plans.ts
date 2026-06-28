export const FREE_PLAN = {
  id: 'free',
  name: 'Free',
  price: 0,
  messagesGranted: 5,
  voiceMinutes: 0,
  badge: null,
  featured: false,
  description: 'Try Astraeus with no card required.',
  features: [
    '5 text messages',
    'No voice',
    'Full Vedic chart context',
    'No card required',
  ],
} as const;

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 5,
    messagesGranted: 30,
    voiceMinutes: 10,
    badge: null,
    featured: false,
    description: 'A focused reading session — text and voice.',
    features: [
      '30 text messages',
      '10 minutes of voice',
      'Full Vedic chart context',
      'Follow-up questions',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 12,
    messagesGranted: 100,
    voiceMinutes: 30,
    badge: 'Most popular',
    featured: true,
    description: 'Deeper exploration across multiple life areas.',
    features: [
      '100 text messages',
      '30 minutes of voice',
      'Full Vedic chart context',
      'Multi-topic readings',
    ],
  },
  {
    id: 'deep',
    name: 'Deep',
    price: 20,
    messagesGranted: 200,
    voiceMinutes: 60,
    badge: null,
    featured: false,
    description: 'Extended access for ongoing cosmic guidance.',
    features: [
      '200 text messages',
      '60 minutes of voice',
      'Full Vedic chart context',
      'Priority response',
    ],
  },
] as const;

export type PlanId = typeof PLANS[number]['id'];

export const FREE_MESSAGE_LIMIT = FREE_PLAN.messagesGranted;
