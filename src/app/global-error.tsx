"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown by the root layout itself. It replaces
 * the whole document, so it must render its own <html> and <body> and cannot
 * rely on anything from the layout — including Tailwind, fonts and providers.
 *
 * Styling is therefore self-contained: a scoped <style> block rather than
 * design tokens, so this page still renders correctly if the CSS bundle is the
 * thing that failed. The media query keeps it theme-aware without them.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <style>{`
          :root {
            color-scheme: light dark;
            --ge-bg: #ffffff;
            --ge-fg: #171717;
            --ge-muted: #737373;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --ge-bg: #0a0a0a;
              --ge-fg: #ededed;
              --ge-muted: #a1a1a1;
            }
          }
          .ge-body {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 1.5rem;
            background: var(--ge-bg);
            color: var(--ge-fg);
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          }
          .ge-main { max-width: 28rem; text-align: center; }
          .ge-title { font-size: 1.5rem; font-weight: 600; margin: 0; }
          .ge-text { margin-top: 0.75rem; font-size: 0.875rem; color: var(--ge-muted); }
          .ge-ref { margin-top: 1rem; font-family: ui-monospace, monospace; font-size: 0.75rem; color: var(--ge-muted); }
        `}</style>
        <div className="ge-body">
          <main className="ge-main">
            <h1 className="ge-title">Something went wrong</h1>
            <p className="ge-text">
              The application failed to load. Please refresh the page.
            </p>
            {error.digest ? (
              <p className="ge-ref">Reference: {error.digest}</p>
            ) : null}
          </main>
        </div>
      </body>
    </html>
  );
}
