import { API_BASE, authedGet, authedPost, authedPut } from "../lib/http";
import { getToken } from "../utils/session";
import type { ApiPlan, ApiUserSubscription, ApiBillingCycle, SubStats, PopulatedSubscription } from "../types";

// ─── Subscription API ─────────────────────────────────────────────────────────

const SUB_BASE = `${API_BASE}/subscription`;

export const subscriptionApi = {
  /** List all available plans (public) */
  listPlans: () =>
    authedGet<{ success: boolean; plans: ApiPlan[] }>(`${SUB_BASE}/plans`),

  /** Get current user's active/pending subscription */
  mySubscription: () =>
    authedGet<{ success: boolean; subscription: ApiUserSubscription | null }>(
      `${SUB_BASE}/my`
    ),

  purchase: (payload: {
    planId: string;
    billingCycleId: string;
    paymentMethod: string;
    paymentReference: string;
  }) =>
    authedPost<{ success: boolean; message: string; subscription: ApiUserSubscription }>(
      SUB_BASE,
      "/purchase",
      payload
    ),
};

// ─── Admin Subscription API ──────────────────────────────────────────────────

export const adminApi = {
  getStats: () =>
    authedGet<{ success: boolean; stats: SubStats }>(`${SUB_BASE}/admin/stats`),

  listSubscriptions: (status?: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    return authedGet<{ success: boolean; subscriptions: PopulatedSubscription[]; total: number }>(
      `${SUB_BASE}/admin/subscriptions?${params}`
    );
  },

  handleSubscription: (id: string, action: "approve" | "reject", rejectionReason?: string) =>
    authedPut<{ success: boolean; message: string; subscription: PopulatedSubscription }>(
      SUB_BASE,
      `/admin/subscriptions/${id}`,
      { action, rejectionReason }
    ),

  listPlans: () =>
    authedGet<{ success: boolean; plans: ApiPlan[] }>(`${SUB_BASE}/plans`),

  createPlan: (payload: Partial<ApiPlan>) =>
    authedPost<{ success: boolean; message: string; plan: ApiPlan }>(
      SUB_BASE,
      "/admin/plans",
      payload
    ),

  updatePlan: (id: string, payload: Partial<ApiPlan>) =>
    authedPut<{ success: boolean; message: string; plan: ApiPlan }>(
      SUB_BASE,
      `/admin/plans/${id}`,
      payload
    ),

  deletePlan: (id: string) => {
    const token = getToken();
    return fetch(`${API_BASE}/subscription/admin/plans/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to delete plan");
      return data as { success: boolean; message: string };
    });
  },

  togglePlanStatus: (id: string, isActive: boolean) =>
    authedPut<{ success: boolean; message: string }>(
      SUB_BASE,
      `/admin/plans/active-inactive/${id}`,
      { isActive }
    ),
};

// ─── Billing Cycle API ──────────────────────────────────────────────────────────

const BILLING_CYCLE_BASE = `${API_BASE}/billing-cycle`;

export const billingCycleApi = {
  getAll: (activeOnly = false) =>
    authedGet<{ success: boolean; billingCycles: ApiBillingCycle[] }>(
      `${BILLING_CYCLE_BASE}/all${activeOnly ? "?activeOnly=true" : ""}`
    ),

  create: (payload: Partial<ApiBillingCycle>) =>
    authedPost<{ success: boolean; billingCycle: ApiBillingCycle; message: string }>(
      BILLING_CYCLE_BASE,
      `/create`,
      payload
    ),

  update: (id: string, payload: Partial<ApiBillingCycle>) =>
    authedPut<{ success: boolean; message: string }>(
      BILLING_CYCLE_BASE,
      `/${id}`,
      payload
    ),

  delete: (id: string) => {
    const token = getToken();
    return fetch(`${BILLING_CYCLE_BASE}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to delete billing cycle");
      return data as { success: boolean; message: string };
    });
  },

  toggleStatus: (id: string, isActive: boolean) =>
    authedPut<{ success: boolean; message: string }>(
      BILLING_CYCLE_BASE,
      `/active-inactive/${id}`,
      { isActive }
    ),
};
