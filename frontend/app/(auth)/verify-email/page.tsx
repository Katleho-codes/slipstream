'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  if (error) {
    return (
      <div className="bg-white border border-[#E2EDE5] rounded-xl p-7 shadow-sm text-center">
        <div className="mx-auto mb-4 w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 5v6M10 14.5v.01" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-[14px] text-[#B91C1C] mb-2">
          Verification link invalid or expired
        </p>
        <p className="text-[12px] text-[#9A9890] mb-6">
          Sign in and request a new verification email if you still need to verify.
        </p>
        <Link
          href="/login"
          className="text-[12px] text-[#2D6A4F] hover:underline font-medium"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2EDE5] rounded-xl p-7 shadow-sm text-center">
      <div className="mx-auto mb-4 w-10 h-10 rounded-full bg-[#E1F5EE] flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M6 10L9 13L14 7" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-[14px] text-[#111] mb-2">Email verified</p>
      <p className="text-[12px] text-[#666] mb-6">
        Your email address has been confirmed. You can now sign in.
      </p>
      <Link
        href="/login"
        className="text-[12px] text-[#2D6A4F] hover:underline font-medium"
      >
        Sign in →
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white border border-[#E2EDE5] rounded-xl p-7 shadow-sm text-center">
          <p className="text-[14px] text-[#111]">Verifying…</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}