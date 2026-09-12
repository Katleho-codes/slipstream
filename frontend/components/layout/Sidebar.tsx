'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx, initials, PLAN_PRICE } from '@/lib/utils';
import { Employer } from '@/lib/api';

interface SidebarProps {
  employer: Employer | null;
}

const nav = [
  {
    label: 'Payroll',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
      { href: '/dashboard/employees', label: 'Employees', icon: IconEmployees },
      { href: '/dashboard/payslips', label: 'Payslips', icon: IconPayslips },
      { href: '/dashboard/periods', label: 'Pay Periods', icon: IconCalendar },
    ],
  },
  {
    label: 'Organisation',
    items: [
      { href: '/dashboard/members', label: 'Members', icon: IconMembers },
      { href: '/dashboard/settings', label: 'Settings', icon: IconSettings },
    ],
  },
];

export function Sidebar({ employer }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-55 shrink-0 bg-white border-r border-[#E2EDE5] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-4.5 border-b border-[#E2EDE5] flex items-center gap-2.5">
        <span className="text-[14px] font-semibold text-[#0D0D0D]" >
          Slip<span className="text-[#2D6A4F]">Stream</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {nav.map(group => (
          <div key={group.label} className="mb-4">
            <p className="px-2 mb-1 text-[10px] font-semibold text-[#9A9890] uppercase tracking-widest">
              {group.label}
            </p>
            {group.items.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    'flex items-center gap-2.5 px-2 py-1.75 rounded-md text-[13px] mb-0.5 transition-all duration-100',
                    active
                      ? 'bg-[#EAF2EC] text-[#1A3D2B] font-medium'
                      : 'text-[#6B6860] hover:bg-[#F7F5F1] hover:text-[#0D0D0D]'
                  )}
                >
                  <item.icon active={active} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Employer footer */}
      {employer && (
        <div className="border-t border-[#E2EDE5] p-3">
          <Link href="/dashboard/settings" className="flex items-center gap-2.5 p-2 rounded-md hover:bg-[#F7F5F1] transition-colors">
            <div className="w-7 h-7 rounded-md bg-[#EAF2EC] border border-[#C8D9CC] flex items-center justify-center text-[11px] font-semibold text-[#2D6A4F] shrink-0">
              {initials(employer.companyName)}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[#0D0D0D] truncate">{employer.companyName}</p>
              <p className="text-[10px] text-[#9A9890]">{PLAN_PRICE[employer.plan]} · {employer.plan}</p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconMembers({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} className="shrink-0">
      <circle cx="5" cy="4.5" r="2.5" />
      <path d="M1 13c0-2.5 1.8-4 4-4s4 1.5 4 4" />
      <circle cx="11.5" cy="4.5" r="2" />
      <path d="M11.5 8.5c1.5 0 2.5 1 2.5 2.5v2" strokeLinecap="round" />
    </svg>
  );
}
function IconDashboard({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} className="shrink-0">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1.2" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.2" />
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2" />
    </svg>
  );
}
function IconEmployees({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} className="shrink-0">
      <circle cx="5.5" cy="4.5" r="2.5" />
      <path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
      <path d="M10.5 6.5c1.2 0 2.5.8 2.5 2.5v4" strokeLinecap="round" />
      <circle cx="12" cy="4" r="1.8" />
    </svg>
  );
}
function IconPayslips({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} className="shrink-0">
      <rect x="2" y="1" width="11" height="13" rx="1.5" />
      <path d="M5 5h5M5 7.5h5M5 10h3" strokeLinecap="round" />
    </svg>
  );
}
function IconCalendar({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} className="shrink-0">
      <rect x="1.5" y="2.5" width="12" height="11" rx="1.5" />
      <path d="M5 1.5v2M10 1.5v2M1.5 6.5h12" strokeLinecap="round" />
    </svg>
  );
}
function IconSettings({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} className="shrink-0">
      <circle cx="7.5" cy="7.5" r="2" />
      <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.2 3.2l1 1M10.8 10.8l1 1M3.2 11.8l1-1M10.8 4.2l1-1" strokeLinecap="round" />
    </svg>
  );
}
