import { Router } from "express";
import { validate } from "../middleware/validate";
import {
    createOrganisation,
    CreateOrganisationSchema,
    getOnboardingStatus,
    selectPlan,
    SelectPlanSchema,
} from "../controllers/onboarding.controller";

const router = Router();

router.get("/onboarding/status", getOnboardingStatus);
router.post(
    "/onboarding/organisation",
    validate(CreateOrganisationSchema),
    createOrganisation,
);
router.post("/onboarding/plan", validate(SelectPlanSchema), selectPlan);

export default router;