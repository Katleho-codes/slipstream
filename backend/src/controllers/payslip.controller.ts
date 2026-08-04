import { Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { PayslipWithRelations } from '../types';
import { generateVerifyToken } from '../utils/verifyToken';
import { calculateNetPay, calculateUIF } from '../utils/payCalculator';
import { sendPayslipEmail } from '../services/email.service';
import { generatePayslipPDF, getPayslipPDFPath, payslipPDFExists } from '../services/pdf.service';
import { sendSuccess, sendCreated, sendError, sendNotFound, sendServerError } from '../utils/response';

export const CreatePayslipSchema = z.object({
  employeeId: z.string().min(1),
  periodId: z.string().min(1),
  grossSalary: z.number().positive(),
  overtimePay: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
  allowances: z.number().min(0).default(0),
  paye: z.number().min(0).default(0),
  uif: z.number().min(0).optional(),
  sdl: z.number().min(0).default(0),
  deductions: z.array(z.object({
    label: z.string().min(1),
    amount: z.number().positive(),
    type: z.enum(['FIXED', 'PERCENTAGE']).default('FIXED'),
  })).default([]),
});

export async function getPayslips(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { periodId, employeeId } = req.query;
    const payslips = await prisma.payslip.findMany({
      where: {
        employee: { employerId: req.employer!.id },
        ...(periodId ? { periodId: String(periodId) } : {}),
        ...(employeeId ? { employeeId: String(employeeId) } : {}),
      },
      include: {
        employee: { select: { firstName: true, lastName: true, role: true, department: true } },
        period: { select: { label: true, payDate: true } },
        deductions: true,
      },
      orderBy: { issuedAt: 'desc' },
    });
    sendSuccess(res, payslips);
  } catch (err) {
    console.error('[getPayslips]', err);
    sendServerError(res);
  }
}

export async function getPayslip(req: AuthRequest, res: Response): Promise<void> {
  try {
    const payslip = await prisma.payslip.findFirst({
      where: { id: req.params.id, employee: { employerId: req.employer!.id } },
      include: {
        employee: true,
        period: { include: { employer: true } },
        deductions: true,
      },
    });
    if (!payslip) { sendNotFound(res, 'Payslip'); return; }
    sendSuccess(res, payslip);
  } catch (err) {
    console.error('[getPayslip]', err);
    sendServerError(res);
  }
}

export async function createPayslip(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { employeeId, periodId, grossSalary, overtimePay, bonus, allowances, paye, uif: uifInput, sdl, deductions } = req.body;

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, employerId: req.employer!.id },
    });
    if (!employee) { sendNotFound(res, 'Employee'); return; }

    const period = await prisma.payPeriod.findFirst({
      where: { id: periodId, employerId: req.employer!.id },
    });
    if (!period) { sendNotFound(res, 'Pay period'); return; }

    const duplicate = await prisma.payslip.findFirst({ where: { employeeId, periodId } });
    if (duplicate) {
      sendError(res, 'A payslip already exists for this employee and pay period', 409);
      return;
    }

    const uif = uifInput ?? calculateUIF(grossSalary);
    const customDeductionsTotal = deductions.reduce((sum: number, d: { amount: number }) => sum + d.amount, 0);
    const netPay = calculateNetPay({ grossSalary, overtimePay, bonus, allowances, paye, uif, sdl, customDeductions: customDeductionsTotal });

    if (netPay < 0) {
      sendError(res, 'Net pay cannot be negative. Check your deductions.', 422);
      return;
    }

    const now = new Date();
    const verifyToken = generateVerifyToken({ payslipId: 'pending', employeeId, issuedAt: now });

    const payslip = await prisma.payslip.create({
      data: {
        employeeId, periodId,
        grossSalary, overtimePay, bonus, allowances,
        paye, uif, sdl, netPay,
        verifyToken, issuedAt: now,
        deductions: { create: deductions },
      },
      include: {
        employee: true,
        period: { include: { employer: true } },
        deductions: true,
      },
    });

    sendCreated(res, payslip, 'Payslip created');
  } catch (err) {
    console.error('[createPayslip]', err);
    sendServerError(res);
  }
}

export async function issuePayslip(req: AuthRequest, res: Response): Promise<void> {
  try {
    const payslip = await prisma.payslip.findFirst({
      where: { id: req.params.id, employee: { employerId: req.employer!.id } },
      include: {
        employee: true,
        period: { include: { employer: true } },
        deductions: true,
      },
    });
    if (!payslip) { sendNotFound(res, 'Payslip'); return; }

    const results = { pdf: false, email: false };

    try {
      await generatePayslipPDF(payslip as unknown as PayslipWithRelations);
      await prisma.payslip.update({ where: { id: payslip.id }, data: { pdfUrl: getPayslipPDFPath(payslip.id) } });
      results.pdf = true;
    } catch (pdfErr) {
      console.error('[issuePayslip] PDF failed:', pdfErr);
    }

    if (payslip.employee.email) {
      const sent = await sendPayslipEmail({
        to: payslip.employee.email,
        employeeName: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
        companyName: payslip.period.employer.companyName,
        periodLabel: payslip.period.label,
        netPay: payslip.netPay,
        verifyToken: payslip.verifyToken,
      });
      await prisma.payslip.update({
        where: { id: payslip.id },
        data: { emailStatus: sent ? 'SENT' : 'FAILED', emailSentAt: sent ? new Date() : undefined },
      });
      results.email = sent;
    }

    sendSuccess(res, { payslipId: payslip.id, ...results }, 'Payslip issued');
  } catch (err) {
    console.error('[issuePayslip]', err);
    sendServerError(res);
  }
}

export async function downloadPayslipPDF(req: AuthRequest, res: Response): Promise<void> {
  try {
    const payslip = await prisma.payslip.findFirst({
      where: { id: req.params.id, employee: { employerId: req.employer!.id } },
      include: { employee: true, period: { include: { employer: true } }, deductions: true },
    });
    if (!payslip) { sendNotFound(res, 'Payslip'); return; }

    if (!payslipPDFExists(payslip.id)) {
      await generatePayslipPDF(payslip as unknown as PayslipWithRelations);
    }

    const pdfPath = getPayslipPDFPath(payslip.id);
    const name = `${payslip.employee.firstName}_${payslip.employee.lastName}`;
    const filename = `payslip_${name}_${payslip.period.label.replace(/\s/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(pdfPath).pipe(res);
  } catch (err) {
    console.error('[downloadPayslipPDF]', err);
    sendServerError(res);
  }
}

// Public — no auth
export async function verifyPayslip(req: Request, res: Response): Promise<void> {
  try {
    const payslip = await prisma.payslip.findUnique({
      where: { verifyToken: req.params.token },
      include: {
        employee: { select: { firstName: true, lastName: true, role: true, department: true, idNumber: true } },
        period: { include: { employer: { select: { companyName: true, regNumber: true, address: true } } } },
        deductions: true,
      },
    });

    if (!payslip) {
      res.status(404).json({ valid: false, message: 'Payslip not found or token is invalid' });
      return;
    }

    res.json({
      valid: true,
      payslip: {
        employeeName: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
        role: payslip.employee.role,
        companyName: payslip.period.employer.companyName,
        period: payslip.period.label,
        payDate: payslip.period.payDate,
        grossSalary: payslip.grossSalary,
        netPay: payslip.netPay,
        issuedAt: payslip.issuedAt,
      },
    });
  } catch (err) {
    console.error('[verifyPayslip]', err);
    res.status(500).json({ valid: false, message: 'Verification service error' });
  }
}
