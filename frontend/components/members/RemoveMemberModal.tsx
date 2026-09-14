import { useState } from 'react';
import { members as membersApi } from '@/lib/api';
import { OrgMember } from '@/lib/api/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface RemoveMemberModalProps {
    target: OrgMember | null;
    onClose: () => void;
    onRemoved: (userId: string) => void;
}

export function RemoveMemberModal({ target, onClose, onRemoved }: RemoveMemberModalProps) {
    const { toast } = useToast();
    const [removing, setRemoving] = useState(false);

    async function handleRemove() {
        if (!target) return;
        setRemoving(true);
        try {
            await membersApi.remove(target.user.id);
            onRemoved(target.user.id);
            toast(`${target.user.name} removed`);
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : 'Failed to remove', 'error');
        } finally {
            setRemoving(false);
        }
    }

    return (
        <Modal open={!!target} onClose={onClose} title="Remove member" width="sm">
            <div className="flex flex-col gap-4">
                <p className="text-[13px] text-[#3A3A3A] leading-relaxed">
                    Remove <strong>{target?.user.name}</strong> ({target?.user.email}) from your organisation?
                    They will immediately lose access to all employees, payslips, and company data.
                </p>
                <div className="flex justify-end gap-2 pt-1 border-t border-[#E2EDE5]">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button variant="danger" loading={removing} onClick={handleRemove}>Remove member</Button>
                </div>
            </div>
        </Modal>
    );
}