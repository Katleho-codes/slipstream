import { Response } from "express";
import { z } from "zod";
import { auth } from "../lib/auth";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import {
    sendSuccess,
    sendCreated,
    sendError,
    sendUnauthorized,
    sendServerError,
} from "../utils/response";

// ─── Schemas ──────────────────────────────────────────────────────────────────
export const CreateOrganisationSchema = z.object({
    companyName: z.string().min(2, "Company name required"),
    regNumber: z.string().optional(),
    vatNumber: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
});

export const SelectPlanSchema = z.object({
    plan: z.enum(["STARTER", "GROWTH", "BUSINESS", "ENTERPRISE"]),
});

// ─── GET /api/onboarding/status ───────────────────────────────────────────────
/**
 * Returns the current user's onboarding step so the flow can resume
 * exactly where they left off — even after signing out and back in.
 *
 * Step logic:
 *   - No employer row          → 'organisations'
 *   - Employer, !onboardingComplete → 'plan'
 *   - Employer, onboardingComplete  → 'complete' (redirect to /dashboard)
 */
export async function getOnboardingStatus(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        // Read session directly from Better Auth — no employer required yet
        const session = await auth.api.getSession({
            headers: req.headers as unknown as Headers,
        });

        if (!session?.user) {
            sendUnauthorized(res);
            return;
        }

        const employer = await prisma.employer.findUnique({
            where: { userId: session.user.id },
            include: { user: { select: { email: true, name: true } } },
        });

        // Determine step
        let step: string;
        let resuming = false;

        if (!employer) {
            step = "organisations";
            resuming = false;
        } else if (!employer.onboardingComplete) {
            // They created the org but never selected a plan
            step = "plan";
            resuming = true;
        } else {
            step = "complete";
            resuming = false;
        }

        sendSuccess(res, { step, employer, resuming });
    } catch (err) {
        console.log("[getOnboardingStatus]", err);
        sendServerError(res);
    }
}

// ─── POST /api/onboarding/organisation ───────────────────────────────────────
/**
 * Creates or updates the Employer profile for the current user.
 * This is step 2 — user has chosen to create an organisation.
 * If an employer already exists (resumed flow), updates it instead.
 */
export async function createOrganisation(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const session = await auth.api.getSession({
            headers: req.headers as unknown as Headers,
        });

        if (!session?.user) {
            sendUnauthorized(res);
            return;
        }

        const { companyName, regNumber, vatNumber, phone, address } = req.body;

        const existing = await prisma.employer.findUnique({
            where: { userId: session.user.id },
        });

        let employer;

        if (existing) {

            employer = await prisma.$transaction(async (tx) => {
                const updatedEmployer = await tx.employer.update({
                    where: { userId: session.user.id },
                    data: {
                        companyName,
                        regNumber,
                        vatNumber,
                        phone,
                        address,
                    },
                    include: {
                        user: {
                            select: {
                                email: true,
                                name: true,
                            },
                        },
                    },
                });

                await tx.orgMember.upsert({
                    where: {
                        employerId_userId: {
                            employerId: updatedEmployer.id,
                            userId: session.user.id,
                        },
                    },
                    create: {
                        employerId: updatedEmployer.id,
                        userId: session.user.id,
                        role: "OWNER",
                    },
                    update: {},
                });

                return updatedEmployer;
            });
        } else {
            // An organisation created through onboarding always has its creator as an OWNER member
            employer = await prisma.$transaction(async (tx) => {
                const employer = await tx.employer.create({
                    data: {
                        userId: session.user.id,
                        companyName,
                        regNumber,
                        vatNumber,
                        phone,
                        address,
                        onboardingComplete: false,
                    },
                    include: {
                        user: {
                            select: {
                                email: true,
                                name: true,
                            },
                        },
                    },
                });

                await tx.orgMember.create({
                    data: {
                        employerId: employer.id,
                        userId: session.user.id,
                        role: "OWNER",
                    },
                });

                return employer;
            });
        }

        sendCreated(res, employer, "Organisation created");
    } catch (err) {
        console.log("[createOrganisation]", err);
        sendServerError(res);
    }
}

// ─── POST /api/onboarding/plan ────────────────────────────────────────────────
/**
 * Sets the employer's plan and marks onboarding as complete.
 * This is the final step — after this, the user lands on /dashboard.
 */
export async function selectPlan(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const session = await auth.api.getSession({
            headers: req.headers as unknown as Headers,
        });

        if (!session?.user) {
            sendUnauthorized(res);
            return;
        }

        const { plan } = req.body;

        const employer = await prisma.employer.findUnique({
            where: { userId: session.user.id },
        });

        if (!employer) {
            sendError(
                res,
                "No organisation found — complete step 2 first",
                400,
            );
            return;
        }

        const updated = await prisma.employer.update({
            where: { userId: session.user.id },
            data: {
                plan,
                onboardingComplete: true,
            },
            include: { user: { select: { email: true, name: true } } },
        });

        sendSuccess(res, updated, "Plan selected — onboarding complete");
    } catch (err) {
        console.log("[selectPlan]", err);
        sendServerError(res);
    }
}
