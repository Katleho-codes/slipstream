import { request, BASE } from "./client";
import { Payslip, CreatePayslipDto, PayslipVerifyPayload } from "./types";

export const payslips = {
    list: (params?: { periodId?: string; employeeId?: string }) =>
        request<Payslip[]>({
            url: "/api/payslips",
            params,
        }),

    get: (id: string) =>
        request<Payslip>({
            url: `/api/payslips/${id}`,
        }),

    create: (body: CreatePayslipDto) =>
        request<Payslip>({
            url: "/api/payslips",
            method: "POST",
            data: body,
        }),

    issue: (id: string) =>
        request<{ payslipId: string; pdf: boolean; email: boolean }>({
            url: `/api/payslips/${id}/issue`,
            method: "POST",
        }),

    pdfUrl: (id: string) => `${BASE}/api/payslips/${id}/pdf`,

    publicVerify: (token: string) =>
        request<PayslipVerifyPayload>({
            url: `/api/verify/${token}`,
        }),
};