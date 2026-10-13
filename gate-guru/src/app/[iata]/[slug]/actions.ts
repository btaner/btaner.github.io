"use server";

import { insertReport } from "@/lib/data";
import { isIssueType } from "@/lib/types";

export type ReportState = {
  status: "idle" | "success" | "error";
  message: string;
  /** Submitted values, echoed back so the form can restore them after an error. */
  values?: { issueType: string; note: string };
  attempt: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NOTE = 1000;

export async function submitReport(prev: ReportState, formData: FormData): Promise<ReportState> {
  const attempt = prev.attempt + 1;
  // Honeypot: real users never see or fill this field. Pretend success so bots move on.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "success", message: "Thanks — your report was sent.", attempt };
  }

  const facilityId = String(formData.get("facility_id") ?? "");
  const issueType = formData.get("issue_type");
  const note = String(formData.get("note") ?? "").trim();
  const values = { issueType: typeof issueType === "string" ? issueType : "", note };
  const fail = (message: string): ReportState => ({ status: "error", message, values, attempt });

  if (!UUID.test(facilityId)) return fail("Something went wrong. Please reload and try again.");
  if (!isIssueType(issueType)) return fail("Please choose what’s wrong.");
  if (note.length > MAX_NOTE) return fail(`Please keep the note under ${MAX_NOTE} characters.`);
  if (issueType !== "closed" && note.length === 0) return fail("Please add a short note so we know what to fix.");

  try {
    await insertReport(facilityId, issueType, note || null);
  } catch (err) {
    console.error(err);
    return fail("We couldn’t save your report right now. Please try again later.");
  }
  return { status: "success", message: "Thanks — your report was sent. We’ll review this listing.", attempt };
}
