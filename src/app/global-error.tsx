'use client';

import './globals.css';

/**
 * Replaces the root layout when it is the thing that failed, so it has to
 * bring its own <html>/<body> and cannot rely on any provider above it.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <title>Something went wrong | Astro AI</title>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center flex flex-col items-center gap-5">
            <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="text-sm text-foreground/55 leading-relaxed">
              Astro AI could not finish loading. Please try again.
            </p>
            {error.digest && (
              <p className="text-[11px] font-mono text-foreground/30">Reference: {error.digest}</p>
            )}
            <button
              onClick={() => unstable_retry()}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
