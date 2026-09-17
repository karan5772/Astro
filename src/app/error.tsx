'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M16 4L19.09 12.26L28 13.27L21.5 19.64L23.18 28L16 24L8.82 28L10.5 19.64L4 13.27L12.91 12.26L16 4Z"
              fill="currentColor"
              className="text-primary"
            />
          </svg>
        </div>

        <h1 className="text-xl font-semibold tracking-tight">The stars are momentarily clouded</h1>
        <p className="text-sm text-foreground/55 leading-relaxed">
          Something went wrong on our side. Trying again usually clears it.
        </p>

        {/* The digest is the only handle support has for matching this to a server log. */}
        {error.digest && (
          <p className="text-[11px] font-mono text-foreground/30">Reference: {error.digest}</p>
        )}

        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={() => unstable_retry()}
            className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            Try again
          </button>
          <Link
            href="/"
            className="flex-1 py-3 rounded-xl bg-foreground/[0.07] hover:bg-foreground/[0.11] border border-border text-sm font-medium transition-colors flex items-center justify-center"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
