import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { buildApp } from "./helpers/app";
import { authState, prismaMock } from "./setup";
import { fixtureAuthEmployer, fixtureEmployeeRecord } from "./helpers/fixtures";

const app = buildApp();

beforeEach(() => {
    authState.employer = fixtureAuthEmployer;
});

describe("GET /api/employees", () => {
    it("returns a list of employees", async () => {
        prismaMock.employee.findMany.mockResolvedValue([fixtureEmployeeRecord]);

        const res = await request(app).get("/api/employees");

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data ?? res.body)).toBe(true);
        // NOTE: sendSuccess()'s exact envelope (res.body vs res.body.data)
        // is unverified since utils/response.ts wasn't shared — this
        // assertion accepts either shape. Tighten once confirmed.
    });
});

describe("GET /api/employees/:id", () => {
    it("returns a single employee with nested payslip history", async () => {
        prismaMock.employee.findFirst.mockResolvedValue({
            ...fixtureEmployeeRecord,
            payslips: [],
        });

        const res = await request(app).get(
            `/api/employees/${fixtureEmployeeRecord.id}`,
        );

        expect(res.status).toBe(200);
    });

    it("returns 404 for an employee that doesn't exist", async () => {
        prismaMock.employee.findFirst.mockResolvedValue(null);

        const res = await request(app).get("/api/employees/does-not-exist");

        expect(res.status).toBe(404);
    });
});

describe("POST /api/employees", () => {
    it("rejects an empty body with 400 (missing firstName/lastName/phone/employeeCode)", async () => {
        const res = await request(app).post("/api/employees").send({});
        expect(res.status).toBe(400);
    });

    it("rejects an invalid SA phone number with 400", async () => {
        const res = await request(app).post("/api/employees").send({
            firstName: "Thabo",
            lastName: "Nkosi",
            phone: "0123456789", // invalid: must start 6/7/8 after 0 or +27
            employeeCode: "EMP002",
        });
        expect(res.status).toBe(400);
    });

    it("creates an employee with a valid body", async () => {
        prismaMock.employee.count.mockResolvedValue(0); // under STARTER's limit of 10
        prismaMock.employee.findFirst.mockResolvedValue(null); // no email/code clash
        prismaMock.employee.create.mockResolvedValue(fixtureEmployeeRecord);

        const res = await request(app).post("/api/employees").send({
            firstName: fixtureEmployeeRecord.firstName,
            lastName: fixtureEmployeeRecord.lastName,
            phone: fixtureEmployeeRecord.phone,
            employeeCode: fixtureEmployeeRecord.employeeCode,
            email: fixtureEmployeeRecord.email,
        });

        // ASSUMPTION: sendCreated() -> 201, unverified (see employer.test.ts note)
        expect(res.status).toBe(201);
    });

    it("rejects with 403 once the plan's active employee limit is reached", async () => {
        // fixtureAuthEmployer.plan is STARTER, limit 10
        prismaMock.employee.count.mockResolvedValue(10);

        const res = await request(app).post("/api/employees").send({
            firstName: fixtureEmployeeRecord.firstName,
            lastName: fixtureEmployeeRecord.lastName,
            phone: fixtureEmployeeRecord.phone,
            employeeCode: "EMP099",
        });

        expect(res.status).toBe(403);
    });

    it("rejects a duplicate employee code with 409", async () => {
        prismaMock.employee.count.mockResolvedValue(0);
        prismaMock.employee.findFirst.mockResolvedValue({
            ...fixtureEmployeeRecord,
            employeeCode: "EMP001",
        });

        const res = await request(app).post("/api/employees").send({
            firstName: "Another",
            lastName: "Person",
            phone: "0821234568",
            employeeCode: "EMP001", // clashes with the existing record above
        });

        expect(res.status).toBe(409);
    });
});

describe("PATCH /api/employees/:id", () => {
    it("rejects an invalid email with 400", async () => {
        const res = await request(app)
            .patch(`/api/employees/${fixtureEmployeeRecord.id}`)
            .send({ email: "not-an-email" });

        expect(res.status).toBe(400);
    });

    it("updates an employee with a valid body", async () => {
        prismaMock.employee.findFirst.mockResolvedValue(fixtureEmployeeRecord);
        prismaMock.employee.update.mockResolvedValue({
            ...fixtureEmployeeRecord,
            role: "Senior Developer",
        });

        const res = await request(app)
            .patch(`/api/employees/${fixtureEmployeeRecord.id}`)
            .send({ role: "Senior Developer" });

        expect(res.status).toBe(200);
    });

    it("returns 404 when the employee doesn't exist (existence check runs first)", async () => {
        prismaMock.employee.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .patch("/api/employees/does-not-exist")
            .send({ role: "Senior Developer" });

        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/employees/:id", () => {
    // NOTE: this is a soft delete — the controller calls
    // prisma.employee.update({ data: { isActive: false } }), never .delete().
    it("deactivates an employee", async () => {
        prismaMock.employee.findFirst.mockResolvedValue(fixtureEmployeeRecord);
        prismaMock.employee.update.mockResolvedValue({
            ...fixtureEmployeeRecord,
            isActive: false,
        });

        const res = await request(app).delete(
            `/api/employees/${fixtureEmployeeRecord.id}`,
        );

        expect(res.status).toBe(200);
    });

    it("returns 404 when deactivating an employee that doesn't exist", async () => {
        prismaMock.employee.findFirst.mockResolvedValue(null);

        const res = await request(app).delete("/api/employees/does-not-exist");

        expect(res.status).toBe(404);
    });
});
