import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { buildApp } from "./helpers/app";
import { authState, prismaMock } from "./setup";
import { fixtureAuthEmployer } from "./helpers/fixtures";

const app = buildApp();

const fixtureEmployerRecord = {
    ...fixtureAuthEmployer,
    regNumber: "2020123456",
    vatNumber: "4123456789",
    phone: "0821234567",
    address: "1 Main Road, Johannesburg",
    isActive: true,
    onboardingComplete: false,
    user: { email: "admin@slipstream.com", name: "Admin" },
};

describe("onboarding status", () => {
    beforeEach(() => {
        authState.employer = fixtureAuthEmployer;
    });

    it("returns organisations step when no employer exists", async () => {
        prismaMock.employer.findUnique.mockResolvedValue(null);

        const res = await request(app).get("/api/onboarding/status");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.step).toBe("organisations");
        expect(res.body.data.resuming).toBe(false);
    });

    it("returns plan step when the employer has not completed onboarding", async () => {
        prismaMock.employer.findUnique.mockResolvedValue(
            fixtureEmployerRecord,
        );

        const res = await request(app).get("/api/onboarding/status");

        expect(res.status).toBe(200);
        expect(res.body.data.step).toBe("plan");
        expect(res.body.data.resuming).toBe(true);
    });

    it("returns complete step once onboarding is done", async () => {
        prismaMock.employer.findUnique.mockResolvedValue({
            ...fixtureEmployerRecord,
            onboardingComplete: true,
        });

        const res = await request(app).get("/api/onboarding/status");

        expect(res.status).toBe(200);
        expect(res.body.data.step).toBe("complete");
        expect(res.body.data.resuming).toBe(false);
    });
});

describe("POST /api/onboarding/organisation", () => {
    beforeEach(() => {
        authState.employer = fixtureAuthEmployer;
    });

    it("rejects an empty body with 400", async () => {
        const res = await request(app)
            .post("/api/onboarding/organisation")
            .send({});
        expect(res.status).toBe(400);
    });

    it("creates an employer and OWNER membership for a new user", async () => {
        prismaMock.employer.findUnique.mockResolvedValue(null);
        prismaMock.employer.create.mockResolvedValue(fixtureEmployerRecord);
        prismaMock.orgMember.create.mockResolvedValue({});

        const res = await request(app)
            .post("/api/onboarding/organisation")
            .send({
                companyName: "Acme Payroll (Pty) Ltd",
                regNumber: "2020123456",
                phone: "0821234567",
                address: "1 Main Road, Johannesburg",
            });

        expect(res.status).toBe(201);
        expect(prismaMock.orgMember.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ role: "OWNER" }),
            }),
        );
    });

    it("updates the employer when they resumed a partial flow", async () => {
        prismaMock.employer.findUnique.mockResolvedValue(
            fixtureEmployerRecord,
        );
        prismaMock.employer.update.mockResolvedValue(fixtureEmployerRecord);

        const res = await request(app)
            .post("/api/onboarding/organisation")
            .send({ companyName: "Acme Payroll (Pty) Ltd" });

        expect(res.status).toBe(201);
    });
});

describe("POST /api/onboarding/plan", () => {
    beforeEach(() => {
        authState.employer = fixtureAuthEmployer;
    });

    it("rejects an invalid plan with 400", async () => {
        const res = await request(app)
            .post("/api/onboarding/plan")
            .send({ plan: "FREEMIUM" });
        expect(res.status).toBe(400);
    });

    it("400 when no organisation has been created yet", async () => {
        prismaMock.employer.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .post("/api/onboarding/plan")
            .send({ plan: "GROWTH" });

        expect(res.status).toBe(400);
    });

    it("selects the plan and marks onboarding complete", async () => {
        prismaMock.employer.findUnique.mockResolvedValue(
            fixtureEmployerRecord,
        );
        prismaMock.employer.update.mockResolvedValue({
            ...fixtureEmployerRecord,
            plan: "GROWTH",
            onboardingComplete: true,
        });

        const res = await request(app)
            .post("/api/onboarding/plan")
            .send({ plan: "GROWTH" });

        expect(res.status).toBe(200);
        expect(prismaMock.employer.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ onboardingComplete: true }),
            }),
        );
    });
});