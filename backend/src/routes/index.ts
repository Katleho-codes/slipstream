import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";

import {
    me,
    updateProfile,
    UpdateProfileSchema,
} from "../controllers/auth.controller";
import {
    createEmployee,
    CreateEmployeeSchema,
    deleteEmployee,
    getEmployee,
    getEmployees,
    updateEmployee,
    UpdateEmployeeSchema,
} from "../controllers/employee.controller";
import {
    createOrganisation,
    CreateOrganisationSchema,
    getOnboardingStatus,
    selectPlan,
    SelectPlanSchema,
} from "../controllers/onboarding.controller";
import {
    createPayPeriod,
    CreatePayPeriodSchema,
    deletePayPeriod,
    getPayPeriods,
} from "../controllers/payPeriod.controller";
import {
    createPayslip,
    CreatePayslipSchema,
    downloadPayslipPDF,
    getPayslip,
    getPayslips,
    issuePayslip,
    verifyPayslip,
} from "../controllers/payslip.controller";
import {
    getMembers,
    InviteMemberSchema,
    inviteMember,
    getInvites,
    revokeInvite,
    AcceptInviteSchema,
    acceptInvite,
    updateMemberRole,
    removeMember,
    previewInvite,
} from "../controllers/members.controller";

const router = Router();

// ─── Onboarding (session-only — no employer profile required yet) ─────────────
router.get("/onboarding/status", getOnboardingStatus);
router.post(
    "/onboarding/organisation",
    validate(CreateOrganisationSchema),
    createOrganisation,
);
router.post("/onboarding/plan", validate(SelectPlanSchema), selectPlan);

// ─── Employer profile (Better Auth handles /api/auth/* sign-in/sign-up/sign-out) ──
router.get("/employer/me", requireAuth, me);
router.patch(
    "/employer/profile",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    validate(UpdateProfileSchema),
    updateProfile,
);

// ─── Employees ────────────────────────────────────────────────────────────────
router.get("/employees", requireAuth, getEmployees);
router.get("/employees/:id", requireAuth, getEmployee);
router.post(
    "/employees",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    validate(CreateEmployeeSchema),
    createEmployee,
);
router.patch(
    "/employees/:id",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    validate(UpdateEmployeeSchema),
    updateEmployee,
);
router.delete(
    "/employees/:id",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    deleteEmployee,
);

// ─── Pay Periods ──────────────────────────────────────────────────────────────
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

// ─── Payslips ─────────────────────────────────────────────────────────────────
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

// ─── Members & invites ────────────────────────────────────────────────────────
router.get("/members", requireAuth, getMembers);
router.post(
    "/members/invite",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    validate(InviteMemberSchema),
    inviteMember,
);
router.get(
    "/members/invites",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    getInvites,
);
router.delete(
    "/members/invites/:id",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    revokeInvite,
);
router.post("/members/accept", validate(AcceptInviteSchema), acceptInvite); // session only — no OrgMember yet
router.patch(
    "/members/:userId/role",
    requireAuth,
    requireRole("OWNER"),
    updateMemberRole,
);
router.delete(
    "/members/:userId",
    requireAuth,
    requireRole("OWNER"),
    removeMember,
);
// ─── Public invite preview (no auth) ─────────────────────────────────────────
router.get("/invites/:token", previewInvite);
// ─── Public verify (no auth) ──────────────────────────────────────────────────
router.get("/verify/:token", verifyPayslip);

export default router;
// // ─── Public invite preview ────────────────────────────────────────────────────
// router.get("/invites/:token", previewInvite);
