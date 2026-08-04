export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  idNumber?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  employeeCode?: string;
  bankName?: string;
  bankAccount?: string;
  bankBranch?: string;
  startDate?: string;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
  isActive?: boolean;
}

export interface DeductionInput {
  label: string;
  amount: number;
  type?: 'FIXED' | 'PERCENTAGE';
}

export interface CreatePayslipDto {
  employeeId: string;
  periodId: string;
  grossSalary: number;
  overtimePay?: number;
  bonus?: number;
  allowances?: number;
  paye?: number;
  uif?: number;
  sdl?: number;
  deductions?: DeductionInput[];
}

export interface PayslipWithRelations {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    idNumber?: string | null;
    role?: string | null;
    department?: string | null;
  };
  period: {
    label: string;
    periodStart: Date;
    periodEnd: Date;
    payDate: Date;
    employer: {
      companyName: string;
      address?: string | null;
      regNumber?: string | null;
    };
  };
  grossSalary: number;
  overtimePay: number;
  bonus: number;
  allowances: number;
  paye: number;
  uif: number;
  sdl: number;
  netPay: number;
  deductions: Array<{ label: string; amount: number; type: string }>;
  verifyToken: string;
  issuedAt: Date;
}
