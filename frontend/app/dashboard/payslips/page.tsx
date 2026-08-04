'use client';
import { useEffect, useState } from 'react';
import { payslips as payslipsApi, payPeriods as periodsApi, employees as employeesApi } from '@/lib/api';
import type { Payslip, PayPeriod, Employee, CreatePayslipDto } from '@/lib/api';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { emailStatusChip } from '@/components/ui/Chip';
import { fmtCurrency, fmtDateShort } from '@/lib/utils';

export default function PayslipsPage() {
  const { toast } = useToast();
  const [slips, setSlips] = useState<Payslip[]>([]);
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterPeriod, setFilterPeriod] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [issuing, setIssuing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CreatePayslipDto>({
    employeeId: '', periodId: '', grossSalary: 0,
    overtimePay: 0, bonus: 0, allowances: 0,
    paye: 0, sdl: 0, deductions: [],
  });

  useEffect(() => {
    Promise.all([
      payslipsApi.list(),
      periodsApi.list(),
      employeesApi.list(true),
    ]).then(([s, p, e]) => {
      setSlips(s); setPeriods(p); setEmployees(e);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = filterPeriod ? slips.filter(s => s.periodId === filterPeriod) : slips;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const slip = await payslipsApi.create(form);
      setSlips(s => [slip, ...s]);
      setOpen(false);
      toast('Payslip created');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to create payslip', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleIssue(id: string) {
    setIssuing(id);
    try {
      const result = await payslipsApi.issue(id);
      setSlips(s => s.map(x => x.id === id ? { ...x, emailStatus: result.email ? 'SENT' : 'FAILED' } as Payslip : x));
      toast(result.email ? 'Payslip issued and emailed' : 'Payslip issued (no email — no address on record)', result.email ? 'success' : 'info');
    } catch {
      toast('Issue failed', 'error');
    } finally {
      setIssuing(null);
    }
  }

  const numField = (k: keyof CreatePayslipDto) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: parseFloat(e.target.value) || 0 }));

  return (
    <>
      <Topbar
        title="Payslips"
        subtitle={`${slips.length} total`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setOpen(true)} disabled={periods.length === 0 || employees.length === 0}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5.5 1v9M1 5.5h9" strokeLinecap="round" />
            </svg>
            Create payslip
          </Button>
        }
      />

      <div className="p-7 flex-1">
        <div className="mb-4">
          <select
            value={filterPeriod}
            onChange={e => setFilterPeriod(e.target.value)}
            className="text-[13px] bg-white border border-[#C8D9CC] rounded-md px-3 py-1.5 outline-none focus:border-[#2D6A4F] text-[#0D0D0D]"
          >
            <option value="">All periods</option>
            {periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-[#1A3D2B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#E2EDE5] rounded-lg p-12 text-center">
            <p className="text-[13px] text-[#9A9890] mb-3">
              {periods.length === 0
                ? 'Create a pay period first before adding payslips.'
                : employees.length === 0
                ? 'Add employees first before creating payslips.'
                : 'No payslips yet for this period.'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#E2EDE5] rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F7F5F1] border-b border-[#E2EDE5]">
                  {['Employee', 'Period', 'Gross', 'Net pay', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9A9890] uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(slip => (
                  <tr key={slip.id} className="border-b border-[#E2EDE5] last:border-0 hover:bg-[#F7F5F1] transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#0D0D0D]">{slip.employee.firstName} {slip.employee.lastName}</p>
                      <p className="text-[11px] text-[#9A9890]">{slip.employee.role ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6860]">
                      {slip.period.label}<br />
                      <span className="text-[#9A9890]">{fmtDateShort(slip.period.payDate)}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#3A3A3A] tabnum">{fmtCurrency(slip.grossSalary)}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-[#0D0D0D] tabnum">{fmtCurrency(slip.netPay)}</td>
                    <td className="px-4 py-3">{emailStatusChip(slip.emailStatus)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        {slip.emailStatus === 'PENDING' && (
                          <Button size="sm" variant="primary" loading={issuing === slip.id} onClick={() => handleIssue(slip.id)}>
                            Issue
                          </Button>
                        )}
                        <a href={payslipsApi.pdfUrl(slip.id)} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost">PDF</Button>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create payslip" width="md">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#6B6860] uppercase tracking-wider">Employee</label>
              <select
                required
                value={form.employeeId}
                onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                className="px-3 py-2 text-[13px] bg-white border border-[#C8D9CC] rounded-md outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]"
              >
                <option value="">Select employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[#6B6860] uppercase tracking-wider">Pay period</label>
              <select
                required
                value={form.periodId}
                onChange={e => setForm(f => ({ ...f, periodId: e.target.value }))}
                className="px-3 py-2 text-[13px] bg-white border border-[#C8D9CC] rounded-md outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]"
              >
                <option value="">Select period</option>
                {periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-[#E2EDE5] pt-3">
            <p className="text-[11px] font-semibold text-[#9A9890] uppercase tracking-widest mb-3">Earnings</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Gross salary (R)" type="number" min="0" step="0.01" required
                value={form.grossSalary || ''} onChange={numField('grossSalary')} />
              <Input label="Overtime (R)" type="number" min="0" step="0.01"
                value={form.overtimePay || ''} onChange={numField('overtimePay')} />
              <Input label="Bonus (R)" type="number" min="0" step="0.01"
                value={form.bonus || ''} onChange={numField('bonus')} />
              <Input label="Allowances (R)" type="number" min="0" step="0.01"
                value={form.allowances || ''} onChange={numField('allowances')} />
            </div>
          </div>

          <div className="border-t border-[#E2EDE5] pt-3">
            <p className="text-[11px] font-semibold text-[#9A9890] uppercase tracking-widest mb-3">Statutory deductions</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="PAYE (R)" type="number" min="0" step="0.01"
                value={form.paye || ''} onChange={numField('paye')}
                hint="Enter calculated PAYE" />
              <Input label="UIF (R)" type="number" min="0" step="0.01"
                value={form.uif || ''} onChange={numField('uif')}
                hint="Leave blank to auto-calculate (1%)" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2EDE5]">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving}>Create payslip</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
