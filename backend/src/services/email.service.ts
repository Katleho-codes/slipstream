import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT ?? 2525),
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const FROM = `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_EMAIL}>`;
const VERIFY_BASE = process.env.VERIFY_BASE_URL;

interface PayslipEmailParams {
    to: string;
    employeeName: string;
    companyName: string;
    periodLabel: string;
    netPay: number;
    verifyToken: string;
    pdfUrl?: string;
}

interface PasswordResetEmailParams {
    to: string;
    name: string;
    resetUrl: string;
}

interface VerificationEmailParams {
    to: string;
    name: string;
    verifyUrl: string;
}

interface InviteEmailParams {
    to: string;
    companyName: string;
    role: string;
    inviteUrl: string;
    expiresAt: Date;
}

const EMAIL_SHELL = (opts: {
    preheader: string;
    heading: string;
    body: string;
    cta?: { url: string; label: string };
    footerNote: string;
}) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5">

        <!-- Header -->
        <tr><td style="background:#0F6E56;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:600;color:#fff">SlipStream</p>
          <p style="margin:4px 0 0;font-size:13px;color:#9FE1CB">${opts.preheader}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px">
          <p style="margin:0 0 16px;font-size:15px;color:#111"><strong>${opts.heading}</strong></p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6">${opts.body}</p>
          ${
              opts.cta
                  ? `<table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            <tr><td style="background:#0F6E56;border-radius:8px">
              <a href="${opts.cta.url}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:500;color:#fff;text-decoration:none">${opts.cta.label} →</a>
            </td></tr>
          </table>`
                  : ""
          }
          <p style="margin:0;font-size:13px;color:#666;line-height:1.6">${opts.footerNote}</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #f0f0f0">
          <p style="margin:0;font-size:12px;color:#999">Issued by SlipStream · If you weren't expecting this email, you can ignore it.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

async function sendEmail(
    to: string,
    subject: string,
    html: string,
): Promise<boolean> {
    try {
        await transporter.sendMail({ from: FROM, to, subject, html });
        return true;
    } catch (err) {
        console.error("[sendEmail] SMTP error:", err);
        return false;
    }
}

// ─── Payslip ─────────────────────────────────────────────────────────────────

export async function sendPayslipEmail(
    params: PayslipEmailParams,
): Promise<boolean> {
    const { employeeName, companyName, periodLabel, netPay, verifyToken } = params;
    const verifyUrl = `${VERIFY_BASE}/${verifyToken}`;
    const netFormatted = `R ${netPay.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5">
        <tr><td style="background:#0F6E56;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:600;color:#fff">SlipStream</p>
          <p style="margin:4px 0 0;font-size:13px;color:#9FE1CB">Your payslip is ready</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:15px;color:#111">Hi ${employeeName},</p>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6">
            Your payslip for <strong>${periodLabel}</strong> from <strong>${companyName}</strong> is ready.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#E1F5EE;border-radius:8px;margin-bottom:24px">
            <tr><td style="padding:20px 24px">
              <p style="margin:0 0 4px;font-size:12px;color:#085041;text-transform:uppercase;letter-spacing:0.05em">Net pay</p>
              <p style="margin:0;font-size:28px;font-weight:600;color:#0F6E56">${netFormatted}</p>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            <tr><td style="background:#0F6E56;border-radius:8px">
              <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:500;color:#fff;text-decoration:none">
                View & verify payslip →
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:13px;color:#555;line-height:1.6">
            You can use this payslip as verified proof of income for loan applications, rental agreements, and government services. The verification link above confirms your payslip is authentic.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f0f0f0">
          <p style="margin:0;font-size:12px;color:#999">
            Issued by ${companyName} via SlipStream · <a href="${verifyUrl}" style="color:#0F6E56">Verify authenticity</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    return sendEmail(params.to, `Your ${periodLabel} payslip from ${companyName}`, html);
}

// ─── Password reset ──────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
    params: PasswordResetEmailParams,
): Promise<boolean> {
    const html = EMAIL_SHELL({
        preheader: "Password reset",
        heading: `Hi ${params.name},`,
        body: "We received a request to reset your SlipStream password. If this wasn't you, you can safely ignore this email.",
        cta: { url: params.resetUrl, label: "Reset your password" },
        footerNote:
            "This link is only valid for 1 hour. If it has expired, request a new reset link from the sign-in page.",
    });

    return sendEmail(params.to, "Reset your SlipStream password", html);
}

// ─── Email verification ──────────────────────────────────────────────────────

export async function sendVerificationEmail(
    params: VerificationEmailParams,
): Promise<boolean> {
    const html = EMAIL_SHELL({
        preheader: "Verify your email",
        heading: `Hi ${params.name},`,
        body: "Confirm this email address to finish setting up your SlipStream account. Verified addresses are required for secure payslip delivery.",
        cta: { url: params.verifyUrl, label: "Verify my email" },
        footerNote:
            "This link is only valid for 24 hours. If it has expired, request a new link from the sign-in page.",
    });

    return sendEmail(params.to, "Verify your SlipStream email", html);
}

// ─── Invite ──────────────────────────────────────────────────────────────────

export async function sendInviteEmail(
    params: InviteEmailParams,
): Promise<boolean> {
    const roleLabel =
        params.role === "ADMIN" ? "Administrator" : "Staff (view only)";
    const expiryStr = params.expiresAt.toLocaleDateString("en-ZA", {
        timeZone: "Africa/Johannesburg",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5">
      <tr><td style="background:#1A3D2B;padding:28px 32px">
        <p style="margin:0;font-size:22px;font-weight:600;color:#fff;font-family:Arial,sans-serif">SlipStream</p>
        <p style="margin:4px 0 0;font-size:13px;color:#9FE1CB">Organisation invitation</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#111">You've been invited to join <strong>${params.companyName}</strong> on SlipStream as <strong>${roleLabel}</strong>.</p>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0">
          <tr><td style="background:#1A3D2B;border-radius:8px">
            <a href="${params.inviteUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none">Accept invitation →</a>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#666">This invite expires on <strong>${expiryStr}</strong>. If you don't have a SlipStream account yet, you'll be able to create one when you click the link.</p>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid #f0f0f0">
        <p style="margin:0;font-size:12px;color:#999">SlipStream by Lsquared Technologies · If you weren't expecting this invite, you can ignore this email.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

    return sendEmail(
        params.to,
        `You've been invited to join ${params.companyName} on SlipStream`,
        html,
    );
}