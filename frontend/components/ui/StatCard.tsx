import { cx } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: 'default' | 'warn' | 'muted';
  className?: string;
  children?: ReactNode;
}

export function StatCard({ label, value, sub, variant = 'default', className, children }: StatCardProps) {
  return (
    <div className={cx(
      'bg-white border border-[#E2EDE5] rounded-lg p-4',
      className
    )}>
      <p className="text-[10px] font-semibold text-[#9A9890] uppercase tracking-widest mb-1.5">{label}</p>
      <p className={cx(
        'text-[22px] font-semibold leading-none mb-1 tabnum',
        variant === 'default' ? 'text-[#1A3D2B]' : 'text-[#0D0D0D]'
      )}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-[#9A9890]">{sub}</p>}
      {children}
    </div>
  );
}
