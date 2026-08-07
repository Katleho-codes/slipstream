import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import "dotenv/config";
import prisma from "../utils/prisma";
export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),

    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8003",

    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    const existing = await prisma.employer.findUnique({
                        where: { userId: user.id },
                    });
                    if (!existing) {
                        await prisma.employer.create({
                            data: { userId: user.id, companyName: user.name },
                        });
                    }
                },
            },
        },
    },

    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: { enabled: true, maxAge: 60 * 5 },
    },

    trustedOrigins: [process.env.FRONTEND_URL ?? "http://localhost:3003"],

    advanced: { cookiePrefix: "slipstream" },
});

export type Auth = typeof auth;
