import { Router } from "express";
import { db } from "@workspace/db";
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

const router = Router();

router.get("/venues", async (req, res) => {
  try {
    const parsed = ListVenuesQueryParams.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query params" });
    }
    const { status, category, neighborhood, search } = parsed.data;

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

    if (category) {
      conditions.push(eq(venuesTable.category, category));
    }

    if (neighborhood) {
      conditions.push(eq(venuesTable.neighborhood, neighborhood));
    }

    if (search) {
      conditions.push(
        or(
          like(venuesTable.name, `%${search}%`),
          like(venuesTable.neighborhood, `%${search}%`),
        )!,
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const venues = await query;
    const result = venues.map(formatVenue);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error listing venues");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/stats", async (req, res) => {
  try {
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
      .sort(
        (a, b) =>
          new Date(b.dateAdded!).getTime() - new Date(a.dateAdded!).getTime(),
      )
      .slice(0, 10)
      .map(formatVenue);

    res.json({
      total: allVenues.length,
      active,
      closed,
      unverified,
      byCategory,
      recentlyAdded,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting venue stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/random", async (req, res) => {
  try {
    const parsed = GetRandomVenueQueryParams.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query params" });
    }
    const { mode, neighborhood, excludeId } = parsed.data;

    const conditions = [eq(venuesTable.status, "active")];

    if (mode === "coffee-only") {
      conditions.push(
        or(
          eq(venuesTable.category, "coffee-only"),
          eq(venuesTable.category, "coworking"),
        )!,
      );
    } else if (mode === "coffee-food") {
      conditions.push(eq(venuesTable.category, "coffee-food"));
    } else if (mode === "lunch-spot") {
      conditions.push(eq(venuesTable.category, "sandwich-lunch"));
    }

    if (neighborhood && neighborhood !== "Anywhere in SF") {
      conditions.push(eq(venuesTable.neighborhood, neighborhood));
    }

    let venues = await db
      .select()
      .from(venuesTable)
      .where(and(...conditions));

    if (excludeId) {
      venues = venues.filter((v) => v.id !== excludeId);
    }

    if (venues.length === 0) {
      return res.status(404).json({ error: "No venues match these filters" });
    }

    const venue = venues[Math.floor(Math.random() * venues.length)];
    res.json(formatVenue(venue));
  } catch (err) {
    req.log.error({ err }, "Error getting random venue");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:id", async (req, res) => {
  try {
    const parsed = GetVenueParams.safeParse({ id: req.params.id });
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const [venue] = await db
      .select()
      .from(venuesTable)
      .where(eq(venuesTable.id, parsed.data.id))
      .limit(1);

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const visits = await db
      .select()
      .from(visitsTable)
      .where(eq(visitsTable.venueId, venue.id))
      .orderBy(sql`${visitsTable.visitedAt} DESC`);

    res.json({
      ...formatVenue(venue),
      visits: visits.map(formatVisit),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting venue");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/venues/:id", async (req, res) => {
  try {
    const parsedParams = UpdateVenueParams.safeParse({ id: req.params.id });
    if (!parsedParams.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const parsedBody = UpdateVenueBody.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: "Invalid body" });
    }

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

    if (!updated) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.json(formatVenue(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating venue");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:id/visits", async (req, res) => {
  try {
    const parsed = GetVenueVisitsParams.safeParse({ id: req.params.id });
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const visits = await db
      .select()
      .from(visitsTable)
      .where(eq(visitsTable.venueId, parsed.data.id))
      .orderBy(sql`${visitsTable.visitedAt} DESC`);

    res.json(visits.map(formatVisit));
  } catch (err) {
    req.log.error({ err }, "Error getting venue visits");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatVenue(venue: typeof venuesTable.$inferSelect) {
  let tags: string[] = [];
  try {
    tags = JSON.parse(venue.tags || "[]");
  } catch {
    tags = [];
  }
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

function formatVisit(visit: typeof visitsTable.$inferSelect) {
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

export default router;
export { formatVenue };
