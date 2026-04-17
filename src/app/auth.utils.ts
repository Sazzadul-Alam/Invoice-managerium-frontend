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

// ─── API calls ────────────────────────────────────────────────────────────────

const BASE = "http://localhost:4000/api/user";

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

async function authedPut<T>(path: string, body: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
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
      "/update-password",
      payload
    ),
};

// ─── Shop API ─────────────────────────────────────────────────────────────────

const SHOP_BASE = "http://localhost:4000/api/shop";

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

const SUB_BASE = "http://localhost:4000/api/subscription";

export const subscriptionApi = {
  /** List all available plans (public) */
  listPlans: () =>
    authedGet<{ success: boolean; plans: ApiPlan[] }>(`${SUB_BASE}/plans`),

  /** Get current user's active/pending subscription */
  mySubscription: () =>
    authedGet<{ success: boolean; subscription: ApiUserSubscription | null }>(
      `${SUB_BASE}/my`
    ),

  /** Purchase a plan (submit payment reference) */
  purchase: (payload: {
    planId: string;
    paymentMethod: string;
    paymentReference: string;
    paymentAmount: number;
  }) =>
    authedPost<{ success: boolean; message: string; subscription: ApiUserSubscription }>(
      SUB_BASE,
      "/purchase",
      payload
    ),
};