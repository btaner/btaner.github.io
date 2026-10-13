# Gate Guru

Find restaurants, lounges and facilities at an airport, filtered by **terminal** and **security
zone** (landside = before security, airside = after security). Mobile-first, departure-board style.

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase Postgres · Vercel.

> ⚠️ Seed data is **unverified** (written from AI model knowledge). Read [DATA_NOTES.md](DATA_NOTES.md)
> before any public launch.

## Routes

| Route | What |
| --- | --- |
| `/` | Airport search (name, city or IATA code) and airport cards |
| `/[iata]?terminal=&zone=&category=` | Airport board. Filters live in the URL and are applied in the database query |
| `/[iata]/[slug]` | Facility detail, open-now status, "Report an issue" form |
| `/sitemap.xml`, `/robots.txt` | SEO |

## Setup

Requires Node 20.9+ (tested on Node 26) and a Supabase project.

```bash
cd gate-guru
npm install
cp .env.example .env.local   # then fill in the values
```

### Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | local + Vercel | Supabase project URL (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | local + Vercel | Public anon key. Row Level Security limits it to reading listings and inserting reports |
| `SUPABASE_SERVICE_ROLE_KEY` | **local only** | Used only by `npm run seed`. Never add it to Vercel or client code |
| `NEXT_PUBLIC_SITE_URL` | Vercel (recommended) | Canonical base URL for Open Graph tags and the sitemap. Falls back to Vercel's production domain, then `http://localhost:3000` |

### Run the migration

The schema is in [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql). Pick one of:

- **SQL editor (simplest):** Supabase dashboard → SQL Editor → paste the whole file → Run.
- **Supabase CLI:**
  ```bash
  npx supabase login
  npx supabase link --project-ref YOUR_PROJECT_REF
  npx supabase db push
  ```

### Seed the data

```bash
npm run validate-data   # checks data/airports/*.json, no database needed
npm run seed            # upserts into Supabase using SUPABASE_SERVICE_ROLE_KEY from .env.local
```

The seed is idempotent. It upserts airports by `iata`, terminals by `(airport, code)` and facilities
by `(airport, slug)`. It never deletes rows, and it always writes `last_verified_at = null`.

### Develop

```bash
npm run dev        # http://localhost:3000
npm test           # vitest (open-now / timezone logic)
npm run lint
npm run typecheck
npm run build
```

## Deploy to Vercel

1. Push the repo to GitHub, then in Vercel choose **Add New → Project** and import it.
2. **Root Directory: `gate-guru`** (the app lives in a subfolder of this repo). Framework preset: Next.js.
3. Add the environment variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `NEXT_PUBLIC_SITE_URL` for Production (and Preview if you want previews to work).
4. Deploy. Then smoke-test `/`, `/yul`, a facility page, submitting a report (check the `reports`
   table), and `/sitemap.xml`.

CLI alternative: `npx vercel link` (set root to `gate-guru`), `npx vercel env add …`, `npx vercel --prod`.

## Add a new airport

1. Create `data/airports/<iata>.json` (lowercase file name), copying the shape of an existing file:
   ```json
   {
     "airport": { "iata": "AMS", "name": "Amsterdam Airport Schiphol", "city": "Amsterdam",
                  "country": "Netherlands", "timezone": "Europe/Amsterdam" },
     "terminals": [{ "code": "1", "name": "Departure Hall 1", "sort_order": 1 }],
     "facilities": [{
       "slug": "t1-example-cafe", "name": "Example Café", "terminal": "1",
       "category": "cafe", "zone": "airside", "gate_area": "Gates B1-B20",
       "description": "…", "access_info": null, "url": null,
       "opening_hours": { "mon": [{ "open": "05:00", "close": "22:00" }] }
     }]
   }
   ```
   - `timezone` is an IANA name. Open-now uses it.
   - `category` is one of: `restaurant cafe bar lounge shop pharmacy restroom charging prayer_room other`.
   - `zone` is `landside` (before security) or `airside` (after security).
   - `slug` is lowercase-kebab and unique within the airport.
   - `opening_hours` is in local time, keyed by `mon`…`sun`. Use `[]` for closed that day.
     `close` earlier than `open` means the range runs past midnight, and `00:00`–`24:00` means
     24 hours. Leave the whole field out or `null` if unknown. Never guess.
2. `npm run validate-data` and fix any errors it reports.
3. `npm run seed`.
4. After verifying listings, set `last_verified_at` in the database (see DATA_NOTES.md).

## Project layout

```
supabase/migrations/   SQL schema + RLS
data/airports/         seed JSON, one file per airport
scripts/               seed.ts, validate-data.ts
src/app/               routes (home, [iata], [iata]/[slug], sitemap, robots, 404, error)
src/components/        AirportSearch, Chip, FacilityRow, Badges, ReportForm
src/lib/               data access, open-now logic (+ tests), filters, types
```

See [PLAN.md](PLAN.md) for the original plan and [DECISIONS.md](DECISIONS.md) for the judgement calls.
