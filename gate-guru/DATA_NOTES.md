# Data notes — READ BEFORE PUBLIC LAUNCH

## Status

| Airport | Status |
| --- | --- |
| YUL | **Locations verified 2026-10-13** against the official directory (admtl.com/en-CA/directory): 98 venues, zone + nearest gate. Hours not published there, still unknown. Domestic restroom locations unverified. |
| YYZ, JFK, LHR, CDG | Unverified (model-written, see below) |

## Unverified airports

Everything in `data/airports/*.json` (5 airports, 16 terminals/sectors, 108 facilities) was written
from an AI model's general knowledge, **not** from current airport sources. It has not been checked
against airport websites, signage, or visits.

Expect that some of it is wrong:

- Venues open, close, rebrand and move constantly. Some named venues may no longer exist, or may be
  in a different terminal, pier or zone.
- Lounge access rules (Priority Pass, credit cards, airline status) change often and differ by
  location and time of day. Every `access_info` value should be treated as a hint, not a fact.
- Several rows are deliberately generic ("Sports bar", "Pharmacy", "Coffee counter") and say
  "name to be confirmed" in their description. They stand for a facility type that very likely
  exists there, but the actual vendor and location are unknown.
- Gate areas are approximate or missing.
- **`opening_hours` is null for every row.** No hours were invented. The UI shows "Hours unknown".
- `url` values only point to airline/airport/lounge-operator home pages, never to deep links.
- `last_verified_at` is null for every row, so the UI shows an **Unverified** badge everywhere.

Do not market the data as accurate until it has been reviewed.

## Suggested verification process

1. **One airport at a time.** Start with the airport you will launch with.
2. **Primary sources first**, in this order:
   - Airport's official "shops & restaurants" / "lounges" / "services" pages and terminal maps
     (admtl.com, torontopearson.com, jfkairport.com, heathrow.com, parisaeroport.fr).
   - Lounge operator / airline lounge finders (Priority Pass, Plaza Premium, Amex, airline sites)
     for access rules and hours.
   - Venue's own page for hours.
3. **For each row**, confirm: still exists · terminal · zone (before/after security) · gate area ·
   access rules · hours. Fix the JSON, then set `last_verified_at` (see below). Delete rows that
   no longer exist (and delete them from the database — the seed script only upserts).
4. **Replace generic rows** ("Sports bar", "Pharmacy"…) with the real vendor or remove them.
5. **Hours**: only fill `opening_hours` from an official source. Format:
   `{"mon":[{"open":"05:00","close":"22:00"}], ...}` in airport local time, `[]` for closed that
   day, `close` earlier than `open` for past-midnight, `{"open":"00:00","close":"24:00"}` for 24h.
6. **Record verification**: add `"last_verified_at": "YYYY-MM-DD"` to each checked facility in the
   JSON (the seed writes it; missing = Unverified). Add a top-level `"source"` note saying what was
   checked and where. Then run `npm run seed -- --prune` so removed venues are deleted too.
7. **Use the reports table.** "Report an issue" submissions land in `reports`; review them weekly in
   the Supabase table editor:
   `select f.name, a.iata, r.issue_type, r.note, r.created_at from reports r join facilities f on f.id=r.facility_id join airports a on a.id=f.airport_id order by r.created_at desc;`
8. **Re-verify on a schedule** (e.g. every 90 days); rows older than that could show a "may be
   out of date" hint.

## Expanding coverage

- Add one JSON file per airport in `data/airports/` (see README "Adding a new airport"), run
  `npm run validate-data`, then `npm run seed`.
- Good next airports: high-traffic hubs your users connect through (ATL, ORD, LAX, DXB, AMS, FRA).
- Consider partnering with airports or buying a licensed dataset rather than scraping; check the
  terms of any source before copying from it.
