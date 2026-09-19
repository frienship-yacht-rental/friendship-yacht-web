import type { Metadata } from "next";

import { InquiryForm } from "@/features/inquiries/components/inquiry-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Request a consultation or ask about a specific yacht.",
  alternates: { canonical: "/contact" },
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default async function ContactPage({
  searchParams,
}: PageProps<"/contact">) {
  const { yacht } = await searchParams;
  const yachtSlug =
    typeof yacht === "string" && slugPattern.test(yacht) ? yacht : undefined;

  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Request a consultation
          </h1>
          <p className="text-muted-foreground">
            {yachtSlug
              ? `Tell us what you have in mind for the ${yachtSlug.replace(/-/g, " ")}.`
              : "Tell us what you have in mind and we will be in touch."}
          </p>
        </header>
        <InquiryForm yachtSlug={yachtSlug} />
      </div>
    </main>
  );
}
