import { Request, Response } from "express";
import { z } from "zod";
import { addHours } from "date-fns";

import prisma from "../utils/prisma";

import { OrgRole } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { auth } from "../lib/auth";
import { sendPayslipEmail } from "../services/email.service";
import { audit } from "../utils/audit";
import {
    sendSuccess,
    sendCreated,
    sendError,
    sendNotFound,
    sendForbidden,
    sendServerError,
    sendUnauthorized,
} from "../utils/response";

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const InviteMemberSchema = z.object({
    email: z.string().email("Valid email required"),
    role: z.enum(["ADMIN", "STAFF"]), // OWNER cannot be invited — only the creator gets OWNER
});

export const AcceptInviteSchema = z.object({
    token: z.string().min(1, "Invite token required"),
});

// ─── GET /api/members ─────────────────────────────────────────────────────────

export async function getMembers(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const members = await prisma.orgMember.findMany({
            where: { employerId: req.employer!.id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, image: true },
                },
            },
            orderBy: { joinedAt: "asc" },
        });

        sendSuccess(res, members);
    } catch (err) {
        console.error("[getMembers]", err);
        sendServerError(res);
    }
}

// ─── POST /api/members/invite ─────────────────────────────────────────────────

export async function inviteMember(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { email, role } = req.body as { email: string; role: OrgRole };
        const employerId = req.employer!.id;

        // Check the invitee isn't already a member
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            const existingMember = await prisma.orgMember.findUnique({
                where: {
                    employerId_userId: { employerId, userId: existingUser.id },
                },
            });
            if (existingMember) {
                sendError(
                    res,
                    "This person is already a member of your organisation",
                    409,
                );
                return;
            }
        }

        // Check for a pending unexpired invite to same email
        const pendingInvite = await prisma.orgInvite.findFirst({
            where: {
                employerId,
                email,
                acceptedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
        if (pendingInvite) {
            sendError(
                res,
                "An active invite has already been sent to this email",
                409,
            );
            return;
        }

        const invite = await prisma.orgInvite.create({
            data: {
                employerId,
                email,
                role,
                invitedBy: req.employer!.userId,
                expiresAt: addHours(new Date(), 48),
            },
        });

        // Send invite email
        const inviteUrl = `${process.env.FRONTEND_URL}/invite/${invite.token}`;
        await sendInviteEmail({
            to: email,
            companyName: req.employer!.companyName,
            role,
            inviteUrl,
            expiresAt: invite.expiresAt,
        });

        await audit({
            performedByUserId: req.employer?.userId,
            employerId,
            action: "MEMBER_INVITE",
            resourceType: "OrgInvite",
            resourceId: invite.id,
            status: "SUCCESS",
            details: { email, role },
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] as string,
        });

        sendCreated(
            res,
            { id: invite.id, email, role, expiresAt: invite.expiresAt },
            "Invite sent",
        );
    } catch (err) {
        console.log("[inviteMember]", err);
        sendServerError(res);
    }
}

// ─── GET /api/members/invites ─────────────────────────────────────────────────

export async function getInvites(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const invites = await prisma.orgInvite.findMany({
            where: {
                employerId: req.employer!.id,
                acceptedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
        });

        sendSuccess(res, invites);
    } catch (err) {
        console.error("[getInvites]", err);
        sendServerError(res);
    }
}

// ─── DELETE /api/members/invites/:id ─────────────────────────────────────────

export async function revokeInvite(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const invite = await prisma.orgInvite.findFirst({
            where: { id: req.params.id, employerId: req.employer!.id },
        });

        if (!invite) {
            sendNotFound(res, "Invite");
            return;
        }
        if (invite.acceptedAt) {
            sendError(res, "Cannot revoke an already accepted invite", 400);
            return;
        }

        await prisma.orgInvite.delete({ where: { id: req.params.id } });
        sendSuccess(res, null, "Invite revoked");
    } catch (err) {
        console.error("[revokeInvite]", err);
        sendServerError(res);
    }
}

