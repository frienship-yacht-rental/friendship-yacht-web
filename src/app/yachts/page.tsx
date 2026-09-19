import type { Metadata } from "next";

import { YachtList } from "@/features/yachts/components/yacht-list";

export const metadata: Metadata = {
  title: "The fleet",
  description:
    "Every Friendship yacht currently in build or available to order.",
  alternates: { canonical: "/yachts" },
};

// Set explicitly rather than inferred from fetch options: if the API is down
// at build time no fetch succeeds, and without this the fallback page would
// be treated as fully static and never revalidate.
export const revalidate = 300;

export default function YachtsPage() {
  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">The fleet</h1>
          <p className="max-w-prose text-muted-foreground">
            Each hull is built to order. Enquire about any model to discuss
            specification and delivery.
          </p>
        </header>
        <YachtList />
      </div>
    </main>
  );
}
