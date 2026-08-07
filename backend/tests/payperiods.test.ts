import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { buildApp } from "./helpers/app";
import { authState, prismaMock } from "./setup";
import { fixtureAuthEmployer, fixturePayPeriod } from "./helpers/fixtures";

const app = buildApp();

beforeEach(() => {
    authState.employer = fixtureAuthEmployer;
});

describe("GET /api/pay-periods", () => {
    it("returns a list of pay periods", async () => {
        prismaMock.payPeriod.findMany.mockResolvedValue([
            { ...fixturePayPeriod, _count: { payslips: 0 } },
        ]);

        const res = await request(app).get("/api/pay-periods");

        expect(res.status).toBe(200);
    });
});

describe("POST /api/pay-periods", () => {
    it("rejects an empty body with 400", async () => {
        const res = await request(app).post("/api/pay-periods").send({});
        expect(res.status).toBe(400);
    });

    it("creates a pay period with a valid body", async () => {
        prismaMock.payPeriod.create.mockResolvedValue(fixturePayPeriod);

        const res = await request(app).post("/api/pay-periods").send({
            periodStart: fixturePayPeriod.periodStart,
            periodEnd: fixturePayPeriod.periodEnd,
            payDate: fixturePayPeriod.payDate,
            label: fixturePayPeriod.label,
        });

        // ASSUMPTION: sendCreated() -> 201, unverified
        expect(res.status).toBe(201);
    });

    // CreatePayPeriodSchema only checks each field is a non-empty string —
    // there's no periodEnd >= periodStart check in the schema or controller.
    // Worth deciding whether that's intentional.
    it.todo("rejects a periodEnd before periodStart (not currently validated)");
});

describe("DELETE /api/pay-periods/:id", () => {
    it("deletes a pay period", async () => {
        prismaMock.payPeriod.findFirst.mockResolvedValue(fixturePayPeriod);
        prismaMock.payPeriod.delete.mockResolvedValue(fixturePayPeriod);

        const res = await request(app).delete(
            `/api/pay-periods/${fixturePayPeriod.id}`,
        );

        expect(res.status).toBe(200);
    });

    it("returns 404 for a pay period that doesn't exist", async () => {
        prismaMock.payPeriod.findFirst.mockResolvedValue(null);

        const res = await request(app).delete(
            "/api/pay-periods/does-not-exist",
        );

        expect(res.status).toBe(404);
    });

    // deletePayPeriod doesn't currently check for attached payslips before
    // deleting — worth confirming that's intentional given SARS payslip
    // history requirements.
    it.todo(
        "prevents deleting a pay period that already has issued payslips (not currently guarded)",
    );
});
