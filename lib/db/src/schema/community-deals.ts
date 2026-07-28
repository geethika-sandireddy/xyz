import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// deals people post themselves, like "student plan available" or "call and ask for loyalty discount"
// shown next to the built-in curated ones on the deal watch page
export const communityDealsTable = pgTable("community_deals", {
  id: serial("id").primaryKey(),
  serviceName: text("service_name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommunityDealSchema = createInsertSchema(communityDealsTable).omit({ id: true, upvotes: true, createdAt: true });
export type InsertCommunityDeal = z.infer<typeof insertCommunityDealSchema>;
export type CommunityDeal = typeof communityDealsTable.$inferSelect;
