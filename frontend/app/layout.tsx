import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
})
export const metadata: Metadata = {
  title: 'SlipStream | Employer Dashboard',
  description: 'SlipStream is a multi-tenant digital payroll platform that enables employers to issue secure, verifiable payslips while allowing employees to access and share them instantly. It includes role-based access control, PDF generation, document verification, audit logging, and secure document storage',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
