import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, loansTable } from "@workspace/db";
import {
  ListLoansQueryParams,
  CreateLoanBody,
  UpdateLoanParams,
  UpdateLoanBody,
  DeleteLoanParams,
  GetLoanPayoffParams,
} from "@workspace/api-zod";
import { isProUser } from "../../lib/auth.js";

const router: IRouter = Router();

function serialize(l: typeof loansTable.$inferSelect) {
  return {
    ...l,
    principal: parseFloat(l.principal),
    outstandingBalance: parseFloat(l.outstandingBalance),
    interestRate: parseFloat(l.interestRate),
    emiAmount: parseFloat(l.emiAmount),
    createdAt: l.createdAt.toISOString(),
  };
}

// GET /loans?sessionId=...
router.get("/loans", async (req, res): Promise<void> => {
  const parsed = ListLoansQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const rows = await db.select().from(loansTable).where(eq(loansTable.sessionId, parsed.data.sessionId));
  res.json(rows.map(serialize));
});

// POST /loans
router.post("/loans", async (req, res): Promise<void> => {
  const body = CreateLoanBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const pro = await isProUser(body.data.sessionId);
  if (!pro) {
    res.status(402).json({ error: "loan tracking needs a pro plan" });
    return;
  }

  const [created] = await db
    .insert(loansTable)
    .values({
      sessionId: body.data.sessionId,
      label: body.data.label,
      loanType: body.data.loanType ?? "other",
      principal: String(body.data.principal),
      outstandingBalance: String(body.data.outstandingBalance),
      interestRate: String(body.data.interestRate),
      emiAmount: String(body.data.emiAmount),
      startDate: body.data.startDate ?? null,
    })
    .returning();

  res.status(201).json(serialize(created));
});

// PATCH /loans/:id
router.patch("/loans/:id", async (req, res): Promise<void> => {
  const params = UpdateLoanParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = UpdateLoanBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updates: Partial<typeof loansTable.$inferInsert> = {};
  if (body.data.outstandingBalance !== undefined) updates.outstandingBalance = String(body.data.outstandingBalance);
  if (body.data.emiAmount !== undefined) updates.emiAmount = String(body.data.emiAmount);
  if (body.data.interestRate !== undefined) updates.interestRate = String(body.data.interestRate);

  const [updated] = await db.update(loansTable).set(updates).where(eq(loansTable.id, params.data.id)).returning();

  if (!updated) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }

  res.json(serialize(updated));
});

// DELETE /loans/:id
router.delete("/loans/:id", async (req, res): Promise<void> => {
  const params = DeleteLoanParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db.delete(loansTable).where(eq(loansTable.id, params.data.id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }

  res.status(204).send();
});

// GET /loans/:id/payoff
// Standard amortization math: given outstanding balance, annual rate, and
// EMI, work out how many months remain and total interest still to be paid.
// This is a mathematical projection based on the numbers entered — not
// financial advice, and doesn't account for rate changes or prepayments.
router.get("/loans/:id/payoff", async (req, res): Promise<void> => {
  const params = GetLoanPayoffParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [loan] = await db.select().from(loansTable).where(eq(loansTable.id, params.data.id));
  if (!loan) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }

  const balance = parseFloat(loan.outstandingBalance);
  const annualRate = parseFloat(loan.interestRate);
  const emi = parseFloat(loan.emiAmount);
  const monthlyRate = annualRate / 100 / 12;

  const monthlyInterestOnBalance = balance * monthlyRate;

  if (emi <= monthlyInterestOnBalance) {
    // EMI doesn't even cover the interest accruing each month — balance
    // will never shrink at this payment level.
    res.json({
      monthsRemaining: null,
      totalInterestRemaining: 0,
      totalPayoffAmount: balance,
      note: "Your EMI doesn't cover the monthly interest at the current rate, so this loan won't pay itself off at this payment level — consider increasing the EMI.",
    });
    return;
  }

  // n = -log(1 - (P*r)/EMI) / log(1+r) — standard amortization formula
  const monthsRemaining = Math.ceil(
    -Math.log(1 - (balance * monthlyRate) / emi) / Math.log(1 + monthlyRate),
  );
  const totalPayoffAmount = Math.round(monthsRemaining * emi * 100) / 100;
  const totalInterestRemaining = Math.round((totalPayoffAmount - balance) * 100) / 100;

  res.json({
    monthsRemaining,
    totalInterestRemaining,
    totalPayoffAmount,
    note: "Projection based on your current EMI and rate. Extra prepayments would shorten this further.",
  });
});

export default router;
