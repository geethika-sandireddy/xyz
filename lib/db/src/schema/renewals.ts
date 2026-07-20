import { pgTable, serial, text, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Renewal Watch: tracks free trials and upcoming subscription renewals so
// users get reminded BEFORE they get auto-charged, instead of finding out
// after the money is already gone.
export const renewalsTable = pgTable("renewals", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  serviceName: text("service_name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: text("frequency").notNull().default("monthly"), // monthly | annual | weekly | one_time_trial
  renewalDate: timestamp("renewal_date").notNull(),
  isTrial: boolean("is_trial").notNull().default(false),
  status: text("status").notNull().default("upcoming"), // upcoming | reminded | cancelled | renewed | ignored
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRenewalSchema = createInsertSchema(renewalsTable).omit({ id: true, createdAt: true });
export type InsertRenewal = z.infer<typeof insertRenewalSchema>;
export type Renewal = typeof renewalsTable.$inferSelect;
