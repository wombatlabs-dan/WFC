import { Hono } from "hono";
import { createDb } from "@workspace/db";
import { venuesTable, visitsTable } from "@workspace/db";
import { eq, sql, and, like, or } from "drizzle-orm";
import {
  ListVenuesQueryParams,
  GetVenueParams,
  UpdateVenueParams,
  UpdateVenueBody,
  GetRandomVenueQueryParams,
  GetVenueVisitsParams,
} from "@workspace/api-zod";
import type { Env } from "../index";

const app = new Hono<{ Bindings: Env }>();

app.get("/venues", async (c) => {
  try {
    const parsed = ListVenuesQueryParams.safeParse(c.req.query());
    if (!parsed.success) return c.json({ error: "Invalid query params" }, 400);

    const { status, category, neighborhood, search } = parsed.data;
    const db = createDb(c.env.DATABASE_URL);

    let query = db.select().from(venuesTable).$dynamic();
    const conditions = [];

    if (status && status !== "all") {
      conditions.push(eq(venuesTable.status, status));
    } else if (!status) {
      conditions.push(
        or(
          eq(venuesTable.status, "active"),
          eq(venuesTable.status, "temporarily-closed"),
          eq(venuesTable.status, "unverified"),
        )!,
      );
    }

    if (category) conditions.push(eq(venuesTable.category, category));
    if (neighborhood) conditions.push(eq(venuesTable.neighborhood, neighborhood));
    if (search) {
      conditions.push(
        or(
          like(venuesTable.name, `%${search}%`),
          like(venuesTable.neighborhood, `%${search}%`),
        )!,
      );
    }

    if (conditions.length > 0) query = query.where(and(...conditions));

    const venues = await query;
    return c.json(venues.map(formatVenue));
  } catch (err) {
    console.error("Error listing venues", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/venues/stats", async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);
    const allVenues = await db.select().from(venuesTable);
    const active = allVenues.filter((v) => v.status === "active").length;
    const closed = allVenues.filter((v) => v.status === "closed").length;
    const unverified = allVenues.filter(
      (v) => v.status === "unverified" || v.status === "temporarily-closed",
    ).length;

    const byCategory: Record<string, number> = {};
    for (const v of allVenues) {
      byCategory[v.category] = (byCategory[v.category] || 0) + 1;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyAdded = allVenues
      .filter((v) => v.dateAdded && new Date(v.dateAdded) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.dateAdded!).getTime() - new Date(a.dateAdded!).getTime())
      .slice(0, 10)
      .map(formatVenue);

    return c.json({ total: allVenues.length, active, closed, unverified, byCategory, recentlyAdded });
  } catch (err) {
    console.error("Error getting venue stats", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/venues/random", async (c) => {
  try {
    const parsed = GetRandomVenueQueryParams.safeParse(c.req.query());
    if (!parsed.success) return c.json({ error: "Invalid query params" }, 400);

    const { mode, neighborhood, excludeId } = parsed.data;
    const db = createDb(c.env.DATABASE_URL);
    const conditions = [eq(venuesTable.status, "active")];

    if (mode === "coffee-only") {
      conditions.push(
        or(eq(venuesTable.category, "coffee-only"), eq(venuesTable.category, "coworking"))!,
      );
    } else if (mode === "coffee-food") {
      conditions.push(eq(venuesTable.category, "coffee-food"));
    } else if (mode === "lunch-spot") {
      conditions.push(eq(venuesTable.category, "sandwich-lunch"));
    }

    if (neighborhood && neighborhood !== "Anywhere in SF") {
      conditions.push(eq(venuesTable.neighborhood, neighborhood));
    }

    let venues = await db.select().from(venuesTable).where(and(...conditions));
    if (excludeId) venues = venues.filter((v) => v.id !== excludeId);

    if (venues.length === 0) return c.json({ error: "No venues match these filters" }, 404);

    const venue = venues[Math.floor(Math.random() * venues.length)];
    return c.json(formatVenue(venue));
  } catch (err) {
    console.error("Error getting random venue", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/venues/:id", async (c) => {
  try {
    const parsed = GetVenueParams.safeParse({ id: c.req.param("id") });
    if (!parsed.success) return c.json({ error: "Invalid ID" }, 400);

    const db = createDb(c.env.DATABASE_URL);
    const [venue] = await db
      .select()
      .from(venuesTable)
      .where(eq(venuesTable.id, parsed.data.id))
      .limit(1);

    if (!venue) return c.json({ error: "Venue not found" }, 404);

    const visits = await db
      .select()
      .from(visitsTable)
      .where(eq(visitsTable.venueId, venue.id))
      .orderBy(sql`${visitsTable.visitedAt} DESC`);

    return c.json({ ...formatVenue(venue), visits: visits.map(formatVisit) });
  } catch (err) {
    console.error("Error getting venue", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.patch("/venues/:id", async (c) => {
  try {
    const parsedParams = UpdateVenueParams.safeParse({ id: c.req.param("id") });
    if (!parsedParams.success) return c.json({ error: "Invalid ID" }, 400);

    const parsedBody = UpdateVenueBody.safeParse(await c.req.json());
    if (!parsedBody.success) return c.json({ error: "Invalid body" }, 400);

    const db = createDb(c.env.DATABASE_URL);
    const updates: Partial<typeof venuesTable.$inferInsert> = {};
    const body = parsedBody.data;

    if (body.name !== undefined) updates.name = body.name;
    if (body.neighborhood !== undefined) updates.neighborhood = body.neighborhood;
    if (body.address !== undefined) updates.address = body.address;
    if (body.hours !== undefined) updates.hours = body.hours;
    if (body.mapsUrl !== undefined) updates.mapsUrl = body.mapsUrl;
    if (body.sourceUrl !== undefined) updates.sourceUrl = body.sourceUrl;
    if (body.workRating !== undefined) updates.workRating = body.workRating;
    if (body.coffeeRating !== undefined) updates.coffeeRating = body.coffeeRating;
    if (body.status !== undefined) updates.status = body.status;
    if (body.tags !== undefined) updates.tags = JSON.stringify(body.tags);
    if (body.notes !== undefined) updates.notes = body.notes;

    const [updated] = await db
      .update(venuesTable)
      .set(updates)
      .where(eq(venuesTable.id, parsedParams.data.id))
      .returning();

    if (!updated) return c.json({ error: "Venue not found" }, 404);
    return c.json(formatVenue(updated));
  } catch (err) {
    console.error("Error updating venue", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/venues/:id/visits", async (c) => {
  try {
    const parsed = GetVenueVisitsParams.safeParse({ id: c.req.param("id") });
    if (!parsed.success) return c.json({ error: "Invalid ID" }, 400);

    const db = createDb(c.env.DATABASE_URL);
    const visits = await db
      .select()
      .from(visitsTable)
      .where(eq(visitsTable.venueId, parsed.data.id))
      .orderBy(sql`${visitsTable.visitedAt} DESC`);

    return c.json(visits.map(formatVisit));
  } catch (err) {
    console.error("Error getting venue visits", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export function formatVenue(venue: typeof venuesTable.$inferSelect) {
  let tags: string[] = [];
  try { tags = JSON.parse(venue.tags || "[]"); } catch { tags = []; }
  return {
    id: venue.id,
    name: venue.name,
    neighborhood: venue.neighborhood,
    address: venue.address,
    category: venue.category,
    tags,
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
  };
}

export function formatVisit(visit: typeof visitsTable.$inferSelect) {
  return {
    id: visit.id,
    venueId: visit.venueId,
    visitedAt: visit.visitedAt,
    workedOn: visit.workedOn,
    accomplished: visit.accomplished,
    whoSaw: visit.whoSaw,
    coffeeNotes: visit.coffeeNotes,
  };
}

export default app;
