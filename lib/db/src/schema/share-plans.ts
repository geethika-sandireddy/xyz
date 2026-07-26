import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// lets people flag a subscription as "willing to split" so we can match
// them with someone else on the same service. no real user matching yet
// (would need auth/accounts), just tracks intent for now.
export const sharePlanRequestsTable = pgTable("share_plan_requests", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  serviceName: text("service_name").notNull(),
  maxMembers: text("max_members"), // free text, e.g. "6" for family plans - not every plan is numeric
  contactNote: text("contact_note"), // how to reach them - phone/email/whatever they want to share
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSharePlanRequestSchema = createInsertSchema(sharePlanRequestsTable).omit({ id: true, createdAt: true });
export type InsertSharePlanRequest = z.infer<typeof insertSharePlanRequestSchema>;
export type SharePlanRequest = typeof sharePlanRequestsTable.$inferSelect;
