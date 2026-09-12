'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, onboarding, Plan, Employer, CreateOrganisationDto } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'organisations' | 'create-organisation' | 'plan' | 'complete';

interface StepMeta {
    id: Step;
    label: string;
    leftHeading: string;
    leftBody: string;
}

const STEPS: StepMeta[] = [
    {
        id: 'organisations',
        label: 'Your organisations',
        leftHeading: 'Welcome to\nSlipStream.',
        leftBody: 'Payslips that work for South African employers and the people who work for them.',
    },
    {
        id: 'create-organisation',
        label: 'Organisation details',
        leftHeading: 'Tell us about\nyour company.',
        leftBody: 'This information appears on every payslip you issue. You can update it any time.',
    },
    {
        id: 'plan',
        label: 'Choose a plan',
        leftHeading: 'Pick the right\nplan for now.',
        leftBody: 'You can upgrade any time. No setup fees, no per-payslip charges.',
    },
];

const PLAN_CONFIG = [
    {
        id: 'STARTER' as Plan,
        name: 'Starter',
        price: 'R199',
        period: '/month',
        limit: 'Up to 10 employees',
        features: ['Unlimited payslips', 'Email delivery', 'PDF generation', 'QR verification', 'SARS-compliant layout'],
        featured: false,
    },
    {
        id: 'GROWTH' as Plan,
        name: 'Growth',
        price: 'R499',
        period: '/month',
        limit: 'Up to 50 employees',
        features: ['Everything in Starter', 'Custom deduction types', 'Branded payslips', 'Bulk issue', 'Priority support'],
        featured: true,
    },
    {
        id: 'BUSINESS' as Plan,
        name: 'Business',
        price: 'R999',
        period: '/month',
        limit: 'Up to 150 employees',
        features: ['Everything in Growth', 'API access', 'WhatsApp delivery', 'EMP201 export', 'Dedicated onboarding'],
        featured: false,
    },
];

