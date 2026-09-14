import { request } from "./client";
import { Employer } from "./types";

export const employer = {
    me: () =>
        request<Employer>({
            url: "/api/employer/me",
        }),

    updateProfile: (
        body: Partial<
            Pick<
                Employer,
                "companyName" | "regNumber" | "vatNumber" | "phone" | "address"
            >
        >,
    ) =>
        request<Employer>({
            url: "/api/employer/profile",
            method: "PATCH",
            data: body,
        }),

    changePlan: (plan: string) =>
        request<{ plan: string }>({
            url: "/api/employer/plan",
            method: "PATCH",
            data: { plan },
        }),
};