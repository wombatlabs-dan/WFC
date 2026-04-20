import { Hono } from "hono";
import { createDb } from "@workspace/db";
import { venuesTable, discoveryQueueTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import type { Env } from "../index";

// Free-tier Workers cap each invocation at 50 subrequests.
// Each venue costs 1 Places fetch + 1 DB update = 2 subrequests,
// plus 1 initial SELECT. 20 venues = 41 subrequests, safe headroom.
const VALIDATE_CHUNK_SIZE = 20;

const app = new Hono<{ Bindings: Env }>();

// Middleware: verify x-cron-secret header
function cronAuth(secret: string | undefined, provided: string | undefined): boolean {
  if (!secret) return true; // no secret configured = allow (dev mode)
  return provided === secret;
}

app.post("/cron/discover", async (c) => {
  if (!cronAuth(c.env.CRON_SECRET, c.req.header("x-cron-secret"))) {
    return c.json({ error: "Unauthorized. Set x-cron-secret header." }, 401);
  }

  try {
    const apiKey = c.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) {
      return c.json({
        success: false,
        message: "BRAVE_SEARCH_API_KEY not configured. Add it in Settings.",
        found: 0,
      });
    }

    const db = createDb(c.env.DATABASE_URL);
    const queries = [
      "new specialty coffee shop San Francisco 2025 2026 pour over third wave",
      "new café opening San Francisco laptop friendly 2026",
    ];

    let found = 0;
    for (const query of queries) {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`,
        {
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": apiKey,
          },
        },
      );

      if (!response.ok) {
        console.error("Brave Search API error", response.status);
        continue;
      }

      const data = (await response.json()) as {
        web?: { results?: Array<{ title: string; url: string; description: string }> };
      };

      const existingVenues = await db.select({ name: venuesTable.name }).from(venuesTable);
      const existingDiscovery = await db
        .select({ name: discoveryQueueTable.name })
        .from(discoveryQueueTable);
      const existingNames = new Set([
        ...existingVenues.map((v) => v.name.toLowerCase()),
        ...existingDiscovery.map((d) => d.name.toLowerCase()),
      ]);

      for (const result of data.web?.results ?? []) {
        const cleanName = result.title.split(" - ")[0].split(" | ")[0].trim();
        if (
          cleanName.length < 3 ||
          cleanName.length > 100 ||
          existingNames.has(cleanName.toLowerCase())
        ) continue;

        await db.insert(discoveryQueueTable).values({
          name: cleanName,
          address: null,
          neighborhood: null,
          sourceUrl: result.url,
          discoveredAt: new Date().toISOString(),
          status: "pending",
        });
        existingNames.add(cleanName.toLowerCase());
        found++;
      }
    }

    return c.json({
      success: true,
      message: `Discovery complete. Found ${found} new candidate venues.`,
      found,
    });
  } catch (err) {
    console.error("Error running discovery cron", err);
    return c.json({ success: false, message: "Discovery job failed." }, 500);
  }
});

app.post("/cron/validate", async (c) => {
  if (!cronAuth(c.env.CRON_SECRET, c.req.header("x-cron-secret"))) {
    return c.json({ error: "Unauthorized. Set x-cron-secret header." }, 401);
  }

  try {
    const apiKey = c.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return c.json({
        success: false,
        message: "GOOGLE_PLACES_API_KEY not configured. Add it in Settings.",
        validated: 0,
        updated: 0,
      });
    }

    const db = createDb(c.env.DATABASE_URL);

    // Oldest-checked (including never-checked) venues go first.
    // With the cron running daily, a 66-venue database is fully covered every ~4 days.
    const activeVenues = await db
      .select()
      .from(venuesTable)
      .where(eq(venuesTable.status, "active"))
      .orderBy(sql`${venuesTable.lastValidatedAt} ASC NULLS FIRST`)
      .limit(VALIDATE_CHUNK_SIZE);

    let validated = 0;
    let updated = 0;
    const now = new Date().toISOString();

    for (const venue of activeVenues) {
      if (!venue.address && !venue.name) continue;
      const query = encodeURIComponent(`${venue.name} ${venue.address || ""} San Francisco CA`);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=business_status,opening_hours,name&key=${apiKey}`,
      );

      // Collect any status/hours changes alongside lastValidatedAt so we issue
      // exactly one UPDATE per venue (keeps us under the subrequest budget).
      const patch: Partial<typeof venuesTable.$inferInsert> = { lastValidatedAt: now };
      let statusChanged = false;

      if (!response.ok) {
        console.error("Google Places API error", response.status, "for venue", venue.id);
      } else {
        const data = (await response.json()) as {
          candidates?: Array<{
            business_status?: string;
            opening_hours?: { weekday_text?: string[] };
          }>;
        };
        const candidate = data.candidates?.[0];

        if (!candidate) {
          patch.status = "unverified";
          statusChanged = true;
        } else if (candidate.business_status === "CLOSED_PERMANENTLY") {
          patch.status = "closed";
          statusChanged = true;
        } else if (candidate.opening_hours?.weekday_text?.length) {
          const hours = candidate.opening_hours.weekday_text.join(", ");
          if (hours !== venue.hours) {
            patch.hours = hours;
            statusChanged = true;
          }
        }
      }

      await db.update(venuesTable).set(patch).where(eq(venuesTable.id, venue.id));
      if (statusChanged) updated++;
      validated++;
    }

    return c.json({
      success: true,
      message: `Validation complete. Checked ${validated} venues, updated ${updated}. (chunk size ${VALIDATE_CHUNK_SIZE})`,
      validated,
      updated,
      chunkSize: VALIDATE_CHUNK_SIZE,
    });
  } catch (err) {
    console.error("Error running validation cron", err);
    return c.json({ success: false, message: "Validation job failed." }, 500);
  }
});

export default app;
