// Deal Watch: a curated database of known recurring promos/offers that
// commonly apply to the services SpendShield already detects.
//
// This is a manually-curated reference list, not a live web-scraper — deals
// like these change constantly and a hackathon-scope backend can't safely
// scrape pricing pages in real time. It's refreshed periodically and framed
// honestly to the user as "worth checking", not as a live guarantee.
export interface KnownDeal {
  matchesServiceKeys: string[]; // lowercase keys matching subscriptionDetector's KNOWN_SERVICES
  title: string;
  description: string;
}

export const KNOWN_DEALS: KnownDeal[] = [
  {
    matchesServiceKeys: ["hotstar", "disney+ hotstar", "jio cinema", "sony liv", "zee5"],
    title: "Check if your telecom plan already includes this",
    description: "Jio, Airtel, and Vi postpaid/broadband plans frequently bundle in a free OTT subscription (JioCinema, Hotstar, or similar) — worth checking your current plan before paying separately.",
  },
  {
    matchesServiceKeys: ["spotify", "youtube music", "apple music"],
    title: "Student and family plans are usually much cheaper",
    description: "Music streaming services typically offer a student plan (with ID verification) or a family plan that splits the cost across up to 6 people — often 50%+ cheaper per person than an individual plan.",
  },
  {
    matchesServiceKeys: ["netflix", "amazon prime", "amazon prime video"],
    title: "Annual billing usually beats monthly",
    description: "Streaming services often price annual plans at roughly 1-2 months free compared to paying monthly — if you're keeping the subscription long-term, switching to annual billing is a straightforward save.",
  },
  {
    matchesServiceKeys: ["cult fit", "cure fit", "gold's gym", "fitpass"],
    title: "Off-peak or quarterly plans often cost less per month",
    description: "Many fitness platforms offer discounted quarterly/annual commitments, or off-peak-hours passes at a lower rate — worth asking your gym directly if you can commit to a longer term.",
  },
  {
    matchesServiceKeys: ["notion", "slack", "google one", "icloud", "microsoft 365", "dropbox"],
    title: "You may already have this through work, college, or a bundle",
    description: "Many software subscriptions are already included via an employer's Google Workspace/Microsoft 365 license, a college email account, or bundled with a device purchase — check before paying separately.",
  },
  {
    matchesServiceKeys: ["zomato pro", "swiggy one", "swiggy super"],
    title: "These often run free-trial reactivation offers",
    description: "Food delivery membership programs frequently send win-back offers (1-3 months free) to lapsed users — cancelling and waiting a few weeks before resubscribing can sometimes net a free period.",
  },
];

export function findMatchingDeals(serviceName: string, matchedKey: string | null): KnownDeal[] {
  const key = matchedKey ?? serviceName.toLowerCase();
  return KNOWN_DEALS.filter(d => d.matchesServiceKeys.some(k => key.includes(k) || k.includes(key)));
}
