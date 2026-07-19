import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import { db, savingsTable } from "@workspace/db";
import { RecordSavingBody } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /savings
router.get("/savings", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(savingsTable)
    .orderBy(desc(savingsTable.savedAt));

  const totalSaved = rows.reduce((sum, r) => sum + parseFloat(r.amountSaved), 0);

  res.json({
    savings: rows.map(r => ({
      ...r,
      amountSaved: parseFloat(r.amountSaved),
      savedAt: r.savedAt.toISOString(),
    })),
    totalSaved,
    count: rows.length,
  });
});

// POST /savings
router.post("/savings", async (req, res): Promise<void> => {
  const parsed = RecordSavingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [saved] = await db
    .insert(savingsTable)
    .values({
      subscriptionId: parsed.data.subscriptionId ?? null,
      subscriptionName: parsed.data.subscriptionName,
      amountSaved: String(parsed.data.amountSaved),
      note: parsed.data.note ?? null,
    })
    .returning();

  res.status(201).json({
    ...saved,
    amountSaved: parseFloat(saved.amountSaved),
    savedAt: saved.savedAt.toISOString(),
  });
});

// GET /savings/summary
router.get("/savings/summary", async (_req, res): Promise<void> => {
  const rows = await db.select().from(savingsTable).orderBy(desc(savingsTable.savedAt));

  const now = new Date();
  const thisMonth = rows.filter(r => {
    const d = new Date(r.savedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalSaved = rows.reduce((sum, r) => sum + parseFloat(r.amountSaved), 0);
  const thisMonthSaved = thisMonth.reduce((sum, r) => sum + parseFloat(r.amountSaved), 0);

  // Build monthly breakdown — last 6 months
  const monthlyMap: Record<string, number> = {};
  for (const r of rows) {
    const d = new Date(r.savedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = (monthlyMap[key] ?? 0) + parseFloat(r.amountSaved);
  }

  const monthlySavings = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }));

  res.json({
    totalSaved,
    totalCount: rows.length,
    thisMonthSaved,
    allTimeCount: rows.length,
    monthlySavings,
  });
});

export default router;
