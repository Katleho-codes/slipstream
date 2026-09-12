'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await auth.signUp(form);
      router.push('/onboarding');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-[#E2EDE5] rounded-xl p-7 shadow-sm">
      <h2 className="text-[18px] font-semibold text-[#0D0D0D] mb-1" >
        Create your account
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Your name"
          value={form.name}
          onChange={set('name')}
          placeholder="Katleho Mabala"
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="admin@company.co.za"
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={set('password')}
          placeholder="Minimum 8 characters"
          required
          autoComplete="new-password"
          hint="At least 8 characters"
        />
        {error && (
          <p className="text-[12px] text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <Button variant="primary" type="submit" loading={loading} className="w-full justify-center mt-1">
          Create account
        </Button>
      </form>

      <p className="text-[12px] text-[#9A9890] mt-5 text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-[#2D6A4F] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
