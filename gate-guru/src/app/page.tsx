import { connection } from "next/server";
import { AirportSearch } from "@/components/AirportSearch";
import { getAirports } from "@/lib/data";

export default async function HomePage() {
  await connection();
  const airports = await getAirports();
  return (
    <>
      <section className="mb-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-amber">Now boarding</p>
        <h1 className="mt-2 font-mono text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          What’s near your gate?
        </h1>
        <p className="mt-3 max-w-prose text-muted">
          Restaurants, lounges, restrooms, charging and more — by terminal, before or after security.
        </p>
      </section>
      <AirportSearch airports={airports} />
    </>
  );
}
