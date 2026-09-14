import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8003";

export class ApiError extends Error {
    constructor(
        public status: number,
        public errors?: Record<string, string[]>,
        message = "Request failed",
    ) {
        super(message);
        this.name = "ApiError";
    }
}

export const api = axios.create({
    baseURL: BASE,
    timeout: 10000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

export { BASE };

export async function request<T>(
    config: Parameters<typeof api.request>[0],
): Promise<T> {
    try {
        const { data } = await api.request(config);
        return data?.data ?? data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const res = error.response;
            throw new ApiError(
                res?.status ?? 500,
                res?.data?.errors,
                res?.data?.message ?? error.message,
            );
        }
        throw error;
    }
}