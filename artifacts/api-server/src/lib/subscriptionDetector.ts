// Rule-based subscription detector
// Identifies recurring charges from raw bank statement text.
// Designed to be swapped with Gemini AI analysis when API key is available.

export interface DetectedSubscription {
  name: string;
  amount: number;
  frequency: "monthly" | "annual" | "weekly" | "unknown";
  category: "streaming" | "fitness" | "software" | "food" | "finance" | "utility" | "gaming" | "education" | "other";
  status: "active" | "flagged";
  flagReason: string | null;
}

// Known subscription services with expected price ranges (INR)
const KNOWN_SERVICES: Record<string, { category: DetectedSubscription["category"]; monthlyRange: [number, number] }> = {
  netflix: { category: "streaming", monthlyRange: [149, 649] },
  "amazon prime": { category: "streaming", monthlyRange: [99, 299] },
  "amazon prime video": { category: "streaming", monthlyRange: [99, 299] },
  hotstar: { category: "streaming", monthlyRange: [49, 299] },
  "disney+ hotstar": { category: "streaming", monthlyRange: [49, 299] },
  spotify: { category: "streaming", monthlyRange: [7, 119] },
  "youtube premium": { category: "streaming", monthlyRange: [129, 189] },
  "youtube music": { category: "streaming", monthlyRange: [99, 99] },
  "apple music": { category: "streaming", monthlyRange: [99, 99] },
  "jio cinema": { category: "streaming", monthlyRange: [29, 89] },
  "zee5": { category: "streaming", monthlyRange: [49, 99] },
  "sony liv": { category: "streaming", monthlyRange: [99, 299] },
  "mxplayer": { category: "streaming", monthlyRange: [49, 99] },
  "voot": { category: "streaming", monthlyRange: [99, 299] },
  "cult fit": { category: "fitness", monthlyRange: [699, 2999] },
  "cure fit": { category: "fitness", monthlyRange: [699, 2999] },
  "gold's gym": { category: "fitness", monthlyRange: [799, 2499] },
  "fitpass": { category: "fitness", monthlyRange: [499, 1999] },
  "unacademy": { category: "education", monthlyRange: [299, 1999] },
  "byju": { category: "education", monthlyRange: [999, 4999] },
  "coursera": { category: "education", monthlyRange: [399, 1499] },
  "udemy": { category: "education", monthlyRange: [199, 499] },
  "notion": { category: "software", monthlyRange: [0, 799] },
  "slack": { category: "software", monthlyRange: [0, 599] },
  "google one": { category: "software", monthlyRange: [130, 650] },
  "icloud": { category: "software", monthlyRange: [75, 249] },
  "microsoft 365": { category: "software", monthlyRange: [420, 840] },
  "dropbox": { category: "software", monthlyRange: [199, 999] },
  "zomato pro": { category: "food", monthlyRange: [99, 169] },
  "swiggy one": { category: "food", monthlyRange: [99, 179] },
  "swiggy super": { category: "food", monthlyRange: [99, 179] },
  "dunzo": { category: "food", monthlyRange: [49, 99] },
  "zepto pass": { category: "food", monthlyRange: [49, 99] },
  "phonepe": { category: "finance", monthlyRange: [0, 199] },
  "paytm": { category: "finance", monthlyRange: [0, 299] },
  "groww": { category: "finance", monthlyRange: [0, 0] },
  "zerodha": { category: "finance", monthlyRange: [0, 300] },
  "insurance": { category: "finance", monthlyRange: [200, 5000] },
  "jio": { category: "utility", monthlyRange: [149, 999] },
  "airtel": { category: "utility", monthlyRange: [149, 999] },
  "bsnl": { category: "utility", monthlyRange: [99, 599] },
  "vi ": { category: "utility", monthlyRange: [149, 999] },
  "playstation": { category: "gaming", monthlyRange: [499, 999] },
  "xbox game pass": { category: "gaming", monthlyRange: [399, 699] },
  "ea play": { category: "gaming", monthlyRange: [299, 499] },
};

// Amount pattern: matches ₹ or Rs amounts like ₹299, Rs.499, 1,299.00
const AMOUNT_PATTERN = /(?:₹|Rs\.?|INR)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi;

// Line patterns that indicate a debit / charge
const DEBIT_KEYWORDS = /(?:debit|dr|paid|payment|charge|subscription|auto.?renew|emi|mandate)/i;

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, ""));
}

