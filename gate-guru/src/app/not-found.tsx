import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-10 text-center">
      <p className="flap mx-auto inline-block rounded-md bg-panel px-4 py-2 font-mono text-5xl font-bold tracking-[0.2em] text-amber">
        404
      </p>
      <h1 className="mt-6 font-mono text-2xl font-bold">Gate not found</h1>
      <p className="mx-auto mt-3 max-w-prose text-muted">
        We don’t have that airport or listing yet. Check the code, or pick from the airports we cover.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-12 items-center rounded-md bg-amber px-5 font-mono text-sm font-bold uppercase tracking-wide text-navy"
      >
        All airports
      </Link>
    </section>
  );
}
