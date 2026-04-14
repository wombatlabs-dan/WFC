import { Router } from "express";
import { db } from "@workspace/db";
import { venuesTable, visitsTable } from "@workspace/db";
import { eq, sql, countDistinct } from "drizzle-orm";
import {
  CreateVisitBody,
  ListVisitsQueryParams,
  GetVisitParams,
  UpdateVisitParams,
  UpdateVisitBody,
} from "@workspace/api-zod";
import { formatVenue } from "./venues";

const router = Router();

router.get("/visits/stats", async (req, res) => {
  try {
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(visitsTable);
    const [uniqueResult] = await db
      .select({ count: countDistinct(visitsTable.venueId) })
      .from(visitsTable);

    res.json({
      totalVisits: Number(totalResult?.count ?? 0),
      uniqueVenues: Number(uniqueResult?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting visit stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/visits", async (req, res) => {
  try {
    const parsed = ListVisitsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query params" });
    }
    const { venueId, limit } = parsed.data;

    let visits = await db
      .select({
        visit: visitsTable,
        venue: venuesTable,
      })
      .from(visitsTable)
      .leftJoin(venuesTable, eq(visitsTable.venueId, venuesTable.id))
      .orderBy(sql`${visitsTable.visitedAt} DESC`);

    if (venueId) {
      visits = visits.filter((v) => v.visit.venueId === venueId);
    }

    if (limit) {
      visits = visits.slice(0, limit);
    }

    res.json(
      visits.map(({ visit, venue }) => ({
        id: visit.id,
        venueId: visit.venueId,
        visitedAt: visit.visitedAt,
        workedOn: visit.workedOn,
        accomplished: visit.accomplished,
        whoSaw: visit.whoSaw,
        coffeeNotes: visit.coffeeNotes,
        venue: venue ? formatVenue(venue) : null,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Error listing visits");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/visits", async (req, res) => {
  try {
    const parsed = CreateVisitBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid body" });
    }

    const { venueId, workedOn, accomplished, whoSaw, coffeeNotes } = parsed.data;

    const [venue] = await db
      .select()
      .from(venuesTable)
      .where(eq(venuesTable.id, venueId))
      .limit(1);

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const now = new Date().toISOString();

    const [visit] = await db
      .insert(visitsTable)
      .values({
        venueId,
        visitedAt: now,
        workedOn: workedOn ?? null,
        accomplished: accomplished ?? null,
        whoSaw: whoSaw ?? null,
        coffeeNotes: coffeeNotes ?? null,
      })
      .returning();

    await db
      .update(venuesTable)
      .set({
        visitCount: (venue.visitCount || 0) + 1,
        lastVisited: now.split("T")[0],
      })
      .where(eq(venuesTable.id, venueId));

    res.status(201).json({
      id: visit.id,
      venueId: visit.venueId,
      visitedAt: visit.visitedAt,
      workedOn: visit.workedOn,
      accomplished: visit.accomplished,
      whoSaw: visit.whoSaw,
      coffeeNotes: visit.coffeeNotes,
    });
  } catch (err) {
    req.log.error({ err }, "Error creating visit");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/visits/:id", async (req, res) => {
  try {
    const parsed = GetVisitParams.safeParse({ id: req.params.id });
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const [row] = await db
      .select({
        visit: visitsTable,
        venue: venuesTable,
      })
      .from(visitsTable)
      .leftJoin(venuesTable, eq(visitsTable.venueId, venuesTable.id))
      .where(eq(visitsTable.id, parsed.data.id))
      .limit(1);

    if (!row) {
      return res.status(404).json({ error: "Visit not found" });
    }

    res.json({
      id: row.visit.id,
      venueId: row.visit.venueId,
      visitedAt: row.visit.visitedAt,
      workedOn: row.visit.workedOn,
      accomplished: row.visit.accomplished,
      whoSaw: row.visit.whoSaw,
      coffeeNotes: row.visit.coffeeNotes,
      venue: row.venue ? formatVenue(row.venue) : null,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting visit");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/visits/:id", async (req, res) => {
  try {
    const parsedParams = UpdateVisitParams.safeParse({ id: req.params.id });
    if (!parsedParams.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const parsedBody = UpdateVisitBody.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: "Invalid body" });
    }

    const updates: Partial<typeof visitsTable.$inferInsert> = {};
    const body = parsedBody.data;

    if (body.workedOn !== undefined) updates.workedOn = body.workedOn;
    if (body.accomplished !== undefined) updates.accomplished = body.accomplished;
    if (body.whoSaw !== undefined) updates.whoSaw = body.whoSaw;
    if (body.coffeeNotes !== undefined) updates.coffeeNotes = body.coffeeNotes;

    const [updated] = await db
      .update(visitsTable)
      .set(updates)
      .where(eq(visitsTable.id, parsedParams.data.id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Visit not found" });
    }

    res.json({
      id: updated.id,
      venueId: updated.venueId,
      visitedAt: updated.visitedAt,
      workedOn: updated.workedOn,
      accomplished: updated.accomplished,
      whoSaw: updated.whoSaw,
      coffeeNotes: updated.coffeeNotes,
    });
  } catch (err) {
    req.log.error({ err }, "Error updating visit");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
