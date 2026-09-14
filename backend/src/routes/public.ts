import { Router } from "express";
import { previewInvite } from "../controllers/members.controller";
import { verifyPayslip } from "../controllers/payslip.controller";

const router = Router();

// Public invite preview (no auth)
router.get("/invites/:token", previewInvite);
// Public payslip verification (no auth)
router.get("/verify/:token", verifyPayslip);

export default router;