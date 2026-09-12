'use client';

import { useEffect, useState } from 'react';
import { members as membersApi, employer as employerApi, OrgMember, OrgInvite, OrgRole } from '@/lib/api';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { useToast } from '@/components/ui/Toast';
import { fmtDateShort, initials } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<OrgRole, string> = { OWNER: 'Owner', ADMIN: 'Admin', STAFF: 'Staff' };

const ROLE_DESC: Record<OrgRole, string> = {
    OWNER: 'Full access including billing and organisation settings',
    ADMIN: 'Full access except billing and org deletion',
    STAFF: 'View-only — can see employees and payslips',
};

const PERMISSIONS = [
    { label: 'View employees & payslips', owner: true, admin: true, staff: true },
    { label: 'Create & edit employees', owner: true, admin: true, staff: false },
    { label: 'Create & issue payslips', owner: true, admin: true, staff: false },
    { label: 'Manage pay periods', owner: true, admin: true, staff: false },
    { label: 'Invite & manage members', owner: true, admin: true, staff: false },
    { label: 'Update company profile', owner: true, admin: true, staff: false },
    { label: 'Change member roles', owner: true, admin: false, staff: false },
    { label: 'Billing & plan changes', owner: true, admin: false, staff: false },
    { label: 'Delete organisation', owner: true, admin: false, staff: false },
];

// ─── Small components ─────────────────────────────────────────────────────────

function roleChip(role: OrgRole) {
    if (role === 'OWNER') return <Chip variant="green">Owner</Chip>;
    if (role === 'ADMIN') return <Chip variant="amber">Admin</Chip>;
    return <Chip variant="muted">Staff</Chip>;
}

function Check() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mx-auto">
            <circle cx="7" cy="7" r="6" fill="#EAF2EC" />
            <path d="M4 7l2.5 2.5 4-4" stroke="#2D6A4F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function Cross() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mx-auto">
            <circle cx="7" cy="7" r="6" fill="#F7F5F1" />
            <path d="M5 5l4 4M9 5L5 9" stroke="#C8D9CC" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}

