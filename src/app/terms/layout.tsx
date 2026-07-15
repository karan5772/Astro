import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using Astro AI — your AI-powered Vedic astrology platform.',
  alternates: { canonical: 'https://astro.daranchoudhary.dev/terms' },
  robots: { index: true, follow: false },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
