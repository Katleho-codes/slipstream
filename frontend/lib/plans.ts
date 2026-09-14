import { Plan } from "./api/types";

export interface PlanConfig {
    id: Plan;
    name: string;
    price: string;
    period: string;
    limit: string;
    employees: number;
    features: string[];
    featured: boolean;
}

export const PLANS: PlanConfig[] = [
    {
        id: "STARTER",
        name: "Starter",
        price: "R199",
        period: "/month",
        limit: "Up to 10 employees",
        employees: 10,
        features: [
            "Unlimited payslips",
            "Email delivery",
            "PDF generation",
            "QR verification",
            "SARS-compliant layout",
        ],
        featured: false,
    },
    {
        id: "GROWTH",
        name: "Growth",
        price: "R499",
        period: "/month",
        limit: "Up to 50 employees",
        employees: 50,
        features: [
            "Everything in Starter",
            "Custom deduction types",
            "Branded payslips",
            "Bulk issue",
            "Priority support",
        ],
        featured: true,
    },
    {
        id: "BUSINESS",
        name: "Business",
        price: "R999",
        period: "/month",
        limit: "Up to 150 employees",
        employees: 150,
        features: [
            "Everything in Growth",
            "API access",
            "WhatsApp delivery",
            "EMP201 export",
            "Dedicated onboarding",
        ],
        featured: false,
    },
];

export const PLAN_LIMITS: Record<string, number> = {
    STARTER: 10,
    GROWTH: 50,
    BUSINESS: 150,
    ENTERPRISE: Infinity,
};

export const PLAN_PRICE: Record<string, string> = {
    STARTER: "R199/mo",
    GROWTH: "R499/mo",
    BUSINESS: "R999/mo",
    ENTERPRISE: "Custom",
};

export function getPlanById(plan: Plan): PlanConfig | undefined {
    return PLANS.find((p) => p.id === plan);
}