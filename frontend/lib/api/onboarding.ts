import { request } from "./client";
import { Employer, OnboardingStatus, CreateOrganisationDto, Plan } from "./types";

export const onboarding = {
    status: () =>
        request<OnboardingStatus>({
            url: "/api/onboarding/status",
        }),

    createOrganisation: (body: CreateOrganisationDto) =>
        request<Employer>({
            url: "/api/onboarding/organisation",
            method: "POST",
            data: body,
        }),

    selectPlan: (plan: Plan) =>
        request<Employer>({
            url: "/api/onboarding/plan",
            method: "POST",
            data: { plan },
        }),
};