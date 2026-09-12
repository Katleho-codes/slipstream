'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { payslips, PayslipVerifyPayload } from '@/lib/api';

type Stage = 'loading' | 'valid' | 'invalid';

const fmtMoney = (n: number) =>
    `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });

export default function VerifyPage() {
    const { token } = useParams<{ token: string }>();

    const [stage, setStage] = useState<Stage>('loading');
    const [data, setData] = useState<PayslipVerifyPayload | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const result = await payslips.publicVerify(token);
                if (cancelled) return;
                setData(result);
                setStage(result.valid ? 'valid' : 'invalid');
            } catch {
                if (cancelled) return;
                setStage('invalid');
            }
        }

        if (token) {
            load();
        }

        return () => {
            cancelled = true;
        };
    }, [token]);

    return (
        <div style={{
            minHeight: '100vh', background: '#F7F5F1',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px', fontFamily: 'Inter, sans-serif',
        }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 32 }}>
                <div style={{
                    width: 30, height: 30, background: '#1A3D2B', borderRadius: 7,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#fff',
                }}>L²</div>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, color: '#0D0D0D' }}>
                    Slip<span style={{ color: '#2D6A4F' }}>Stream</span>
                </span>
            </div>

            <div style={{
                width: '100%', maxWidth: 440,
                background: '#fff', border: '1px solid #E2EDE5',
                borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>

                {/* Loading */}
                {stage === 'loading' && (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                        <Spinner />
                        <p style={{ fontSize: 13, color: '#9A9890', marginTop: 16 }}>Verifying payslip…</p>
                    </div>
                )}

                {/* Valid */}
                {stage === 'valid' && data?.payslip && (
                    <>
                        <div style={{
                            background: '#1A3D2B', padding: '28px 32px',
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                        }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: '50%',
                                background: '#EAF2EC', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', flexShrink: 0,
                            }}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M4 10l4.5 4.5 8-8" stroke="#1A3D2B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                                    Verification
                                </p>
                                <p style={{ fontSize: 17, fontWeight: 600, color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>
                                    Authentic payslip
                                </p>
                            </div>
                        </div>

                        <div style={{ padding: '24px 28px' }}>
                            <p style={{ fontSize: 12, color: '#9A9890', marginBottom: 20, lineHeight: 1.6 }}>
                                This payslip was issued by SlipStream and matches the employer&apos;s records.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                                <Row label="Employer">{data.payslip.companyName}</Row>
                                <Row label="Employee">{data.payslip.employeeName}</Row>
                                {data.payslip.role && <Row label="Role">{data.payslip.role}</Row>}
                                <Row label="Period">{data.payslip.period}</Row>
                                <Row label="Pay date">{fmtDate(data.payslip.payDate)}</Row>
                                <Row label="Gross">{fmtMoney(data.payslip.grossSalary)}</Row>
                                <Row label="Issued">{fmtDate(data.payslip.issuedAt)}</Row>
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: '#F0F9F6', border: '1px solid #C8D9CC',
                                borderRadius: 8, padding: '14px 18px',
                            }}>
                                <span style={{ fontSize: 13, color: '#2D6A4F', fontWeight: 600 }}>Net pay</span>
                                <span style={{ fontSize: 20, fontWeight: 700, color: '#1A3D2B', fontFamily: 'DM Sans, sans-serif' }}>
                                    {fmtMoney(data.payslip.netPay)}
                                </span>
                            </div>

                            <p style={{ fontSize: 11, color: '#9A9890', textAlign: 'center', marginTop: 20 }}>
                                Issued via SlipStream · {fmtDate(data.payslip.issuedAt)}
                            </p>
                        </div>
                    </>
                )}

                {/* Invalid */}
                {stage === 'invalid' && (
                    <div style={{ padding: '40px 36px', textAlign: 'center' }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: '#FEF2F2', border: '1px solid #FECACA',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px',
                        }}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 6v5M10 14h.01" stroke="#B91C1C" strokeWidth="1.8" strokeLinecap="round" />
                                <circle cx="10" cy="10" r="8.5" stroke="#B91C1C" strokeWidth="1.5" />
                            </svg>
                        </div>
                        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: '#0D0D0D', marginBottom: 8 }}>
                            Not found
                        </h2>
                        <p style={{ fontSize: 13, color: '#6B6860', lineHeight: 1.7 }}>
                            This payslip couldn&apos;t be verified. The token may be invalid, expired, or the payslip doesn&apos;t exist.
                            Contact the employer if you believe this is an error.
                        </p>
                    </div>
                )}
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=DM+Sans:wght@600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
        </div>
    );
}

// ─── Micro components ─────────────────────────────────────────────────────────

function Spinner() {
    return (
        <div style={{
            width: 20, height: 20, border: '2px solid #1A3D2B',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin .7s linear infinite', margin: '0 auto',
        }} />
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontSize: 11, color: '#9A9890', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </span>
            <span style={{ fontSize: 13, color: '#111', fontWeight: 500, textAlign: 'right' }}>
                {children}
            </span>
        </div>
    );
}