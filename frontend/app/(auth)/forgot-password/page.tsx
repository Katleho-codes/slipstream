'use client';
import { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.requestPasswordReset({ email });
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-[#E2EDE5] rounded-xl p-7 shadow-sm">
      <h2 className="text-[18px] font-semibold text-[#0D0D0D] mb-1">
        Reset your password
      </h2>
      <p className="text-[12px] text-[#9A9890] mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {sent ? (
        <div className="text-center">
          <div className="mx-auto mb-4 w-10 h-10 rounded-full bg-[#E1F5EE] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 10L9 13L14 7" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-[14px] text-[#111] mb-2">Check your email</p>
          <p className="text-[12px] text-[#666] mb-6">
            If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
          </p>
          <Link
            href="/login"
            className="text-[12px] text-[#2D6A4F] hover:underline font-medium"
          >
            ← Back to sign in
          </Link>
        </div>
      ) : (
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
            Send reset link
          </Button>
        </form>
      )}

      {!sent && (
        <p className="text-[12px] text-[#9A9890] mt-5 text-center">
          Remember your password?{' '}
          <Link
            href="/login"
            className="text-[#2D6A4F] hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
