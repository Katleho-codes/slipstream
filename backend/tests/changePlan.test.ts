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

describe("PATCH /api/employer/plan", () => {
    beforeEach(() => {
        authState.employer = fixtureAuthEmployer;
    });

    it("rejects an invalid plan with 400", async () => {
        const res = await request(app)
            .patch("/api/employer/plan")
            .send({ plan: "FREEMIUM" });

        expect(res.status).toBe(400);
    });

    it("404 when no employer exists", async () => {
        prismaMock.employer.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .patch("/api/employer/plan")
            .send({ plan: "GROWTH" });

        expect(res.status).toBe(404);
    });

    it("returns success when plan is already active", async () => {
        prismaMock.employer.findUnique.mockResolvedValue({
            ...fixtureEmployerRecord,
            plan: "STARTER",
        });

        const res = await request(app)
            .patch("/api/employer/plan")
            .send({ plan: "STARTER" });

        expect(res.status).toBe(200);
        expect(res.body.data.plan).toBe("STARTER");
    });

    it("updates the plan when changing to a new one", async () => {
        prismaMock.employer.findUnique.mockResolvedValue({
            ...fixtureEmployerRecord,
            plan: "STARTER",
        });
        prismaMock.employer.update.mockResolvedValue({
            ...fixtureEmployerRecord,
            plan: "GROWTH",
        });

        const res = await request(app)
            .patch("/api/employer/plan")
            .send({ plan: "GROWTH" });

        expect(res.status).toBe(200);
        expect(res.body.data.plan).toBe("GROWTH");
        expect(prismaMock.employer.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ plan: "GROWTH" }),
            }),
        );
    });

    it("403 when non-owner attempts to change plan", async () => {
        authState.employer = { ...fixtureAuthEmployer, role: "ADMIN" };

        const res = await request(app)
            .patch("/api/employer/plan")
            .send({ plan: "GROWTH" });

        expect(res.status).toBe(403);
    });

    it("401 when not authenticated", async () => {
        authState.employer = null;

        const res = await request(app)
            .patch("/api/employer/plan")
            .send({ plan: "GROWTH" });

        expect(res.status).toBe(401);
    });
});
