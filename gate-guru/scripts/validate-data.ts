// Validates data/airports/*.json without touching the database. Usage: npm run validate-data
import { loadSeedAirports } from "../src/lib/seed-data";

for (const seed of loadSeedAirports()) {
  console.log(`${seed.airport.iata}: ${seed.terminals.length} terminals, ${seed.facilities.length} facilities`);
}
console.log("All seed files are valid.");
