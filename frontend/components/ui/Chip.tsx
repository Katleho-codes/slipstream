import { cx } from '@/lib/utils';

type ChipVariant = 'green' | 'amber' | 'red' | 'muted';

const styles: Record<ChipVariant, string> = {
  green: 'bg-[#EAF2EC] text-[#2D6A4F]',
  amber: 'bg-[#FDF6E3] text-[#92600A]',
  red:   'bg-[#FEF2F2] text-[#B91C1C]',
  muted: 'bg-[#F7F5F1] text-[#9A9890]',
};

interface ChipProps {
  variant: ChipVariant;
  children: React.ReactNode;
  className?: string;
}

export function Chip({ variant, children, className }: ChipProps) {
  return (
    <span className={cx('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', styles[variant], className)}>
      {children}
    </span>
  );
}

export function emailStatusChip(status: string) {
  if (status === 'SENT')    return <Chip variant="green">Issued</Chip>;
  if (status === 'FAILED')  return <Chip variant="red">Failed</Chip>;
  return <Chip variant="amber">Pending</Chip>;
}
