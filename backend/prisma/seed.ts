import { PrismaClient } from '@prisma/client';
import { auth } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SlipStream dev database...\n');

  // Create user + employer via Better Auth
  const { user } = await auth.api.signUpEmail({
    body: {
      name: 'Prestige Clothing',
      email: 'admin@prestige-clothing.co.za',
      password: 'password123',
    },
  });
  console.log(`✅ User: ${user.email}`);

  // Better Auth's onUserCreate already created the Employer row.
  // Now update it with full company details.
  const employer = await prisma.employer.update({
    where: { userId: user.id },
    data: {
      companyName: 'Prestige Clothing (Pty) Ltd',
      regNumber: '2019/123456/07',
      phone: '011 555 1234',
      address: '14 Industry Road, Germiston, 1401',
    },
  });
  console.log(`✅ Employer: ${employer.companyName}`);

  // Seed employees
  const [thabo, nomsa] = await Promise.all([
    prisma.employee.create({
      data: {
        employerId: employer.id,
        firstName: 'Thabo', lastName: 'Mokoena',
        email: 'thabo.mokoena@email.com', phone: '071 234 5678',
        idNumber: '9001015009087', role: 'Machine Operator',
        department: 'Factory Floor', employeeCode: 'EMP001',
        startDate: new Date('2021-03-01'),
      },
    }),
    prisma.employee.create({
      data: {
        employerId: employer.id,
        firstName: 'Nomsa', lastName: 'Dlamini',
        email: 'nomsa.dlamini@email.com', phone: '082 345 6789',
        idNumber: '9205220187084', role: 'Quality Controller',
        department: 'Factory Floor', employeeCode: 'EMP002',
        startDate: new Date('2020-07-15'),
      },
    }),
  ]);
  console.log(`✅ Employees: ${thabo.firstName}, ${nomsa.firstName}`);

  // Seed pay period
  const period = await prisma.payPeriod.create({
    data: {
      employerId: employer.id,
      label: 'March 2026',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-31'),
      payDate: new Date('2026-03-28'),
    },
  });
  console.log(`✅ Pay period: ${period.label}`);

  // Seed payslip
  await prisma.payslip.create({
    data: {
      employeeId: thabo.id, periodId: period.id,
      grossSalary: 8500, paye: 1190, uif: 85, netPay: 6480,
      verifyToken: 'dev-verify-token-thabo-march-2026',
      deductions: { create: [{ label: 'Medical aid', amount: 745 }] },
    },
  });
  console.log(`✅ Payslip: Thabo Mokoena — R6,480 net`);

  console.log('\n✅ Done.\n  Email:    admin@prestige-clothing.co.za\n  Password: password123\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
