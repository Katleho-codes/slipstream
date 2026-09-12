'use client';
import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { employer as employerApi, Employer, onboarding } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onboarding.status()
      .then(status => {
        if (status.step !== 'complete') {
          router.replace('/onboarding');
          return;
        }
        return employerApi.me().then(setEmployer);
      })
      .catch(() => router.replace('/login'))
      .finally(() => setReady(true));
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F7F5F1] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#1A3D2B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar employer={employer} />
        <main className="flex-1 overflow-y-auto flex flex-col bg-[#F7F5F1]">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
