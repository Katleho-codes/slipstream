import { cx } from '@/lib/utils';

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <div className={cx('bg-white border border-[#E2EDE5] rounded-lg overflow-hidden', className)}>
      {children}
    </div>
  );
}

export function SectionCardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-5 py-4 border-b border-[#E2EDE5]">
      <h2 className="text-[13px] font-semibold text-[#0D0D0D]">{title}</h2>
      {subtitle && <p className="text-[12px] text-[#9A9890]">{subtitle}</p>}
    </div>
  );
}

export function SectionCardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('p-5', className)}>{children}</div>;
}