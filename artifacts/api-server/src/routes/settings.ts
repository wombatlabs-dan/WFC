import { Router, type IRouter } from "express";

const router: IRouter = Router();

function maskKey(value: string | undefined): { set: boolean; masked: string | null } {
  if (!value) return { set: false, masked: null };
  const last4 = value.slice(-4);
  return { set: true, masked: `••••••••••••••••••••••••${last4}` };
}

router.get("/settings/status", (_req, res) => {
  res.json({
    googlePlacesApiKey: maskKey(process.env.GOOGLE_PLACES_API_KEY),
    braveSearchApiKey: maskKey(process.env.BRAVE_SEARCH_API_KEY),
  });
});

export default router;
