import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { sendForbidden, sendUnauthorized } from "../utils/response";
import prisma from "../utils/prisma";
import { OrgRole } from "@prisma/client";

export interface AuthRequest extends Request {
    employer?: {
        id: string;
        userId: string;
        email: string;
        companyName: string;
        plan: string;
        isActive: boolean;
        onboardingComplete: boolean;
        role: OrgRole; // the member's role in this org
    };
}

/**
 * requireAuth — validates the Better Auth session and loads the Employer profile.
 * Used on all routes that require a fully onboarded employer.
 *
 * Onboarding routes (/api/onboarding/*) do NOT use this middleware because
 * the user has a valid session but no Employer row yet.
 */
export async function requireAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const session = await auth.api.getSession({
            headers: req.headers as unknown as Headers,
        });
        if (!session?.user) {
            sendUnauthorized(res, "Not authenticated");
            return;
        }

        const membership = await prisma.orgMember.findFirst({
            where: { userId: session.user.id },
            include: { employer: true },
            orderBy: { joinedAt: "asc" }, // oldest = primary
        });
        if (!membership) {
            sendUnauthorized(res, "No organisation membership found");
            return;
        }

        // const employer = await prisma.employer.findUnique({
        //     where: { userId: session.user.id },
        //     select: {
        //         id: true,
        //         userId: true,
        //         companyName: true,
        //         plan: true,
        //         isActive: true,
        //         onboardingComplete: true,
        //     },
        // });

        // if (!employer) {
        //     sendUnauthorized(
        //         res,
        //         "Organisation not found — complete onboarding first",
        //     );
        //     return;
        // }

        // if (!employer.isActive) {
        //     sendUnauthorized(res, "Account inactive");
        //     return;
        // }

        // req.employer = {
        //     id: employer.id,
        //     userId: employer.userId,
        //     email: session.user.email,
        //     companyName: employer.companyName,
        //     plan: employer.plan,
        //     isActive: employer.isActive,
        //     onboardingComplete: employer.onboardingComplete,
        // };

        req.employer = {
            id: membership.employer.id,
            userId: session.user.id,
            email: session.user.email,
            companyName: membership.employer.companyName,
            plan: membership.employer.plan,
            isActive: membership.employer.isActive,
            role: membership.role, // NEW — now on req.employer
            onboardingComplete: membership.employer.onboardingComplete,
        };

        next();
    } catch (err) {
        console.log("[requireAuth]", err);
        sendUnauthorized(res, "Authentication failed");
    }
}

/**
 * requireRole
 * Gates a route to specific roles. Must be used after requireAuth.
 *
 * Usage:
 *   router.post('/employees', requireAuth, requireRole('OWNER', 'ADMIN'), createEmployee);
 *   router.get('/employees',  requireAuth, getEmployees); // all roles
 */
export function requireRole(...roles: OrgRole[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!roles.includes(req.employer!.role as OrgRole)) {
            sendForbidden(
                res,
                "You do not have permission to perform this action",
            );
            return;
        }
        next();
    };
}
