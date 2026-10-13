import { cache } from "react";
import type { Filters } from "./filters";
import { getSupabase } from "./supabase";
import type { Airport, Facility, IssueType, Terminal } from "./types";

/** Thrown for any Supabase failure; rendered by app/error.tsx. */
export class DataError extends Error {
  constructor(context: string, message: string) {
    super(`${context}: ${message}`);
    this.name = "DataError";
  }
}

const AIRPORT_COLUMNS = "id, iata, name, city, country, timezone";
const TERMINAL_COLUMNS = "id, airport_id, code, name, sort_order";
const FACILITY_COLUMNS =
  "id, airport_id, terminal_id, name, category, zone, gate_area, description, opening_hours, access_info, url, last_verified_at, slug";

export const getAirports = cache(async (): Promise<Airport[]> => {
  const { data, error } = await getSupabase()
    .from("airports")
    .select(AIRPORT_COLUMNS)
    .order("iata")
    .overrideTypes<Airport[], { merge: false }>();
  if (error) throw new DataError("Loading airports", error.message);
  return data;
});

export type AirportWithTerminals = Airport & { terminals: Terminal[] };

/** Airport by IATA code (case-insensitive) with its terminals, or null if unknown. */
export const getAirport = cache(async (iata: string): Promise<AirportWithTerminals | null> => {
  const code = iata.toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return null;
  const { data, error } = await getSupabase()
    .from("airports")
    .select(`${AIRPORT_COLUMNS}, terminals(${TERMINAL_COLUMNS})`)
    .eq("iata", code)
    .maybeSingle()
    .overrideTypes<AirportWithTerminals | null, { merge: false }>();
  if (error) throw new DataError(`Loading airport ${code}`, error.message);
  if (!data) return null;
  data.terminals.sort((a, b) => a.sort_order - b.sort_order || a.code.localeCompare(b.code));
  return data;
});

export async function getFacilities(airport: AirportWithTerminals, filters: Filters): Promise<Facility[]> {
  let query = getSupabase().from("facilities").select(FACILITY_COLUMNS).eq("airport_id", airport.id);
  if (filters.terminal) {
    const terminal = airport.terminals.find((t) => t.code === filters.terminal);
    if (terminal) query = query.eq("terminal_id", terminal.id);
  }
  if (filters.zone) query = query.eq("zone", filters.zone);
  if (filters.category) query = query.eq("category", filters.category);
  const { data, error } = await query.order("name").overrideTypes<Facility[], { merge: false }>();
  if (error) throw new DataError(`Loading facilities for ${airport.iata}`, error.message);
  return data;
}

export const getFacility = cache(async (airportId: string, slug: string): Promise<Facility | null> => {
  const { data, error } = await getSupabase()
    .from("facilities")
    .select(FACILITY_COLUMNS)
    .eq("airport_id", airportId)
    .eq("slug", slug)
    .maybeSingle()
    .overrideTypes<Facility | null, { merge: false }>();
  if (error) throw new DataError(`Loading facility ${slug}`, error.message);
  return data;
});

/** All airport + facility paths, for the sitemap. */
export async function getSitemapEntries(): Promise<{ iata: string; slug: string | null }[]> {
  const { data, error } = await getSupabase()
    .from("facilities")
    .select("slug, airports(iata)")
    .overrideTypes<{ slug: string; airports: { iata: string } }[], { merge: false }>();
  if (error) throw new DataError("Loading sitemap", error.message);
  const airports = await getAirports();
  return [
    ...airports.map((a) => ({ iata: a.iata, slug: null })),
    ...data.map((f) => ({ iata: f.airports.iata, slug: f.slug })),
  ];
}

export async function insertReport(facilityId: string, issueType: IssueType, note: string | null): Promise<void> {
  const { error } = await getSupabase()
    .from("reports")
    .insert({ facility_id: facilityId, issue_type: issueType, note });
  if (error) throw new DataError("Saving report", error.message);
}
