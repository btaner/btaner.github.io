import Link from "next/link";

/** Filter chip rendered as a link so filters live in the URL. */
export function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      scroll={false}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-md border px-3 font-mono text-sm font-semibold uppercase tracking-wide transition-colors ${
        active ? "border-amber bg-amber text-navy" : "border-line bg-panel text-ink hover:border-amber/60"
      }`}
    >
      {children}
    </Link>
  );
}
