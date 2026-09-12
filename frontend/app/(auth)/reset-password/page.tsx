'use client';
import { useState } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await auth.resetPassword({ newPassword: password, token });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="bg-white border border-[#E2EDE5] rounded-xl p-7 shadow-sm text-center">
        <p className="text-[14px] text-[#B91C1C] mb-2">Invalid or missing reset link</p>
        <p className="text-[12px] text-[#9A9890] mb-6">
          This link is missing its token. Request a new one from the sign-in page.
        </p>
        <Link
          href="/forgot-password"
          className="text-[12px] text-[#2D6A4F] hover:underline font-medium"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return done ? (
    <div className="bg-white border border-[#E2EDE5] rounded-xl p-7 shadow-sm text-center">
      <div className="mx-auto mb-4 w-10 h-10 rounded-full bg-[#E1F5EE] flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M6 10L9 13L14 7" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-[14px] text-[#111] mb-2">Password updated</p>
      <p className="text-[12px] text-[#666] mb-6">
        Your password has been changed. You can now sign in.
      </p>
      <Link
        href="/login"
        className="text-[12px] text-[#2D6A4F] hover:underline font-medium"
      >
        Sign in →
      </Link>
    </div>
  ) : (
    <div className="bg-white border border-[#E2EDE5] rounded-xl p-7 shadow-sm">
      <h2 className="text-[18px] font-semibold text-[#0D0D0D] mb-1">
        Choose a new password
      </h2>
      <p className="text-[12px] text-[#9A9890] mb-6">
        Use at least 8 characters.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="New password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Minimum 8 characters"
          required
          autoComplete="new-password"
          hint="At least 8 characters"
        />
        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Repeat your password"
          required
          autoComplete="new-password"
        />
        {error && (
          <p className="text-[12px] text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <Button
          variant="primary"
          type="submit"
          loading={loading}
          className="w-full justify-center mt-1"
        >
          Update password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white border border-[#E2EDE5] rounded-xl p-7 shadow-sm text-center">
          <p className="text-[14px] text-[#111]">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}