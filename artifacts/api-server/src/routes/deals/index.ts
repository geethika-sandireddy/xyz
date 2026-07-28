import { Router, type IRouter } from "express";
import { eq, ilike, desc } from "drizzle-orm";
import { db, communityDealsTable } from "@workspace/db";
import { ListDealsQueryParams, PostDealBody, UpvoteDealParams } from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(d: typeof communityDealsTable.$inferSelect) {
  return { ...d, createdAt: d.createdAt.toISOString() };
}

router.get("/deals", async (req, res): Promise<void> => {
  const parsed = ListDealsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rows = parsed.data.serviceName
    ? await db.select().from(communityDealsTable).where(ilike(communityDealsTable.serviceName, parsed.data.serviceName)).orderBy(desc(communityDealsTable.upvotes))
    : await db.select().from(communityDealsTable).orderBy(desc(communityDealsTable.upvotes));

  res.json(rows.map(serialize));
});

router.post("/deals", async (req, res): Promise<void> => {
  const body = PostDealBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const created = await db.insert(communityDealsTable).values(body.data).returning();
  res.status(201).json(serialize(created[0]));
});

router.post("/deals/:id/upvote", async (req, res): Promise<void> => {
  const params = UpvoteDealParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "bad id" });
    return;
  }

  const existing = await db.select().from(communityDealsTable).where(eq(communityDealsTable.id, params.data.id));
  const deal = existing[0];
  if (!deal) {
    res.status(404).json({ error: "not found" });
    return;
  }

  const updated = await db
    .update(communityDealsTable)
    .set({ upvotes: deal.upvotes + 1 })
    .where(eq(communityDealsTable.id, params.data.id))
    .returning();

  res.json(serialize(updated[0]));
});

export default router;
