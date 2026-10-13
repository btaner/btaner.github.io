import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { StatusBadge, UnverifiedBadge } from "@/components/Badges";
import { ReportForm } from "@/components/ReportForm";
import { CATEGORY_META, terminalLabel, ZONE_META } from "@/lib/categories";
import { getAirport, getFacility } from "@/lib/data";
import { formatWeeklyHours, getOpenStatus } from "@/lib/hours";

const DAY_LABELS = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" } as const;

async function load(iata: string, slug: string) {
  const airport = await getAirport(iata);
  if (!airport) return null;
  const facility = await getFacility(airport.id, slug);
  if (!facility) return null;
  return { airport, facility, terminal: airport.terminals.find((t) => t.id === facility.terminal_id) };
}

export async function generateMetadata({ params }: PageProps<"/[iata]/[slug]">): Promise<Metadata> {
  const { iata, slug } = await params;
  const data = await load(iata, slug);
  if (!data) return { title: "Not found" };
  const { airport, facility, terminal } = data;
  const where = `${terminal?.name ?? "Terminal"}, ${ZONE_META[facility.zone].hint.toLowerCase()}`;
  const title = `${facility.name} — ${airport.iata} ${terminal?.name ?? ""}`.trim();
  const description = `${CATEGORY_META[facility.category].label} at ${airport.name} (${where}). ${facility.description ?? ""}`.trim();
  const url = `/${airport.iata.toLowerCase()}/${facility.slug}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };
}

export default async function FacilityPage({ params }: PageProps<"/[iata]/[slug]">) {
  const { iata, slug } = await params;
  if (iata !== iata.toLowerCase()) permanentRedirect(`/${iata.toLowerCase()}/${slug}`);
  const data = await load(iata, slug);
  if (!data) notFound();
  const { airport, facility, terminal } = data;
  const meta = CATEGORY_META[facility.category];
  const status = getOpenStatus(facility.opening_hours, airport.timezone);
  const backHref = `/${airport.iata.toLowerCase()}${terminal ? `?terminal=${encodeURIComponent(terminal.code)}` : ""}`;

  return (
    <article>
      <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 font-mono text-sm uppercase tracking-wide text-amber hover:underline">
        <span aria-hidden="true">←</span> {airport.iata} {terminal ? `· ${terminalLabel(terminal.code)}` : ""}
      </Link>

      <header className="mt-4 flex items-start gap-4">
        <span className="flap shrink-0 rounded-md bg-panel px-3 py-2 font-mono text-2xl font-bold tracking-wider text-amber" aria-hidden="true">
          {meta.code}
        </span>
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">{meta.label}</p>
          <h1 className="font-mono text-2xl font-bold leading-tight sm:text-3xl">{facility.name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge status={status} />
            {facility.last_verified_at === null && <UnverifiedBadge />}
          </div>
        </div>
      </header>

      {facility.description && <p className="mt-6 max-w-prose text-lg leading-relaxed">{facility.description}</p>}

      <dl className="mt-6 divide-y divide-line rounded-md border border-line bg-panel">
        <Detail label="Airport">
          {airport.name} ({airport.iata})
        </Detail>
        <Detail label="Terminal">{terminal?.name ?? "Unknown"}</Detail>
        <Detail label="Zone">
          {ZONE_META[facility.zone].label} <span className="text-muted">· {ZONE_META[facility.zone].hint}</span>
        </Detail>
        <Detail label="Gate area">{facility.gate_area ?? <span className="text-muted">Not specified</span>}</Detail>
        <Detail label="Hours">
          {facility.opening_hours ? (
            <table className="w-full max-w-xs text-sm">
              <caption className="sr-only">Opening hours, local time ({airport.timezone})</caption>
              <tbody>
                {formatWeeklyHours(facility.opening_hours).map((row) => (
                  <tr key={row.day}>
                    <th scope="row" className="py-0.5 pr-4 text-left font-mono font-normal text-muted">
                      {DAY_LABELS[row.day]}
                    </th>
                    <td className="py-0.5 font-mono">{row.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <span className="text-muted">Hours unknown — check at the venue.</span>
          )}
        </Detail>
        {facility.access_info && <Detail label="Access">{facility.access_info}</Detail>}
        {facility.url && (
          <Detail label="Website">
            <a href={facility.url} target="_blank" rel="noopener noreferrer" className="break-all text-amber underline underline-offset-4">
              {new URL(facility.url).hostname}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Detail>
        )}
        <Detail label="Verified">
          {facility.last_verified_at ? (
            new Date(facility.last_verified_at).toLocaleDateString("en-GB", { dateStyle: "medium" })
          ) : (
            <span className="text-muted">Not yet verified. Details may be inaccurate.</span>
          )}
        </Detail>
      </dl>

      <section aria-labelledby="report-heading" className="mt-10 border-t border-line pt-6">
        <h2 id="report-heading" className="font-mono text-sm font-semibold uppercase tracking-widest text-amber">
          Report an issue
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted">Closed, moved or wrong? Tell us and we’ll fix the listing.</p>
        <ReportForm facilityId={facility.id} />
      </section>
    </article>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 px-4 py-3">
      <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
