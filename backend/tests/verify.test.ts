import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { buildApp } from "./helpers/app";
import { authState, prismaMock } from "./setup";
import { fixturePayslip } from "./helpers/fixtures";

const app = buildApp();

describe("GET /api/verify/:token", () => {
    beforeEach(() => {
        authState.employer = null; // this route must work without a session
    });

    it("verifies a valid token without requiring auth", async () => {
        prismaMock.payslip.findUnique.mockResolvedValue(fixturePayslip);

        const res = await request(app).get(
            `/api/verify/${fixturePayslip.verifyToken}`,
        );

        expect(res.status).toBe(200);
        expect(res.body.data.valid).toBe(true);
        expect(res.body.data.payslip.employeeName).toBe(
            `${fixturePayslip.employee.firstName} ${fixturePayslip.employee.lastName}`,
        );
        expect(res.body.data.payslip.companyName).toBe(
            fixturePayslip.period.employer.companyName,
        );
    });

    it("returns 404 for an unknown or tampered token", async () => {
        prismaMock.payslip.findUnique.mockResolvedValue(null);

        const res = await request(app).get("/api/verify/tampered-token");

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    it("does not expose the employee's ID number to an anonymous verifier", async () => {
        // The controller's response object is built by hand from a fixed
        // field list — idNumber is fetched (it's in the `select`) but never
        // placed on the response. grossSalary/netPay, by contrast, ARE
        // included by design — this checks the actual documented contract,
        // not a guess about what "should" be hidden.
        prismaMock.payslip.findUnique.mockResolvedValue(fixturePayslip);

        const res = await request(app).get(
            `/api/verify/${fixturePayslip.verifyToken}`,
        );

        expect(res.status).toBe(200);
        expect(res.body.data.payslip).not.toHaveProperty("idNumber");
        expect(res.body.data.payslip.grossSalary).toBe(fixturePayslip.grossSalary);
        expect(res.body.data.payslip.netPay).toBe(fixturePayslip.netPay);
    });
});
