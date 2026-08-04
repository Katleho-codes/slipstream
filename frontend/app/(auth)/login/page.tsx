'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.signIn({ email, password });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-[#E2EDE5] rounded-xl p-7 shadow-sm">
      <h2 className="text-[18px] font-semibold text-[#0D0D0D] mb-1" >
        Sign in
      </h2>
      <p className="text-[12px] text-[#9A9890] mb-6">Manage your payroll from here.</p>

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
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
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
