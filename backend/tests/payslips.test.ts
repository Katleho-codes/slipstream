import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { buildApp } from "./helpers/app";
import { authState, prismaMock } from "./setup";
import {
    fixtureAuthEmployer,
    fixtureEmployeeRecord,
    fixturePayPeriod,
    fixturePayslip,
} from "./helpers/fixtures";

const app = buildApp();

beforeEach(() => {
    authState.employer = fixtureAuthEmployer;
});

describe("GET /api/payslips", () => {
    it("returns a list of payslips", async () => {
        prismaMock.payslip.findMany.mockResolvedValue([fixturePayslip]);

        const res = await request(app).get("/api/payslips");

        expect(res.status).toBe(200);
    });
});

describe("GET /api/payslips/:id", () => {
    it("returns a single payslip", async () => {
        prismaMock.payslip.findFirst.mockResolvedValue(fixturePayslip);

        const res = await request(app).get(
            `/api/payslips/${fixturePayslip.id}`,
        );

        expect(res.status).toBe(200);
    });

    it("returns 404 for a payslip that doesn't exist", async () => {
        prismaMock.payslip.findFirst.mockResolvedValue(null);

        const res = await request(app).get("/api/payslips/does-not-exist");

        expect(res.status).toBe(404);
    });
});

describe("POST /api/payslips", () => {
    it("rejects an empty body with 400", async () => {
        const res = await request(app).post("/api/payslips").send({});
        expect(res.status).toBe(400);
    });

    it("returns 404 when the employee doesn't belong to this employer", async () => {
        prismaMock.employee.findFirst.mockResolvedValue(null);

        const res = await request(app).post("/api/payslips").send({
            employeeId: fixtureEmployeeRecord.id,
            periodId: fixturePayPeriod.id,
            grossSalary: 30000,
        });

        expect(res.status).toBe(404);
    });

    it("returns 404 when the pay period doesn't belong to this employer", async () => {
        prismaMock.employee.findFirst.mockResolvedValue(fixtureEmployeeRecord);
        prismaMock.payPeriod.findFirst.mockResolvedValue(null);

        const res = await request(app).post("/api/payslips").send({
            employeeId: fixtureEmployeeRecord.id,
            periodId: fixturePayPeriod.id,
            grossSalary: 30000,
        });

        expect(res.status).toBe(404);
    });

    it("rejects a duplicate payslip for the same employee + period with 409", async () => {
        prismaMock.employee.findFirst.mockResolvedValue(fixtureEmployeeRecord);
        prismaMock.payPeriod.findFirst.mockResolvedValue(fixturePayPeriod);
        prismaMock.payslip.findFirst.mockResolvedValue(fixturePayslip); // duplicate found

        const res = await request(app).post("/api/payslips").send({
            employeeId: fixtureEmployeeRecord.id,
            periodId: fixturePayPeriod.id,
            grossSalary: 30000,
        });

        expect(res.status).toBe(409);
    });

    it("creates a payslip with a valid minimal body (schema defaults fill the rest)", async () => {
        prismaMock.employee.findFirst.mockResolvedValue(fixtureEmployeeRecord);
        prismaMock.payPeriod.findFirst.mockResolvedValue(fixturePayPeriod);
        prismaMock.payslip.findFirst.mockResolvedValue(null); // no duplicate
        prismaMock.payslip.create.mockResolvedValue(fixturePayslip);

        // CreatePayslipSchema only strictly requires employeeId, periodId,
        // and a positive grossSalary — everything else defaults.
        const res = await request(app).post("/api/payslips").send({
            employeeId: fixtureEmployeeRecord.id,
            periodId: fixturePayPeriod.id,
            grossSalary: 30000,
            paye: 4000, // kept modest relative to gross so netPay stays positive
        });

        // ASSUMPTION: sendCreated() -> 201, unverified
        expect(res.status).toBe(201);
    });

    it("rejects a negative grossSalary with 400", async () => {
        const res = await request(app).post("/api/payslips").send({
            employeeId: fixtureEmployeeRecord.id,
            periodId: fixturePayPeriod.id,
            grossSalary: -100,
        });

        expect(res.status).toBe(400);
    });
});

describe("POST /api/payslips/:id/issue", () => {
    it("issues a payslip: generates a PDF and emails it", async () => {
        prismaMock.payslip.findFirst.mockResolvedValue(fixturePayslip);
        prismaMock.payslip.update.mockResolvedValue(fixturePayslip);

        const res = await request(app).post(
            `/api/payslips/${fixturePayslip.id}/issue`,
        );

        expect(res.status).toBe(200);
        expect(res.body.data?.pdf ?? res.body.pdf).toBe(true);
        expect(res.body.data?.email ?? res.body.email).toBe(true);
    });

    it("returns 404 when issuing a payslip that doesn't exist", async () => {
        prismaMock.payslip.findFirst.mockResolvedValue(null);

        const res = await request(app).post(
            "/api/payslips/does-not-exist/issue",
        );

        expect(res.status).toBe(404);
    });

    // The controller has no field tracking "already issued" and no guard
    // against re-issuing — every call regenerates the PDF and re-sends the
    // email. Worth confirming whether that's intentional (e.g. re-sends on
    // typo'd employee email) or a gap to close.
    it.todo(
        "prevents (or intentionally allows) re-issuing an already-issued payslip",
    );
});
