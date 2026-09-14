import { useState } from 'react';
import { payslips as payslipsApi } from '@/lib/api';
import { Payslip, PayPeriod, Employee, CreatePayslipDto } from '@/lib/api/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

interface CreatePayslipModalProps {
    open: boolean;
    onClose: () => void;
    periods: PayPeriod[];
    employees: Employee[];
    onCreated: (slip: Payslip) => void;
}

export function CreatePayslipModal({ open, onClose, periods, employees, onCreated }: CreatePayslipModalProps) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<CreatePayslipDto>({
        employeeId: '', periodId: '', grossSalary: 0,
        overtimePay: 0, bonus: 0, allowances: 0,
        paye: 0, sdl: 0, deductions: [],
    });

    const numField = (k: keyof CreatePayslipDto) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [k]: parseFloat(e.target.value) || 0 }));

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const slip = await payslipsApi.create(form);
            onCreated(slip);
            onClose();
            toast('Payslip created');
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : 'Failed to create payslip', 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal open={open} onClose={onClose} title="Create payslip" width="md">
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-[#6B6860] uppercase tracking-wider">Employee</label>
                        <select
                            required
                            value={form.employeeId}
                            onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                            className="px-3 py-2 text-[13px] bg-white border border-[#C8D9CC] rounded-md outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]"
                        >
                            <option value="">Select employee</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-[#6B6860] uppercase tracking-wider">Pay period</label>
                        <select
                            required
                            value={form.periodId}
                            onChange={e => setForm(f => ({ ...f, periodId: e.target.value }))}
                            className="px-3 py-2 text-[13px] bg-white border border-[#C8D9CC] rounded-md outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]"
                        >
                            <option value="">Select period</option>
                            {periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="border-t border-[#E2EDE5] pt-3">
                    <p className="text-[11px] font-semibold text-[#9A9890] uppercase tracking-widest mb-3">Earnings</p>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Gross salary (R)" type="number" min="0" step="0.01" required
                            value={form.grossSalary || ''} onChange={numField('grossSalary')} />
                        <Input label="Overtime (R)" type="number" min="0" step="0.01"
                            value={form.overtimePay || ''} onChange={numField('overtimePay')} />
                        <Input label="Bonus (R)" type="number" min="0" step="0.01"
                            value={form.bonus || ''} onChange={numField('bonus')} />
                        <Input label="Allowances (R)" type="number" min="0" step="0.01"
                            value={form.allowances || ''} onChange={numField('allowances')} />
                    </div>
                </div>

                <div className="border-t border-[#E2EDE5] pt-3">
                    <p className="text-[11px] font-semibold text-[#9A9890] uppercase tracking-widest mb-3">Statutory deductions</p>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="PAYE (R)" type="number" min="0" step="0.01"
                            value={form.paye || ''} onChange={numField('paye')}
                            hint="Enter calculated PAYE" />
                        <Input label="UIF (R)" type="number" min="0" step="0.01"
                            value={form.uif || ''} onChange={numField('uif')}
                            hint="Leave blank to auto-calculate (1%)" />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#E2EDE5]">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={saving}>Create payslip</Button>
                </div>
            </form>
        </Modal>
    );
}