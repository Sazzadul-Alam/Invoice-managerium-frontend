import { API_BASE, authedGet, authedPut, authedFormDataPost, authedFormDataPut } from "../lib/http";
import { getToken } from "../utils/session";
import type { ApiCategory, ApiBrand, ApiProduct } from "../types";

// ─── Category API ──────────────────────────────────────────────────────────

const CATEGORY_BASE = `${API_BASE}/category`;

export const categoryApi = {
  getAll: () =>
    authedGet<{ success: boolean; categories: ApiCategory[] }>(`${CATEGORY_BASE}/all`),
};

// ─── Varient Attribute API ──────────────────────────────────────────────────────────

const VARIENT_ATTR_BASE = `${API_BASE}/varient-attribute`;

export const varientAttributeApi = {
  getAll: () =>
    authedGet<{ success: boolean; attributes: { _id: string; name: string; value: string }[] }>(`${VARIENT_ATTR_BASE}/all`),
};

// ─── Brand API ──────────────────────────────────────────────────────────

const BRAND_BASE = `${API_BASE}/brand`;

export const brandApi = {
  getAll: () =>
    authedGet<{ success: boolean; brands: ApiBrand[] }>(`${BRAND_BASE}/all`),
};

// ─── Product API ──────────────────────────────────────────────────────────

const PRODUCT_BASE = `${API_BASE}/product`;

export const productApi = {
  getAll: (demoOnly = false, shopId?: string, page = 1, limit = 10, search = "") => {
    const params = new URLSearchParams();
    if (demoOnly) params.set("demoOnly", "true");
    if (shopId) params.set("shopId", shopId);
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search) params.set("name", search);
    return authedGet<{ success: boolean; products: ApiProduct[]; total: number }>(
      `${PRODUCT_BASE}/all?${params.toString()}`
    );
  },

  create: (formData: FormData) =>
    authedFormDataPost<{ success: boolean; message: string; data: ApiProduct }>(
      PRODUCT_BASE,
      "/create",
      formData
    ),

  update: (id: string, formData: FormData) =>
    authedFormDataPut<{ success: boolean; message: string; data: ApiProduct }>(
      PRODUCT_BASE,
      `/${id}`,
      formData
    ),

  delete: (id: string) => {
    const token = getToken();
    return fetch(`${PRODUCT_BASE}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to delete product");
      return data as { success: boolean; message: string };
    });
  },

  toggleStatus: (id: string, status: "active" | "inactive") =>
    authedPut<{ success: boolean; message: string; data: ApiProduct }>(
      PRODUCT_BASE,
      `/active-inactive/${id}`,
      { status }
    ),
};
