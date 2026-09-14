import { request } from "./client";
import { OrgRole, InvitePreview } from "./types";

export const invites = {
    preview: (token: string) =>
        request<InvitePreview>({ url: `/api/invites/${token}` }),

    accept: (token: string) =>
        request<{ companyName: string; role: OrgRole }>({
            url: "/api/members/accept",
            method: "POST",
            data: { token },
        }),
};