import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
    createPayslip,
    CreatePayslipSchema,
    downloadPayslipPDF,
    getPayslip,
    getPayslips,
    issuePayslip,
} from "../controllers/payslip.controller";

const router = Router();

router.get("/payslips", requireAuth, getPayslips);
router.get("/payslips/:id", requireAuth, getPayslip);
router.post(
    "/payslips",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    validate(CreatePayslipSchema),
    createPayslip,
);
router.post(
    "/payslips/:id/issue",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    issuePayslip,
);
router.get("/payslips/:id/pdf", requireAuth, downloadPayslipPDF);

export default router;