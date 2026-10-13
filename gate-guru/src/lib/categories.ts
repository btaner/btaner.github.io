import type { Category, Zone } from "./types";

/** Board-style 3-letter code plus a readable label for each category. */
export const CATEGORY_META: Record<Category, { code: string; label: string; plural: string }> = {
  restaurant: { code: "EAT", label: "Restaurant", plural: "Restaurants" },
  cafe: { code: "CAF", label: "Café", plural: "Cafés" },
  bar: { code: "BAR", label: "Bar", plural: "Bars" },
  lounge: { code: "LNG", label: "Lounge", plural: "Lounges" },
  shop: { code: "SHP", label: "Shop", plural: "Shops" },
  pharmacy: { code: "RX", label: "Pharmacy", plural: "Pharmacies" },
  restroom: { code: "WC", label: "Restroom", plural: "Restrooms" },
  charging: { code: "PWR", label: "Charging", plural: "Charging" },
  prayer_room: { code: "PRY", label: "Prayer room", plural: "Prayer rooms" },
  other: { code: "OTH", label: "Other", plural: "Other" },
};

export const ZONE_META: Record<Zone, { label: string; hint: string }> = {
  landside: { label: "Landside", hint: "Before security" },
  airside: { label: "Airside", hint: "After security" },
};

/** Short terminal label: "T4", "T2E" for numbered terminals, the code itself otherwise ("INT"). */
export function terminalLabel(code: string): string {
  return /^\d/.test(code) ? `T${code}` : code;
}
