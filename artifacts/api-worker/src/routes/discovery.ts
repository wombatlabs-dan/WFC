import { Hono } from "hono";
import { createDb } from "@workspace/db";
import { discoveryQueueTable, venuesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListDiscoveryQueryParams,
  ApproveDiscoveryParams,
  RejectDiscoveryParams,
} from "@workspace/api-zod";
import type { Env } from "../index";

const app = new Hono<{ Bindings: Env }>();

app.get("/discovery", async (c) => {
  try {
    const parsed = ListDiscoveryQueryParams.safeParse(c.req.query());
    if (!parsed.success) return c.json({ error: "Invalid query params" }, 400);

    const { status } = parsed.data;
    const db = createDb(c.env.DATABASE_URL);
    let items = await db.select().from(discoveryQueueTable);

    if (status && status !== "all") {
      items = items.filter((i) => i.status === status);
    } else if (!status) {
      items = items.filter((i) => i.status === "pending");
    }

    items.sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime());
    return c.json(items.map(formatDiscovery));
  } catch (err) {
    console.error("Error listing discovery queue", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/discovery/:id/approve", async (c) => {
  try {
    const parsed = ApproveDiscoveryParams.safeParse({ id: c.req.param("id") });
    if (!parsed.success) return c.json({ error: "Invalid ID" }, 400);

    const db = createDb(c.env.DATABASE_URL);
    const [item] = await db
      .select()
      .from(discoveryQueueTable)
      .where(eq(discoveryQueueTable.id, parsed.data.id))
      .limit(1);

    if (!item) return c.json({ error: "Discovery item not found" }, 404);

    const [venue] = await db
      .insert(venuesTable)
      .values({
        name: item.name,
        address: item.address,
        neighborhood: item.neighborhood,
        sourceUrl: item.sourceUrl,
        category: "coffee-only",
        tags: "[]",
        status: "unverified",
        dateAdded: new Date().toISOString().split("T")[0],
        visitCount: 0,
      })
      .returning();

    await db
      .update(discoveryQueueTable)
      .set({ status: "approved" })
      .where(eq(discoveryQueueTable.id, parsed.data.id));

    return c.json({
      id: venue.id,
      name: venue.name,
      neighborhood: venue.neighborhood,
      address: venue.address,
      category: venue.category,
      tags: [],
      workRating: venue.workRating,
      coffeeRating: venue.coffeeRating,
      hours: venue.hours,
      mapsUrl: venue.mapsUrl,
      sourceUrl: venue.sourceUrl,
      status: venue.status,
      dateAdded: venue.dateAdded,
      visitCount: venue.visitCount || 0,
      lastVisited: venue.lastVisited,
      notes: venue.notes,
    });
  } catch (err) {
    console.error("Error approving discovery item", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/discovery/:id/reject", async (c) => {
  try {
    const parsed = RejectDiscoveryParams.safeParse({ id: c.req.param("id") });
    if (!parsed.success) return c.json({ error: "Invalid ID" }, 400);

    const db = createDb(c.env.DATABASE_URL);
    const [updated] = await db
      .update(discoveryQueueTable)
      .set({ status: "rejected" })
      .where(eq(discoveryQueueTable.id, parsed.data.id))
      .returning();

    if (!updated) return c.json({ error: "Discovery item not found" }, 404);
    return c.json(formatDiscovery(updated));
  } catch (err) {
    console.error("Error rejecting discovery item", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

function formatDiscovery(item: typeof discoveryQueueTable.$inferSelect) {
  return {
    id: item.id,
    name: item.name,
    address: item.address,
    neighborhood: item.neighborhood,
    sourceUrl: item.sourceUrl,
    discoveredAt: item.discoveredAt,
    status: item.status,
  };
}

export default app;
