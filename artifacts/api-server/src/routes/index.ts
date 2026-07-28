import { Router, type IRouter } from "express";
import healthRouter from "./health";
import billsRouter from "./bills/index.js";
import subscriptionsRouter from "./subscriptions/index.js";
import savingsRouter from "./savings/index.js";
import renewalsRouter from "./renewals/index.js";
import budgetRouter from "./budget/index.js";
import loansRouter from "./loans/index.js";
import taxRouter from "./tax/index.js";
import sharePlansRouter from "./share-plans/index.js";
import messagesRouter from "./messages/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(billsRouter);
router.use(subscriptionsRouter);
router.use(savingsRouter);
router.use(renewalsRouter);
router.use(budgetRouter);
router.use(loansRouter);
router.use(taxRouter);
router.use(sharePlansRouter);
router.use(messagesRouter);

export default router;
