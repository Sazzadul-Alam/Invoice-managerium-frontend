/// <reference types="vite/client" />
// ─── JWT helpers ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  _id: string;
  email: string;
  role: "admin" | "customer";
  iat?: number;
  exp?: number;
}

/** Decode a JWT without verifying the signature (client-side only). */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Store access token + derived role in sessionStorage. */
export function saveSession(token: string, user: ApiUser) {
  const payload = decodeJwt(token);
  const role = payload?.role ?? user.role ?? "customer";
  sessionStorage.setItem("access_token", token);
  sessionStorage.setItem("userRole", role);
  sessionStorage.setItem("userEmail", user.email);
  sessionStorage.setItem("userName", user.name);
}

export function clearSession() {
  ["access_token", "userRole", "userEmail", "userName"].forEach((k) =>
    sessionStorage.removeItem(k)
  );
}

export function getToken(): string | null {
  return sessionStorage.getItem("access_token");
}

export function getRole(): "admin" | "customer" {
  return (sessionStorage.getItem("userRole") as "admin" | "customer") ?? "customer";
}

// ─── API types ────────────────────────────────────────────────────────────────

export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "customer";
  status: string;
  isVerified: boolean;
  provider: string;
  bio: string;
  image: string;
  businessName: string;
  contactNumber: string;
  address: {
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiShop {
  _id: string;
  ownerId: string;
  name: string;
  slug: string;
  logo: string;
  contactNumber: string;
  address: {
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
  };
  receiptConfig: {
    headerText: string;
    footerText: string;
    showLogo: boolean;
    accentColor: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSubscriptionPlan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  maxShops: number;
  maxModeratorsPerShop: number;
  maxProductsPerShop: number;
  maxInvoicesPerMonth: number;
  features: {
    receiptCustomization: boolean;
    exportPdf: boolean;
    analytics: boolean;
  };
  isActive: boolean;
  sortOrder: number;
}

export interface ApiBillingCycle {
  _id: string;
  name: string;
  durationInMonths: number;
  discountAmount: number;
  isActive: boolean;
  sortOrder: number;
  deactivatedAt?: string;
}

export interface ApiPlan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingCycle: string;
  maxShops: number;
  maxModeratorsPerShop: number;
  maxProductsPerShop: number;
  maxInvoicesPerMonth: number;
  features: {
    receiptCustomization: boolean;
    exportPdf: boolean;
    analytics: boolean;
  };
  isActive: boolean;
  sortOrder: number;
  deactivatedAt?: string;
}

export interface ApiUserSubscription {
  _id: string;
  userId: string;
  planId: ApiPlan;
  status: "pending" | "active" | "expired" | "cancelled";
  paymentMethod: string;
  paymentReference: string;
  paymentAmount: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ─── API Base URL ─────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.memobook.shop/api";

// ─── API calls ────────────────────────────────────────────────────────────────

const BASE = `${API_BASE}/user`;

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // needed for HttpOnly refresh cookie
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    // Validation errors array → join into readable string
    if (Array.isArray(data.errors)) {
      const msg = (data.errors as { path: string; message: string }[])
        .map((e) => e.message)
        .join(", ");
      throw new Error(msg);
    }
    throw new Error(data.message ?? "Something went wrong");
  }

  return data as T;
}

async function authedGet<T>(url: string): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    if (Array.isArray(data.errors)) {
      const msg = (data.errors as { path: string; message: string }[])
        .map((e) => e.message)
        .join(", ");
      throw new Error(msg);
    }
    throw new Error(data.message ?? "Something went wrong");
  }

  return data as T;
}

async function authedPut<T>(basePath: string, path: string, body: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${basePath}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    if (Array.isArray(data.errors)) {
      const msg = (data.errors as { path: string; message: string }[])
        .map((e) => e.message)
        .join(", ");
      throw new Error(msg);
    }
    throw new Error(data.message ?? "Something went wrong");
  }

  return data as T;
}

async function authedPost<T>(basePath: string, path: string, body: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${basePath}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    if (Array.isArray(data.errors)) {
      const msg = (data.errors as { path: string; message: string }[])
        .map((e) => e.message)
        .join(", ");
      throw new Error(msg);
    }
    throw new Error(data.message ?? "Something went wrong");
  }

  return data as T;
}

export async function authedFormDataPost<T>(basePath: string, path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${basePath}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    if (Array.isArray(data.errors)) {
      throw new Error(data.errors.map((e: any) => e.message).join(", "));
    }
    throw new Error(data.message ?? "Something went wrong");
  }
  return data as T;
}

