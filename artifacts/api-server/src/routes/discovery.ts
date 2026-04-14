import { Router } from "express";
import { db } from "@workspace/db";
import { discoveryQueueTable, venuesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListDiscoveryQueryParams,
  ApproveDiscoveryParams,
  RejectDiscoveryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/discovery", async (req, res) => {
  try {
    const parsed = ListDiscoveryQueryParams.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query params" });
    }
    const { status } = parsed.data;

    let items = await db.select().from(discoveryQueueTable);

    if (status && status !== "all") {
      items = items.filter((i) => i.status === status);
    } else if (!status) {
      items = items.filter((i) => i.status === "pending");
    }

    items.sort(
      (a, b) =>
        new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime(),
    );

    res.json(items.map(formatDiscovery));
  } catch (err) {
    req.log.error({ err }, "Error listing discovery queue");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/discovery/:id/approve", async (req, res) => {
  try {
    const parsed = ApproveDiscoveryParams.safeParse({ id: req.params.id });
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const [item] = await db
      .select()
      .from(discoveryQueueTable)
      .where(eq(discoveryQueueTable.id, parsed.data.id))
      .limit(1);

    if (!item) {
      return res.status(404).json({ error: "Discovery item not found" });
    }

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

    res.json({
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
    req.log.error({ err }, "Error approving discovery item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/discovery/:id/reject", async (req, res) => {
  try {
    const parsed = RejectDiscoveryParams.safeParse({ id: req.params.id });
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const [updated] = await db
      .update(discoveryQueueTable)
      .set({ status: "rejected" })
      .where(eq(discoveryQueueTable.id, parsed.data.id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Discovery item not found" });
    }

    res.json(formatDiscovery(updated));
  } catch (err) {
    req.log.error({ err }, "Error rejecting discovery item");
    res.status(500).json({ error: "Internal server error" });
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

export default router;
