import { cx } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md';
  color?: string;
}

export function Spinner({ className, size = 'md', color }: SpinnerProps) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
  };

  if (color) {
    const sizePx = size === 'sm' ? 14 : 18;
    return (
      <div style={{
        width: sizePx,
        height: sizePx,
        border: `2px solid ${color}30`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className={cx('border-2 border-[#1A3D2B] border-t-transparent rounded-full animate-spin', sizes[size], className)} />
  );
}