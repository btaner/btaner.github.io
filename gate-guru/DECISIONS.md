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
10. **Local dev without Supabase**: if `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    are not set, the data layer reads the same `data/*.json` seed files (read-only, reports are
    logged to the server console). This made local verification possible without credentials and
    lets anyone run the UI instantly. In production the env vars are required (the app shows the
    friendly error page if Supabase errors).
11. **Fonts**: JetBrains Mono (headings, codes, labels) + Inter (body) via `next/font/google`.
12. **Icons**: emoji-free, dependency-free inline SVG would be heavier to maintain; I use short
    monospace category codes (e.g. `EAT`, `BAR`, `LNG`) styled like a departure board, with a
    full text label for screen readers.
13. **Open-now for 24h/overnight**: computed against both today's and yesterday's ranges.
14. **"Closing soon"** is shown when a venue closes within 30 minutes (cheap, useful).
