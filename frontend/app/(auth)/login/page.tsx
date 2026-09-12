'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, onboarding } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setUnverified(null);
    setResent(false);
    setLoading(true);
    try {
      await auth.signIn({ email, password });

      const session = await auth.session();
      if (session?.user && session.user.emailVerified === false) {
        setUnverified(session.user.email);
        return;
      }

      // Check onboarding status — new users go to /onboarding, returning users to /dashboard
      const status = await onboarding.status();
      if (status.step === 'complete') {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!unverified) return;
    setResending(true);
    setResent(false);
    try {
      await auth.sendVerificationEmail({
        email: unverified,
        callbackURL: `${window.location.origin}/verify-email`,
      });
      setResent(true);
    } catch {
      setResent(false);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="bg-white border border-[#E2EDE5] rounded-xl p-7 shadow-sm">
      <h2 className="text-[18px] font-semibold text-[#0D0D0D] mb-1">
        Sign in
      </h2>
      <p className="text-[12px] text-[#9A9890] mb-6">Manage your payroll from here.</p>

      {unverified && (
        <div className="mb-5 rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5">
          <p className="text-[12px] text-[#92400E]">
            Your email isn&apos;t verified yet. Check your inbox for the link we sent, or{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-medium text-[#2D6A4F] hover:underline disabled:opacity-50"
            >
              {resending ? 'Sending…' : 'resend it'}
            </button>
            .
          </p>
          {resent && (
            <p className="text-[12px] text-[#2D6A4F] mt-1">
              Verification email sent — check your inbox.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="admin@company.co.za"
          required
          autoComplete="email"
        />
        <div>
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          <div className="mt-1.5 text-right">
            <Link
              href="/forgot-password"
              className="text-[12px] text-[#2D6A4F] hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        {error && (
          <p className="text-[12px] text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <Button variant="primary" type="submit" loading={loading} className="w-full justify-center mt-1">
          Sign in
        </Button>
      </form>

      <p className="text-[12px] text-[#9A9890] mt-5 text-center">
        No account?{' '}
        <Link href="/register" className="text-[#2D6A4F] hover:underline font-medium">
          Register your company
        </Link>
      </p>
    </div>
  );
}