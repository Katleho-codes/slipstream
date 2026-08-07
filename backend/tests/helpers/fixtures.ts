/**
 * Fixtures matching the real shapes in employee.controller.ts,
 * employer.controller.ts, payPeriod.controller.ts, payslip.controller.ts,
 * and middleware/auth.ts (AuthRequest.employer).
 */

// Matches AuthRequest["employer"] exactly, as attached by the real requireAuth
export const fixtureAuthEmployer = {
    id: "employer_1",
    userId: "UP7ppDj6pbG2KQnnlrVbDlfwuiAjpp7V", // Better Auth user id
    email: "admin@slipstream.com",
    companyName: "Acme Payroll (Pty) Ltd",
    plan: "STARTER", // PLAN_LIMITS.STARTER = 10
};

// Full Employer DB record (for prisma.employer.* mocks — includes fields
// requireAuth selects but doesn't put on req.employer, e.g. isActive)
export const fixtureEmployerRecord = {
    id: fixtureAuthEmployer.id,
    userId: fixtureAuthEmployer.userId,
    companyName: fixtureAuthEmployer.companyName,
    regNumber: "2020123456",
    vatNumber: "4123456789",
    phone: "0821234567",
    address: "1 Main Road, Johannesburg",
    plan: fixtureAuthEmployer.plan,
    isActive: true,
};

export const fixtureEmployeeRecord = {
    id: "employee_1",
    employerId: fixtureAuthEmployer.id,
    firstName: "Thabo",
    lastName: "Nkosi",
    email: "thabo@acme.co.za",
    phone: "0821234567", // must match /^(?:\+27|0)[6-8][0-9]{8}$/
    role: "Software Developer",
    department: "Engineering",
    employeeCode: "EMP001",
    isActive: true,
    startDate: "2024-01-15",
    _count: { payslips: 0 },
};

export const fixturePayPeriod = {
    id: "payperiod_1",
    employerId: fixtureAuthEmployer.id,
    periodStart: "2026-07-01",
    periodEnd: "2026-07-31",
    payDate: "2026-07-25",
    label: "July 2026",
};

// Nested to match the various `include` shapes across payslip.controller.ts
export const fixturePayslip = {
    id: "payslip_1",
    employeeId: fixtureEmployeeRecord.id,
    periodId: fixturePayPeriod.id, // NOTE: field is `periodId`, not `payPeriodId`
    grossSalary: 35000, // NOTE: field is `grossSalary`, not `grossPay`
    overtimePay: 0,
    bonus: 0,
    allowances: 0,
    paye: 5000,
    uif: 350,
    sdl: 0,
    netPay: 29650,
    verifyToken: "tok_abc123",
    issuedAt: "2026-07-25T09:00:00.000Z",
    pdfUrl: null,
    emailStatus: null,
    employee: {
        firstName: fixtureEmployeeRecord.firstName,
        lastName: fixtureEmployeeRecord.lastName,
        email: fixtureEmployeeRecord.email,
        role: fixtureEmployeeRecord.role,
        department: fixtureEmployeeRecord.department,
        idNumber: "9001015800081",
    },
    period: {
        label: fixturePayPeriod.label,
        payDate: fixturePayPeriod.payDate,
        employer: {
            companyName: fixtureEmployerRecord.companyName,
            regNumber: fixtureEmployerRecord.regNumber,
            address: fixtureEmployerRecord.address,
        },
    },
    deductions: [],
};
