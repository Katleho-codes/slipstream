import { request } from "./client";
import { PayPeriod, CreatePayPeriodDto } from "./types";

export const payPeriods = {
    list: () =>
        request<PayPeriod[]>({
            url: "/api/pay-periods",
        }),

    create: (body: CreatePayPeriodDto) =>
        request<PayPeriod>({
            url: "/api/pay-periods",
            method: "POST",
            data: body,
        }),

    delete: (id: string) =>
        request({
            url: `/api/pay-periods/${id}`,
            method: "DELETE",
        }),
};