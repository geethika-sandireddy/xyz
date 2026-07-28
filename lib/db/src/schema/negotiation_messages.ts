import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const negotiationMessagesTable = pgTable("negotiation_messages", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull(),
  messageType: text("message_type").notNull(), // cancel | negotiate | downgrade
  message: text("message").notNull(),
  serviceName: text("service_name"), // copy of the subscription name at send time, for stats later
  outcome: text("outcome"), // worked | partial | ignored | declined | null if not reported yet
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNegotiationMessageSchema = createInsertSchema(negotiationMessagesTable).omit({ id: true, createdAt: true });
export type InsertNegotiationMessage = z.infer<typeof insertNegotiationMessageSchema>;
export type NegotiationMessage = typeof negotiationMessagesTable.$inferSelect;
