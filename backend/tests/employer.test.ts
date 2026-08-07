import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { buildApp } from "./helpers/app";
import { authState, prismaMock } from "./setup";
import { fixtureAuthEmployer, fixtureEmployerRecord } from "./helpers/fixtures";

const app = buildApp();

beforeEach(() => {
    authState.employer = fixtureAuthEmployer;
});

describe("POST /api/employer", () => {
    it("rejects an empty body with 400", async () => {
        const res = await request(app).post("/api/employer").send({});
        expect(res.status).toBe(400);
    });

    it("creates an employer with a valid body", async () => {
        prismaMock.employer.findFirst.mockResolvedValue(null); // no duplicate
        prismaMock.employer.create.mockResolvedValue(fixtureEmployerRecord);

        // Matches CreateEmployerSchema exactly: regNumber/vatNumber need 10+ chars.
        const res = await request(app).post("/api/employer").send({
            companyName: fixtureEmployerRecord.companyName,
            regNumber: fixtureEmployerRecord.regNumber,
            vatNumber: fixtureEmployerRecord.vatNumber,
            phone: fixtureEmployerRecord.phone,
            address: fixtureEmployerRecord.address,
            plan: fixtureEmployerRecord.plan,
            userId: fixtureEmployerRecord.userId,
        });

        // ASSUMPTION: sendCreated() -> 201. Not verified — utils/response.ts
        // wasn't shared. Adjust if it actually sends 200.
        expect(res.status).toBe(201);
    });

    it("rejects a duplicate company name with 409", async () => {
        prismaMock.employer.findFirst.mockResolvedValue(fixtureEmployerRecord);

        const res = await request(app).post("/api/employer").send({
            companyName: fixtureEmployerRecord.companyName,
            regNumber: fixtureEmployerRecord.regNumber,
            vatNumber: fixtureEmployerRecord.vatNumber,
            phone: fixtureEmployerRecord.phone,
            address: fixtureEmployerRecord.address,
            plan: fixtureEmployerRecord.plan,
            userId: fixtureEmployerRecord.userId,
        });

        expect(res.status).toBe(409);
    });

    it("rejects an invalid SA phone number with 400", async () => {
        const res = await request(app).post("/api/employer").send({
            companyName: fixtureEmployerRecord.companyName,
            regNumber: fixtureEmployerRecord.regNumber,
            vatNumber: fixtureEmployerRecord.vatNumber,
            phone: "0123456789", // starts with 1 — regex requires 6/7/8 after prefix
            address: fixtureEmployerRecord.address,
            plan: fixtureEmployerRecord.plan,
            userId: fixtureEmployerRecord.userId,
        });

        expect(res.status).toBe(400);
    });
});

// `me` and `updateProfile` live in src/controllers/auth.controller.ts, which
// wasn't shared — can't write real assertions without seeing what it reads
// off `req.employer` / returns. Un-skip once that file's available.
describe.todo("GET /api/employer/me — pending auth.controller.ts source");
describe.todo(
    "PATCH /api/employer/profile — pending auth.controller.ts source",
);
