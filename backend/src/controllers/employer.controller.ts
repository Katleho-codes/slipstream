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

export const CreateEmployerSchema = z.object({
    companyName: z.string().min(3, "Company name required"),
    regNumber: z.string().min(10, "Last name required"),
    vatNumber: z.string().min(10, "VAT number required"),
    phone: z
        .string()
        .regex(
            /^(?:\+27|0)[6-8][0-9]{8}$/,
            "Please enter a valid South African cellphone number",
        ),
    address: z.string().min(3, "Address is required"),
    plan: z.string(),
    userId: z.string(),
});

export const UpdateEmployerSchema = CreateEmployerSchema.partial().extend({
    isActive: z.boolean().optional(),
});

const PLAN_LIMITS: Record<string, number> = {
    STARTER: 10,
    GROWTH: 50,
    BUSINESS: 150,
    ENTERPRISE: Infinity,
};

export async function createEmployer(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        if (req.body.companyName) {
            const existing = await prisma.employer.findFirst({
                where: {
                    companyName: req.body.companyName,
                },
            });
            if (existing) {
                console.log("Employer already exists");
                sendError(res, "Employer already exists", 409);
                return;
            }
        }

        const employer = await prisma.employer.create({
            data: {
                ...req.body,
            },
        });
        sendCreated(res, employer, "Employer created");
    } catch (err) {
        console.error("[createEmployer]", err);
        sendServerError(res);
    }
}
