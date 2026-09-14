'use client';
import { useEffect, useState } from 'react';
import { payslips as payslipsApi, payPeriods as periodsApi, employees as employeesApi, employer as employerApi } from '@/lib/api';
import type { Payslip, PayPeriod, Employer } from '@/lib/api';
import { Topbar } from '@/components/layout/Topbar';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Chip, emailStatusChip } from '@/components/ui/Chip';
import { fmtCurrency, fmtDateShort, PLAN_LIMITS, PLAN_PRICE } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const [period, setPeriod] = useState<PayPeriod | null>(null);
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [slips, setSlips] = useState<Payslip[]>([]);
  const [empCount, setEmpCount] = useState(0);
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [issuing, setIssuing] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      periodsApi.list(),
      employeesApi.list(true),
      employerApi.me(),
    ]).then(([ps, emps, emp]) => {
      setPeriods(ps);
      setEmpCount(emps.length);
      setEmployer(emp);
      if (ps.length > 0) {
        setPeriod(ps[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (!period) return;
    payslipsApi.list({ periodId: period.id }).then(setSlips);
  }, [period]);

  const totalPayroll = slips.reduce((s, p) => s + p.netPay, 0);
  const issued = slips.filter(p => p.emailStatus === 'SENT').length;
  const pending = slips.filter(p => p.emailStatus === 'PENDING').length;
  const limit = employer ? (PLAN_LIMITS[employer.plan] ?? 10) : 10;
  const usagePct = Math.round((empCount / limit) * 100);

  async function handleIssue(id: string) {
    setIssuing(id);
    try {
      await payslipsApi.issue(id);
      if (period) {
        const updated = await payslipsApi.list({ periodId: period.id });
        setSlips(updated);
      }
    } finally {
      setIssuing(null);
    }
  }

  return (
    <>
      <Topbar
        title="Dashboard"
        actions={
          <>
            <Link href="/dashboard/periods">
              <Button variant="ghost" size="sm">New pay period</Button>
            </Link>
            <Link href="/dashboard/payslips">
              <Button variant="primary" size="sm">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M5.5 1v9M1 5.5l4.5 4.5 4.5-4.5" strokeLinecap="round" />
                </svg>
                Issue payslips
              </Button>
            </Link>
          </>
        }
      />

      <div className="p-7 flex-1">

        {/* Period selector */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <select
              value={period?.id ?? ''}
              onChange={e => setPeriod(periods.find(p => p.id === e.target.value) ?? null)}
              className="text-[13px] font-medium bg-white border border-[#C8D9CC] rounded-md px-3 py-1.5 text-[#0D0D0D] outline-none focus:border-[#2D6A4F] cursor-pointer"
            >
              {periods.length === 0 && <option value="">No pay periods yet</option>}
              {periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          {period && (
            <p className="text-[12px] text-[#9A9890]">
              {pending > 0
                ? <span className="text-[#92600A]">● {pending} payslip{pending !== 1 ? 's' : ''} pending · Pay date {fmtDateShort(period.payDate)}</span>
                : <span className="text-[#2D6A4F]">● All payslips issued</span>
              }
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Total payroll"
            value={fmtCurrency(totalPayroll)}
            sub={`${period?.label ?? '—'} · ${slips.length} employees`}
          />
          <StatCard
            label="Payslips issued"
            value={`${issued} / ${slips.length}`}
            sub={`${pending} pending`}
            variant={pending > 0 ? 'warn' : 'default'}
          />
          <StatCard
            label="Pending"
            value={pending}
            sub={period ? `Due by ${fmtDateShort(period.payDate)}` : '—'}
            variant={pending > 0 ? 'warn' : 'muted'}
          />
          <StatCard
            label="Employees"
            value={empCount}
            sub={`${limit - empCount} slot${limit - empCount !== 1 ? 's' : ''} remaining`}
            variant="muted"
          />
        </div>

        {/* Payslips table */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-[#0D0D0D]" >
            {period?.label ?? 'Payslips'}
          </h2>
          <Link href="/dashboard/payslips" className="text-[12px] text-[#2D6A4F] hover:underline">
            View all →
          </Link>
        </div>

        {slips.length === 0 ? (
          <div className="bg-white border border-[#E2EDE5] rounded-lg p-10 text-center">
            <p className="text-[13px] text-[#9A9890]">
              {period ? 'No payslips for this period yet.' : 'Create a pay period to get started.'}
            </p>
            <Link href={period ? '/dashboard/payslips' : '/dashboard/periods'}>
              <Button variant="primary" size="sm" className="mt-3">
                {period ? 'Create payslips' : 'Create pay period'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[#E2EDE5] rounded-lg overflow-hidden mb-5">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F7F5F1] border-b border-[#E2EDE5]">
                  {['Employee', 'Gross', 'Deductions', 'Net pay', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9A9890] uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slips.map(slip => {
                  const deductTotal = slip.paye + slip.uif + slip.sdl + slip.deductions.reduce((s, d) => s + d.amount, 0);
                  return (
                    <tr key={slip.id} className="border-b border-[#E2EDE5] last:border-0 hover:bg-[#F7F5F1] transition-colors group">
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-medium text-[#0D0D0D]">
                          {slip.employee.firstName} {slip.employee.lastName}
                        </p>
                        <p className="text-[11px] text-[#9A9890]">
                          {slip.employee.role ?? '—'}{slip.employee.department ? ` · ${slip.employee.department}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#3A3A3A] tabnum">{fmtCurrency(slip.grossSalary)}</td>
                      <td className="px-4 py-3 text-[13px] text-[#9A9890] tabnum">{fmtCurrency(deductTotal)}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-[#0D0D0D] tabnum">{fmtCurrency(slip.netPay)}</td>
                      <td className="px-4 py-3">{emailStatusChip(slip.emailStatus)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          {slip.emailStatus === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="primary"
                              loading={issuing === slip.id}
                              onClick={() => handleIssue(slip.id)}
                            >
                              Issue
                            </Button>
                          )}
                          <a
                            href={payslipsApi.pdfUrl(slip.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="ghost">PDF</Button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Plan usage */}
        {employer && (
          <div className="bg-white border border-[#E2EDE5] rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[13px] font-semibold text-[#0D0D0D]" >
                  {employer.plan} plan
                </p>
                <p className="text-[12px] text-[#9A9890]">{PLAN_PRICE[employer.plan]} · {empCount} of {limit} employees used</p>
              </div>
              {usagePct >= 80 && (
                <Chip variant="amber">
                  {usagePct >= 100 ? 'Limit reached' : 'Nearly full'}
                </Chip>
              )}
            </div>
            <div className="h-1.5 bg-[#F7F5F1] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(usagePct, 100)}%`,
                  background: usagePct >= 80 ? '#D4901A' : '#2D6A4F',
                }}
              />
            </div>
            {usagePct >= 80 && (
              <Link href="/dashboard/upgrade">
                <Button variant="ghost" size="sm" className="mt-3 w-full justify-center">
                  Upgrade plan →
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
