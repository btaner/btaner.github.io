"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { Airport } from "@/lib/types";

function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function AirportSearch({ airports }: { airports: Airport[] }) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const q = normalize(query.trim());
  const results = q
    ? airports.filter((a) => [a.iata, a.name, a.city, a.country].some((v) => normalize(v).includes(q)))
    : airports;

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block font-mono text-xs font-semibold uppercase tracking-widest text-muted">
        Airport, city or code
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. YUL, London, Kennedy"
        autoComplete="off"
        className="min-h-12 w-full rounded-md border border-line bg-panel px-4 font-mono text-lg text-ink placeholder:text-muted/70 focus:border-amber"
      />
      <p className="sr-only" aria-live="polite">
        {results.length} {results.length === 1 ? "airport" : "airports"} found
      </p>

      {results.length === 0 ? (
        <p className="mt-6 rounded-md border border-dashed border-line p-6 text-center text-muted">
          No airport matches “{query}”. We currently cover {airports.map((a) => a.iata).join(", ")}.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {results.map((a) => (
            <li key={a.id}>
              <Link
                href={`/${a.iata.toLowerCase()}`}
                className="flex min-h-24 items-center gap-4 rounded-md border border-line bg-panel p-4 transition-colors hover:border-amber/60 hover:bg-panel-hi"
              >
                <span className="flap rounded bg-navy px-3 py-2 font-mono text-3xl font-bold tracking-[0.2em] text-amber">
                  {a.iata}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-snug">{a.name}</span>
                  <span className="block text-sm text-muted">
                    {a.city}, {a.country}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
