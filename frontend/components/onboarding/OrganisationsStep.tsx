import { StepHeading } from '@/components/ui/StepHeading';
import { InlinePrimaryButton } from '@/components/ui/InlinePrimaryButton';
import { Employer } from '@/lib/api/types';

interface OrganisationsStepProps {
    resuming: boolean;
    employer: Employer | null;
    onGoToCreate: () => void;
    onGoToPlan: () => void;
}

export function OrganisationsStep({ resuming, employer, onGoToCreate, onGoToPlan }: OrganisationsStepProps) {
    return (
        <div>
            {resuming && (
                <div style={{
                    background: '#EAF2EC', border: '1px solid #C8D9CC',
                    borderRadius: 8, padding: '10px 14px', marginBottom: 24,
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <span style={{ fontSize: 12, color: '#2D6A4F' }}>
                        Welcome back — let&apos;s pick up where you left off.
                    </span>
                </div>
            )}
            <StepHeading
                eyebrow={`Signed in as ${employer?.user?.email ?? ''}`}
                title="Your organisations"
                subtitle="Organisations you manage appear here. Each organisation has its own employees, payslips, and plan."
            />
            {employer ? (
                <div style={{
                    background: '#fff', border: '1px solid #E2EDE5', borderRadius: 10,
                    padding: '16px 18px', marginBottom: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: '#EAF2EC', border: '1px solid #C8D9CC',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 600, color: '#2D6A4F',
                        }}>
                            {employer.companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 500, color: '#0D0D0D' }}>{employer.companyName}</p>
                            <p style={{ fontSize: 11, color: '#9A9890' }}>{employer.plan} plan</p>
                        </div>
                    </div>
                    <button
                        onClick={onGoToPlan}
                        style={{
                            background: '#1A3D2B', color: '#fff', border: 'none',
                            borderRadius: 6, padding: '7px 14px', fontSize: 12,
                            fontWeight: 500, cursor: 'pointer',
                        }}
                    >
                        Continue →
                    </button>
                </div>
            ) : (
                <div style={{
                    background: '#fff', border: '1.5px dashed #C8D9CC',
                    borderRadius: 10, padding: '28px', marginBottom: 16,
                    textAlign: 'center',
                }}>
                    <p style={{ fontSize: 13, color: '#9A9890', marginBottom: 4 }}>No organisations yet</p>
                    <p style={{ fontSize: 12, color: '#C8D9CC' }}>Create one to get started</p>
                </div>
            )}
            <InlinePrimaryButton onClick={onGoToCreate} loading={false}>
                {employer ? 'Create another organisation' : 'Create organisation'}
            </InlinePrimaryButton>
        </div>
    );
}