"use client";

import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * Route-level error boundary. Catches render and data errors below it while
 * keeping the root layout mounted.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replace with the error reporter when observability is wired up. The
    // digest correlates this with the server-side stack trace.
    console.error("Route error:", error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>
            <h1>Something went wrong</h1>
          </EmptyTitle>
          <EmptyDescription>
            An unexpected error occurred while loading this page. Please try
            again.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
          {error.digest ? (
            // <code> picks up the mono font from Tailwind's preflight.
            <EmptyDescription>
              Reference: <code>{error.digest}</code>
            </EmptyDescription>
          ) : null}
        </EmptyContent>
      </Empty>
    </main>
  );
}
