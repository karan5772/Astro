import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-5">
        <p className="text-5xl font-semibold tracking-tight text-foreground/20">404</p>
        <h1 className="text-xl font-semibold tracking-tight">This path is not written in the stars</h1>
        <p className="text-sm text-foreground/55 leading-relaxed">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="flex gap-3 w-full mt-1">
          <Link
            href="/"
            className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors flex items-center justify-center"
          >
            Go home
          </Link>
          <Link
            href="/chat"
            className="flex-1 py-3 rounded-xl bg-foreground/[0.07] hover:bg-foreground/[0.11] border border-border text-sm font-medium transition-colors flex items-center justify-center"
          >
            Open chat
          </Link>
        </div>
      </div>
    </div>
  );
}
