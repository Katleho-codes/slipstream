import { InputHTMLAttributes, forwardRef } from 'react';
import { cx } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-medium text-[#6B6860] uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cx(
            'w-full px-3 py-2 text-[13px] rounded-md border bg-white text-[#0D0D0D] placeholder:text-[#9A9890]',
            'outline-none transition-all duration-100',
            error
              ? 'border-[#FECACA] focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]'
              : 'border-[#C8D9CC] focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]',
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-[#B91C1C]">{error}</p>}
        {hint && !error && <p className="text-[11px] text-[#9A9890]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
