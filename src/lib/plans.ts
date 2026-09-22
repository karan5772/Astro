/**
 * All prices are in Indian rupees. Razorpay charges INR, so pricing in INR is
 * the only way the number on the pricing page is the number on the bank
 * statement — the previous USD list price was converted at a live rate, which
 * meant "$5" became an unpredictable rupee amount at the moment of payment.
 */
export const CURRENCY = 'INR' as const;
export const CURRENCY_SYMBOL = '\u20B9';

export const FREE_PLAN = {
  id: 'free',
  name: 'Free',
  price: 0,
  messagesGranted: 3,
  voiceMinutes: 0,
  badge: null,
  featured: false,
  description: 'Try Astraeus with no card required.',
  features: [
    '3 text messages',
    'No voice',
    'Full Vedic chart context',
    'No card required',
  ],
} as const;

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 399,
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
    price: 999,
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
    price: 1599,
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

/**
 * Answering the astrologer's own follow-up questions does not spend a message.
 * The user typed nothing new, and charging for it meant the trial was mostly
 * questionnaire. These are the uncharged rounds an account gets: a starting
 * allowance, plus more with every purchase.
 */
export const FREE_ANSWER_ROUNDS_ON_SIGNUP = 5;
export const FREE_ANSWER_ROUNDS_PER_PURCHASE = 3;
