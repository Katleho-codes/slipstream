/**
 * Global Vitest setup — registered via `setupFiles` in vitest.config.ts.
 * Only mocks live here. No implementation code.
 */
import { vi } from "vitest";
import { Readable } from "stream";

// ─── Auth state — tests set authState.employer to simulate logged-in user ────
export const authState: { employer: Record<string, unknown> | null } = {
    employer: null,
};

vi.mock("../src/middleware/auth", () => ({
    requireAuth: (req: any, res: any, next: any) => {
        if (!authState.employer) {
            return res
                .status(401)
                .json({ success: false, message: "Not authenticated" });
        }
        req.employer = authState.employer;
        next();
    },
    requireRole:
        (...roles: string[]) =>
        (req: any, res: any, next: any) => {
            const role = req.employer?.role ?? "STAFF";
            if (!roles.includes(role)) {
                return res
                    .status(403)
                    .json({ success: false, message: "Forbidden" });
            }
            next();
        },
}));

// ─── Prisma mock ──────────────────────────────────────────────────────────────
export const prismaMock = {
    employer: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    employee: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
    },
    payPeriod: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
    },
    payslip: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    orgMember: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        upsert: vi.fn(),
    },
    orgInvite: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
    },
    auditLog: {
        create: vi.fn().mockResolvedValue({}), // always succeeds silently
    },
    $transaction: vi.fn((arg: unknown) => {
        // Prisma supports both an array of promises and an interactive
        // callback. For the callback form the mock passes itself as `tx`.
        if (typeof arg === "function") {
            return (arg as (tx: unknown) => unknown)(prismaMock);
        }
        return Promise.all(arg as Promise<unknown>[]);
    }),
};

vi.mock("../src/utils/prisma", () => ({ default: prismaMock }));

// ─── Better Auth — controllers read the session straight from auth.api ───────
vi.mock("../src/lib/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn().mockResolvedValue({
                user: {
                    id: "UP7ppDj6pbG2KQnnlrVbDlfwuiAjpp7V",
                    email: "admin@slipstream.com",
                    name: "Admin",
                },
            }),
        },
    },
}));

// The public verify endpoint now enforces the HMAC with a constant-time
// comparison. The fixtures carry plain tokens, so force the check to pass —
// route/auth behaviour is what these tests assert, not the crypto.
vi.mock("../src/utils/verifyToken", async (importOriginal) => {
    const actual = await importOriginal<
        typeof import("../src/utils/verifyToken")
    >();
    return {
        ...actual,
        verifyPayslipToken: vi.fn().mockReturnValue(true),
    };
});

// ─── External services ────────────────────────────────────────────────────────
vi.mock("../src/services/pdf.service", () => ({
    generatePayslipPDF: vi.fn().mockResolvedValue(undefined),
    getPayslipPDFPath: vi.fn((id: string) => `/tmp/payslip_${id}.pdf`),
    payslipPDFExists: vi.fn().mockReturnValue(true),
}));

vi.mock("../src/services/email.service", () => ({
    sendPayslipEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("fs", async (importOriginal) => {
    const actual = await importOriginal<typeof import("fs")>();
    const mockStream = vi.fn(() => Readable.from([Buffer.from("%PDF-fake")]));
    return {
        ...actual,
        createReadStream: mockStream,
        default: { ...actual, createReadStream: mockStream },
    };
});