// ─── POST /api/members/accept ─────────────────────────────────────────────────
// Public-ish: requires a valid Better Auth session but no OrgMember yet

export async function acceptInvite(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.body as { token: string };

        const session = await auth.api.getSession({
            headers: req.headers as unknown as Headers,
        });

        if (!session?.user) {
            sendUnauthorized(res, "Sign in to accept this invite");
            return;
        }

        const invite = await prisma.orgInvite.findUnique({
            where: { token },
            include: { employer: { select: { id: true, companyName: true } } },
        });

        if (!invite) {
            sendError(res, "Invite not found or already used", 404);
            return;
        }

        if (invite.expiresAt < new Date()) {
            sendError(
                res,
                "This invite has expired. Ask the owner to send a new one.",
                410,
            );
            return;
        }

        if (invite.acceptedAt) {
            sendError(res, "This invite has already been accepted", 409);
            return;
        }

        if (invite.email !== session.user.email) {
            sendForbidden(
                res,
                `This invite was sent to ${invite.email}. Sign in with that email to accept it.`,
            );
            return;
        }

        // Check not already a member
        const alreadyMember = await prisma.orgMember.findUnique({
            where: {
                employerId_userId: {
                    employerId: invite.employerId,
                    userId: session.user.id,
                },
            },
        });

        if (alreadyMember) {
            sendError(
                res,
                "You are already a member of this organisation",
                409,
            );
            return;
        }

        // Create membership + mark invite accepted in a transaction
        const [member] = await prisma.$transaction([
            prisma.orgMember.create({
                data: {
                    employerId: invite.employerId,
                    userId: session.user.id,
                    role: invite.role,
                    invitedBy: invite.invitedBy,
                },
            }),
            prisma.orgInvite.update({
                where: { id: invite.id },
                data: { acceptedAt: new Date() },
            }),
        ]);

        await audit({
            performedByUserId: session.user.id,
            employerId: invite.employerId,
            action: "MEMBER_ACCEPTED",
            resourceType: "OrgMember",
            resourceId: member.id,
            status: "SUCCESS",
            details: { role: invite.role, inviteId: invite.id },
            ipAddress: (req as { ip?: string }).ip,
            userAgent: req.headers["user-agent"] as string,
        });

        sendCreated(
            res,
            {
                employerId: invite.employerId,
                companyName: invite.employer.companyName,
                role: invite.role,
            },
            `Welcome to ${invite.employer.companyName}`,
        );
    } catch (err) {
        console.log("[acceptInvite]", err);
        sendServerError(res);
    }
}

// ─── PATCH /api/members/:userId/role ─────────────────────────────────────────

export async function updateMemberRole(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { role } = req.body as { role: OrgRole };
        const targetUserId = req.params.userId;

        // Cannot change your own role
        if (targetUserId === req.employer!.userId) {
            sendError(res, "You cannot change your own role", 400);
            return;
        }

        // Cannot assign OWNER role — ownership transfer not supported in v1
        if (role === "OWNER") {
            sendError(
                res,
                "OWNER role cannot be assigned via this endpoint",
                400,
            );
            return;
        }

        const member = await prisma.orgMember.findUnique({
            where: {
                employerId_userId: {
                    employerId: req.employer!.id,
                    userId: targetUserId,
                },
            },
        });

        if (!member) {
            sendNotFound(res, "Member");
            return;
        }

        // Cannot demote another OWNER
        if (member.role === "OWNER") {
            sendError(
                res,
                "Cannot change the role of the organisation owner",
                400,
            );
            return;
        }

        const updated = await prisma.orgMember.update({
            where: {
                employerId_userId: {
                    employerId: req.employer!.id,
                    userId: targetUserId,
                },
            },
            data: { role },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        await audit({
            performedByUserId: req.employer?.userId,
            employerId: req.employer?.id,
            action: "MEMBER_ROLE_CHANGE",
            resourceType: "OrgMember",
            resourceId: updated.id,
            status: "SUCCESS",
            details: { targetUserId, previousRole: member.role, newRole: role },
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] as string,
        });

        sendSuccess(res, updated, "Role updated");
    } catch (err) {
        console.error("[updateMemberRole]", err);
        sendServerError(res);
    }
}

