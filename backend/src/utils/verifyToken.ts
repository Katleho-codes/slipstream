import crypto from "crypto";
import "dotenv/config";
const HMAC_SECRET = process.env.VERIFY_HMAC_SECRET!;

/**
 * Generate a tamper-proof verify token for a payslip.
 * Token = HMAC-SHA256(payslipId + employeeId + issuedAt) encoded as hex.
 * Any change to the payslip data invalidates the token.
 */
export function generateVerifyToken(params: {
    payslipId: string;
    employeeId: string;
    issuedAt: Date;
}): string {
    const payload = `${params.payslipId}:${params.employeeId}:${new Date(
        params.issuedAt,
    ).toISOString()}`;
    return crypto
        .createHmac("sha256", HMAC_SECRET)
        .update(payload)
        .digest("hex");
}

/**
 * Verify that a token matches the expected HMAC for the given params.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export function verifyPayslipToken(
    token: string,
    params: { payslipId: string; employeeId: string; issuedAt: Date },
): boolean {
    const expected = generateVerifyToken(params);
    try {
        return crypto.timingSafeEqual(
            Buffer.from(token, "hex"),
            Buffer.from(expected, "hex"),
        );
    } catch {
        return false;
    }
}
