import { Router, type IRouter } from "express";
import { EstimateTaxBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Simplified FY2024-25 India slabs. This is a rough estimate for personal
// budgeting purposes only — NOT tax advice. Real tax calculation involves
// many more factors (HRA, other deductions, surcharge, capital gains,
// exact rebate rules, etc.) that a qualified CA should account for.

function newRegimeTax(taxableIncome: number): number {
  const slabs: [number, number, number][] = [
    [0, 300000, 0],
    [300000, 700000, 0.05],
    [700000, 1000000, 0.10],
    [1000000, 1200000, 0.15],
    [1200000, 1500000, 0.20],
    [1500000, Infinity, 0.30],
  ];

  let tax = 0;
  for (const [from, to, rate] of slabs) {
    if (taxableIncome > from) {
      tax += (Math.min(taxableIncome, to) - from) * rate;
    }
  }

  // Section 87A rebate: taxable income up to ₹7L pays zero tax under new regime
  if (taxableIncome <= 700000) return 0;

  return Math.round(tax * 1.04); // + 4% health & education cess
}

function oldRegimeTax(taxableIncome: number): number {
  const slabs: [number, number, number][] = [
    [0, 250000, 0],
    [250000, 500000, 0.05],
    [500000, 1000000, 0.20],
    [1000000, Infinity, 0.30],
  ];

  let tax = 0;
  for (const [from, to, rate] of slabs) {
    if (taxableIncome > from) {
      tax += (Math.min(taxableIncome, to) - from) * rate;
    }
  }

  // Section 87A rebate: taxable income up to ₹5L pays zero tax under old regime
  if (taxableIncome <= 500000) return 0;

  return Math.round(tax * 1.04);
}

// POST /tax/estimate
router.post("/tax/estimate", (req, res): void => {
  const body = EstimateTaxBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { annualIncome, deductions80C = 0 } = body.data;
  const applyStandardDeduction = body.data.standardDeduction ?? true;

  const newTaxableIncome = Math.max(0, annualIncome - (applyStandardDeduction ? 75000 : 0));
  const oldTaxableIncome = Math.max(
    0,
    annualIncome - (applyStandardDeduction ? 50000 : 0) - Math.min(deductions80C, 150000),
  );

  const newTax = newRegimeTax(newTaxableIncome);
  const oldTax = oldRegimeTax(oldTaxableIncome);

  res.json({
    new: { regime: "new", taxableIncome: newTaxableIncome, estimatedTax: newTax },
    old: { regime: "old", taxableIncome: oldTaxableIncome, estimatedTax: oldTax },
    recommendedRegime: newTax <= oldTax ? "new" : "old",
    disclaimer:
      "This is a rough estimate for personal budgeting only, based on simplified FY2024-25 slabs. It is not tax advice — please consult a qualified CA or use the official income tax portal for actual filing.",
  });
});

export default router;
