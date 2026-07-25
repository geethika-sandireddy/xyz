import { pgTable, serial, text, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// One row per session — the user's monthly income and their savings target.
// Kept separate from expenses so it's a simple upsert-by-sessionId.
export const budgetProfileTable = pgTable("budget_profiles", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  monthlyIncome: numeric("monthly_income", { precision: 12, scale: 2 }).notNull(),
  savingsTarget: numeric("savings_target", { precision: 12, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Fixed recurring costs the user carries every month: rent, electricity,
// petrol, food, EMIs, insurance, etc. Subtracted from income before we
// estimate "safe to spend" balance.
export const fixedExpensesTable = pgTable("fixed_expenses", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  label: text("label").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull().default("other"), // rent | utilities | transport | food | emi | insurance | other
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Short or long-term financial goals (e.g. "home down payment"), with a
// target amount and date, used to work out required monthly savings.
export const financialGoalsTable = pgTable("financial_goals", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  title: text("title").notNull(),
  targetAmount: numeric("target_amount", { precision: 14, scale: 2 }).notNull(),
  savedSoFar: numeric("saved_so_far", { precision: 14, scale: 2 }).notNull().default("0"),
  targetDate: date("target_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBudgetProfileSchema = createInsertSchema(budgetProfileTable).omit({ id: true, updatedAt: true });
export const insertFixedExpenseSchema = createInsertSchema(fixedExpensesTable).omit({ id: true, createdAt: true });
export const insertFinancialGoalSchema = createInsertSchema(financialGoalsTable).omit({ id: true, createdAt: true });

export type InsertBudgetProfile = z.infer<typeof insertBudgetProfileSchema>;
export type InsertFixedExpense = z.infer<typeof insertFixedExpenseSchema>;
export type InsertFinancialGoal = z.infer<typeof insertFinancialGoalSchema>;
export type BudgetProfile = typeof budgetProfileTable.$inferSelect;
export type FixedExpense = typeof fixedExpensesTable.$inferSelect;
export type FinancialGoal = typeof financialGoalsTable.$inferSelect;
