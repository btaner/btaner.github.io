import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { Chip } from "@/components/Chip";
import { FacilityRow } from "@/components/FacilityRow";
import { CATEGORY_META, terminalLabel, ZONE_META } from "@/lib/categories";
import { getAirport, getFacilities, type AirportWithTerminals } from "@/lib/data";
import { filterHref, parseFilters, type Filters } from "@/lib/filters";
import { CATEGORIES, ZONES } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[iata]">): Promise<Metadata> {
  const { iata } = await params;
  const airport = await getAirport(iata);
  if (!airport) return { title: "Airport not found" };
  const title = `${airport.iata} ${airport.city} — food, lounges & facilities`;
  const description = `Restaurants, lounges, restrooms and more at ${airport.name}, by terminal and before or after security.`;
  return {
    title,
    description,
    alternates: { canonical: `/${airport.iata.toLowerCase()}` },
    openGraph: { title, description, url: `/${airport.iata.toLowerCase()}` },
  };
}

export default async function AirportPage({ params, searchParams }: PageProps<"/[iata]">) {
  const { iata } = await params;
  const query = await searchParams;
  if (iata !== iata.toLowerCase()) {
    const qs = new URLSearchParams(
      Object.entries(query).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])),
    ).toString();
    permanentRedirect(`/${iata.toLowerCase()}${qs ? `?${qs}` : ""}`);
  }
  const airport = await getAirport(iata);
  if (!airport) notFound();

  const filters = parseFilters(query, airport.terminals.map((t) => t.code));
  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: airport.timezone,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).format(new Date());

  return (
    <>
      <section className="mb-6 flex items-center gap-4">
        <h1 className="flap rounded-md bg-panel px-4 py-2 font-mono text-5xl font-bold tracking-[0.2em] text-amber sm:text-6xl">
          <span className="sr-only">{airport.name} </span>
          <span aria-hidden="true">{airport.iata}</span>
        </h1>
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{airport.name}</p>
          <p className="text-sm text-muted">
            {airport.city}, {airport.country}
          </p>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
            Local time <time className="text-ink">{localTime}</time>
          </p>
        </div>
      </section>

      <nav aria-label="Filters" className="space-y-4">
        <FilterGroup label="Terminal">
          <Chip href={filterHref(airport.iata, filters, { terminal: null })} active={!filters.terminal}>
            All
          </Chip>
          {airport.terminals.map((t) => (
            <Chip key={t.id} href={filterHref(airport.iata, filters, { terminal: t.code })} active={filters.terminal === t.code}>
              <span aria-hidden="true">{terminalLabel(t.code)}</span>
              <span className="sr-only">{t.name}</span>
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="Security" hint="Landside = before security · Airside = after security">
          <Chip href={filterHref(airport.iata, filters, { zone: null })} active={!filters.zone}>
            All
          </Chip>
          {ZONES.map((z) => (
            <Chip key={z} href={filterHref(airport.iata, filters, { zone: z })} active={filters.zone === z}>
              {ZONE_META[z].label}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="Category">
          <Chip href={filterHref(airport.iata, filters, { category: null })} active={!filters.category}>
            All
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} href={filterHref(airport.iata, filters, { category: c })} active={filters.category === c}>
              {CATEGORY_META[c].plural}
            </Chip>
          ))}
        </FilterGroup>
      </nav>

      <Suspense key={JSON.stringify(filters)} fallback={<ListSkeleton />}>
        <FacilityList airport={airport} filters={filters} />
      </Suspense>
    </>
  );
}

function FilterGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
      {hint && <p className="-mt-1 mb-1.5 text-xs text-muted">{hint}</p>}
      {/* Horizontal scroll on narrow screens; negative margin lets chips run to the edge. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">{children}</div>
    </div>
  );
}

async function FacilityList({ airport, filters }: { airport: AirportWithTerminals; filters: Filters }) {
  const facilities = await getFacilities(airport, filters);
  const now = new Date();
  const hasFilters = Boolean(filters.terminal || filters.zone || filters.category);

  return (
    <section aria-labelledby="results-heading" className="mt-8">
      <div className="mb-3 flex items-baseline justify-between border-b border-line pb-2">
        <h2 id="results-heading" className="font-mono text-sm font-semibold uppercase tracking-widest text-amber">
          Facilities
        </h2>
        <p className="font-mono text-xs uppercase tracking-widest text-muted" aria-live="polite">
          {facilities.length} {facilities.length === 1 ? "result" : "results"}
        </p>
      </div>

      {facilities.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-8 text-center">
          <p className="font-mono font-semibold uppercase tracking-wide">No matches</p>
          <p className="mt-2 text-muted">Nothing listed for this combination yet. Try another terminal or category.</p>
          {hasFilters && (
            <Link
              href={`/${airport.iata.toLowerCase()}`}
              className="mt-4 inline-flex min-h-11 items-center rounded-md bg-amber px-4 font-mono text-sm font-bold uppercase tracking-wide text-navy"
            >
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {facilities.map((f) => (
            <FacilityRow
              key={f.id}
              facility={f}
              terminal={airport.terminals.find((t) => t.id === f.terminal_id)}
              iata={airport.iata}
              timezone={airport.timezone}
              now={now}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-8" aria-busy="true" aria-label="Loading facilities">
      <div className="mb-3 h-6 border-b border-line" />
      <ul className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="h-20 animate-pulse rounded-md border border-line bg-panel" />
        ))}
      </ul>
    </div>
  );
}
