/**
 * SlipStream — Pay calculation utilities
 * These are helper calculations only. The MVP accepts employer-entered PAYE.
 * Phase 2 will integrate SARS tax tables for automated PAYE calculation.
 */

/**
 * Calculate UIF employee contribution
 * 1% of gross, capped at monthly remuneration of R17,712 (2025/2026)
 */
export function calculateUIF(gross: number): number {
  const UIF_CAP = 17712;
  const UIF_RATE = 0.01;
  return parseFloat((Math.min(gross, UIF_CAP) * UIF_RATE).toFixed(2));
}

/**
 * Calculate SDL (Skills Development Levy)
 * 1% of gross — employer pays, but shown on payslip for transparency
 * Only applies if employer's annual payroll > R500,000
 */
export function calculateSDL(gross: number): number {
  return parseFloat((gross * 0.01).toFixed(2));
}

/**
 * Calculate net pay from gross and all deductions
 */
export function calculateNetPay(params: {
  grossSalary: number;
  overtimePay?: number;
  bonus?: number;
  allowances?: number;
  paye: number;
  uif: number;
  sdl?: number;
  customDeductions?: number;
}): number {
  const totalEarnings =
    params.grossSalary +
    (params.overtimePay ?? 0) +
    (params.bonus ?? 0) +
    (params.allowances ?? 0);

  const totalDeductions =
    params.paye +
    params.uif +
    (params.sdl ?? 0) +
    (params.customDeductions ?? 0);

  return parseFloat((totalEarnings - totalDeductions).toFixed(2));
}

/**
 * Validate that net pay is not negative
 */
export function isValidNetPay(net: number): boolean {
  return net >= 0;
}
