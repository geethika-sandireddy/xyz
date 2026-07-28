import { pgTable, serial, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savingsTable = pgTable("savings", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  subscriptionId: integer("subscription_id"),
  subscriptionName: text("subscription_name").notNull(),
  amountSaved: numeric("amount_saved", { precision: 10, scale: 2 }).notNull(),
  note: text("note"),
  savedAt: timestamp("saved_at").notNull().defaultNow(),
});

export const insertSavingSchema = createInsertSchema(savingsTable).omit({ id: true, savedAt: true });
export type InsertSaving = z.infer<typeof insertSavingSchema>;
export type Saving = typeof savingsTable.$inferSelect;