// ─── DELETE /api/members/:userId ─────────────────────────────────────────────

export async function removeMember(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const targetUserId = req.params.userId;

        if (targetUserId === req.employer!.userId) {
            sendError(
                res,
                "You cannot remove yourself from the organisation",
                400,
            );
            return;
        }

        const member = await prisma.orgMember.findUnique({
            where: {
                employerId_userId: {
                    employerId: req.employer!.id,
                    userId: targetUserId,
                },
            },
            include: { user: { select: { name: true, email: true } } },
        });

        if (!member) {
            sendNotFound(res, "Member");
            return;
        }

        if (member.role === "OWNER") {
            sendError(res, "Cannot remove the organisation owner", 400);
            return;
        }

        await prisma.orgMember.delete({
            where: {
                employerId_userId: {
                    employerId: req.employer!.id,
                    userId: targetUserId,
                },
            },
        });

        await audit({
            performedByUserId: req.employer?.userId,
            employerId: req.employer?.id,
            action: "MEMBER_DELETED",
            resourceType: "OrgMember",
            resourceId: member.id,
            status: "SUCCESS",
            details: {
                targetUserId,
                role: member.role,
                email: member.user.email,
            },
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] as string,
        });

        sendSuccess(res, null, "Member removed");
    } catch (err) {
        console.error("[removeMember]", err);
        sendServerError(res);
    }
}

// ─── Email helper ─────────────────────────────────────────────────────────────

async function sendInviteEmail(params: {
    to: string;
    companyName: string;
    role: string;
    inviteUrl: string;
    expiresAt: Date;
}): Promise<void> {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const roleLabel =
        params.role === "ADMIN" ? "Administrator" : "Staff (view only)";
    const expiryStr = params.expiresAt.toLocaleDateString("en-ZA", {
        timeZone: "Africa/Johannesburg",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    await resend.emails.send({
        from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
        to: params.to,
        subject: `You've been invited to join ${params.companyName} on SlipStream`,
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5">
      <tr><td style="background:#1A3D2B;padding:28px 32px">
        <p style="margin:0;font-size:22px;font-weight:600;color:#fff;font-family:Arial,sans-serif">SlipStream</p>
        <p style="margin:4px 0 0;font-size:13px;color:#9FE1CB">Organisation invitation</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#111">You've been invited to join <strong>${params.companyName}</strong> on SlipStream as <strong>${roleLabel}</strong>.</p>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0">
          <tr><td style="background:#1A3D2B;border-radius:8px">
            <a href="${params.inviteUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none">Accept invitation →</a>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#666">This invite expires on <strong>${expiryStr}</strong>. If you don't have a SlipStream account yet, you'll be able to create one when you click the link.</p>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid #f0f0f0">
        <p style="margin:0;font-size:12px;color:#999">SlipStream by Lsquared Technologies · If you weren't expecting this invite, you can ignore this email.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`,
    });
}
// ─── GET /api/invites/:token (public) ────────────────────────────────────────
/**
 * Returns a safe preview of the invite so the acceptance page
 * can show the company name, role, and expiry before the user
 * signs in or creates an account.
 */
export async function previewInvite(
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const invite = await prisma.orgInvite.findUnique({
            where: { token: req.params.token },
            include: { employer: { select: { companyName: true } } },
        });

        if (!invite) {
            res.status(404).json({
                success: false,
                message: "Invite not found or already used",
            });
            return;
        }

        sendSuccess(res, {
            email: invite.email,
            role: invite.role,
            companyName: invite.employer.companyName,
            expiresAt: invite.expiresAt,
            expired: invite.expiresAt < new Date(),
            accepted: !!invite.acceptedAt,
        });
    } catch (err) {
        console.log("[previewInvite]", err);
        sendServerError(res);
    }
}
