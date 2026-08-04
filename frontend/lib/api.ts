/**
 * SlipStream API client
 * All requests go to the Express backend on port 8003.
 * Credentials: 'include' is required — Better Auth uses cookies.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8003";

class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        ...init,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...init?.headers },
    });

    const json = await res.json();

    if (!res.ok) {
        if (process.env.NODE_ENV === "development")
            throw new ApiError(res.status, json.message ?? "Request failed");
    }

    return json.data ?? json;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
    signUp: (body: { name: string; email: string; password: string }) =>
        request("/api/auth/sign-up/email", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    signIn: (body: { email: string; password: string }) =>
        request("/api/auth/sign-in/email", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    signOut: () => request("/api/auth/sign-out", { method: "POST" }),

    session: () =>
        request<{ user: { id: string; email: string; name: string } } | null>(
            "/api/auth/get-session",
        ),
};

// ─── Employer ─────────────────────────────────────────────────────────────────
export const employer = {
    me: () => request<Employer>("/api/employer/me"),

    updateProfile: (
        body: Partial<
            Pick<
                Employer,
                "companyName" | "regNumber" | "vatNumber" | "phone" | "address"
            >
        >,
    ) =>
        request<Employer>("/api/employer/profile", {
            method: "PATCH",
            body: JSON.stringify(body),
        }),
};

// ─── Employees ────────────────────────────────────────────────────────────────
export const employees = {
    list: (active?: boolean) =>
        request<Employee[]>(
            `/api/employees${active !== undefined ? `?active=${active}` : ""}`,
        ),

    get: (id: string) => request<Employee>(`/api/employees/${id}`),

    create: (body: CreateEmployeeDto) =>
        request<Employee>("/api/employees", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    update: (id: string, body: Partial<CreateEmployeeDto>) =>
        request<Employee>(`/api/employees/${id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
        }),

    deactivate: (id: string) =>
        request(`/api/employees/${id}`, { method: "DELETE" }),
};

// ─── Pay Periods ──────────────────────────────────────────────────────────────
export const payPeriods = {
    list: () => request<PayPeriod[]>("/api/pay-periods"),

    create: (body: CreatePayPeriodDto) =>
        request<PayPeriod>("/api/pay-periods", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    delete: (id: string) =>
        request(`/api/pay-periods/${id}`, { method: "DELETE" }),
};

// ─── Payslips ─────────────────────────────────────────────────────────────────
export const payslips = {
    list: (params?: { periodId?: string; employeeId?: string }) => {
        const qs = new URLSearchParams(
            params as Record<string, string>,
        ).toString();
        return request<Payslip[]>(`/api/payslips${qs ? `?${qs}` : ""}`);
    },

    get: (id: string) => request<Payslip>(`/api/payslips/${id}`),

    create: (body: CreatePayslipDto) =>
        request<Payslip>("/api/payslips", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    issue: (id: string) =>
        request<{ payslipId: string; pdf: boolean; email: boolean }>(
            `/api/payslips/${id}/issue`,
            { method: "POST" },
        ),

    pdfUrl: (id: string) => `${BASE}/api/payslips/${id}/pdf`,
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
    user: { email: string; name: string; emailVerified: boolean };
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
