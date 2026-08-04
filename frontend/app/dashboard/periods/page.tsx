'use client';
import { useEffect, useState } from 'react';
import { payPeriods as periodsApi, PayPeriod, CreatePayPeriodDto } from '@/lib/api';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { fmtDate } from '@/lib/utils';

const empty: CreatePayPeriodDto = { label: '', periodStart: '', periodEnd: '', payDate: '' };

export default function PeriodsPage() {
  const { toast } = useToast();
  const [list, setList] = useState<PayPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreatePayPeriodDto>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    periodsApi.list().then(setList).finally(() => setLoading(false));
  }, []);

  const set = (k: keyof CreatePayPeriodDto) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // Auto-generate label from periodStart
  function handleStartChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setForm(f => ({
      ...f,
      periodStart: val,
      label: val ? new Date(val).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg' }) : f.label,
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const period = await periodsApi.create(form);
      setList(l => [period, ...l]);
      setOpen(false);
      setForm(empty);
      toast(`${period.label} pay period created`);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to create period', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete the ${label} pay period? This cannot be undone.`)) return;
    try {
      await periodsApi.delete(id);
      setList(l => l.filter(p => p.id !== id));
      toast(`${label} deleted`);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to delete', 'error');
    }
  }

  return (
    <>
      <Topbar
        title="Pay Periods"
        subtitle={`${list.length} period${list.length !== 1 ? 's' : ''}`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5.5 1v9M1 5.5h9" strokeLinecap="round" />
            </svg>
            New pay period
          </Button>
        }
      />

      <div className="p-7 flex-1">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-[#1A3D2B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white border border-[#E2EDE5] rounded-lg p-12 text-center">
            <p className="text-[13px] text-[#9A9890] mb-3">No pay periods yet. Create your first to start issuing payslips.</p>
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>Create pay period</Button>
          </div>
        ) : (
          <div className="bg-white border border-[#E2EDE5] rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F7F5F1] border-b border-[#E2EDE5]">
                  {['Period', 'Start date', 'End date', 'Pay date', 'Payslips', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9A9890] uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(p => (
                  <tr key={p.id} className="border-b border-[#E2EDE5] last:border-0 hover:bg-[#F7F5F1] transition-colors group">
                    <td className="px-4 py-3 text-[13px] font-medium text-[#0D0D0D]">{p.label}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6860]">{fmtDate(p.periodStart)}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6860]">{fmtDate(p.periodEnd)}</td>
                    <td className="px-4 py-3 text-[12px] font-medium text-[#0D0D0D]">{fmtDate(p.payDate)}</td>
                    <td className="px-4 py-3 text-[12px] text-[#9A9890]">{p._count?.payslips ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="danger" onClick={() => handleDelete(p.id, p.label)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New pay period" width="sm">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Label"
            value={form.label}
            onChange={set('label')}
            placeholder="June 2026"
            required
            hint="Auto-filled from start date — edit if needed"
          />
          <Input label="Period start" type="date" value={form.periodStart} onChange={handleStartChange} required />
          <Input label="Period end" type="date" value={form.periodEnd} onChange={set('periodEnd')} required />
          <Input label="Pay date" type="date" value={form.payDate} onChange={set('payDate')} required />
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2EDE5]">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving}>Create period</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
