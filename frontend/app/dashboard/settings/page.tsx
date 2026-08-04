'use client';
import { useEffect, useState } from 'react';
import { employer as employerApi, Employer } from '@/lib/api';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { initials, PLAN_LIMITS, PLAN_PRICE } from '@/lib/utils';
import { Chip } from '@/components/ui/Chip';

export default function SettingsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<Employer | null>(null);
  const [form, setForm] = useState({ companyName: '', regNumber: '', vatNumber: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    employerApi.me().then(emp => {
      setData(emp);
      setForm({
        companyName: emp.companyName,
        regNumber: emp.regNumber ?? '',
        vatNumber: emp.vatNumber ?? '',
        phone: emp.phone ?? '',
        address: emp.address ?? '',
      });
    });
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await employerApi.updateProfile(form);
      setData(d => d ? { ...d, ...updated } : null);
      toast('Profile saved');
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <>
        <Topbar title="Settings" />
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#1A3D2B] border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  const limit = PLAN_LIMITS[data.plan] ?? 10;
  const used = data._count.employees;
  const usagePct = Math.round((used / limit) * 100);

  return (
    <>
      <Topbar title="Settings" />
      <div className="p-7 max-w-2xl flex flex-col gap-5">

        {/* Company profile */}
        <div className="bg-white border border-[#E2EDE5] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2EDE5]">
            <h2 className="text-[13px] font-semibold text-[#0D0D0D]" >
              Company profile
            </h2>
            <p className="text-[12px] text-[#9A9890]">This information appears on all payslips.</p>
          </div>
          <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-lg bg-[#EAF2EC] border border-[#C8D9CC] flex items-center justify-center text-[16px] font-semibold text-[#2D6A4F]">
                {initials(data.companyName)}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#0D0D0D]">{data.companyName}</p>
                <p className="text-[12px] text-[#9A9890]">{data.user.email}</p>
              </div>
            </div>
            <Input label="Company name" value={form.companyName} onChange={set('companyName')} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Registration number" value={form.regNumber} onChange={set('regNumber')} placeholder="2019/123456/07" />
              <Input label="VAT number" value={form.vatNumber} onChange={set('vatNumber')} placeholder="4123456789" />
            </div>
            <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="011 555 1234" />
            <Input label="Address" value={form.address} onChange={set('address')} placeholder="14 Industry Road, Germiston, 1401" />
            <div className="flex justify-end pt-1">
              <Button type="submit" variant="primary" loading={saving}>Save changes</Button>
            </div>
          </form>
        </div>

        {/* Plan */}
        <div className="bg-white border border-[#E2EDE5] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2EDE5]">
            <h2 className="text-[13px] font-semibold text-[#0D0D0D]" >
              Plan & usage
            </h2>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[15px] font-semibold text-[#0D0D0D]">{data.plan}</p>
                <p className="text-[12px] text-[#9A9890]">{PLAN_PRICE[data.plan]}</p>
              </div>
              <Chip variant={usagePct >= 80 ? 'amber' : 'green'}>
                {used} / {limit} employees
              </Chip>
            </div>
            <div className="h-1.5 bg-[#F7F5F1] rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(usagePct, 100)}%`, background: usagePct >= 80 ? '#D4901A' : '#2D6A4F' }}
              />
            </div>

            <div className="border border-[#E2EDE5] rounded-lg overflow-hidden mt-4">
              {[
                { plan: 'STARTER', label: 'Starter', price: 'R199/mo', employees: 10 },
                { plan: 'GROWTH', label: 'Growth', price: 'R499/mo', employees: 50 },
                { plan: 'BUSINESS', label: 'Business', price: 'R999/mo', employees: 150 },
              ].map(tier => (
                <div key={tier.plan} className={`flex items-center justify-between px-4 py-3 border-b border-[#E2EDE5] last:border-0 ${tier.plan === data.plan ? 'bg-[#EAF2EC]' : ''}`}>
                  <div>
                    <p className="text-[13px] font-medium text-[#0D0D0D]">{tier.label}</p>
                    <p className="text-[11px] text-[#9A9890]">Up to {tier.employees} employees</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-medium text-[#3A3A3A]">{tier.price}</span>
                    {tier.plan === data.plan
                      ? <Chip variant="green">Current</Chip>
                      : <Button size="sm" variant="ghost">Upgrade</Button>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