// ─── Animation hook ────────────────────────────────────────────────────────────
function useStepTransition(step: Step) {
    const [displayStep, setDisplayStep] = useState<Step>(step);
    const [animState, setAnimState] = useState<'idle' | 'exit' | 'enter'>('idle');
    const prevStep = useRef<Step>(step);

    useEffect(() => {
        if (step === prevStep.current) return;
        setAnimState('exit');
        const t1 = setTimeout(() => {
            setDisplayStep(step);
            setAnimState('enter');
        }, 200);
        const t2 = setTimeout(() => {
            setAnimState('idle');
            prevStep.current = step;
        }, 420);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [step]);

    return { displayStep, animState };
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('organisations');
    const [resuming, setResuming] = useState(false);
    const [employer, setEmployer] = useState<Employer | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<Plan>('STARTER');

    const { displayStep, animState } = useStepTransition(step);

    // Organisation form state
    const [org, setOrg] = useState<CreateOrganisationDto>({
        companyName: '', regNumber: '', vatNumber: '', phone: '', address: '',
    });

    // ─── Load status on mount ──────────────────────────────────────────────────
    useEffect(() => {
        onboarding.status()
            .then(status => {
                setResuming(status.resuming);
                setEmployer(status.employer);
                if (status.step === 'complete') {
                    router.replace('/dashboard');
                    return;
                }
                setStep(status.step);
                if (status.employer) {
                    setOrg({
                        companyName: status.employer.companyName ?? '',
                        regNumber: status.employer.regNumber ?? '',
                        vatNumber: status.employer.vatNumber ?? '',
                        phone: status.employer.phone ?? '',
                        address: status.employer.address ?? '',
                    });
                    setSelectedPlan(status.employer.plan ?? 'STARTER');
                }
            })
            .catch(() => router.replace('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    // ─── Step handlers ─────────────────────────────────────────────────────────
    const goToCreate = useCallback(() => {
        setError('');
        setStep('create-organisation');
    }, []);

    const handleCreateOrg = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!org.companyName.trim()) { setError('Company name is required'); return; }
        setSaving(true);
        setError('');
        try {
            const created = await onboarding.createOrganisation(org);
            setEmployer(created);
            setStep('plan');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }, [org]);

    const handleSelectPlan = useCallback(async () => {
        setSaving(true);
        setError('');
        try {
            await onboarding.selectPlan(selectedPlan);
            setStep('complete');
            // Brief pause so the completion state is visible before redirect
            setTimeout(() => router.push('/dashboard'), 1200);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }, [selectedPlan, router]);

    const setOrgField = useCallback(
        (k: keyof CreateOrganisationDto) =>
            (e: React.ChangeEvent<HTMLInputElement>) =>
                setOrg(o => ({ ...o, [k]: e.target.value })),
        []
    );

    // ─── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#0F2318', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner color="#fff" />
            </div>
        );
    }

    const currentStepMeta = STEPS.find(s => s.id === displayStep) ?? STEPS[0];
    const stepIndex = STEPS.findIndex(s => s.id === step);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

            {/* ── Left panel ── */}
            <div style={{
                width: '360px', flexShrink: 0,
                background: '#0F2318',
                display: 'flex', flexDirection: 'column',
                padding: '40px 36px',
                position: 'sticky', top: 0, height: '100vh',
                overflow: 'hidden',
            }}>
                {/* Ambient gradient */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `radial-gradient(ellipse at 30% ${30 + stepIndex * 20}%, rgba(45,106,79,0.35) 0%, transparent 65%)`,
                    transition: 'background 0.8s ease',
                }} />

                {/* Watermark number */}
                <div style={{
                    position: 'absolute', right: -20, bottom: 40,
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 280, fontWeight: 700,
                    color: 'rgba(255,255,255,0.03)',
                    lineHeight: 1, pointerEvents: 'none',
                    userSelect: 'none', letterSpacing: '-10px',
                }}>
                    {stepIndex + 1}
                </div>

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56, position: 'relative' }}>
                    <div style={{
                        width: 30, height: 30, background: '#2D6A4F', borderRadius: 7,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#fff',
                    }}>L²</div>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, color: '#fff' }}>
                        Slip<span style={{ color: '#3D8B6A' }}>Stream</span>
                    </span>
                </div>

                {/* Step list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 48, position: 'relative' }}>
                    {STEPS.map((s, i) => {
                        const done = i < stepIndex;
                        const current = i === stepIndex;
                        return (
                            <div key={s.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                opacity: done ? 0.9 : current ? 1 : 0.35,
                                transition: 'opacity 0.4s ease',
                            }}>
                                <div style={{
                                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                    border: `1.5px solid ${done ? '#3D8B6A' : current ? '#fff' : 'rgba(255,255,255,0.3)'}`,
                                    background: done ? '#3D8B6A' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.3s ease',
                                }}>
                                    {done ? (
                                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                            <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    ) : (
                                        <span style={{ fontSize: 10, color: current ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                                            {i + 1}
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: 13, color: current ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: current ? 500 : 400 }}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Animated left copy */}
                <div style={{
                    position: 'relative', flex: 1,
                    opacity: animState === 'exit' ? 0 : 1,
                    transform: animState === 'exit' ? 'translateY(8px)' : 'translateY(0)',
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                }}>
                    <h2 style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 28, fontWeight: 700, color: '#fff',
                        lineHeight: 1.2, letterSpacing: '-0.02em',
                        marginBottom: 16, whiteSpace: 'pre-line',
                    }}>
                        {currentStepMeta.leftHeading}
                    </h2>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                        {currentStepMeta.leftBody}
                    </p>
                </div>

                {/* Sign out */}
                <button
                    onClick={async () => { await auth.signOut(); router.push('/login'); }}
                    style={{
                        marginTop: 32, background: 'transparent', border: 'none',
                        color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer',
                        textAlign: 'left', padding: 0, position: 'relative',
                    }}
                >
                    Sign out
                </button>
            </div>

            {/* ── Right panel ── */}
            <div style={{
                flex: 1, background: '#F7F5F1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '40px 48px', minHeight: '100vh',
                overflowY: 'auto',
            }}>
                <div style={{
                    width: '100%', maxWidth: 560,
                    opacity: animState === 'exit' ? 0 : 1,
                    transform: animState === 'exit' ? 'translateX(-24px)' : animState === 'enter' ? 'translateX(24px)' : 'translateX(0)',
                    transition: animState === 'exit'
                        ? 'opacity 0.18s ease, transform 0.18s ease'
                        : 'opacity 0.22s ease, transform 0.22s ease',
                }}>

                    {/* ── Step: Organisations ── */}
                    {displayStep === 'organisations' && (
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
                                        onClick={() => setStep('plan')}
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
                            <PrimaryButton onClick={goToCreate} loading={false}>
                                {employer ? 'Create another organisation' : 'Create organisation'}
                            </PrimaryButton>
                        </div>
                    )}

                    {/* ── Step: Create organisation ── */}
                    {displayStep === 'create-organisation' && (
                        <div>
                            <StepHeading
                                eyebrow="Step 2 of 3"
                                title="Organisation details"
                                subtitle="These details appear on every payslip you issue. You can update them any time."
                            />
                            <form onSubmit={handleCreateOrg} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <FormField
                                    label="Company name"
                                    required
                                    value={org.companyName}
                                    onChange={setOrgField('companyName')}
                                    placeholder="Prestige Clothing (Pty) Ltd"
                                    autoFocus
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <FormField
                                        label="Registration number"
                                        value={org.regNumber ?? ''}
                                        onChange={setOrgField('regNumber')}
                                        placeholder="2019/123456/07"
                                        hint="Optional — shown on payslips"
                                    />
                                    <FormField
                                        label="VAT number"
                                        value={org.vatNumber ?? ''}
                                        onChange={setOrgField('vatNumber')}
                                        placeholder="4123456789"
                                        hint="Optional"
                                    />
                                </div>
                                <FormField
                                    label="Phone number"
                                    value={org.phone ?? ''}
                                    onChange={setOrgField('phone')}
                                    placeholder="011 555 1234"
                                />
                                <FormField
                                    label="Business address"
                                    value={org.address ?? ''}
                                    onChange={setOrgField('address')}
                                    placeholder="14 Industry Road, Germiston, 1401"
                                    hint="Shown on payslips"
                                />
                                {error && <ErrorMessage>{error}</ErrorMessage>}
                                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                    <button
                                        type="button"
                                        onClick={() => setStep('organisations')}
                                        style={{
                                            background: 'transparent', color: '#6B6860',
                                            border: '1px solid #C8D9CC', borderRadius: 6,
                                            padding: '9px 18px', fontSize: 13, fontWeight: 500,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Back
                                    </button>
                                    <PrimaryButton type="submit" loading={saving} style={{ flex: 1 }}>
                                        Save and continue
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ── Step: Plan ── */}
                    {displayStep === 'plan' && (
                        <div>
                            <StepHeading
                                eyebrow="Step 3 of 3 — almost there"
                                title="Choose your plan"
                                subtitle="All plans include unlimited payslips, PDF generation, and QR verification. Change plans any time."
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                                {PLAN_CONFIG.map(plan => (
                                    <button
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        style={{
                                            background: selectedPlan === plan.id ? '#fff' : '#fff',
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
                                                    {/* Radio */}
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
                            {error && <ErrorMessage>{error}</ErrorMessage>}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    onClick={() => setStep('create-organisation')}
                                    style={{
                                        background: 'transparent', color: '#6B6860',
                                        border: '1px solid #C8D9CC', borderRadius: 6,
                                        padding: '9px 18px', fontSize: 13, fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Back
                                </button>
                                <PrimaryButton onClick={handleSelectPlan} loading={saving} style={{ flex: 1 }}>
                                    Start with {PLAN_CONFIG.find(p => p.id === selectedPlan)?.name} →
                                </PrimaryButton>
                            </div>
                            <p style={{ fontSize: 11, color: '#9A9890', textAlign: 'center', marginTop: 14 }}>
                                Starter is free forever for up to 10 employees. No credit card required.
                            </p>
                        </div>
                    )}

                    {/* ── Step: Complete ── */}
                    {displayStep === 'complete' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: '50%',
                                background: '#EAF2EC', border: '2px solid #C8D9CC',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px',
                                animation: 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                            }}>
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                    <path d="M6 14l5.5 5.5 10-10" stroke="#1A3D2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 700, color: '#0D0D0D', marginBottom: 8 }}>
                                You&apos;re all set.
                            </h2>
                            <p style={{ fontSize: 14, color: '#6B6860', marginBottom: 24 }}>
                                Taking you to your dashboard…
                            </p>
                            <Spinner color="#1A3D2B" />
                        </div>
                    )}

                </div>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        input::placeholder { color: #9A9890; }
        input:focus { outline: none; }
        button:focus-visible { outline: 2px solid #2D6A4F; outline-offset: 2px; }
      `}</style>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
    return (
        <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A9890', marginBottom: 8 }}>
                {eyebrow}
            </p>
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 700, color: '#0D0D0D', letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.2 }}>
                {title}
            </h1>
            <p style={{ fontSize: 14, color: '#6B6860', lineHeight: 1.65 }}>{subtitle}</p>
        </div>
    );
}

function FormField({ label, value, onChange, placeholder, hint, required, autoFocus }: {
    label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string; hint?: string; required?: boolean; autoFocus?: boolean;
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6860' }}>
                {label}{required && <span style={{ color: '#B91C1C', marginLeft: 2 }}>*</span>}
            </label>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                autoFocus={autoFocus}
                style={{
                    padding: '9px 12px', fontSize: 13, borderRadius: 6,
                    border: '1px solid #C8D9CC', background: '#fff',
                    color: '#0D0D0D', width: '100%',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#2D6A4F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.1)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#C8D9CC'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {hint && <p style={{ fontSize: 11, color: '#9A9890' }}>{hint}</p>}
        </div>
    );
}

function PrimaryButton({ children, onClick, loading, type = 'button', style: extraStyle }: {
    children: React.ReactNode; onClick?: () => void; loading?: boolean;
    type?: 'button' | 'submit'; style?: React.CSSProperties;
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={loading}
            style={{
                background: loading ? '#2D6A4F' : '#1A3D2B',
                color: '#fff', border: 'none', borderRadius: 6,
                padding: '10px 20px', fontSize: 13, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
                fontFamily: 'Inter, sans-serif',
                ...extraStyle,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2D6A4F'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1A3D2B'; }}
        >
            {loading && <Spinner color="#fff" size={14} />}
            {children}
        </button>
    );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 6, padding: '10px 14px',
            fontSize: 13, color: '#B91C1C', lineHeight: 1.5,
        }}>
            {children}
        </div>
    );
}

function Spinner({ color = '#1A3D2B', size = 18 }: { color?: string; size?: number }) {
    return (
        <div style={{
            width: size, height: size,
            border: `2px solid ${color}30`,
            borderTopColor: color,
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            flexShrink: 0,
        }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}