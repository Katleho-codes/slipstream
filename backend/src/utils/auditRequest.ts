import { AuthRequest } from "../middleware/auth";
import { audit } from "./audit";

interface AuditRequestParams {
    action: string;
    resourceType: string;
    resourceId?: string;
    status?: "SUCCESS" | "FAILED";
    details?: unknown;
}

/**
 * Fire-and-forget audit log write using the request's actor, employer,
 * IP address, and user agent — eliminates the repetitive audit boilerplate
 * that every controller previously copy-pasted.
 */
export function auditFromRequest(
    req: AuthRequest,
    params: AuditRequestParams,
): Promise<void> {
    return audit({
        performedByUserId: req.employer?.userId,
        employerId: req.employer?.id,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        status: params.status,
        details: params.details,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] as string,
    });
}