import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import "dotenv/config";
import prisma from "../utils/prisma";
import { audit } from "../utils/audit";
import { openAPI } from "better-auth/plugins";
import {
    sendPasswordResetEmail,
    sendVerificationEmail,
} from "../services/email.service";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3003";

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),

    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8003",
    plugins: [openAPI()],
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        sendResetPassword: async ({ user, token }) => {
            // Link straight to the dashboard's reset page so the user ends up
            // on the frontend, not the API base.
            await sendPasswordResetEmail({
                to: user.email,
                name: user.name,
                resetUrl: `${FRONTEND_URL}/reset-password?token=${token}`,
            });
        },
        resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
        // No auto-employer creation here.
        // The onboarding flow (POST /api/onboarding/organisation) creates the
        // Employer profile explicitly, after the user has filled in their
        // company details. This keeps user and organisation concerns separate.
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, token }) => {
            // Route through the API's /verify-email so the session cookie is
            // set, then hand off to the dashboard's confirmation page.
            const verifyUrl = `${
                process.env.BETTER_AUTH_URL ?? "http://localhost:8003"
            }/api/auth/verify-email?token=${token}&callbackURL=${encodeURIComponent(
                `${FRONTEND_URL}/verify-email`,
            )}`;
            await sendVerificationEmail({
                to: user.email,
                name: user.name,
                verifyUrl,
            });
        },
        expiresIn: 60 * 60 * 24, // 24 hours
        autoSignInAfterVerification: false,
    },
    databaseHooks: {
        session: {
            create: {
                after: async (session) => {
                    // Fires on every successful sign-in / sign-up
                    await audit({
                        performedByUserId: session.userId,
                        action: "USER_LOGIN",
                        resourceType: "SESSION",
                        resourceId: session.id,
                        status: "SUCCESS",
                        details: {
                            expiresAt: session.expiresAt,
                        },
                    });
                },
            },
            delete: {
                after: async (session) => {
                    // Fires on sign-out and session revocation
                    await audit({
                        performedByUserId: session.userId,
                        action: "USER_LOGOUT",
                        resourceType: "SESSION",
                        resourceId: session.id,
                        status: "SUCCESS",
                    });
                },
            },
        },
        user: {
            create: {
                after: async (user) => {
                    // Fires on sign-up
                    await audit({
                        performedByUserId: user.id,
                        action: "USER_REGISTER",
                        resourceType: "USER",
                        resourceId: user.id,
                        status: "SUCCESS",
                        details: {
                            email: user.email,
                            name: user.name,
                        },
                    });
                },
            },
            delete: {
                after: async (user) => {
                    await audit({
                        performedByUserId: user.id,
                        action: "USER_DELETE_ACCOUNT",
                        resourceType: "USER",
                        resourceId: user.id,
                        status: "SUCCESS",
                    });
                },
            },
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // refresh after 1 day of activity
        cookieCache: { enabled: true, maxAge: 60 * 5 },
    },

    trustedOrigins: [process.env.FRONTEND_URL ?? "http://localhost:3003"],

    advanced: { cookiePrefix: "slipstream" },
});

export type Auth = typeof auth;
