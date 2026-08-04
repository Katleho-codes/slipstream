import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

import { me, updateProfile, UpdateProfileSchema } from '../controllers/auth.controller';
import { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee,
         CreateEmployeeSchema, UpdateEmployeeSchema } from '../controllers/employee.controller';
import { getPayPeriods, createPayPeriod, deletePayPeriod,
         CreatePayPeriodSchema } from '../controllers/payPeriod.controller';
import { getPayslips, getPayslip, createPayslip, issuePayslip,
         downloadPayslipPDF, verifyPayslip, CreatePayslipSchema } from '../controllers/payslip.controller';
         

const router = Router();

// ─── Employer profile (Better Auth handles /api/auth/* sign-in/sign-up/sign-out) ──
router.get('/employer/me', requireAuth, me);
router.patch('/employer/profile', requireAuth, validate(UpdateProfileSchema), updateProfile);

// ─── Employees ────────────────────────────────────────────────────────────────
router.get('/employees', requireAuth, getEmployees);
router.get('/employees/:id', requireAuth, getEmployee);
router.post('/employees', requireAuth, validate(CreateEmployeeSchema), createEmployee);
router.patch('/employees/:id', requireAuth, validate(UpdateEmployeeSchema), updateEmployee);
router.delete('/employees/:id', requireAuth, deleteEmployee);

// ─── Pay Periods ──────────────────────────────────────────────────────────────
router.get('/pay-periods', requireAuth, getPayPeriods);
router.post('/pay-periods', requireAuth, validate(CreatePayPeriodSchema), createPayPeriod);
router.delete('/pay-periods/:id', requireAuth, deletePayPeriod);

// ─── Payslips ─────────────────────────────────────────────────────────────────
router.get('/payslips', requireAuth, getPayslips);
router.get('/payslips/:id', requireAuth, getPayslip);
router.post('/payslips', requireAuth, validate(CreatePayslipSchema), createPayslip);
router.post('/payslips/:id/issue', requireAuth, issuePayslip);
router.get('/payslips/:id/pdf', requireAuth, downloadPayslipPDF);

// ─── Public verify (no auth) ──────────────────────────────────────────────────
router.get('/verify/:token', verifyPayslip);

export default router;
