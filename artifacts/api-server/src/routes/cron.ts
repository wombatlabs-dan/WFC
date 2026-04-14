import { Router } from "express";
import { db } from "@workspace/db";
import { venuesTable, discoveryQueueTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/cron/discover", async (req, res) => {
  try {
    const apiKey = process.env.BRAVE_SEARCH_API_KEY;

    if (!apiKey) {
      return res.json({
        success: false,
        message: "BRAVE_SEARCH_API_KEY not configured. Add it in Settings.",
        found: 0,
      });
    }

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
        req.log.error(
          { status: response.status },
          "Brave Search API error",
        );
        continue;
      }

      const data = (await response.json()) as {
        web?: { results?: Array<{ title: string; url: string; description: string }> };
      };
      const results = data.web?.results ?? [];

      const existingVenues = await db.select({ name: venuesTable.name }).from(venuesTable);
      const existingDiscovery = await db
        .select({ name: discoveryQueueTable.name })
        .from(discoveryQueueTable);
      const existingNames = new Set([
        ...existingVenues.map((v) => v.name.toLowerCase()),
        ...existingDiscovery.map((d) => d.name.toLowerCase()),
      ]);

      for (const result of results) {
        const title = result.title;
        if (!title || title.length < 3) continue;

        const cleanName = title.split(" - ")[0].split(" | ")[0].trim();
        if (
          cleanName.length < 3 ||
          cleanName.length > 100 ||
          existingNames.has(cleanName.toLowerCase())
        ) {
          continue;
        }

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

    res.json({
      success: true,
      message: `Discovery complete. Found ${found} new candidate venues.`,
      found,
    });
  } catch (err) {
    req.log.error({ err }, "Error running discovery cron");
    res.status(500).json({
      success: false,
      message: "Discovery job failed. Check server logs.",
    });
  }
});

router.post("/cron/validate", async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return res.json({
        success: false,
        message: "GOOGLE_PLACES_API_KEY not configured. Add it in Settings.",
        validated: 0,
        updated: 0,
      });
    }

    const activeVenues = await db
      .select()
      .from(venuesTable)
      .where(eq(venuesTable.status, "active"));

    let validated = 0;
    let updated = 0;

    for (const venue of activeVenues) {
      if (!venue.address && !venue.name) continue;

      const query = encodeURIComponent(
        `${venue.name} ${venue.address || ""} San Francisco CA`,
      );

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=business_status,opening_hours,name&key=${apiKey}`,
      );

      if (!response.ok) {
        req.log.error(
          { venueId: venue.id, status: response.status },
          "Google Places API error",
        );
        continue;
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          business_status?: string;
          opening_hours?: { weekday_text?: string[] };
        }>;
      };
      const candidate = data.candidates?.[0];

      if (!candidate) {
        await db
          .update(venuesTable)
          .set({ status: "unverified" })
          .where(eq(venuesTable.id, venue.id));
        updated++;
      } else if (candidate.business_status === "CLOSED_PERMANENTLY") {
        await db
          .update(venuesTable)
          .set({ status: "closed" })
          .where(eq(venuesTable.id, venue.id));
        updated++;
      } else if (
        candidate.opening_hours?.weekday_text &&
        candidate.opening_hours.weekday_text.length > 0
      ) {
        const hours = candidate.opening_hours.weekday_text.join(", ");
        if (hours !== venue.hours) {
          await db
            .update(venuesTable)
            .set({ hours })
            .where(eq(venuesTable.id, venue.id));
          updated++;
        }
      }

      validated++;
    }

    res.json({
      success: true,
      message: `Validation complete. Checked ${validated} venues, updated ${updated}.`,
      validated,
      updated,
    });
  } catch (err) {
    req.log.error({ err }, "Error running validation cron");
    res.status(500).json({
      success: false,
      message: "Validation job failed. Check server logs.",
    });
  }
});

export default router;
