import { useState } from 'react';
import { members as membersApi } from '@/lib/api';
import { OrgRole } from '@/lib/api/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
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

interface InviteModalProps {
    open: boolean;
    onClose: () => void;
    onInvited: (invite: { id: string; email: string; role: OrgRole; expiresAt: string }) => void;
}

export function InviteModal({ open, onClose, onInvited }: InviteModalProps) {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
    const [inviting, setInviting] = useState(false);

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        setInviting(true);
        try {
            const invite = await membersApi.invite({ email, role });
            onInvited(invite);
            setEmail('');
            setRole('STAFF');
            toast(`Invite sent to ${invite.email}`);
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : 'Failed to send invite', 'error');
        } finally {
            setInviting(false);
        }
    }

    return (
        <Modal open={open} onClose={() => { onClose(); setEmail(''); }} title="Invite a member" width="sm">
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
                <Input
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="colleague@company.co.za"
                    required
                    autoFocus
                />
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6860]">Role</label>
                    <div className="flex flex-col gap-2">
                        <RoleRadioRow selected={role === 'ADMIN'} role="ADMIN" onClick={() => setRole('ADMIN')} />
                        <RoleRadioRow selected={role === 'STAFF'} role="STAFF" onClick={() => setRole('STAFF')} />
                    </div>
                </div>
                <p className="text-[11px] text-[#9A9890] bg-[#F7F5F1] rounded-md px-3 py-2">
                    They&apos;ll receive an email with a link to join. The invite expires in 48 hours.
                </p>
                <div className="flex justify-end gap-2 pt-1 border-t border-[#E2EDE5]">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={inviting}>Send invite</Button>
                </div>
            </form>
        </Modal>
    );
}