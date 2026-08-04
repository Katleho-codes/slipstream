'use client';
import { cx } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'ghost',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-md transition-all duration-100 cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    sm: 'px-3 py-1.5 text-[11px]',
    md: 'px-3.5 py-[7px] text-[12px]',
  };

  const variants = {
    primary: 'bg-[#1A3D2B] text-white border-[#1A3D2B] hover:bg-[#2D6A4F] hover:border-[#2D6A4F]',
    ghost:   'bg-transparent text-[#6B6860] border-[#C8D9CC] hover:bg-[#F7F5F1] hover:text-[#0D0D0D]',
    danger:  'bg-transparent text-[#B91C1C] border-[#FECACA] hover:bg-[#FEF2F2]',
  };

  return (
    <button
      className={cx(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
