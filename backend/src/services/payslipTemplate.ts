import { PayslipWithRelations } from '../types';
import "dotenv/config";
export function generatePayslipHTML(
  payslip: PayslipWithRelations,
  opts?: { qrDataUri?: string },
): string {
  const { employee, period, deductions } = payslip;
  const fmt = (n: number) => `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d: Date) => new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });

  const totalEarnings = payslip.grossSalary + payslip.overtimePay + payslip.bonus + payslip.allowances;
  const customDeductionsTotal = deductions.reduce((sum, d) => sum + d.amount, 0);
  const totalDeductions = payslip.paye + payslip.uif + payslip.sdl + customDeductionsTotal;

  const verifyUrl = `${process.env.VERIFY_BASE_URL}/${payslip.verifyToken}`;
  const qrDataUri = opts?.qrDataUri;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }
  .page { width: 794px; min-height: 1123px; padding: 48px; position: relative; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #0F6E56; }
  .company-name { font-size: 20px; font-weight: 700; color: #0F6E56; }
  .company-detail { font-size: 11px; color: #555; margin-top: 4px; }
  .slip-label { text-align: right; }
  .slip-title { font-size: 16px; font-weight: 700; color: #0F6E56; }
  .slip-period { font-size: 11px; color: #555; margin-top: 4px; }
  .employee-block { display: flex; gap: 32px; margin-bottom: 28px; padding: 16px; background: #F0F9F6; border-radius: 8px; }
  .eb-section { flex: 1; }
  .eb-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  .eb-value { font-size: 12px; color: #111; margin-bottom: 3px; }
  .eb-value strong { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #0F6E56; color: #fff; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; }
  th.right { text-align: right; }
  td { padding: 7px 12px; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
  td.right { text-align: right; }
  tr:nth-child(even) td { background: #fafafa; }
  .total-row td { font-weight: 600; background: #F0F9F6 !important; color: #0F6E56; border-top: 1px solid #0F6E56; }
  .net-block { display: flex; justify-content: space-between; align-items: center; background: #0F6E56; color: #fff; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px; }
  .net-label { font-size: 13px; }
  .net-amount { font-size: 24px; font-weight: 700; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; display: flex; justify-content: space-between; align-items: center; }
  .verify-text { font-size: 10px; color: #666; }
  .verify-url { font-size: 10px; color: #0F6E56; }
  .footer-qr { width: 64px; height: 64px; margin-bottom: 6px; }
  .watermark { font-size: 9px; color: #bbb; text-align: right; }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div>
      <div class="company-name">${period.employer.companyName}</div>
      <div class="company-detail">${period.employer.address ?? ''}</div>
      ${period.employer.regNumber ? `<div class="company-detail">Reg No: ${period.employer.regNumber}</div>` : ''}
    </div>
    <div class="slip-label">
      <div class="slip-title">PAYSLIP</div>
      <div class="slip-period">${period.label}</div>
      <div class="slip-period">Pay date: ${fmtDate(period.payDate)}</div>
    </div>
  </div>

  <div class="employee-block">
    <div class="eb-section">
      <div class="eb-label">Employee</div>
      <div class="eb-value"><strong>${employee.firstName} ${employee.lastName}</strong></div>
      ${employee.role ? `<div class="eb-value">${employee.role}</div>` : ''}
      ${employee.department ? `<div class="eb-value">${employee.department}</div>` : ''}
    </div>
    <div class="eb-section">
      <div class="eb-label">Period</div>
      <div class="eb-value">${fmtDate(period.periodStart)} – ${fmtDate(period.periodEnd)}</div>
    </div>
    ${employee.idNumber ? `
    <div class="eb-section">
      <div class="eb-label">ID Number</div>
      <div class="eb-value">${employee.idNumber}</div>
    </div>` : ''}
  </div>

  <!-- Earnings -->
  <table>
    <thead>
      <tr><th>Earnings</th><th class="right">Amount</th></tr>
    </thead>
    <tbody>
      <tr><td>Basic salary</td><td class="right">${fmt(payslip.grossSalary)}</td></tr>
      ${payslip.overtimePay > 0 ? `<tr><td>Overtime</td><td class="right">${fmt(payslip.overtimePay)}</td></tr>` : ''}
      ${payslip.bonus > 0 ? `<tr><td>Bonus</td><td class="right">${fmt(payslip.bonus)}</td></tr>` : ''}
      ${payslip.allowances > 0 ? `<tr><td>Allowances</td><td class="right">${fmt(payslip.allowances)}</td></tr>` : ''}
      <tr class="total-row"><td>Total earnings</td><td class="right">${fmt(totalEarnings)}</td></tr>
    </tbody>
  </table>

  <!-- Deductions -->
  <table>
    <thead>
      <tr><th>Deductions</th><th class="right">Amount</th></tr>
    </thead>
    <tbody>
      ${payslip.paye > 0 ? `<tr><td>PAYE (Income tax)</td><td class="right">${fmt(payslip.paye)}</td></tr>` : ''}
      ${payslip.uif > 0 ? `<tr><td>UIF (employee 1%)</td><td class="right">${fmt(payslip.uif)}</td></tr>` : ''}
      ${payslip.sdl > 0 ? `<tr><td>SDL</td><td class="right">${fmt(payslip.sdl)}</td></tr>` : ''}
      ${deductions.map(d => `<tr><td>${d.label}</td><td class="right">${fmt(d.amount)}</td></tr>`).join('')}
      <tr class="total-row"><td>Total deductions</td><td class="right">${fmt(totalDeductions)}</td></tr>
    </tbody>
  </table>

  <!-- Net Pay -->
  <div class="net-block">
    <span class="net-label">NET PAY — ${period.label}</span>
    <span class="net-amount">${fmt(payslip.netPay)}</span>
  </div>

  <div class="footer">
    <div>
      <div class="verify-text">Scan or follow the link to verify authenticity:</div>
      ${qrDataUri ? `<img class="footer-qr" src="${qrDataUri}" alt="Payslip verification QR code" />` : ''}
      <div class="verify-url">${verifyUrl}</div>
    </div>
    <div class="watermark">
      Issued via SlipStream<br>
      ${new Date(payslip.issuedAt).toLocaleDateString('en-ZA')}
    </div>
  </div>

</div>
</body>
</html>`;
}
