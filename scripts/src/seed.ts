/**
 * Seed script — adds sample subscriptions and savings for demo purposes.
 * Run with: pnpm --filter @workspace/scripts run seed
 */

import { db, subscriptionsTable, savingsTable } from "@workspace/db";

const DEMO_SESSION = "demo-session-001";

async function seed() {
  console.log("Seeding demo data...");

  // Clean up existing demo data
  await db.delete(subscriptionsTable);
  await db.delete(savingsTable);

  // Insert sample subscriptions
  const subs = await db
    .insert(subscriptionsTable)
    .values([
      {
        sessionId: DEMO_SESSION,
        name: "Netflix",
        amount: "649",
        frequency: "monthly",
        category: "streaming",
        status: "flagged",
        flagReason: "You have 3 streaming subscriptions — consider consolidating",
      },
      {
        sessionId: DEMO_SESSION,
        name: "Amazon Prime",
        amount: "299",
        frequency: "monthly",
        category: "streaming",
        status: "active",
        flagReason: null,
      },
      {
        sessionId: DEMO_SESSION,
        name: "Disney+ Hotstar",
        amount: "299",
        frequency: "monthly",
        category: "streaming",
        status: "flagged",
        flagReason: "You have 3 streaming subscriptions — consider consolidating",
      },
      {
        sessionId: DEMO_SESSION,
        name: "Spotify",
        amount: "119",
        frequency: "monthly",
        category: "streaming",
        status: "active",
        flagReason: null,
      },
      {
        sessionId: DEMO_SESSION,
        name: "Cult Fit",
        amount: "1499",
        frequency: "monthly",
        category: "fitness",
        status: "flagged",
        flagReason: "Paying ₹1499 — above typical range of ₹699–₹999/month",
      },
      {
        sessionId: DEMO_SESSION,
        name: "Google One",
        amount: "650",
        frequency: "monthly",
        category: "software",
        status: "active",
        flagReason: null,
      },
    ])
    .returning();

  console.log(`Inserted ${subs.length} subscriptions`);

  // Insert sample savings
  const savings = await db
    .insert(savingsTable)
    .values([
      {
        subscriptionName: "Zomato Pro",
        amountSaved: "169",
        note: "Negotiated a 3-month free extension by threatening to cancel",
      },
      {
        subscriptionName: "Hotstar Premium",
        amountSaved: "599",
        note: "Switched to mobile-only plan",
      },
      {
        subscriptionName: "Gym Membership",
        amountSaved: "800",
        note: "Got loyalty discount after calling customer care",
      },
    ])
    .returning();

  console.log(`Inserted ${savings.length} savings records`);
  console.log("Done! Total demo savings: ₹" + savings.reduce((s, r) => s + parseFloat(r.amountSaved), 0));

  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
