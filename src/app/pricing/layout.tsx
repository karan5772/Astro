import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Choose a plan for unlimited Vedic astrology AI readings. Chat messages and real-time voice sessions — pay only for what you need.',
  alternates: { canonical: 'https://astro.karanchoudhary.dev/pricing' },
  openGraph: {
    title: 'Pricing | Astro AI',
    description: 'Affordable plans for AI-powered Vedic astrology. Unlimited readings, voice sessions, and personalised birth chart insights.',
    url: 'https://astro.karanchoudhary.dev/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
