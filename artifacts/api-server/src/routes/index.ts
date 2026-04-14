import { Router, type IRouter } from "express";
import healthRouter from "./health";
import venuesRouter from "./venues";
import visitsRouter from "./visits";
import discoveryRouter from "./discovery";
import cronRouter from "./cron";

const router: IRouter = Router();

router.use(healthRouter);
router.use(venuesRouter);
router.use(visitsRouter);
router.use(discoveryRouter);
router.use(cronRouter);

export default router;
