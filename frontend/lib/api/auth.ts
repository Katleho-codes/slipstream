import { request } from "./client";

export const auth = {
    signUp: (body: { name: string; email: string; password: string }) =>
        request({
            url: "/api/auth/sign-up/email",
            method: "POST",
            data: body,
        }),

    signIn: (body: { email: string; password: string }) =>
        request({
            url: "/api/auth/sign-in/email",
            method: "POST",
            data: body,
        }),

    signOut: () =>
        request({
            url: "/api/auth/sign-out",
            method: "POST",
        }),

    session: () =>
        request<{
            user: {
                id: string;
                email: string;
                name: string;
                emailVerified: boolean;
            } | null;
        }>({
            url: "/api/auth/get-session",
        }),

    requestPasswordReset: (body: { email: string }) =>
        request({
            url: "/api/auth/request-password-reset",
            method: "POST",
            data: body,
        }),

    resetPassword: (body: { newPassword: string; token: string }) =>
        request({
            url: "/api/auth/reset-password",
            method: "POST",
            data: body,
        }),

    sendVerificationEmail: (body: { email: string; callbackURL: string }) =>
        request({
            url: "/api/auth/send-verification-email",
            method: "POST",
            data: body,
        }),
};