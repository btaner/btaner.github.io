# Gate Guru — MVP Plan

Mobile-first web app: find restaurants, lounges and facilities at an airport, filtered by
terminal and security zone (landside / airside). Goal: "what is near my gate, right now" in two taps.

## Stack
Next.js 16 (App Router, Server Components) · TypeScript (strict) · Tailwind v4 · Supabase Postgres
via `@supabase/supabase-js` · Vercel. Tests with Vitest. Seed script run with `tsx`.

## File structure
```
gate-guru/
  PLAN.md  DECISIONS.md  DATA_NOTES.md  README.md
  supabase/migrations/001_init.sql   schema, enums, indexes, RLS
  data/airports/{yul,yyz,jfk,lhr,cdg}.json   seed source (one file per airport)
  scripts/seed.ts                    upserts data/*.json with the service-role key
  src/
    app/
      layout.tsx  globals.css         fonts (JetBrains Mono + Inter), board theme
      page.tsx                        home: airport search + cards
      not-found.tsx  error.tsx        404 / friendly Supabase error page
      sitemap.ts  robots.ts
      [iata]/page.tsx                 airport board with filters from searchParams
      [iata]/loading.tsx
      [iata]/[slug]/page.tsx          facility detail + report form
      [iata]/[slug]/actions.ts        server action: insert report
    components/                       AirportSearch (client), FilterChips, FacilityRow,
                                      OpenBadge, UnverifiedBadge, ReportForm (client)
    lib/
      types.ts                        domain types + enums
      supabase.ts                     server-side anon client
      data.ts                         query functions (getAirports, getAirport, getFacilities…)
      hours.ts (+ hours.test.ts)      open-now logic, timezone aware, overnight ranges
      filters.ts                      parse/validate searchParams, build hrefs
      categories.ts                   labels + icons per category
```

## Schema (see migration)
- `airports(id uuid, iata char(3) unique, name, city, country, timezone)`
- `terminals(id, airport_id → airports, code, name, sort_order)`, unique(airport_id, code)
- `facilities(id, airport_id, terminal_id, name, category enum, zone enum, gate_area, description,
  opening_hours jsonb, access_info, url, last_verified_at, slug)`, unique(airport_id, slug)
- `reports(id, facility_id, issue_type enum, note, created_at)`
- Index `(airport_id, terminal_id, zone, category)`.
- RLS: anon select on airports/terminals/facilities; anon insert only on reports.

`opening_hours` shape: `{ "mon": [{"open":"05:00","close":"22:00"}], ..., "sun": [...] }`,
local airport time; `close < open` means past midnight; `[]` = closed that day; key missing or
whole column null = unknown. `"00:00"-"24:00"` = 24h.

## Routes
- `/` — search box (client-side filter of airports) + airport cards.
- `/[iata]` — terminal chips, zone toggle, category chips; filters in `?terminal=&zone=&category=`,
  applied server-side in the Supabase query. Empty state. 404 for unknown IATA.
- `/[iata]/[slug]` — facility detail, open-now, unverified badge, "Report an issue" form
  (server action, validation, honeypot).
- `/sitemap.xml`, `/robots.txt`.

## Build order
1. Plan + decisions (commit)
2. Migration SQL, validated against a local Postgres (commit)
3. Seed JSON + seed script + DATA_NOTES.md (commit)
4. App: lib (types, hours + tests, data), layout/theme, pages, actions, SEO, error/404 (commit)
5. Verify: lint, typecheck, tests, build, run locally and curl every route (commit)
6. README + final report (commit)
