"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

import { env } from "@/env";
import { getQueryClient } from "@/lib/query/client";

/**
 * Client-side providers for the whole app.
 *
 * Kept as a leaf `"use client"` boundary wrapping `{children}`: children passed
 * in from the server layout stay Server Components, so this does not drag the
 * page into the client bundle.
 */
export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {env.NODE_ENV === "development" ? (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      ) : null}
    </QueryClientProvider>
  );
}
