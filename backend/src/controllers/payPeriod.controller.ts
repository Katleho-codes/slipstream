import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNotFound, sendServerError } from '../utils/response';

export const CreatePayPeriodSchema = z.object({
  periodStart: z.string().min(1, 'Period start required'),
  periodEnd: z.string().min(1, 'Period end required'),
  payDate: z.string().min(1, 'Pay date required'),
  label: z.string().min(1, 'Label required'),
});

export async function getPayPeriods(req: AuthRequest, res: Response): Promise<void> {
  try {
    const periods = await prisma.payPeriod.findMany({
      where: { employerId: req.employer!.id },
      orderBy: { payDate: 'desc' },
      include: { _count: { select: { payslips: true } } },
    });
    sendSuccess(res, periods);
  } catch (err) {
    console.error('[getPayPeriods]', err);
    sendServerError(res);
  }
}

export async function createPayPeriod(req: AuthRequest, res: Response): Promise<void> {
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
    sendCreated(res, period, 'Pay period created');
  } catch (err) {
    console.error('[createPayPeriod]', err);
    sendServerError(res);
  }
}

export async function deletePayPeriod(req: AuthRequest, res: Response): Promise<void> {
  try {
    const existing = await prisma.payPeriod.findFirst({
      where: { id: req.params.id, employerId: req.employer!.id },
    });
    if (!existing) { sendNotFound(res, 'Pay period'); return; }
    await prisma.payPeriod.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Pay period deleted');
  } catch (err) {
    console.error('[deletePayPeriod]', err);
    sendServerError(res);
  }
}
