import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
    createPayPeriod,
    CreatePayPeriodSchema,
    deletePayPeriod,
    getPayPeriods,
} from "../controllers/payPeriod.controller";

const router = Router();

router.get("/pay-periods", requireAuth, getPayPeriods);
router.post(
    "/pay-periods",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    validate(CreatePayPeriodSchema),
    createPayPeriod,
);
router.delete(
    "/pay-periods/:id",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    deletePayPeriod,
);

export default router;