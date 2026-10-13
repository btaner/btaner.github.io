// Upserts data/airports/*.json into Supabase.
// Usage: npm run seed   (reads .env.local; needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
//
// Idempotent: airports upsert on iata, terminals on (airport_id, code), facilities on (airport_id, slug).
// Rows are never deleted. last_verified_at is always written as null: seed data is unverified.
import { createClient } from "@supabase/supabase-js";
import { loadSeedAirports } from "../src/lib/seed-data";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local).");
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const seeds = loadSeedAirports();
  console.log(`Loaded ${seeds.length} airport files.`);

  for (const seed of seeds) {
    const { data: airport, error: airportError } = await supabase
      .from("airports")
      .upsert(seed.airport, { onConflict: "iata" })
      .select("id, iata")
      .single();
    if (airportError) throw new Error(`${seed.airport.iata}: ${airportError.message}`);

    const { data: terminals, error: terminalError } = await supabase
      .from("terminals")
      .upsert(
        seed.terminals.map((t) => ({ ...t, airport_id: airport.id })),
        { onConflict: "airport_id,code" },
      )
      .select("id, code");
    if (terminalError) throw new Error(`${seed.airport.iata} terminals: ${terminalError.message}`);
    const terminalIds = new Map(terminals.map((t) => [t.code, t.id as string]));

    const rows = seed.facilities.map(({ terminal, ...f }) => {
      const terminalId = terminalIds.get(terminal);
      if (!terminalId) throw new Error(`${seed.airport.iata}: terminal ${terminal} not found after upsert`);
      return { ...f, airport_id: airport.id, terminal_id: terminalId, last_verified_at: null };
    });
    const { error: facilityError } = await supabase
      .from("facilities")
      .upsert(rows, { onConflict: "airport_id,slug" });
    if (facilityError) throw new Error(`${seed.airport.iata} facilities: ${facilityError.message}`);

    console.log(`${airport.iata}: ${terminals.length} terminals, ${rows.length} facilities`);
  }
  console.log("Seed complete.");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
