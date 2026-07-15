import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the Astro AI privacy policy — how we collect, use, and protect your personal and birth data.',
  alternates: { canonical: 'https://astro.daranchoudhary.dev/privacy' },
  robots: { index: true, follow: false },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
