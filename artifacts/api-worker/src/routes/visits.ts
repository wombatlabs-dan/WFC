import { Hono } from "hono";
import { createDb } from "@workspace/db";
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
import type { Env } from "../index";

const app = new Hono<{ Bindings: Env }>();

app.get("/visits/stats", async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);
    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(visitsTable);
    const [uniqueResult] = await db
      .select({ count: countDistinct(visitsTable.venueId) })
      .from(visitsTable);

    return c.json({
      totalVisits: Number(totalResult?.count ?? 0),
      uniqueVenues: Number(uniqueResult?.count ?? 0),
    });
  } catch (err) {
    console.error("Error getting visit stats", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/visits", async (c) => {
  try {
    const parsed = ListVisitsQueryParams.safeParse(c.req.query());
    if (!parsed.success) return c.json({ error: "Invalid query params" }, 400);

    const { venueId, limit } = parsed.data;
    const db = createDb(c.env.DATABASE_URL);

    let visits = await db
      .select({ visit: visitsTable, venue: venuesTable })
      .from(visitsTable)
      .leftJoin(venuesTable, eq(visitsTable.venueId, venuesTable.id))
      .orderBy(sql`${visitsTable.visitedAt} DESC`);

    if (venueId) visits = visits.filter((v) => v.visit.venueId === venueId);
    if (limit) visits = visits.slice(0, limit);

    return c.json(
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
    console.error("Error listing visits", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/visits", async (c) => {
  try {
    const parsed = CreateVisitBody.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: "Invalid body" }, 400);

    const { venueId, workedOn, accomplished, whoSaw, coffeeNotes } = parsed.data;
    const db = createDb(c.env.DATABASE_URL);

    const [venue] = await db
      .select()
      .from(venuesTable)
      .where(eq(venuesTable.id, venueId))
      .limit(1);

    if (!venue) return c.json({ error: "Venue not found" }, 404);

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
      .set({ visitCount: (venue.visitCount || 0) + 1, lastVisited: now.split("T")[0] })
      .where(eq(venuesTable.id, venueId));

    return c.json(
      {
        id: visit.id,
        venueId: visit.venueId,
        visitedAt: visit.visitedAt,
        workedOn: visit.workedOn,
        accomplished: visit.accomplished,
        whoSaw: visit.whoSaw,
        coffeeNotes: visit.coffeeNotes,
      },
      201,
    );
  } catch (err) {
    console.error("Error creating visit", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/visits/:id", async (c) => {
  try {
    const parsed = GetVisitParams.safeParse({ id: c.req.param("id") });
    if (!parsed.success) return c.json({ error: "Invalid ID" }, 400);

    const db = createDb(c.env.DATABASE_URL);
    const [row] = await db
      .select({ visit: visitsTable, venue: venuesTable })
      .from(visitsTable)
      .leftJoin(venuesTable, eq(visitsTable.venueId, venuesTable.id))
      .where(eq(visitsTable.id, parsed.data.id))
      .limit(1);

    if (!row) return c.json({ error: "Visit not found" }, 404);

    return c.json({
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
    console.error("Error getting visit", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.patch("/visits/:id", async (c) => {
  try {
    const parsedParams = UpdateVisitParams.safeParse({ id: c.req.param("id") });
    if (!parsedParams.success) return c.json({ error: "Invalid ID" }, 400);

    const parsedBody = UpdateVisitBody.safeParse(await c.req.json());
    if (!parsedBody.success) return c.json({ error: "Invalid body" }, 400);

    const db = createDb(c.env.DATABASE_URL);
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

    if (!updated) return c.json({ error: "Visit not found" }, 404);

    return c.json({
      id: updated.id,
      venueId: updated.venueId,
      visitedAt: updated.visitedAt,
      workedOn: updated.workedOn,
      accomplished: updated.accomplished,
      whoSaw: updated.whoSaw,
      coffeeNotes: updated.coffeeNotes,
    });
  } catch (err) {
    console.error("Error updating visit", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