export async function authedFormDataPut<T>(basePath: string, path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${basePath}${path}`, {
    method: "PUT",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    if (Array.isArray(data.errors)) {
      throw new Error(data.errors.map((e: any) => e.message).join(", "));
    }
    throw new Error(data.message ?? "Something went wrong");
  }
  return data as T;
}

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface ApiCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  status: string;
}

export interface ApiBrand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  status: string;
}

export interface ApiProduct {
  _id: string;
  name: string;
  slug: string;
  varientId: { _id: string; name: string; value: string } | string;
  brandId?: ApiBrand | string;
  description: string;
  price: number;
  previousPrice?: number;
  extraPrice?: number;
  buyingPrice?: number;
  stock: number;
  sold: number;
  rating: number;
  isDemo: boolean;
  location: string;
  featured: boolean;
  status: "active" | "inactive";
  images?: { image: string; _id?: string }[];
  varient?: { _id: string; name: string; value: string }[];
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    post<{ success: boolean; message: string; access_token: string; user: ApiUser }>("/register", payload),

  login: (payload: LoginPayload) =>
    post<{ success: boolean; access_token: string; message: string; user: ApiUser }>(
      "/login",
      payload
    ),

  verifyEmail: (token: string) =>
    post<{ success: boolean; message: string }>(`/verify/${token}`, {}),

  setupBusinessProfile: (payload: {
    businessName?: string;
    contactNumber?: string;
    address?: Partial<ApiUser["address"]>;
    socialLinks?: Partial<ApiUser["socialLinks"]>;
  }) =>
    authedPut<{ success: boolean; message: string; user: ApiUser }>(
      BASE,
      "/update-profile",
      payload
    ),

  /** Get currently logged-in user details */
  me: () =>
    authedGet<{ success: boolean; user: ApiUser }>(`${BASE}/`),

  /** Update profile (name, phone, bio, etc.) */
  updateProfile: (payload: {
    name?: string;
    phone?: string;
    bio?: string;
  }) =>
    authedPut<{ success: boolean; message: string; user: ApiUser }>(
      BASE,
      "/update-profile",
      payload
    ),

  /** Change password */
  updatePassword: (payload: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) =>
    authedPut<{ success: boolean; message: string }>(
      BASE,
      "/update-password",
      payload
    ),

  forgotPassword: (email: string) =>
    post<{ success: boolean; message: string }>("/forget-password", { email }),

  verifyOtp: (otp: string) =>
    post<{ success: boolean; message: string }>("/verify-otp", { otp }),

  resetPassword: (payload: {
    otp: string;
    newPassword: string;
    confirmPassword: string;
  }) =>
    post<{ success: boolean; message: string }>("/reset-password", payload),
};

// ─── Shop API ─────────────────────────────────────────────────────────────────

const SHOP_BASE = `${API_BASE}/shop`;

export const shopApi = {
  createShop: (payload: {
    name: string;
    contactNumber?: string;
    address?: Partial<ApiUser["address"]>;
    socialLinks?: Partial<ApiUser["socialLinks"]>;
  }) =>
    authedPost<{ success: boolean; message: string; shop: ApiShop }>(
      SHOP_BASE,
      "",
      payload
    ),

  /** List all shops owned by / member of the current user */
  myShops: () =>
    authedGet<{ success: boolean; ownedShops: ApiShop[]; memberShops: ApiShop[] }>(
      SHOP_BASE
    ),

  /** Get a single shop by ID */
  getShop: (id: string) =>
    authedGet<{ success: boolean; shop: ApiShop }>(`${SHOP_BASE}/${id}`),

  /** Update a shop */
  updateShop: (id: string, payload: Partial<{
    name: string;
    contactNumber: string;
    address: Partial<ApiShop["address"]>;
    socialLinks: Partial<ApiShop["socialLinks"]>;
    receiptConfig: Partial<ApiShop["receiptConfig"]>;
  }>) => {
    const token = getToken();
    return fetch(`${SHOP_BASE}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify(payload),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to update shop");
      return data as { success: boolean; message: string; shop: ApiShop };
    });
  },
};

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

export interface SubStats {
  pending: number;
  active: number;
  revenue: number;
}

export interface PopulatedSubscription {
  _id: string;
  userId: { _id: string; name: string; email: string; phone: string; image: string } | null;
  planId: { _id: string; name: string; price: number; billingCycle: string } | null;
  status: "pending" | "active" | "expired" | "cancelled";
  paymentMethod: string;
  paymentReference: string;
  paymentAmount: number;
  startDate: string | null;
  endDate: string | null;
  rejectionReason: string;
  createdAt: string;
  updatedAt: string;
}

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
  getAll: (demoOnly = false, shopId?: string) => {
    const params = new URLSearchParams();
    if (demoOnly) params.set("demoOnly", "true");
    if (shopId) params.set("shopId", shopId);
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