function detectCategory(name: string): DetectedSubscription["category"] {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(KNOWN_SERVICES)) {
    if (lower.includes(key)) return val.category;
  }
  if (/gym|fitness|yoga|zumba|pilates/i.test(lower)) return "fitness";
  if (/stream|video|music|movie|show|ott/i.test(lower)) return "streaming";
  if (/learn|course|edu|skill|tutor/i.test(lower)) return "education";
  if (/food|deliver|restaurant|eat/i.test(lower)) return "food";
  if (/insurance|loan|emi|bank|invest|mutual/i.test(lower)) return "finance";
  if (/cloud|storage|software|saas|app|tool/i.test(lower)) return "software";
  if (/game|play|xbox|playstation|steam/i.test(lower)) return "gaming";
  if (/phone|mobile|internet|wifi|broadband|recharge/i.test(lower)) return "utility";
  return "other";
}

function detectFrequency(line: string, amount: number): DetectedSubscription["frequency"] {
  if (/annual|yearly|year/i.test(line)) return "annual";
  if (/weekly|week/i.test(line)) return "weekly";
  if (/monthly|month|per month/i.test(line)) return "monthly";
  // Heuristic: large round amounts are often annual
  if (amount > 2000 && amount % 100 === 0) return "annual";
  return "monthly";
}

function shouldFlag(
  name: string,
  amount: number,
  frequency: string
): { flag: boolean; reason: string | null } {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(KNOWN_SERVICES)) {
    if (lower.includes(key)) {
      const effectiveMonthly = frequency === "annual" ? amount / 12 : amount;
      const [min, max] = val.monthlyRange;
      if (max > 0 && effectiveMonthly > max * 1.5) {
        return { flag: true, reason: `Paying ₹${amount} — above typical range of ₹${min}–₹${max}/month` };
      }
    }
  }

  // Flag duplicate-looking names
  const streamingServices = ["netflix", "hotstar", "amazon prime", "zee5", "sony liv", "voot", "mxplayer"];
  const detectedStreaming = streamingServices.filter(s => lower.includes(s));
  if (detectedStreaming.length > 0) {
    return { flag: false, reason: null }; // Will be checked at collection level
  }

  return { flag: false, reason: null };
}

export function detectSubscriptions(statementText: string): DetectedSubscription[] {
  const lines = statementText.split(/\n/);
  const results: DetectedSubscription[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!line.trim()) continue;

    // Find amounts in this line
    const amounts: number[] = [];
    let match: RegExpExecArray | null;
    const amtRe = new RegExp(AMOUNT_PATTERN.source, "gi");
    while ((match = amtRe.exec(line)) !== null) {
      const amt = parseAmount(match[1]);
      if (amt > 0 && amt < 50000) amounts.push(amt);
    }

    if (amounts.length === 0) continue;

    // Check if line looks like a subscription / recurring debit
    const isLikelySubscription =
      DEBIT_KEYWORDS.test(line) ||
      Object.keys(KNOWN_SERVICES).some(k => line.toLowerCase().includes(k));

    if (!isLikelySubscription) continue;

    // Try to extract service name
    let detectedName = "";
    for (const key of Object.keys(KNOWN_SERVICES)) {
      if (line.toLowerCase().includes(key)) {
        detectedName = key
          .split(" ")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        break;
      }
    }

    if (!detectedName) {
      // Fallback: extract capitalized words or phrases near payment keywords
      const nameMatch = line.match(/(?:to|for|at|from)\s+([A-Z][A-Za-z0-9\s&.'-]{2,30})/);
      detectedName = nameMatch ? nameMatch[1].trim() : "Unknown Subscription";
    }

    const amount = amounts[0];
    const dedupeKey = `${detectedName.toLowerCase()}:${amount}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const frequency = detectFrequency(line, amount);
    const category = detectCategory(detectedName);
    const { flag, reason } = shouldFlag(detectedName, amount, frequency);

    results.push({
      name: detectedName,
      amount,
      frequency,
      category,
      status: flag ? "flagged" : "active",
      flagReason: reason,
    });
  }

  // Flag if more than 2 streaming services detected
  const streamingCount = results.filter(r => r.category === "streaming").length;
  if (streamingCount >= 3) {
    results
      .filter(r => r.category === "streaming" && r.status === "active")
      .slice(1)
      .forEach(r => {
        r.status = "flagged";
        r.flagReason = r.flagReason ?? `You have ${streamingCount} streaming subscriptions — consider consolidating`;
      });
  }

  return results;
}
