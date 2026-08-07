/**
 * Global Vitest setup — registered via `setupFiles` in vitest.config.ts.
 */
import { vi } from "vitest";
import { Readable } from "stream";

// ─── Auth — real requireAuth attaches `req.employer`, NOT `req.employee` ─────
// (confirmed against src/middleware/auth.ts's AuthRequest interface)
export const authState: { employer: Record<string, any> | null } = {
    employer: null,
};

vi.mock("../src/middleware/auth", () => ({
    requireAuth: (req: any, res: any, next: any) => {
        if (!authState.employer) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        req.employer = authState.employer;
        next();
    },
}));

// ─── Prisma — model/method names confirmed against the four controllers ──────
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
        update: vi.fn(), // deleteEmployee soft-deletes via update({isActive:false})
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
        findUnique: vi.fn(), // only verifyPayslip uses findUnique
        create: vi.fn(),
        update: vi.fn(),
    },
};

vi.mock("../src/utils/prisma", () => ({
    default: prismaMock,
}));

// ─── PDF + email services — issuePayslip/downloadPayslipPDF call these for
// real; mock them so tests don't launch Puppeteer or hit Resend's API. ───────
vi.mock("../src/services/pdf.service", () => ({
    generatePayslipPDF: vi.fn().mockResolvedValue(undefined),
    getPayslipPDFPath: vi.fn((id: string) => `/storage/pdfs/payslip_${id}.pdf`),
    payslipPDFExists: vi.fn().mockReturnValue(true),
}));

vi.mock("../src/services/email.service", () => ({
    sendPayslipEmail: vi.fn().mockResolvedValue(true),
}));

// ─── fs — downloadPayslipPDF streams a real file off disk via
// fs.createReadStream(...).pipe(res); give it a fake in-memory stream. ───────
vi.mock("fs", async (importOriginal) => {
    const actual = await importOriginal<typeof import("fs")>();
    return {
        ...actual,
        createReadStream: vi.fn(() =>
            Readable.from([Buffer.from("%PDF-fake-content")]),
        ),
    };
});
