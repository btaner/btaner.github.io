"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="py-10 text-center" role="alert">
      <p className="mx-auto inline-block rounded-md bg-panel px-4 py-2 font-mono text-2xl font-bold tracking-[0.2em] text-amber">
        DELAYED
      </p>
      <h1 className="mt-6 font-mono text-2xl font-bold">We can’t load the board right now</h1>
      <p className="mx-auto mt-3 max-w-prose text-muted">
        Our data service didn’t respond. This is usually temporary — please try again in a moment.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-12 items-center rounded-md bg-amber px-5 font-mono text-sm font-bold uppercase tracking-wide text-navy"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-md border border-line px-5 font-mono text-sm font-bold uppercase tracking-wide"
        >
          Home
        </Link>
      </div>
      {error.digest && <p className="mt-6 font-mono text-xs text-muted">Ref: {error.digest}</p>}
    </section>
  );
}
