import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import visitsRouter from "./visits";
import prescriptionsRouter from "./prescriptions";
import invoicesRouter from "./invoices";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(patientsRouter);
router.use(appointmentsRouter);
router.use(visitsRouter);
router.use(prescriptionsRouter);
router.use(invoicesRouter);
router.use(dashboardRouter);
router.use(notificationsRouter);

export default router;
