import { isCategory, isZone, type Category, type Zone } from "./types";

export type Filters = { terminal: string | null; zone: Zone | null; category: Category | null };

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Parse ?terminal=&zone=&category=; invalid values are ignored. */
export function parseFilters(params: SearchParams, terminalCodes: string[]): Filters {
  const terminal = first(params.terminal);
  const zone = first(params.zone);
  const category = first(params.category);
  return {
    terminal: terminal && terminalCodes.includes(terminal) ? terminal : null,
    zone: isZone(zone) ? zone : null,
    category: isCategory(category) ? category : null,
  };
}

/** Href for the airport page with `patch` applied on top of the current filters. */
export function filterHref(iata: string, current: Filters, patch: Partial<Filters>): string {
  const next = { ...current, ...patch };
  const qs = new URLSearchParams();
  if (next.terminal) qs.set("terminal", next.terminal);
  if (next.zone) qs.set("zone", next.zone);
  if (next.category) qs.set("category", next.category);
  const query = qs.toString();
  return `/${iata.toLowerCase()}${query ? `?${query}` : ""}`;
}
