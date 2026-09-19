import { AnchorIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ApiError, ApiNetworkError } from "@/lib/api/errors";
import { reportError } from "@/lib/observability/report-error";

import { getYachts } from "../queries";
import { YachtCard } from "./yacht-card";

/**
 * Async Server Component. Degrades to an Empty state if the API is down so a
 * marketing page never 500s because a backend blipped; the route's
 * `revalidate` means it heals itself on the next revalidation.
 */
export async function YachtList() {
  const result = await getYachts().catch((error: unknown) => {
    if (error instanceof ApiNetworkError || error instanceof ApiError) {
      reportError(error, { source: "yacht-list" });
      return null;
    }
    throw error;
  });

  if (result === null) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AnchorIcon />
          </EmptyMedia>
          <EmptyTitle>The fleet is temporarily unavailable</EmptyTitle>
          <EmptyDescription>
            Please check back shortly, or contact us directly.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (result.items.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AnchorIcon />
          </EmptyMedia>
          <EmptyTitle>No yachts listed yet</EmptyTitle>
          <EmptyDescription>
            New builds are announced here first.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {result.items.map((yacht) => (
        <li key={yacht.id}>
          <YachtCard yacht={yacht} />
        </li>
      ))}
    </ul>
  );
}
