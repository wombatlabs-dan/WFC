import { Hono } from "hono";
import { cors } from "hono/cors";
import { createDb } from "@workspace/db";
import venuesRouter from "./routes/venues";
import visitsRouter from "./routes/visits";
import discoveryRouter from "./routes/discovery";
import cronRouter from "./routes/cron";
import settingsRouter from "./routes/settings";

export interface Env {
  DATABASE_URL: string;
  CRON_SECRET?: string;
  GOOGLE_PLACES_API_KEY?: string;
  BRAVE_SEARCH_API_KEY?: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// Health check
app.get("/api/healthz", (c) => c.json({ status: "ok" }));

// Mount routers (each sub-router receives db via middleware)
app.route("/api", venuesRouter);
app.route("/api", visitsRouter);
app.route("/api", discoveryRouter);
app.route("/api", cronRouter);
app.route("/api", settingsRouter);

// Scheduled cron handler — runs weekly discovery + validation
export default {
  fetch: app.fetch,

  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const db = createDb(env.DATABASE_URL);
    console.log("Scheduled cron fired:", event.cron);

    if (event.cron === "0 9 * * 1") {
      // Weekly Monday 9am UTC — discovery
      ctx.waitUntil(runDiscovery(db, env));
    } else if (event.cron === "0 10 * * 1") {
      // Weekly Monday 10am UTC — validation
      ctx.waitUntil(runValidation(db, env));
    }
  },
};

async function runDiscovery(db: ReturnType<typeof createDb>, env: Env) {
  const { discoveryQueueTable, venuesTable } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");

  const apiKey = env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    console.log("BRAVE_SEARCH_API_KEY not configured, skipping discovery");
    return;
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

    if (!response.ok) continue;

    const data = (await response.json()) as {
      web?: { results?: Array<{ title: string; url: string }> };
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
      if (cleanName.length < 3 || cleanName.length > 100 || existingNames.has(cleanName.toLowerCase())) continue;

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

  console.log(`Discovery complete. Found ${found} new candidates.`);
}

async function runValidation(db: ReturnType<typeof createDb>, env: Env) {
  const { venuesTable } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");

  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.log("GOOGLE_PLACES_API_KEY not configured, skipping validation");
    return;
  }

  const activeVenues = await db.select().from(venuesTable).where(eq(venuesTable.status, "active"));
  let validated = 0;
  let updated = 0;

  for (const venue of activeVenues) {
    if (!venue.address && !venue.name) continue;
    const query = encodeURIComponent(`${venue.name} ${venue.address || ""} San Francisco CA`);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=business_status,opening_hours,name&key=${apiKey}`,
    );
    if (!response.ok) continue;

    const data = (await response.json()) as {
      candidates?: Array<{ business_status?: string; opening_hours?: { weekday_text?: string[] } }>;
    };
    const candidate = data.candidates?.[0];

    if (!candidate) {
      await db.update(venuesTable).set({ status: "unverified" }).where(eq(venuesTable.id, venue.id));
      updated++;
    } else if (candidate.business_status === "CLOSED_PERMANENTLY") {
      await db.update(venuesTable).set({ status: "closed" }).where(eq(venuesTable.id, venue.id));
      updated++;
    } else if (candidate.opening_hours?.weekday_text?.length) {
      const hours = candidate.opening_hours.weekday_text.join(", ");
      if (hours !== venue.hours) {
        await db.update(venuesTable).set({ hours }).where(eq(venuesTable.id, venue.id));
        updated++;
      }
    }
    validated++;
  }

  console.log(`Validation complete. Checked ${validated} venues, updated ${updated}.`);
}
