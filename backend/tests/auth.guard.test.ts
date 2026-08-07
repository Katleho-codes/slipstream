import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { buildApp } from "./helpers/app";
import { authState } from "./setup";

const app = buildApp();

const protectedRoutes: Array<{
    method: "get" | "post" | "patch" | "delete";
    path: string;
}> = [
    { method: "get", path: "/api/employer/me" },
    { method: "patch", path: "/api/employer/profile" },
    { method: "post", path: "/api/employer" },
    { method: "get", path: "/api/employees" },
    { method: "get", path: "/api/employees/employee_1" },
    { method: "post", path: "/api/employees" },
    { method: "patch", path: "/api/employees/employee_1" },
    { method: "delete", path: "/api/employees/employee_1" },
    { method: "get", path: "/api/pay-periods" },
    { method: "post", path: "/api/pay-periods" },
    { method: "delete", path: "/api/pay-periods/payperiod_1" },
    { method: "get", path: "/api/payslips" },
    { method: "get", path: "/api/payslips/payslip_1" },
    { method: "post", path: "/api/payslips" },
    { method: "post", path: "/api/payslips/payslip_1/issue" },
    { method: "get", path: "/api/payslips/payslip_1/pdf" },
];

describe("auth guard", () => {
    beforeEach(() => {
        authState.employer = null;
    });

    it.each(protectedRoutes)(
        "rejects unauthenticated $method $path with 401",
        async ({ method, path }) => {
            const res = await request(app)[method](path);
            expect(res.status).toBe(401);
        },
    );

    it("does NOT require auth for /api/verify/:token", async () => {
        const res = await request(app).get("/api/verify/some-token");
        expect(res.status).not.toBe(401);
    });
});
