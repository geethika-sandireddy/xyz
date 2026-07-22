import { Router, type IRouter } from "express";
import healthRouter from "./health";
import billsRouter from "./bills/index.js";
import subscriptionsRouter from "./subscriptions/index.js";
import savingsRouter from "./savings/index.js";
import renewalsRouter from "./renewals/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(billsRouter);
router.use(subscriptionsRouter);
router.use(savingsRouter);
router.use(renewalsRouter);

export default router;
