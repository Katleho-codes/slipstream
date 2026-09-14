export type OrgRole = "OWNER" | "ADMIN" | "STAFF";
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

export interface InvitePreview {
    email: string;
    role: OrgRole;
    companyName: string;
    expiresAt: string;
    expired: boolean;
}