import { Router, type IRouter } from "express";
import { eq, and, ne, ilike } from "drizzle-orm";
import { db, sharePlanRequestsTable } from "@workspace/db";
import {
  ListSharePlanRequestsQueryParams,
  CreateSharePlanRequestBody,
  DeleteSharePlanRequestParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(r: typeof sharePlanRequestsTable.$inferSelect) {
  return { ...r, createdAt: r.createdAt.toISOString() };
}

router.get("/share-plans", async (req, res): Promise<void> => {
  const parsed = ListSharePlanRequestsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId, serviceName } = parsed.data;

  // two modes: "show my own requests" (sessionId only) or
  // "show me who else wants to split this service" (serviceName, excluding me)
  let rows;
  if (serviceName) {
    const conditions = [ilike(sharePlanRequestsTable.serviceName, serviceName)];
    if (sessionId) conditions.push(ne(sharePlanRequestsTable.sessionId, sessionId));
    rows = await db.select().from(sharePlanRequestsTable).where(and(...conditions));
  } else if (sessionId) {
    rows = await db.select().from(sharePlanRequestsTable).where(eq(sharePlanRequestsTable.sessionId, sessionId));
  } else {
    res.status(400).json({ error: "sessionId or serviceName required" });
    return;
  }

  res.json(rows.map(serialize));
});

router.post("/share-plans", async (req, res): Promise<void> => {
  const body = CreateSharePlanRequestBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [created] = await db.insert(sharePlanRequestsTable).values(body.data).returning();
  res.status(201).json(serialize(created));
});

router.delete("/share-plans/:id", async (req, res): Promise<void> => {
  const params = DeleteSharePlanRequestParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(sharePlanRequestsTable)
    .where(eq(sharePlanRequestsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "not found" });
    return;
  }

  res.status(204).send();
});

export default router;
