import { request } from "./client";
import { OrgMember, OrgInvite, OrgRole } from "./types";

export const members = {
    list: () => request<OrgMember[]>({ url: "/api/members" }),

    invite: (body: { email: string; role: "ADMIN" | "STAFF" }) =>
        request<{
            id: string;
            email: string;
            role: OrgRole;
            expiresAt: string;
        }>({
            url: "/api/members/invite",
            method: "POST",
            data: body,
        }),

    listInvites: () => request<OrgInvite[]>({ url: "/api/members/invites" }),

    revokeInvite: (id: string) =>
        request({ url: `/api/members/invites/${id}`, method: "DELETE" }),

    updateRole: (userId: string, role: "ADMIN" | "STAFF") =>
        request<OrgMember>({
            url: `/api/members/${userId}/role`,
            method: "PATCH",
            data: { role },
        }),

    remove: (userId: string) =>
        request({ url: `/api/members/${userId}`, method: "DELETE" }),

    acceptInvite: (token: string) =>
        request({
            url: "/api/members/accept",
            method: "POST",
            data: { token },
        }),
};