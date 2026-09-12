'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, invites, InvitePreview, OrgRole } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtDate } from '@/lib/utils';

type Stage = 'loading' | 'invalid' | 'expired' | 'ready' | 'accepting' | 'done' | 'error';

const ROLE_LABEL: Record<OrgRole, string> = { OWNER: 'Owner', ADMIN: 'Admin', STAFF: 'Staff' };
const ROLE_DESC: Record<OrgRole, string> = {
    OWNER: 'Full access including billing and organisation settings',
    ADMIN: 'Full access except billing and organisation deletion',
    STAFF: 'View-only — can see employees and payslips',
};

export default function InvitePage() {
    const { token } = useParams<{ token: string }>();
    const router = useRouter();

    const [stage, setStage] = useState<Stage>('loading');
    const [preview, setPreview] = useState<InvitePreview | null>(null);
    const [tab, setTab] = useState<'signin' | 'register'>('signin');
    const [error, setError] = useState('');
    const [companyName, setCompanyName] = useState('');

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function acceptInvite() {
        try {
            const result = await invites.accept(token);
            setCompanyName(result.companyName);
            setStage('done');
            setTimeout(() => router.push('/dashboard'), 2000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to accept invite');
            setStage('error');
        }
    }

    useEffect(() => {
        async function loadInvite() {
            try {
                setStage("loading");

                const data = await invites.preview(token);

                setPreview(data);
                setEmail(data.email);

                if (
                    data.expired ||
                    new Date(data.expiresAt) < new Date()
                ) {
                    setStage("expired");
                    return;
                }

                const session = await auth.session();

                if (session?.user) {
                    setStage("accepting");
                    await acceptInvite();
                    return;
                }

                setStage("ready");
            } catch {
                setStage("invalid");
            }
        }

        if (token) {
            loadInvite();
        }
    }, [token]);

    async function handleSignIn(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await auth.signIn({ email, password });
            setStage('accepting');
            await acceptInvite();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Sign in failed');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await auth.signUp({ name, email, password });
            setStage('accepting');
            await acceptInvite();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    }

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
                width: '100%', maxWidth: 420,
                background: '#fff', border: '1px solid #E2EDE5',
                borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>

                {/* Loading */}
                {stage === 'loading' && (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                        <Spinner />
                        <p style={{ fontSize: 13, color: '#9A9890', marginTop: 16 }}>Loading your invite…</p>
                    </div>
                )}

                {/* Invalid */}
                {stage === 'invalid' && (
                    <StatusCard
                        icon="error"
                        title="Invalid invite"
                        body="This invite link isn't valid. It may have already been used or the link is incorrect. Ask the organisation owner to send you a new invite."
                    />
                )}

                {/* Expired */}
                {stage === 'expired' && preview && (
                    <StatusCard
                        icon="clock"
                        title="Invite expired"
                        body={`Your invite to join ${preview.companyName} expired on ${fmtDate(preview.expiresAt)}. Ask the organisation owner to send a new one.`}
                    />
                )}

                {/* Accepting */}
                {stage === 'accepting' && (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                        <Spinner />
                        <p style={{ fontSize: 13, color: '#9A9890', marginTop: 16 }}>Joining the organisation…</p>
                    </div>
                )}

                {/* Done */}
                {stage === 'done' && (
                    <div style={{ padding: '40px 36px', textAlign: 'center' }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: '50%', background: '#EAF2EC',
                            border: '1px solid #C8D9CC', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 20px',
                            animation: 'popIn .4s cubic-bezier(.34,1.56,.64,1) both',
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12l4.5 4.5 9-9" stroke="#1A3D2B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: '#0D0D0D', marginBottom: 8 }}>
                            You&apos;re in.
                        </h2>
                        <p style={{ fontSize: 13, color: '#6B6860', lineHeight: 1.7 }}>
                            You&apos;ve joined <strong>{companyName}</strong>. Taking you to the dashboard…
                        </p>
                    </div>
                )}

                {/* Error */}
                {stage === 'error' && (
                    <div style={{ padding: '40px 36px', textAlign: 'center' }}>
                        <StatusCard icon="error" title="Something went wrong" body={error} />
                        <div style={{ marginTop: 20 }}>
                            <Button variant="ghost" onClick={() => router.push('/login')}>Go to sign in</Button>
                        </div>
                    </div>
                )}

                {/* Ready — invite card + auth */}
                {stage === 'ready' && preview && (
                    <>
                        {/* Invite header */}
                        <div style={{ background: '#1A3D2B', padding: '28px 32px' }}>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                                You&apos;ve been invited
                            </p>
                            <p style={{ fontSize: 17, fontWeight: 600, color: '#fff', fontFamily: 'DM Sans, sans-serif', marginBottom: 12 }}>
                                Join {preview.companyName}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                                    background: preview.role === 'ADMIN' ? 'rgba(212,144,26,0.25)' : 'rgba(255,255,255,0.12)',
                                    color: preview.role === 'ADMIN' ? '#E8C87A' : 'rgba(255,255,255,0.65)',
                                }}>
                                    {ROLE_LABEL[preview.role]}
                                </span>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                                    {ROLE_DESC[preview.role]}
                                </span>
                            </div>
                        </div>

                        {/* Expiry notice */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '9px 20px', background: '#FDF6E3',
                            borderBottom: '1px solid #E8C87A',
                        }}>
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                <circle cx="6.5" cy="6.5" r="5.5" stroke="#92600A" strokeWidth="1.3" />
                                <path d="M6.5 4v3l1.5 1.5" stroke="#92600A" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                            <p style={{ fontSize: 11, color: '#92600A' }}>
                                Invite expires {fmtDate(preview.expiresAt)}
                            </p>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #E2EDE5' }}>
                            {(['signin', 'register'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => { setTab(t); setError(''); }}
                                    style={{
                                        flex: 1, padding: '12px 0',
                                        fontSize: 13, fontWeight: tab === t ? 500 : 400,
                                        color: tab === t ? '#0D0D0D' : '#9A9890',
                                        background: 'transparent', border: 'none',
                                        borderBottom: tab === t ? '2px solid #1A3D2B' : '2px solid transparent',
                                        cursor: 'pointer', transition: 'all .15s', marginBottom: -1,
                                    }}
                                >
                                    {t === 'signin' ? 'Sign in' : 'Create account'}
                                </button>
                            ))}
                        </div>

                        {/* Sign in */}
                        {tab === 'signin' && (
                            <form onSubmit={handleSignIn} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <p style={{ fontSize: 13, color: '#6B6860' }}>
                                    Sign in with the account for <strong>{preview.email}</strong>.
                                </p>
                                <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                                <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
                                {error && <ErrorMsg>{error}</ErrorMsg>}
                                <Button type="submit" variant="primary" loading={submitting} className="w-full justify-center">
                                    Sign in and join {preview.companyName}
                                </Button>
                                <p style={{ fontSize: 11, color: '#9A9890', textAlign: 'center' }}>
                                    No account?{' '}
                                    <InlineBtn onClick={() => setTab('register')}>Create one</InlineBtn>
                                </p>
                            </form>
                        )}

                        {/* Register */}
                        {tab === 'register' && (
                            <form onSubmit={handleRegister} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <p style={{ fontSize: 13, color: '#6B6860' }}>
                                    Create an account to join <strong>{preview.companyName}</strong>.
                                </p>
                                <Input label="Your name" value={name} onChange={e => setName(e.target.value)} placeholder="Nomsa Dlamini" required autoFocus />
                                <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" required autoComplete="new-password" hint="At least 8 characters" />
                                {error && <ErrorMsg>{error}</ErrorMsg>}
                                <Button type="submit" variant="primary" loading={submitting} className="w-full justify-center">
                                    Create account and join {preview.companyName}
                                </Button>
                                <p style={{ fontSize: 11, color: '#9A9890', textAlign: 'center' }}>
                                    Already have an account?{' '}
                                    <InlineBtn onClick={() => setTab('signin')}>Sign in</InlineBtn>
                                </p>
                            </form>
                        )}
                    </>
                )}
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=DM+Sans:wght@600;700&display=swap');
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes popIn { from { transform: scale(.5); opacity:0; } to { transform: scale(1); opacity:1; } }
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

function StatusCard({ icon, title, body }: { icon: 'error' | 'clock'; title: string; body: string }) {
    const isError = icon === 'error';
    return (
        <div style={{ padding: '40px 36px', textAlign: 'center' }}>
            <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: isError ? '#FEF2F2' : '#FDF6E3',
                border: `1px solid ${isError ? '#FECACA' : '#E8C87A'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
            }}>
                {isError ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 6v5M10 14h.01" stroke="#B91C1C" strokeWidth="1.8" strokeLinecap="round" />
                        <circle cx="10" cy="10" r="8.5" stroke="#B91C1C" strokeWidth="1.5" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="8.5" stroke="#92600A" strokeWidth="1.5" />
                        <path d="M10 6v4l2.5 2.5" stroke="#92600A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: '#0D0D0D', marginBottom: 8 }}>
                {title}
            </h2>
            <p style={{ fontSize: 13, color: '#6B6860', lineHeight: 1.7 }}>{body}</p>
        </div>
    );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
    return (
        <p style={{ fontSize: 12, color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '8px 12px' }}>
            {children}
        </p>
    );
}

function InlineBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} style={{ color: '#2D6A4F', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>
            {children}
        </button>
    );
}
