import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
    me,
    updateProfile,
    UpdateProfileSchema,
    changePlan,
    ChangePlanSchema,
} from "../controllers/auth.controller";

const router = Router();

router.get("/employer/me", requireAuth, me);
router.patch(
    "/employer/profile",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    validate(UpdateProfileSchema),
    updateProfile,
);
router.patch(
    "/employer/plan",
    requireAuth,
    requireRole("OWNER"),
    validate(ChangePlanSchema),
    changePlan,
);

export default router;