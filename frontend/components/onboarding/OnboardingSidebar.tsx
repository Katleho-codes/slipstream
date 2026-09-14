interface StepMeta {
    id: string;
    label: string;
    leftHeading: string;
    leftBody: string;
}

interface OnboardingSidebarProps {
    steps: StepMeta[];
    stepIndex: number;
    displayStep: string;
    animState: 'idle' | 'exit' | 'enter';
    currentStepMeta: StepMeta;
    onSignOut: () => void;
}

export function OnboardingSidebar({ steps, stepIndex, animState, currentStepMeta, onSignOut }: OnboardingSidebarProps) {
    return (
        <div style={{
            width: '360px', flexShrink: 0,
            background: '#0F2318',
            display: 'flex', flexDirection: 'column',
            padding: '40px 36px',
            position: 'sticky', top: 0, height: '100vh',
            overflow: 'hidden',
        }}>
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `radial-gradient(ellipse at 30% ${30 + stepIndex * 20}%, rgba(45,106,79,0.35) 0%, transparent 65%)`,
                transition: 'background 0.8s ease',
            }} />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 48, position: 'relative' }}>
                {steps.map((s, i) => {
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
            <button
                onClick={onSignOut}
                style={{
                    marginTop: 32, background: 'transparent', border: 'none',
                    color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer',
                    textAlign: 'left', padding: 0, position: 'relative',
                }}
            >
                Sign out
            </button>
        </div>
    );
}