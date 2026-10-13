import { describeStatus, type OpenStatus } from "@/lib/hours";

const pill = "inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wide";

export function StatusBadge({ status }: { status: OpenStatus }) {
  const label = describeStatus(status);
  if (status.state === "open") {
    const tone = status.closingSoon ? "bg-amber text-navy" : "bg-go/15 text-go ring-1 ring-go/40";
    return (
      <span className={`${pill} ${tone}`}>
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
        {label}
      </span>
    );
  }
  if (status.state === "closed") {
    return <span className={`${pill} bg-stop/15 text-stop ring-1 ring-stop/40`}>{label}</span>;
  }
  return <span className={`${pill} text-muted ring-1 ring-line`}>{label}</span>;
}

export function UnverifiedBadge() {
  return (
    <span
      className={`${pill} border border-dashed border-amber-dim text-amber`}
      title="This listing has not been verified yet. Check signage at the airport."
    >
      Unverified
    </span>
  );
}
