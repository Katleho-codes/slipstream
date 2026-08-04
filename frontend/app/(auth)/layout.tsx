import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F5F1] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <span className="text-[16px] font-semibold text-[#0D0D0D]" >
            Slip<span className="text-[#2D6A4F]">Stream</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
