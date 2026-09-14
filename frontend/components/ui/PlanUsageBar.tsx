import { Chip } from './Chip';
import { PLAN_LIMITS, PLAN_PRICE } from '@/lib/plans';
import { Plan } from '@/lib/api/types';

interface PlanUsageBarProps {
  plan: Plan;
  used: number;
  showLabel?: boolean;
}

export function PlanUsageBar({ plan, used, showLabel = true }: PlanUsageBarProps) {
  const limit = PLAN_LIMITS[plan] ?? 10;
  const usagePct = Math.round((used / limit) * 100);
  const isWarning = usagePct >= 80;
  const isFull = usagePct >= 100;

  return (
    <div className="flex flex-col gap-1">
      {showLabel && (
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-[13px] font-semibold text-[#0D0D0D]">{plan} plan</p>
            <p className="text-[12px] text-[#9A9890]">{PLAN_PRICE[plan]} · {used} of {limit} employees used</p>
          </div>
          {isWarning && (
            <Chip variant="amber">{isFull ? 'Limit reached' : 'Nearly full'}</Chip>
          )}
        </div>
      )}
      <div className="h-1.5 bg-[#F7F5F1] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(usagePct, 100)}%`,
            background: isWarning ? '#D4901A' : '#2D6A4F',
          }}
        />
      </div>
    </div>
  );
}