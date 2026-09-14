import { Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import {
    sendSuccess,
    sendCreated,
    sendError,
    sendNotFound,
    sendServerError,
} from "../utils/response";
import { auditFromRequest } from "../utils/auditRequest";
import { PLAN_LIMITS } from "../lib/plans";

export const CreateEmployeeSchema = z.object({
    firstName: z.string().min(3, "First name required"),
    lastName: z.string().min(3, "Last name required"),
    idNumber: z.string().optional(),
    email: z.string().email("Valid email required").optional(),
    phone: z
        .string()
        .regex(
            /^(?:\+27|0)[6-8][0-9]{8}$/,
            "Please enter a valid South African cellphone number",
        ),
    role: z.string().optional(),
    department: z.string().optional(),
    employeeCode: z.string().min(3, "Employee code is required"),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
    bankBranch: z.string().optional(),
    startDate: z.string().optional(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial().extend({
    isActive: z.boolean().optional(),
});

export async function getEmployees(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { active } = req.query;
        const employees = await prisma.employee.findMany({
            where: {
                employerId: req.employer!.id,
                ...(active !== undefined
                    ? { isActive: active === "true" }
                    : {}),
            },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                department: true,
                employeeCode: true,
                isActive: true,
                startDate: true,
                _count: { select: { payslips: true } },
            },
        });
        sendSuccess(res, employees);
    } catch (err) {
        console.error("[getEmployees]", err);
        sendServerError(res);
    }
}

export async function getEmployee(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const employee = await prisma.employee.findFirst({
            where: { id: req.params.id, employerId: req.employer!.id },
            include: {
                payslips: {
                    include: { period: true, deductions: true },
                    orderBy: { issuedAt: "desc" },
                    take: 12,
                },
            },
        });
        if (!employee) {
            sendNotFound(res, "Employee");
            return;
        }
        sendSuccess(res, employee);
    } catch (err) {
        console.error("[getEmployee]", err);
        sendServerError(res);
    }
}

export async function createEmployee(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    let createdEmployeeId: string | undefined;

    try {
        const employerId = req.employer!.id;
        const plan = req.employer!.plan;
        const count = await prisma.employee.count({
            where: { employerId, isActive: true },
        });
        const limit = PLAN_LIMITS[plan] ?? 10;

        if (count >= limit) {
            sendError(
                res,
                `Your ${plan} plan supports up to ${limit} active employees. Please upgrade.`,
                403,
            );
            return;
        }

        if (req.body.email || req.body.employeeCode) {
            const existing = await prisma.employee.findFirst({
                where: {
                    employerId,
                    OR: [
                        ...(req.body.email ? [{ email: req.body.email }] : []),
                        ...(req.body.employeeCode
                            ? [{ employeeCode: req.body.employeeCode }]
                            : []),
                    ],
                },
            });

            if (existing) {
                if (req.body.email && existing.email === req.body.email) {
                    sendError(
                        res,
                        "An employee with this email already exists",
                        409,
                    );
                    return;
                }
                if (
                    req.body.employeeCode &&
                    existing.employeeCode === req.body.employeeCode
                ) {
                    sendError(
                        res,
                        "An employee with this employee code already exists",
                        409,
                    );
                    return;
                }
            }
        }

        const employee = await prisma.employee.create({
            data: {
                ...req.body,
                employerId,
                startDate: req.body.startDate
                    ? new Date(req.body.startDate)
                    : undefined,
            },
            select: { id: true, firstName: true, lastName: true },
        });

        createdEmployeeId = employee.id;

        await auditFromRequest(req, {
            action: "EMPLOYEE_CREATED",
            resourceType: "Employee",
            resourceId: employee.id,
            status: "SUCCESS",
            details: req.body,
        });

        sendCreated(res, employee, "Employee created");
    } catch (err) {
        console.error("[createEmployee]", err);

        await auditFromRequest(req, {
            action: "EMPLOYEE_CREATED",
            resourceType: "Employee",
            resourceId: createdEmployeeId,
            status: "FAILED",
            details: { body: req.body, error: (err as Error).message },
        });

        sendServerError(res);
    }
}

export async function updateEmployee(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const existing = await prisma.employee.findFirst({
            where: { id: req.params.id, employerId: req.employer!.id },
        });
        if (!existing) {
            sendNotFound(res, "Employee");
            return;
        }

        const employee = await prisma.employee.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                startDate: req.body.startDate
                    ? new Date(req.body.startDate)
                    : undefined,
            },
        });

        await auditFromRequest(req, {
            action: "EMPLOYEE_UPDATED",
            resourceType: "Employee",
            resourceId: req.params.id,
            status: "SUCCESS",
            details: req.body,
        });

        sendSuccess(res, employee, "Employee updated");
    } catch (err) {
        console.error("[updateEmployee]", err);

        await auditFromRequest(req, {
            action: "EMPLOYEE_UPDATED",
            resourceType: "Employee",
            resourceId: req.params.id,
            status: "FAILED",
            details: { body: req.body, error: (err as Error).message },
        });

        sendServerError(res);
    }
}

export async function deleteEmployee(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const existing = await prisma.employee.findFirst({
            where: { id: req.params.id, employerId: req.employer!.id },
        });
        if (!existing) {
            sendNotFound(res, "Employee");
            return;
        }

        await prisma.employee.update({
            where: { id: req.params.id },
            data: { isActive: false },
        });
        sendSuccess(res, null, "Employee deactivated");
    } catch (err) {
        console.error("[deleteEmployee]", err);
        sendServerError(res);
    }
}