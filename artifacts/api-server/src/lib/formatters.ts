/**
 * Utility formatters for consistent API response shaping.
 */

/** Format an amount number to Indian locale string (e.g. 1299 → "1,299") */
export function formatAmount(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return n.toLocaleString("en-IN");
}

/** Parse a DB numeric string to a JS number safely */
export function parseNumeric(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n) ? 0 : n;
}

/** Format a Date or ISO string to a readable label (e.g. "Jul 2026") */
export function formatMonth(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

/** Map a subscription category to a display label */
export const CATEGORY_LABELS: Record<string, string> = {
  streaming: "Streaming",
  fitness: "Fitness",
  software: "Software",
  food: "Food & Delivery",
  finance: "Finance",
  utility: "Utility",
  gaming: "Gaming",
  education: "Education",
  other: "Other",
};

/** Map a frequency value to a readable label */
export const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "per month",
  annual: "per year",
  weekly: "per week",
  unknown: "",
};