function RadioRow({ selected, role, onClick }: { selected: boolean; role: 'ADMIN' | 'STAFF'; onClick: () => void }) {
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
                <p className="text-[12px] text-[#9A9890]">{ROLE_DESC[role]}</p>
            </div>
        </button>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MembersPage() {
    const { toast } = useToast();

    const [memberList, setMemberList] = useState<OrgMember[]>([]);
    const [inviteList, setInviteList] = useState<OrgInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState('');

    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
    const [inviting, setInviting] = useState(false);

    const [roleTarget, setRoleTarget] = useState<OrgMember | null>(null);
    const [newRole, setNewRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
    const [roleChanging, setRoleChanging] = useState(false);

    const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);
    const [removing, setRemoving] = useState(false);

    useEffect(() => {
        let active = true;

        Promise.all([
            membersApi.list(),
            membersApi.listInvites(),
            employerApi.me(),
        ])
            .then(([m, i, profile]) => {
                if (!active) return;
                setMemberList(m);
                setInviteList(i);
                setCurrentUserId(profile.user?.id ?? '');
            })
            .catch(() => {
                if (active) toast('Failed to load members', 'error');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [toast]);

    // ─── Handlers ─────────────────────────────────────────────────────────────

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        setInviting(true);
        try {
            const invite = await membersApi.invite({ email: inviteEmail, role: inviteRole });
            setInviteList(l => [invite, ...l]);
            setInviteOpen(false);
            setInviteEmail('');
            setInviteRole('STAFF');
            toast(`Invite sent to ${invite.email}`);
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : 'Failed to send invite', 'error');
        } finally {
            setInviting(false);
        }
    }

    async function handleRevokeInvite(invite: OrgInvite) {
        try {
            await membersApi.revokeInvite(invite.id);
            setInviteList(l => l.filter(i => i.id !== invite.id));
            toast('Invite revoked');
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : 'Failed to revoke', 'error');
        }
    }

    async function handleRoleChange(e: React.FormEvent) {
        e.preventDefault();
        if (!roleTarget) return;
        setRoleChanging(true);
        try {
            const updated = await membersApi.updateRole(roleTarget.user.id, newRole);
            setMemberList(l => l.map(m => m.user.id === roleTarget.user.id ? { ...m, role: updated.role } : m));
            setRoleTarget(null);
            toast(`${roleTarget.user.name}'s role updated to ${ROLE_LABEL[newRole]}`);
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : 'Failed to update role', 'error');
        } finally {
            setRoleChanging(false);
        }
    }

    async function handleRemove() {
        if (!removeTarget) return;
        setRemoving(true);
        try {
            await membersApi.remove(removeTarget.user.id);
            setMemberList(l => l.filter(m => m.user.id !== removeTarget.user.id));
            setRemoveTarget(null);
            toast(`${removeTarget.user.name} removed`);
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : 'Failed to remove', 'error');
        } finally {
            setRemoving(false);
        }
    }

    // ─── Derived state ────────────────────────────────────────────────────────

    const myRole = memberList.find(m => m.user.id === currentUserId)?.role ?? 'STAFF';
    const canManage = myRole === 'OWNER' || myRole === 'ADMIN';
    const isOwner = myRole === 'OWNER';

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <Topbar
                title="Members"
                subtitle={`${memberList.length} member${memberList.length !== 1 ? 's' : ''}`}
                actions={canManage ? (
                    <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5.5 1v9M1 5.5h9" strokeLinecap="round" />
                        </svg>
                        Invite member
                    </Button>
                ) : undefined}
            />

            <div className="p-7 flex-1 flex flex-col gap-6">

                {/* Members table */}
                <div>
                    <h2 className="text-[13px] font-semibold text-[#0D0D0D] mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        Organisation members
                    </h2>
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-5 h-5 border-2 border-[#1A3D2B] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="bg-white border border-[#E2EDE5] rounded-lg overflow-hidden">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-[#F7F5F1] border-b border-[#E2EDE5]">
                                        {['Member', 'Role', 'Permissions', 'Joined', ''].map(h => (
                                            <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9A9890] uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {memberList.map(member => {
                                        const isMe = member.user.id === currentUserId;
                                        const canEdit = isOwner && !isMe && member.role !== 'OWNER';
                                        return (
                                            <tr key={member.id} className="border-b border-[#E2EDE5] last:border-0 hover:bg-[#F7F5F1] transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-[#EAF2EC] border border-[#C8D9CC] flex items-center justify-center text-[11px] font-semibold text-[#2D6A4F] shrink-0">
                                                            {initials(member.user.name)}
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-medium text-[#0D0D0D]">
                                                                {member.user.name}
                                                                {isMe && <span className="ml-2 text-[10px] text-[#9A9890] font-normal">(you)</span>}
                                                            </p>
                                                            <p className="text-[11px] text-[#9A9890]">{member.user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">{roleChip(member.role)}</td>
                                                <td className="px-4 py-3 text-[12px] text-[#6B6860]">{ROLE_DESC[member.role]}</td>
                                                <td className="px-4 py-3 text-[12px] text-[#9A9890]">{fmtDateShort(member.joinedAt)}</td>
                                                <td className="px-4 py-3">
                                                    {canEdit && (
                                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                                            <Button size="sm" variant="ghost" onClick={() => { setRoleTarget(member); setNewRole(member.role as 'ADMIN' | 'STAFF'); }}>
                                                                Change role
                                                            </Button>
                                                            <Button size="sm" variant="danger" onClick={() => setRemoveTarget(member)}>
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pending invites */}
                {canManage && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[13px] font-semibold text-[#0D0D0D]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                                Pending invites
                            </h2>
                            {inviteList.length > 0 && <Chip variant="amber">{inviteList.length} pending</Chip>}
                        </div>
                        {inviteList.length === 0 ? (
                            <div className="bg-white border border-[#E2EDE5] rounded-lg px-5 py-8 text-center">
                                <p className="text-[13px] text-[#9A9890]">No pending invites</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-[#E2EDE5] rounded-lg overflow-hidden">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#F7F5F1] border-b border-[#E2EDE5]">
                                            {['Email', 'Role', 'Expires', ''].map(h => (
                                                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9A9890] uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inviteList.map(invite => {
                                            const expired = new Date(invite.expiresAt) < new Date();
                                            return (
                                                <tr key={invite.id} className="border-b border-[#E2EDE5] last:border-0 hover:bg-[#F7F5F1] transition-colors group">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-[#F7F5F1] border border-[#E2EDE5] flex items-center justify-center text-[#9A9890] shrink-0">
                                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
                                                                    <circle cx="7" cy="5" r="2.5" />
                                                                    <path d="M2 13c0-3 2-4.5 5-4.5s5 1.5 5 4.5" strokeLinecap="round" />
                                                                </svg>
                                                            </div>
                                                            <p className="text-[13px] text-[#3A3A3A]">{invite.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">{roleChip(invite.role)}</td>
                                                    <td className="px-4 py-3 text-[12px]" style={{ color: expired ? '#B91C1C' : '#9A9890' }}>
                                                        {expired ? 'Expired ' : ''}{fmtDateShort(invite.expiresAt)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                                            <Button size="sm" variant="danger" onClick={() => handleRevokeInvite(invite)}>Revoke</Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Permissions reference table */}
                <div className="bg-white border border-[#E2EDE5] rounded-lg overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#E2EDE5]">
                        <p className="text-[12px] font-semibold text-[#0D0D0D]" style={{ fontFamily: 'DM Sans, sans-serif' }}>Role permissions</p>
                    </div>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#F7F5F1] border-b border-[#E2EDE5]">
                                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9A9890] uppercase tracking-widest">Action</th>
                                {(['OWNER', 'ADMIN', 'STAFF'] as OrgRole[]).map(r => (
                                    <th key={r} className="text-center px-4 py-2.5 text-[10px] font-semibold text-[#9A9890] uppercase tracking-widest">
                                        {ROLE_LABEL[r]}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {PERMISSIONS.map(row => (
                                <tr key={row.label} className="border-b border-[#E2EDE5] last:border-0">
                                    <td className="px-4 py-2.5 text-[12px] text-[#3A3A3A]">{row.label}</td>
                                    <td className="px-4 py-2.5">{row.owner ? <Check /> : <Cross />}</td>
                                    <td className="px-4 py-2.5">{row.admin ? <Check /> : <Cross />}</td>
                                    <td className="px-4 py-2.5">{row.staff ? <Check /> : <Cross />}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Invite modal */}
            <Modal open={inviteOpen} onClose={() => { setInviteOpen(false); setInviteEmail(''); }} title="Invite a member" width="sm">
                <form onSubmit={handleInvite} className="flex flex-col gap-4">
                    <Input
                        label="Email address"
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.co.za"
                        required
                        autoFocus
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6860]">Role</label>
                        <div className="flex flex-col gap-2">
                            <RadioRow selected={inviteRole === 'ADMIN'} role="ADMIN" onClick={() => setInviteRole('ADMIN')} />
                            <RadioRow selected={inviteRole === 'STAFF'} role="STAFF" onClick={() => setInviteRole('STAFF')} />
                        </div>
                    </div>
                    <p className="text-[11px] text-[#9A9890] bg-[#F7F5F1] rounded-md px-3 py-2">
                        They&apos;ll receive an email with a link to join. The invite expires in 48 hours.
                    </p>
                    <div className="flex justify-end gap-2 pt-1 border-t border-[#E2EDE5]">
                        <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={inviting}>Send invite</Button>
                    </div>
                </form>
            </Modal>

            {/* Change role modal */}
            <Modal open={!!roleTarget} onClose={() => setRoleTarget(null)} title={`Change role — ${roleTarget?.user.name ?? ''}`} width="sm">
                <form onSubmit={handleRoleChange} className="flex flex-col gap-4">
                    <p className="text-[13px] text-[#6B6860]">
                        Changing the role affects what {roleTarget?.user.name} can do across your organisation.
                    </p>
                    <div className="flex flex-col gap-2">
                        <RadioRow selected={newRole === 'ADMIN'} role="ADMIN" onClick={() => setNewRole('ADMIN')} />
                        <RadioRow selected={newRole === 'STAFF'} role="STAFF" onClick={() => setNewRole('STAFF')} />
                    </div>
                    <div className="flex justify-end gap-2 pt-1 border-t border-[#E2EDE5]">
                        <Button type="button" variant="ghost" onClick={() => setRoleTarget(null)}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={roleChanging} disabled={newRole === roleTarget?.role}>
                            Update role
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Remove confirm */}
            <Modal open={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove member" width="sm">
                <div className="flex flex-col gap-4">
                    <p className="text-[13px] text-[#3A3A3A] leading-relaxed">
                        Remove <strong>{removeTarget?.user.name}</strong> ({removeTarget?.user.email}) from your organisation?
                        They will immediately lose access to all employees, payslips, and company data.
                    </p>
                    <div className="flex justify-end gap-2 pt-1 border-t border-[#E2EDE5]">
                        <Button variant="ghost" onClick={() => setRemoveTarget(null)}>Cancel</Button>
                        <Button variant="danger" loading={removing} onClick={handleRemove}>Remove member</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}