import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-full max-w-md" />
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index}>
              <Skeleton className="h-72 w-full" />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
