import { Spinner } from '@/components/ui/Spinner';

export function CompleteStep() {
    return (
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
    );
}