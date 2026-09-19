import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export default function Home() {
  return (
    <main className="flex flex-1 items-center px-6 py-24">
      <div className="mx-auto w-full max-w-3xl">
        <p className="font-mono text-sm tracking-wide text-muted-foreground uppercase">
          {siteConfig.shortName}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Performance sailing yachts, built by hand.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
          {siteConfig.description}
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/yachts">Explore the fleet</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/contact">Request a consultation</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
