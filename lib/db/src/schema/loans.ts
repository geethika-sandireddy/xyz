import { pgTable, serial, text, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Loan/EMI tracker: home loan, car loan, personal loan, education loan, etc.
// Used to compute payoff timelines and flag whether prepayment makes sense.
export const loansTable = pgTable("loans", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  label: text("label").notNull(), // e.g. "Home Loan - SBI"
  loanType: text("loan_type").notNull().default("other"), // home | car | personal | education | credit_card | other
  principal: numeric("principal", { precision: 14, scale: 2 }).notNull(),
  outstandingBalance: numeric("outstanding_balance", { precision: 14, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull(), // annual %, e.g. 8.50
  emiAmount: numeric("emi_amount", { precision: 12, scale: 2 }).notNull(),
  startDate: date("start_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLoanSchema = createInsertSchema(loansTable).omit({ id: true, createdAt: true });
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loansTable.$inferSelect;
