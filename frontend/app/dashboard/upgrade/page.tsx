'use client';
import { useEffect, useState } from 'react';
import { employer as employerApi, Employer } from '@/lib/api';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useToast } from '@/components/ui/Toast';
import { PLANS } from '@/lib/plans';
import { PlanUsageBar } from '@/components/ui/PlanUsageBar';
import { useRouter } from 'next/navigation';

export default function UpgradePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [data, setData] = useState<Employer | null>(null);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    employerApi.me().then(setData);
  }, []);

  async function handleChangePlan(planId: string) {
    if (!data || planId === data.plan) return;
    setChanging(true);
    try {
      await employerApi.changePlan(planId);
      setData(d => d ? { ...d, plan: planId as Employer['plan'] } : null);
      toast(`Switched to ${planId} plan`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to change plan', 'error');
    } finally {
      setChanging(false);
    }
  }

  return (
    <>
      <Topbar
        title="Upgrade plan"
        subtitle="Switch to a plan that fits your team"
        actions={
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/settings')}>
            ← Back to settings
          </Button>
        }
      />
      <div className="p-7 max-w-2xl flex flex-col gap-5">

        {data && (
          <div className="bg-white border border-[#E2EDE5] rounded-lg p-5">
            <PlanUsageBar plan={data.plan} used={data._count.employees} />
          </div>
        )}

        <div className="flex flex-col gap-3">
          {PLANS.map(plan => {
            const isCurrent = data?.plan === plan.id;
            return (
              <div
                key={plan.id}
                className={`bg-white border rounded-lg p-5 flex items-center justify-between transition-all ${
                  isCurrent ? 'border-[#1A3D2B] bg-[#EAF2EC]/40' : 'border-[#E2EDE5] hover:border-[#C8D9CC]'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-[15px] font-semibold text-[#0D0D0D]">{plan.name}</h3>
                    {plan.featured && !isCurrent && <Chip variant="amber">Popular</Chip>}
                    {isCurrent && <Chip variant="green">Current</Chip>}
                  </div>
                  <p className="text-[12px] text-[#9A9890] mb-3">{plan.limit}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {plan.features.map(f => (
                      <span key={f} className="text-[12px] text-[#6B6860] flex items-center gap-1.5">
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#2D6A4F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-6 shrink-0">
                  <div className="text-right">
                    <span className="text-[20px] font-bold text-[#0D0D0D]">{plan.price}</span>
                    <span className="text-[12px] text-[#9A9890]">{plan.period}</span>
                  </div>
                  {!isCurrent && (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={changing}
                      onClick={() => handleChangePlan(plan.id)}
                    >
                      Switch to {plan.name}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-[#9A9890] text-center">
          All plans include unlimited payslips. No setup fees, no per-payslip charges.
        </p>
      </div>
    </>
  );
}