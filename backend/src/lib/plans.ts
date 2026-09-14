export const PLAN_LIMITS: Record<string, number> = {
    STARTER: 10,
    GROWTH: 50,
    BUSINESS: 150,
    ENTERPRISE: Infinity,
};

export const PLANS = ["STARTER", "GROWTH", "BUSINESS", "ENTERPRISE"] as const;
export type Plan = (typeof PLANS)[number];