// Loads and validates the seed files in data/airports/*.json.
// Used by scripts/seed.ts and by the local (no-Supabase) fallback in data.ts.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  isCategory,
  isZone,
  WEEKDAYS,
  type Category,
  type OpeningHours,
  type Zone,
} from "./types";

export type SeedFacility = {
  slug: string;
  name: string;
  terminal: string; // terminal code
  category: Category;
  zone: Zone;
  gate_area: string | null;
  description: string | null;
  opening_hours: OpeningHours | null;
  access_info: string | null;
  url: string | null;
};

export type SeedAirport = {
  airport: { iata: string; name: string; city: string; country: string; timezone: string };
  terminals: { code: string; name: string; sort_order: number }[];
  facilities: SeedFacility[];
};

const DATA_DIR = path.join(process.cwd(), "data", "airports");
const TIME = /^([01]\d|2[0-4]):[0-5]\d$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(o: Obj, key: string, where: string): string {
  const v = o[key];
  if (typeof v !== "string" || v.trim() === "") throw new Error(`${where}: "${key}" must be a non-empty string`);
  return v;
}

function optStr(o: Obj, key: string, where: string): string | null {
  const v = o[key];
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") throw new Error(`${where}: "${key}" must be a string or null`);
  return v;
}

function parseHours(v: unknown, where: string): OpeningHours | null {
  if (v === undefined || v === null) return null;
  if (!isObj(v)) throw new Error(`${where}: opening_hours must be an object or null`);
  const out: OpeningHours = {};
  for (const [day, ranges] of Object.entries(v)) {
    const weekday = WEEKDAYS.find((d) => d === day);
    if (!weekday) throw new Error(`${where}: unknown weekday "${day}"`);
    if (!Array.isArray(ranges)) throw new Error(`${where}: ${day} must be an array`);
    out[weekday] = ranges.map((r: unknown) => {
      if (!isObj(r) || typeof r.open !== "string" || typeof r.close !== "string" || !TIME.test(r.open) || !TIME.test(r.close)) {
        throw new Error(`${where}: ${day} has an invalid range (expected {open:"HH:MM", close:"HH:MM"})`);
      }
      return { open: r.open, close: r.close };
    });
  }
  return out;
}

export function parseSeedAirport(raw: unknown, file: string): SeedAirport {
  if (!isObj(raw) || !isObj(raw.airport) || !Array.isArray(raw.terminals) || !Array.isArray(raw.facilities)) {
    throw new Error(`${file}: expected { airport, terminals[], facilities[] }`);
  }
  const a = raw.airport;
  const airport = {
    iata: str(a, "iata", file).toUpperCase(),
    name: str(a, "name", file),
    city: str(a, "city", file),
    country: str(a, "country", file),
    timezone: str(a, "timezone", file),
  };
  if (!/^[A-Z]{3}$/.test(airport.iata)) throw new Error(`${file}: invalid IATA "${airport.iata}"`);
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: airport.timezone });
  } catch {
    throw new Error(`${file}: invalid IANA timezone "${airport.timezone}"`);
  }

  const terminals = raw.terminals.map((t: unknown, i: number) => {
    const where = `${file} terminals[${i}]`;
    if (!isObj(t)) throw new Error(`${where}: must be an object`);
    return {
      code: str(t, "code", where),
      name: str(t, "name", where),
      sort_order: typeof t.sort_order === "number" ? t.sort_order : i,
    };
  });
  const codes = new Set(terminals.map((t) => t.code));

  const slugs = new Set<string>();
  const facilities = raw.facilities.map((f: unknown, i: number): SeedFacility => {
    const where = `${file} facilities[${i}]`;
    if (!isObj(f)) throw new Error(`${where}: must be an object`);
    const slug = str(f, "slug", where);
    if (!SLUG.test(slug)) throw new Error(`${where}: invalid slug "${slug}"`);
    if (slugs.has(slug)) throw new Error(`${where}: duplicate slug "${slug}"`);
    slugs.add(slug);
    const terminal = str(f, "terminal", where);
    if (!codes.has(terminal)) throw new Error(`${where}: unknown terminal "${terminal}"`);
    if (!isCategory(f.category)) throw new Error(`${where}: invalid category "${String(f.category)}"`);
    if (!isZone(f.zone)) throw new Error(`${where}: invalid zone "${String(f.zone)}"`);
    return {
      slug,
      name: str(f, "name", where),
      terminal,
      category: f.category,
      zone: f.zone,
      gate_area: optStr(f, "gate_area", where),
      description: optStr(f, "description", where),
      opening_hours: parseHours(f.opening_hours, where),
      access_info: optStr(f, "access_info", where),
      url: optStr(f, "url", where),
    };
  });

  return { airport, terminals, facilities };
}

export function loadSeedAirports(dir: string = DATA_DIR): SeedAirport[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((file) => parseSeedAirport(JSON.parse(readFileSync(path.join(dir, file), "utf8")), file));
}
