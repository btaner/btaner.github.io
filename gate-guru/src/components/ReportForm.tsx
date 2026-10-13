"use client";

import { useActionState } from "react";
import { submitReport, type ReportState } from "@/app/[iata]/[slug]/actions";

const initialState: ReportState = { status: "idle", message: "", attempt: 0 };

const OPTIONS = [
  { value: "closed", label: "It’s closed or gone" },
  { value: "wrong_info", label: "Some info is wrong" },
  { value: "other", label: "Something else" },
] as const;

export function ReportForm({ facilityId }: { facilityId: string }) {
  const [state, action, pending] = useActionState(submitReport, initialState);
  const selected = state.values?.issueType ?? OPTIONS[0].value;

  if (state.status === "success") {
    return (
      <p role="status" className="rounded-md border border-go/40 bg-go/10 p-4 text-go">
        {state.message}
      </p>
    );
  }

  return (
    // Keyed by attempt so React remounts the form with the echoed values after its automatic reset.
    <form key={state.attempt} action={action} className="space-y-4" noValidate>
      <input type="hidden" name="facility_id" value={facilityId} />
      {/* Honeypot, hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-muted">What’s wrong?</legend>
        <div className="space-y-2">
          {OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-line bg-panel px-3 has-[:checked]:border-amber"
            >
              <input type="radio" name="issue_type" value={o.value} defaultChecked={o.value === selected} className="h-5 w-5 accent-amber" />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="report-note" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-widest text-muted">
          Details <span className="normal-case tracking-normal">(optional if closed)</span>
        </label>
        <textarea
          id="report-note"
          name="note"
          rows={3}
          maxLength={1000}
          defaultValue={state.values?.note ?? ""}
          className="w-full rounded-md border border-line bg-panel p-3 text-ink placeholder:text-muted/70 focus:border-amber"
          placeholder="e.g. Moved to near gate B12, now closes at 20:00"
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="rounded-md border border-stop/40 bg-stop/10 p-3 text-stop">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 items-center rounded-md bg-amber px-5 font-mono text-sm font-bold uppercase tracking-wide text-navy disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send report"}
      </button>
    </form>
  );
}
