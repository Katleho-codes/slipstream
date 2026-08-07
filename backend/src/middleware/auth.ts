import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { sendUnauthorized } from "../utils/response";
import prisma from "../utils/prisma";

export interface AuthRequest extends Request {
    employer?: {
        id: string; // Employer record id
        userId: string; // Better Auth User id
        email: string;
        companyName: string;
        plan: string;
    };
}

export async function requireAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        // Better Auth reads the session from cookie or Bearer token automatically
        const session = await auth.api.getSession({
            headers: req.headers as unknown as Headers,
        });
        if (!session?.user) {
            sendUnauthorized(res, "Not authenticated");
            return;
        }

        // Load the Employer profile linked to this user
        const employer = await prisma.employer.findUnique({
            where: { userId: session.user.id },
            select: {
                id: true,
                userId: true,
                companyName: true,
                plan: true,
                isActive: true,
            },
        });
        if (!employer || !employer.isActive) {
            sendUnauthorized(res, "Employer account not found or inactive");
            return;
        }

        req.employer = {
            id: employer.id,
            userId: employer.userId,
            email: session.user.email,
            companyName: employer.companyName,
            plan: employer.plan,
        };
        next();
    } catch (err) {
        console.error("[requireAuth]", err);
        sendUnauthorized(res, "Authentication failed");
    }
}
