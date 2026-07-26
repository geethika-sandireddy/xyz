import { pgTable, serial, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  previousAmount: numeric("previous_amount", { precision: 10, scale: 2 }), // set automatically when amount increases — powers the Price-Hike Detector
  frequency: text("frequency").notNull().default("monthly"), // monthly | annual | weekly | unknown
  category: text("category").notNull().default("other"),    // streaming | fitness | software | food | finance | utility | gaming | education | other
  status: text("status").notNull().default("active"),       // active | flagged | cancelled | reviewing
  flagReason: text("flag_reason"),
  keepCount: integer("keep_count").notNull().default(0), // times user dismissed a flag and kept this active — powers the Regret Score nudge
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
