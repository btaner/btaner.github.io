import Link from "next/link";
import { StatusBadge, UnverifiedBadge } from "@/components/Badges";
import { CATEGORY_META, terminalLabel, ZONE_META } from "@/lib/categories";
import { getOpenStatus } from "@/lib/hours";
import type { Facility, Terminal } from "@/lib/types";

type Props = { facility: Facility; terminal: Terminal | undefined; iata: string; timezone: string; now: Date };

/** One departure-board row: category code · name · terminal/zone · status. */
export function FacilityRow({ facility, terminal, iata, timezone, now }: Props) {
  const meta = CATEGORY_META[facility.category];
  const status = getOpenStatus(facility.opening_hours, timezone, now);
  return (
    <li>
      <Link
        href={`/${iata.toLowerCase()}/${facility.slug}`}
        className="grid min-h-16 grid-cols-[3.5rem_1fr] items-center gap-3 rounded-md border border-line bg-panel px-3 py-3 transition-colors hover:border-amber/60 hover:bg-panel-hi"
      >
        <span className="flap rounded bg-navy py-2 text-center font-mono text-sm font-bold tracking-wider text-amber">
          <span aria-hidden="true">{meta.code}</span>
          <span className="sr-only">{meta.label}</span>
        </span>
        <span className="min-w-0">
          <span className="line-clamp-2 font-semibold leading-snug text-ink">{facility.name}</span>
          <span className="mt-0.5 block font-mono text-xs uppercase tracking-wide text-muted">
            {terminal ? terminalLabel(terminal.code) : "—"} · {ZONE_META[facility.zone].label}
            {facility.gate_area ? ` · ${facility.gate_area}` : ""}
          </span>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <StatusBadge status={status} />
            {facility.last_verified_at === null && <UnverifiedBadge />}
          </span>
        </span>
      </Link>
    </li>
  );
}
