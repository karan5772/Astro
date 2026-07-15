import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Birth Chart',
  robots: { index: false, follow: false },
};

export default function ChartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
