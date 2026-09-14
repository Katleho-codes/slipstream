import { useState } from 'react';
import { members as membersApi } from '@/lib/api';
import { OrgMember, OrgRole } from '@/lib/api/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

const ROLE_LABEL: Record<OrgRole, string> = { OWNER: 'Owner', ADMIN: 'Admin', STAFF: 'Staff' };

function RoleRadioRow({ selected, role, onClick }: { selected: boolean; role: 'ADMIN' | 'STAFF'; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-start gap-3 text-left p-3 rounded-lg transition-all w-full"
            style={{
                border: selected ? '2px solid #1A3D2B' : '1.5px solid #E2EDE5',
                background: '#fff',
                boxShadow: selected ? '0 0 0 3px rgba(26,61,43,0.06)' : 'none',
            }}
        >
            <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                border: `2px solid ${selected ? '#1A3D2B' : '#C8D9CC'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1A3D2B' }} />}
            </div>
            <div>
                <p className="text-[13px] font-medium text-[#0D0D0D]">{ROLE_LABEL[role]}</p>
                <p className="text-[12px] text-[#9A9890]">{role === 'ADMIN' ? 'Full access except billing and org deletion' : 'View-only — can see employees and payslips'}</p>
            </div>
        </button>
    );
}

interface ChangeRoleModalProps {
    target: OrgMember | null;
    onClose: () => void;
    onChanged: (userId: string, role: OrgRole) => void;
}

export function ChangeRoleModal({ target, onClose, onChanged }: ChangeRoleModalProps) {
    const { toast } = useToast();
    const [newRole, setNewRole] = useState<'ADMIN' | 'STAFF'>(target?.role === 'ADMIN' ? 'ADMIN' : 'STAFF');
    const [roleChanging, setRoleChanging] = useState(false);

    async function handleRoleChange(e: React.FormEvent) {
        e.preventDefault();
        if (!target) return;
        setRoleChanging(true);
        try {
            const updated = await membersApi.updateRole(target.user.id, newRole);
            onChanged(target.user.id, updated.role);
            toast(`${target.user.name}'s role updated to ${ROLE_LABEL[newRole]}`);
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : 'Failed to update role', 'error');
        } finally {
            setRoleChanging(false);
        }
    }

    return (
        <Modal open={!!target} onClose={onClose} title={`Change role — ${target?.user.name ?? ''}`} width="sm">
            <form onSubmit={handleRoleChange} className="flex flex-col gap-4">
                <p className="text-[13px] text-[#6B6860]">
                    Changing the role affects what {target?.user.name} can do across your organisation.
                </p>
                <div className="flex flex-col gap-2">
                    <RoleRadioRow selected={newRole === 'ADMIN'} role="ADMIN" onClick={() => setNewRole('ADMIN')} />
                    <RoleRadioRow selected={newRole === 'STAFF'} role="STAFF" onClick={() => setNewRole('STAFF')} />
                </div>
                <div className="flex justify-end gap-2 pt-1 border-t border-[#E2EDE5]">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={roleChanging} disabled={newRole === target?.role}>
                        Update role
                    </Button>
                </div>
            </form>
        </Modal>
    );
}