import { request } from "./client";
import { Employee, CreateEmployeeDto } from "./types";

export const employees = {
    list: (active?: boolean) =>
        request<Employee[]>({
            url: "/api/employees",
            params: active !== undefined ? { active } : undefined,
        }),

    get: (id: string) =>
        request<Employee>({
            url: `/api/employees/${id}`,
        }),

    create: (body: CreateEmployeeDto) =>
        request<Employee>({
            url: "/api/employees",
            method: "POST",
            data: body,
        }),

    update: (id: string, body: Partial<CreateEmployeeDto>) =>
        request<Employee>({
            url: `/api/employees/${id}`,
            method: "PATCH",
            data: body,
        }),

    deactivate: (id: string) =>
        request({
            url: `/api/employees/${id}`,
            method: "DELETE",
        }),
};