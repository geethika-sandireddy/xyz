import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, budgetProfileTable, fixedExpensesTable, financialGoalsTable, subscriptionsTable } from "@workspace/db";
import {
  GetBudgetProfileQueryParams,
  SetBudgetProfileBody,
  ListFixedExpensesQueryParams,
  CreateFixedExpenseBody,
  DeleteFixedExpenseParams,
  ListFinancialGoalsQueryParams,
  CreateFinancialGoalBody,
  DeleteFinancialGoalParams,
  GetBudgetSummaryQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeProfile(p: typeof budgetProfileTable.$inferSelect) {
  return {
    sessionId: p.sessionId,
    monthlyIncome: parseFloat(p.monthlyIncome),
    savingsTarget: parseFloat(p.savingsTarget),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function serializeExpense(e: typeof fixedExpensesTable.$inferSelect) {
  return { ...e, amount: parseFloat(e.amount), createdAt: e.createdAt.toISOString() };
}

function serializeGoal(g: typeof financialGoalsTable.$inferSelect) {
  return {
    ...g,
    targetAmount: parseFloat(g.targetAmount),
    savedSoFar: parseFloat(g.savedSoFar),
    createdAt: g.createdAt.toISOString(),
  };
}

// GET /budget/profile?sessionId=...
router.get("/budget/profile", async (req, res): Promise<void> => {
  const parsed = GetBudgetProfileQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const [profile] = await db
    .select()
    .from(budgetProfileTable)
    .where(eq(budgetProfileTable.sessionId, parsed.data.sessionId));

  if (!profile) {
    // No profile set yet — return zeroed defaults rather than 404, so the
    // frontend can render an empty budget form without a special case.
    res.json({ sessionId: parsed.data.sessionId, monthlyIncome: 0, savingsTarget: 0, updatedAt: new Date().toISOString() });
    return;
  }

  res.json(serializeProfile(profile));
});

// PUT /budget/profile — upsert income + savings target
router.put("/budget/profile", async (req, res): Promise<void> => {
  const body = SetBudgetProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(budgetProfileTable)
    .where(eq(budgetProfileTable.sessionId, body.data.sessionId));

  const values = {
    sessionId: body.data.sessionId,
    monthlyIncome: String(body.data.monthlyIncome),
    savingsTarget: String(body.data.savingsTarget ?? 0),
    updatedAt: new Date(),
  };

  const [saved] = existing
    ? await db
        .update(budgetProfileTable)
        .set(values)
        .where(eq(budgetProfileTable.sessionId, body.data.sessionId))
        .returning()
    : await db.insert(budgetProfileTable).values(values).returning();

  res.json(serializeProfile(saved));
});

// GET /budget/expenses?sessionId=...
router.get("/budget/expenses", async (req, res): Promise<void> => {
  const parsed = ListFixedExpensesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const rows = await db
    .select()
    .from(fixedExpensesTable)
    .where(eq(fixedExpensesTable.sessionId, parsed.data.sessionId));

  res.json(rows.map(serializeExpense));
});

// POST /budget/expenses
router.post("/budget/expenses", async (req, res): Promise<void> => {
  const body = CreateFixedExpenseBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [created] = await db
    .insert(fixedExpensesTable)
    .values({
      sessionId: body.data.sessionId,
      label: body.data.label,
      amount: String(body.data.amount),
      category: body.data.category ?? "other",
    })
    .returning();

  res.status(201).json(serializeExpense(created));
});

// DELETE /budget/expenses/:id
router.delete("/budget/expenses/:id", async (req, res): Promise<void> => {
  const params = DeleteFixedExpenseParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(fixedExpensesTable)
    .where(eq(fixedExpensesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.status(204).send();
});

// GET /budget/goals?sessionId=...
router.get("/budget/goals", async (req, res): Promise<void> => {
  const parsed = ListFinancialGoalsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const rows = await db
    .select()
    .from(financialGoalsTable)
    .where(eq(financialGoalsTable.sessionId, parsed.data.sessionId));

  res.json(rows.map(serializeGoal));
});

// POST /budget/goals
router.post("/budget/goals", async (req, res): Promise<void> => {
  const body = CreateFinancialGoalBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [created] = await db
    .insert(financialGoalsTable)
    .values({
      sessionId: body.data.sessionId,
      title: body.data.title,
      targetAmount: String(body.data.targetAmount),
      savedSoFar: String(body.data.savedSoFar ?? 0),
      targetDate: body.data.targetDate ?? null,
    })
    .returning();

  res.status(201).json(serializeGoal(created));
});

// DELETE /budget/goals/:id
router.delete("/budget/goals/:id", async (req, res): Promise<void> => {
  const params = DeleteFinancialGoalParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(financialGoalsTable)
    .where(eq(financialGoalsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  res.status(204).send();
});

// GET /budget/summary?sessionId=...
// The core "remaining balance" estimator: income - fixed expenses -
// active subscriptions - savings target = safe-to-spend for the month.
router.get("/budget/summary", async (req, res): Promise<void> => {
  const parsed = GetBudgetSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }
  const sessionId = parsed.data.sessionId;

  const [profile] = await db
    .select()
    .from(budgetProfileTable)
    .where(eq(budgetProfileTable.sessionId, sessionId));

  const expenses = await db
    .select()
    .from(fixedExpensesTable)
    .where(eq(fixedExpensesTable.sessionId, sessionId));

  const activeSubscriptions = await db
    .select()
    .from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.sessionId, sessionId), eq(subscriptionsTable.status, "active")));

  const goals = await db
    .select()
    .from(financialGoalsTable)
    .where(eq(financialGoalsTable.sessionId, sessionId));

  const monthlyIncome = profile ? parseFloat(profile.monthlyIncome) : 0;
  const savingsTarget = profile ? parseFloat(profile.savingsTarget) : 0;
  const fixedExpensesTotal = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // Normalize all active subscriptions to a monthly-equivalent cost so
  // annual/weekly plans don't distort the monthly remaining-balance figure.
  const subscriptionsTotal = activeSubscriptions.reduce((sum, s) => {
    const amt = parseFloat(s.amount);
    if (s.frequency === "annual") return sum + amt / 12;
    if (s.frequency === "weekly") return sum + amt * 4.33;
    return sum + amt;
  }, 0);

  const remainingBalance = monthlyIncome - fixedExpensesTotal - subscriptionsTotal - savingsTarget;

  const goalsWithMonthly = goals.map(g => {
    const target = parseFloat(g.targetAmount);
    const saved = parseFloat(g.savedSoFar);
    const remaining = Math.max(target - saved, 0);

    let requiredMonthlySaving: number | null = null;
    if (g.targetDate) {
      const monthsLeft = Math.max(
        1,
        Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)),
      );
      requiredMonthlySaving = Math.round((remaining / monthsLeft) * 100) / 100;
    }

    return {
      title: g.title,
      targetAmount: target,
      savedSoFar: saved,
      targetDate: g.targetDate,
      requiredMonthlySaving,
    };
  });

  res.json({
    monthlyIncome,
    fixedExpensesTotal: Math.round(fixedExpensesTotal * 100) / 100,
    subscriptionsTotal: Math.round(subscriptionsTotal * 100) / 100,
    savingsTarget,
    remainingBalance: Math.round(remainingBalance * 100) / 100,
    goals: goalsWithMonthly,
  });
});

export default router;
