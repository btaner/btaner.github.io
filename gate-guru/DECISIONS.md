# Decisions log

Ambiguities resolved autonomously during the MVP build. Simplest reasonable choice each time.

1. **Location in repo.** The working repo is `btaner.github.io` (a GitHub Pages site with a root
   `index.html`). To avoid breaking that site, the app lives in the `gate-guru/` subfolder. On
   Vercel set **Root Directory = `gate-guru`**.
2. **Next.js version.** `create-next-app@latest` produced Next 16.4, which enables Cache Components
   + Partial Prefetching by default. I **turned both off** (previous, request-time rendering model):
   every page here depends on searchParams/params and on the current time (open-now), 404 status
   codes for unknown airports are simpler without streaming, and it keeps the code conventional.
   Revisit once traffic warrants caching.
3. **IDs.** `uuid` primary keys (`gen_random_uuid()`); natural keys used for upserts:
   `airports.iata`, `terminals(airport_id, code)`, `facilities(airport_id, slug)`.
4. **Slugs** are unique per airport (not globally), URL is `/[iata]/[slug]`.
5. **IATA in URLs** is lowercase canonical (`/yul`); uppercase requests redirect to lowercase.
6. **opening_hours format**: per weekday key (`mon`..`sun`) an array of `{open, close}` "HH:MM"
   ranges in airport local time. Arrays allow split shifts; `close <= open` means it runs past
   midnight; `"00:00"`→`"24:00"` means 24h. Null column or missing day = unknown.
7. **Facilities without a terminal** are not allowed: `terminal_id` is NOT NULL (every seeded venue
   is assigned to a terminal; inter-terminal venues go to the closest one).
8. **Reports RLS**: anon may insert only; there is no public select. The server action uses the anon
   key (no service key in the web app). Note length capped at 1000 chars by a CHECK constraint.
9. **Honeypot**: a visually hidden `website` field; if filled, the action pretends success and drops it.
10. **No local JSON fallback.** I considered reading `data/*.json` when Supabase env vars are
    missing, but dropped it to keep one data path. The app needs a Supabase project (cloud or
    `supabase start`). Missing env vars → friendly error page.
11. **Fonts**: JetBrains Mono (headings, codes, labels) + Inter (body) via `next/font/google`.
12. **Icons**: no icon library. I use short
    monospace category codes (e.g. `EAT`, `BAR`, `LNG`) styled like a departure board, with a
    full text label for screen readers.
13. **Open-now for 24h/overnight**: computed against both today's and yesterday's ranges.
14. **"Closing soon"** is shown when a venue closes within 30 minutes (cheap, useful).
15. **Rendering**: all data pages are request-time (`connection()` / searchParams), no caching yet.
    Fine for MVP traffic; add `revalidate`/caching when needed (see README next steps).
16. **No `loading.tsx` on the airport route**: it would start streaming before `notFound()` runs and
    turn unknown-airport 404s into 200s. A `<Suspense>` around the facility list gives the loading
    state instead, after the airport has been validated.
17. **Zone chips** use the spec's Landside / Airside labels with a one-line explanation
    ("Landside = before security…") because travellers don't all know the terms.
18. **Terminal labels**: numeric codes render as `T1`, `T2E`; named sectors (YUL's DOM/INT/USA)
    render as-is.
19. **Report form** echoes submitted values back on validation errors (React 19 resets forms after
    an action). A note is required unless the issue is "closed".
20. **Verification without credentials**: no Supabase keys were available, so the migration, RLS,
    seed script and app were tested against local Postgres 16 + PostgREST (the API Supabase uses),
    with HS256 JWTs for the anon and service roles. Supabase-specific behaviour (its default grants,
    API gateway) was not exercised. Do a smoke test after connecting the real project.
21. **Seed data hours**: all `opening_hours` left null. No hours were invented.
22. **JFK terminals**: seeded T1, T4, T5, T8. Terminal 6 and the new T1 open in phases, so check
    current terminal assignments when verifying.
