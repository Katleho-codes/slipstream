/**
 * SlipStream API client
 * All requests go to the Express backend on port 8003.
 * Credentials: 'include' is required — Better Auth uses cookies.
 */

import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8003";
export type OrgRole = "OWNER" | "ADMIN" | "STAFF";
export class ApiError extends Error {
    constructor(
        public status: number,
        public errors?: Record<string, string[]>,
        message = "Request failed",
    ) {
        super(message);
        this.name = "ApiError";
    }
}

const api = axios.create({
    baseURL: BASE,
    timeout: 10000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

async function request<T>(
    config: Parameters<typeof api.request>[0],
): Promise<T> {
    try {
        const { data } = await api.request(config);

        return data?.data ?? data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const res = error.response;
            throw new ApiError(
                res?.status ?? 500,
                res?.data?.errors,
                res?.data?.message ?? error.message,
            );
        }

        throw error;
    }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
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

    sendVerificationEmail: (body: {
        email: string;
        callbackURL: string;
    }) =>
        request({
            url: "/api/auth/send-verification-email",
            method: "POST",
            data: body,
        }),
};

// ─── Members ──────────────────────────────────────────────────────────────────

export interface OrgMember {
    id: string;
    userId: string;
    employerId: string;
    role: OrgRole;
    joinedAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    };
}

export interface OrgInvite {
    id: string;
    email: string;
    role: OrgRole;
    expiresAt: string;
    createdAt?: string;
}

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

// ─── Onboarding ───────────────────────────────────────────────────────────────
export const onboarding = {
    /**
     * GET /api/onboarding/status
     * Returns the current user's onboarding state so the flow can resume.
     */
    status: () =>
        request<OnboardingStatus>({
            url: "/api/onboarding/status",
        }),

    /**
     * POST /api/onboarding/organisation
     * Creates the Employer profile linked to the current user.
     */
    createOrganisation: (body: CreateOrganisationDto) =>
        request<Employer>({
            url: "/api/onboarding/organisation",
            method: "POST",
            data: body,
        }),

    /**
     * POST /api/onboarding/plan
     * Selects the plan and marks onboarding complete.
     */
    selectPlan: (plan: Plan) =>
        request<Employer>({
            url: "/api/onboarding/plan",
            method: "POST",
            data: {
                plan,
            },
        }),
};

export interface OnboardingStatus {
    step: "organisations" | "create-organisation" | "plan" | "complete";
    employer: Employer | null;
    resuming: boolean;
}

export interface CreateOrganisationDto {
    companyName: string;
    regNumber?: string;
    vatNumber?: string;
    phone?: string;
    address?: string;
}

// ─── Employer ─────────────────────────────────────────────────────────────────
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
};

// ─── Employees ────────────────────────────────────────────────────────────────
export const employees = {
    list: (active?: boolean) =>
        request<Employee[]>({
            url: "/api/employees",
            params: active !== undefined ? { active } : undefined,
        }),

    get: (id: string) =>
        request<Employee>({
            url: `/api/employees/${id}`,
        }),

    create: (body: CreateEmployeeDto) =>
        request<Employee>({
            url: "/api/employees",
            method: "POST",
            data: body,
        }),

    update: (id: string, body: Partial<CreateEmployeeDto>) =>
        request<Employee>({
            url: `/api/employees/${id}`,
            method: "PATCH",
            data: body,
        }),

    deactivate: (id: string) =>
        request({
            url: `/api/employees/${id}`,
            method: "DELETE",
        }),
};

// ─── Pay Periods ──────────────────────────────────────────────────────────────
export const payPeriods = {
    list: () =>
        request<PayPeriod[]>({
            url: "/api/pay-periods",
        }),
    create: (body: CreatePayPeriodDto) =>
        request<PayPeriod>({
            url: "/api/pay-periods",
            method: "POST",
            data: body,
        }),
    delete: (id: string) =>
        request({
            url: `/api/pay-periods/${id}`,
            method: "DELETE",
        }),
};

