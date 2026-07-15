import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy',
  description: 'Cancellation and refund policy for Astro AI plans and purchases.',
  alternates: { canonical: 'https://astro.karanchoudhary.dev/cancellation' },
  robots: { index: true, follow: false },
};

export default function CancellationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
