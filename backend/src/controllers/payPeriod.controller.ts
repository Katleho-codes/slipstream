import { Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import {
    sendSuccess,
    sendCreated,
    sendNotFound,
    sendError,
    sendServerError,
} from "../utils/response";
import { auditFromRequest } from "../utils/auditRequest";

export const CreatePayPeriodSchema = z
    .object({
        periodStart: z.string().min(1, "Period start required"),
        periodEnd: z.string().min(1, "Period end required"),
        payDate: z.string().min(1, "Pay date required"),
        label: z.string().min(1, "Label required"),
    })
    .superRefine((val, ctx) => {
        const start = new Date(val.periodStart);
        const end = new Date(val.periodEnd);
        const pay = new Date(val.payDate);

        if (
            isNaN(start.getTime()) ||
            isNaN(end.getTime()) ||
            isNaN(pay.getTime())
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["periodStart"],
                message: "Dates must be valid ISO dates (YYYY-MM-DD)",
            });
            return;
        }

        if (start > end) {
            ctx.addIssue({
                code: "custom",
                path: ["periodEnd"],
                message: "Period end must be on or after period start",
            });
        }
    });

export async function getPayPeriods(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const periods = await prisma.payPeriod.findMany({
            where: { employerId: req.employer!.id },
            orderBy: { payDate: "desc" },
            include: { _count: { select: { payslips: true } } },
        });
        sendSuccess(res, periods);
    } catch (err) {
        console.error("[getPayPeriods]", err);
        sendServerError(res);
    }
}

export async function createPayPeriod(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    let createdPeriodId: string | undefined;

    try {
        const period = await prisma.payPeriod.create({
            data: {
                employerId: req.employer!.id,
                periodStart: new Date(req.body.periodStart),
                periodEnd: new Date(req.body.periodEnd),
                payDate: new Date(req.body.payDate),
                label: req.body.label,
            },
        });

        createdPeriodId = period.id;

        await auditFromRequest(req, {
            action: "PAYPERIOD_CREATED",
            resourceType: "PAY_PERIOD",
            resourceId: period.id,
            status: "SUCCESS",
            details: {
                label: period.label,
                periodStart: period.periodStart,
                periodEnd: period.periodEnd,
                payDate: period.payDate,
            },
        });

        sendCreated(res, period, "Pay period created");
    } catch (err) {
        console.error("[createPayPeriod]", err);

        await auditFromRequest(req, {
            action: "PAYPERIOD_CREATED",
            resourceType: "PAY_PERIOD",
            resourceId: createdPeriodId,
            status: "FAILED",
            details: { body: req.body, error: (err as Error).message },
        });

        sendServerError(res);
    }
}

export async function deletePayPeriod(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const existing = await prisma.payPeriod.findFirst({
            where: { id: req.params.id, employerId: req.employer!.id },
            include: { _count: { select: { payslips: true } } },
        });
        if (!existing) {
            sendNotFound(res, "Pay period");
            return;
        }

        if (existing._count.payslips > 0) {
            sendError(
                res,
                "Cannot delete a pay period that has issued payslips",
                409,
            );
            return;
        }

        await prisma.payPeriod.delete({ where: { id: req.params.id } });

        await auditFromRequest(req, {
            action: "PAYPERIOD_DELETED",
            resourceType: "PAY_PERIOD",
            resourceId: req.params.id,
            status: "SUCCESS",
            details: {
                label: existing.label,
                periodStart: existing.periodStart,
                periodEnd: existing.periodEnd,
                payDate: existing.payDate,
            },
        });

        sendSuccess(res, null, "Pay period deleted");
    } catch (err) {
        console.error("[deletePayPeriod]", err);

        await auditFromRequest(req, {
            action: "PAYPERIOD_DELETED",
            resourceType: "PAY_PERIOD",
            resourceId: req.params.id,
            status: "FAILED",
            details: { error: (err as Error).message },
        });

        sendServerError(res);
    }
}