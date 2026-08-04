'use client';
import { useEffect, useState } from 'react';
import { employees as employeesApi, Employee, CreateEmployeeDto } from '@/lib/api';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { fmtDateShort } from '@/lib/utils';

const empty: CreateEmployeeDto = {
  firstName: '', lastName: '', email: '', phone: '',
  role: '', department: '', employeeCode: '', idNumber: '',
};

export default function EmployeesPage() {
  const { toast } = useToast();
  const [list, setList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateEmployeeDto>(empty);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    employeesApi.list().then(setList).finally(() => setLoading(false));
  }, []);

  const set = (k: keyof CreateEmployeeDto) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const emp = await employeesApi.create(form);
      setList(l => [...l, emp]);
      setOpen(false);
      setForm(empty);
      toast(`${emp.firstName} ${emp.lastName} added`);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to add employee', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`Deactivate ${name}? Their payslip history is preserved.`)) return;
    try {
      await employeesApi.deactivate(id);
      setList(l => l.map(e => e.id === id ? { ...e, isActive: false } : e));
      toast(`${name} deactivated`);
    } catch {
      toast('Failed to deactivate', 'error');
    }
  }

  const filtered = list.filter(e =>
    `${e.firstName} ${e.lastName} ${e.role} ${e.department} ${e.employeeCode}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Topbar
        title="Employees"
        subtitle={`${list.filter(e => e.isActive).length} active`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5.5 1v9M1 5.5h9" strokeLinecap="round" />
            </svg>
            Add employee
          </Button>
        }
      />

      <div className="p-7 flex-1">
        <div className="mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, role, department…"
            className="w-full max-w-xs px-3 py-2 text-[13px] bg-white border border-[#C8D9CC] rounded-md outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] placeholder:text-[#9A9890]"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-[#1A3D2B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#E2EDE5] rounded-lg p-12 text-center">
            <p className="text-[13px] text-[#9A9890] mb-3">
              {search ? 'No employees match that search.' : 'No employees yet. Add your first employee to get started.'}
            </p>
            {!search && (
              <Button variant="primary" size="sm" onClick={() => setOpen(true)}>Add employee</Button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[#E2EDE5] rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F7F5F1] border-b border-[#E2EDE5]">
                  {['Employee', 'Role', 'Department', 'Code', 'Start date', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9A9890] uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.id} className="border-b border-[#E2EDE5] last:border-0 hover:bg-[#F7F5F1] transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#0D0D0D]">{emp.firstName} {emp.lastName}</p>
                      <p className="text-[11px] text-[#9A9890]">{emp.email ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#3A3A3A]">{emp.role ?? '—'}</td>
                    <td className="px-4 py-3 text-[13px] text-[#3A3A3A]">{emp.department ?? '—'}</td>
                    <td className="px-4 py-3 text-[12px] text-[#9A9890] font-mono">{emp.employeeCode ?? '—'}</td>
                    <td className="px-4 py-3 text-[12px] text-[#9A9890]">
                      {emp.startDate ? fmtDateShort(emp.startDate) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Chip variant={emp.isActive ? 'green' : 'muted'}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </Chip>
                    </td>
                    <td className="px-4 py-3">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1.5">
                        {emp.isActive && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeactivate(emp.id, `${emp.firstName} ${emp.lastName}`)}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add employee">
        <form onSubmit={handleCreate} className="flex flex-col gap-4" autoComplete="off">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" defaultValue={form.firstName} onChange={set('firstName')} aria-autocomplete="none" required />
            <Input label="Last name" defaultValue={form.lastName} onChange={set('lastName')} autoComplete="off" required />
          </div>
          <Input label="Email" type="email" defaultValue={form.email} onChange={set('email')} autoComplete="off" placeholder="employee@email.com" />
          <Input label="Phone" defaultValue={form.phone} onChange={set('phone')} autoComplete="off" placeholder="071 000 0000" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Role" defaultValue={form.role} onChange={set('role')} autoComplete="off" placeholder="Machine Operator" />
            <Input label="Department" defaultValue={form.department} onChange={set('department')} autoComplete="off" placeholder="Factory Floor" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Employee code" defaultValue={form.employeeCode} onChange={set('employeeCode')} autoComplete="off" placeholder="EMP001" />
            <Input label="ID number" defaultValue={form.idNumber} onChange={set('idNumber')} autoComplete="off" placeholder="9001015009087" />
          </div>
          <Input label="Start date" type="date" defaultValue={form.startDate} onChange={set('startDate')} />
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2EDE5]">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving}>Add employee</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
