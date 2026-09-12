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

    it("rejects a periodEnd before periodStart with 400", async () => {
        const res = await request(app).post("/api/pay-periods").send({
            periodStart: "2026-07-31",
            periodEnd: "2026-07-01",
            payDate: "2026-07-25",
            label: "Broken July 2026",
        });

        expect(res.status).toBe(400);
    });
});

describe("DELETE /api/pay-periods/:id", () => {
    it("deletes a pay period", async () => {
        prismaMock.payPeriod.findFirst.mockResolvedValue({
            ...fixturePayPeriod,
            _count: { payslips: 0 },
        });
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

    it("returns 409 when the pay period already has issued payslips", async () => {
        prismaMock.payPeriod.findFirst.mockResolvedValue({
            ...fixturePayPeriod,
            _count: { payslips: 3 },
        });

        const res = await request(app).delete(
            `/api/pay-periods/${fixturePayPeriod.id}`,
        );

        expect(res.status).toBe(409);
    });
});
