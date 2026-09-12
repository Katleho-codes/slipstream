import prisma from "./prisma";

interface AuditParams {
    performedByUserId?: string;
    employerId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    status?: "SUCCESS" | "FAILED";
    details?: unknown;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Fire-and-forget audit log write.
 * Never throws — a logging failure must never affect the response.
 */
export async function audit(params: AuditParams): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                performedByUserId: params.performedByUserId,
                employerId: params.employerId,
                action: params.action,
                resourceType: params.resourceType,
                resourceId: params.resourceId,
                status: params.status ?? "SUCCESS",
                details: (params.details as object) ?? undefined,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });
    } catch (logErr) {
        console.error("[audit] Failed to write audit log:", logErr);
    }
}
