import { Router } from "express";
import onboarding from "./onboarding";
import employer from "./employer";
import employees from "./employees";
import payPeriods from "./payPeriods";
import payslips from "./payslips";
import members from "./members";
import publicRoutes from "./public";

const router = Router();

router.use(onboarding);
router.use(employer);
router.use(employees);
router.use(payPeriods);
router.use(payslips);
router.use(members);
router.use(publicRoutes);

export default router;