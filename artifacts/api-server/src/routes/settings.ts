import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/settings/status", (_req, res) => {
  res.json({
    googlePlacesApiKey: !!process.env.GOOGLE_PLACES_API_KEY,
    braveSearchApiKey: !!process.env.BRAVE_SEARCH_API_KEY,
  });
});

export default router;