// ─── Payslips ─────────────────────────────────────────────────────────────────
export const payslips = {
    list: (params?: { periodId?: string; employeeId?: string }) =>
        request<Payslip[]>({
            url: "/api/payslips",
            params,
        }),

    get: (id: string) =>
        request<Payslip>({
            url: `/api/payslips/${id}`,
        }),

    create: (body: CreatePayslipDto) =>
        request<Payslip>({
            url: "/api/payslips",
            method: "POST",
            data: body,
        }),

    issue: (id: string) =>
        request<{ payslipId: string; pdf: boolean; email: boolean }>({
            url: `/api/payslips/${id}/issue`,
            method: "POST",
        }),

    pdfUrl: (id: string) => `${BASE}/api/payslips/${id}/pdf`,

    /**
     * Public — verify a payslip by its token (the QR/email link target).
     */
    publicVerify: (token: string) =>
        request<PayslipVerifyPayload>({
            url: `/api/verify/${token}`,
        }),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type Plan = "STARTER" | "GROWTH" | "BUSINESS" | "ENTERPRISE";
export type EmailStatus = "PENDING" | "SENT" | "FAILED";

export interface Employer {
    id: string;
    companyName: string;
    regNumber: string | null;
    vatNumber: string | null;
    phone: string | null;
    address: string | null;
    logoUrl: string | null;
    plan: Plan;
    createdAt: string;
    user: { id: string; email: string; name: string; emailVerified: boolean };
    _count: { employees: number };
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    role: string | null;
    department: string | null;
    employeeCode: string | null;
    isActive: boolean;
    startDate: string | null;
    _count?: { payslips: number };
}

export interface PayPeriod {
    id: string;
    label: string;
    periodStart: string;
    periodEnd: string;
    payDate: string;
    _count?: { payslips: number };
}

export interface Deduction {
    id: string;
    label: string;
    amount: number;
    type: "FIXED" | "PERCENTAGE";
}

export interface Payslip {
    id: string;
    employeeId: string;
    periodId: string;
    grossSalary: number;
    overtimePay: number;
    bonus: number;
    allowances: number;
    paye: number;
    uif: number;
    sdl: number;
    netPay: number;
    verifyToken: string;
    emailStatus: EmailStatus;
    emailSentAt: string | null;
    issuedAt: string;
    deductions: Deduction[];
    employee: Pick<Employee, "firstName" | "lastName" | "role" | "department">;
    period: Pick<PayPeriod, "label" | "payDate">;
}

export interface CreateEmployeeDto {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    role?: string;
    department?: string;
    idNumber?: string;
    employeeCode?: string;
    startDate?: string;
}

export interface CreatePayPeriodDto {
    label: string;
    periodStart: string;
    periodEnd: string;
    payDate: string;
}

export interface CreatePayslipDto {
    employeeId: string;
    periodId: string;
    grossSalary: number;
    overtimePay?: number;
    bonus?: number;
    allowances?: number;
    paye?: number;
    uif?: number;
    sdl?: number;
    deductions?: {
        label: string;
        amount: number;
        type?: "FIXED" | "PERCENTAGE";
    }[];
}

export interface PayslipVerifyPayload {
    valid: boolean;
    message?: string;
    payslip?: {
        employeeName: string;
        role: string | null;
        companyName: string;
        period: string;
        payDate: string;
        grossSalary: number;
        netPay: number;
        issuedAt: string;
    };
}

// ─── Payslip verification (public) ────────────────────────────────────────────

// ─── Invite acceptance (public) ───────────────────────────────────────────────
export interface InvitePreview {
    email: string;
    role: OrgRole;
    companyName: string;
    expiresAt: string;
    expired: boolean;
}

export const invites = {
    /** GET /api/invites/:token — preview the invite without auth */
    preview: (token: string) =>
        request<InvitePreview>({ url: `/api/invites/${token}` }),

    /** POST /api/members/accept — accept after signing in/up */
    accept: (token: string) =>
        request<{ companyName: string; role: OrgRole }>({
            url: "/api/members/accept",
            method: "POST",
            data: { token },
        }),
};
