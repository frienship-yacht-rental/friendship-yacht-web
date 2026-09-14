import { Skeleton } from "@/components/ui/skeleton";

/**
 * Streamed instantly while the route's data resolves. Mirrors the page's
 * layout so the transition does not shift content.
 */
export default function Loading() {
  return (
    <main className="flex-1 px-6 py-24">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </main>
  );
}
