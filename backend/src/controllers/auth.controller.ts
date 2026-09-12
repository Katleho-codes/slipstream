import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import prisma from "../utils/prisma";
import {
    sendSuccess,
    sendNotFound,
    sendServerError,
    sendError,
} from "../utils/response";

// Validation schemas (used by the /profile update route)
export const UpdateProfileSchema = z.object({
    companyName: z.string().min(2).optional(),
    regNumber: z.string().optional(),
    vatNumber: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
});

/**
 * GET /api/auth/me
 * Returns the authenticated employer's full profile.
 * Better Auth handles /api/auth/sign-in, /api/auth/sign-up, /api/auth/sign-out.
 */
export async function me(req: AuthRequest, res: Response): Promise<void> {
    try {
        const employer = await prisma.employer.findUnique({
            where: { id: req.employer!.id },
            select: {
                id: true,
                companyName: true,
                regNumber: true,
                vatNumber: true,
                phone: true,
                address: true,
                logoUrl: true,
                plan: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        emailVerified: true,
                    },
                },
                _count: {
                    select: { employees: { where: { isActive: true } } },
                },
            },
        });

        if (!employer) {
            sendNotFound(res, "Employer");
            return;
        }

        sendSuccess(res, employer);
    } catch (err) {
        console.error("[me]", err);
        sendServerError(res);
    }
}

/**
 * PATCH /api/auth/profile
 * Update company profile details.
 */
export async function updateProfile(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const parsed = UpdateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, "Validation failed", 422, parsed.error.issues);
            return;
        }

        const employer = await prisma.employer.update({
            where: { id: req.employer!.id },
            data: parsed.data,
            select: {
                id: true,
                companyName: true,
                regNumber: true,
                vatNumber: true,
                phone: true,
                address: true,
                plan: true,
            },
        });

        sendSuccess(res, employer, "Profile updated");
    } catch (err) {
        console.error("[updateProfile]", err);
        sendServerError(res);
    }
}
