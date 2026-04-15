import { Hono } from "hono";
import type { Env } from "../index";

const app = new Hono<{ Bindings: Env }>();

function maskKey(value: string | undefined): { set: boolean; masked: string | null } {
  if (!value) return { set: false, masked: null };
  const last4 = value.slice(-4);
  return { set: true, masked: `••••••••••••••••••••••••${last4}` };
}

app.get("/settings/status", (c) => {
  return c.json({
    googlePlacesApiKey: maskKey(c.env.GOOGLE_PLACES_API_KEY),
    braveSearchApiKey: maskKey(c.env.BRAVE_SEARCH_API_KEY),
  });
});

export default app;
