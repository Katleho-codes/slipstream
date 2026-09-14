import { StepHeading } from '@/components/ui/StepHeading';
import { InlinePrimaryButton } from '@/components/ui/InlinePrimaryButton';
import { InlineError } from '@/components/ui/InlineError';
import { Plan } from '@/lib/api/types';
import { PlanConfig } from '@/lib/plans';

interface PlanStepProps {
    plans: PlanConfig[];
    selectedPlan: Plan;
    error: string;
    saving: boolean;
    onSelectPlan: (plan: Plan) => void;
    onConfirm: () => void;
    onBack: () => void;
}

export function PlanStep({ plans, selectedPlan, error, saving, onSelectPlan, onConfirm, onBack }: PlanStepProps) {
    return (
        <div>
            <StepHeading
                eyebrow="Step 3 of 3 — almost there"
                title="Choose your plan"
                subtitle="All plans include unlimited payslips, PDF generation, and QR verification. Change plans any time."
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {plans.map(plan => (
                    <button
                        key={plan.id}
                        onClick={() => onSelectPlan(plan.id)}
                        style={{
                            background: '#fff',
                            border: selectedPlan === plan.id ? '2px solid #1A3D2B' : '1.5px solid #E2EDE5',
                            borderRadius: 10, padding: '18px 20px',
                            cursor: 'pointer', textAlign: 'left',
                            transition: 'border-color 0.15s, box-shadow 0.15s',
                            boxShadow: selectedPlan === plan.id ? '0 0 0 3px rgba(26,61,43,0.08)' : 'none',
                            position: 'relative',
                        }}
                    >
                        {plan.featured && (
                            <span style={{
                                position: 'absolute', top: -10, right: 16,
                                background: '#1A3D2B', color: '#fff',
                                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                                padding: '3px 10px', borderRadius: 20,
                            }}>POPULAR</span>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                    <div style={{
                                        width: 18, height: 18, borderRadius: '50%',
                                        border: `2px solid ${selectedPlan === plan.id ? '#1A3D2B' : '#C8D9CC'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'border-color 0.15s',
                                        flexShrink: 0,
                                    }}>
                                        {selectedPlan === plan.id && (
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1A3D2B' }} />
                                        )}
                                    </div>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: '#0D0D0D', fontFamily: 'DM Sans, sans-serif' }}>
                                        {plan.name}
                                    </span>
                                </div>
                                <p style={{ fontSize: 11, color: '#9A9890', marginLeft: 26 }}>{plan.limit}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: 22, fontWeight: 700, color: '#0D0D0D', fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>
                                    {plan.price}
                                </span>
                                <span style={{ fontSize: 12, color: '#9A9890' }}>{plan.period}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginLeft: 26 }}>
                            {plan.features.map(f => (
                                <span key={f} style={{ fontSize: 12, color: '#6B6860', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                        <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#2D6A4F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    {f}
                                </span>
                            ))}
                        </div>
                    </button>
                ))}
            </div>
            {error && <InlineError>{error}</InlineError>}
            <div style={{ display: 'flex', gap: 10 }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'transparent', color: '#6B6860',
                        border: '1px solid #C8D9CC', borderRadius: 6,
                        padding: '9px 18px', fontSize: 13, fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    Back
                </button>
                <InlinePrimaryButton onClick={onConfirm} loading={saving} style={{ flex: 1 }}>
                    Start with {plans.find(p => p.id === selectedPlan)?.name} →
                </InlinePrimaryButton>
            </div>
            <p style={{ fontSize: 11, color: '#9A9890', textAlign: 'center', marginTop: 14 }}>
                Starter is free forever for up to 10 employees. No credit card required.
            </p>
        </div>
    );
}