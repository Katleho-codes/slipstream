'use client';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ReactNode } from 'react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const router = useRouter();
  const { toast } = useToast();

  async function handleSignOut() {
    try {
      await auth.signOut();
      router.push('/login');
    } catch {
      toast('Sign out failed', 'error');
    }
  }

  return (
    <header className="bg-white border-b border-[#E2EDE5] px-7 h-[52px] flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
      <div>
        <h1 className="text-[15px] font-semibold text-[#0D0D0D] tracking-tight" >
          {title}
        </h1>
        {subtitle && <p className="text-[11px] text-[#9A9890]">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button
          onClick={handleSignOut}
          className="w-7 h-7 flex items-center justify-center rounded-md text-[#9A9890] hover:bg-[#F7F5F1] hover:text-[#6B6860] transition-colors"
          title="Sign out"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M12 7H5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
