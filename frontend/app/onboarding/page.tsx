'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, onboarding, Employer, CreateOrganisationDto } from '@/lib/api';
import { Plan } from '@/lib/api/types';
import { PLANS } from '@/lib/plans';
import { useStepTransition } from '@/lib/hooks/useStepTransition';
import { Spinner } from '@/components/ui/Spinner';
import { OnboardingSidebar } from '@/components/onboarding/OnboardingSidebar';
import { OrganisationsStep } from '@/components/onboarding/OrganisationsStep';
import { CreateOrganisationStep } from '@/components/onboarding/CreateOrganisationStep';
import { PlanStep } from '@/components/onboarding/PlanStep';
import { CompleteStep } from '@/components/onboarding/CompleteStep';

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

    const [org, setOrg] = useState<CreateOrganisationDto>({
        companyName: '', regNumber: '', vatNumber: '', phone: '', address: '',
    });

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
            <OnboardingSidebar
                steps={STEPS}
                stepIndex={stepIndex}
                displayStep={displayStep}
                animState={animState}
                currentStepMeta={currentStepMeta}
                onSignOut={async () => { await auth.signOut(); router.push('/login'); }}
            />

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
                    {displayStep === 'organisations' && (
                        <OrganisationsStep
                            resuming={resuming}
                            employer={employer}
                            onGoToCreate={goToCreate}
                            onGoToPlan={() => setStep('plan')}
                        />
                    )}

                    {displayStep === 'create-organisation' && (
                        <CreateOrganisationStep
                            org={org}
                            error={error}
                            saving={saving}
                            onOrgField={setOrgField}
                            onSubmit={handleCreateOrg}
                            onBack={() => setStep('organisations')}
                        />
                    )}

                    {displayStep === 'plan' && (
                        <PlanStep
                            plans={PLANS}
                            selectedPlan={selectedPlan}
                            error={error}
                            saving={saving}
                            onSelectPlan={setSelectedPlan}
                            onConfirm={handleSelectPlan}
                            onBack={() => setStep('create-organisation')}
                        />
                    )}

                    {displayStep === 'complete' && <CompleteStep />}
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