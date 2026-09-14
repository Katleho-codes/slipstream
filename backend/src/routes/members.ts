import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
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
} from "../controllers/members.controller";

const router = Router();

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
router.post(
    "/members/accept",
    validate(AcceptInviteSchema),
    acceptInvite,
); // session only — no OrgMember yet
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

export default router;