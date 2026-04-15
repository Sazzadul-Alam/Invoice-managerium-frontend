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
  address: {
    country: string;
    cityState: string;
    postalCode: string;
    taxId: string;
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

export const authApi = {
  register: (payload: RegisterPayload) =>
    post<{ success: boolean; message: string }>("/register", payload),

  login: (payload: LoginPayload) =>
    post<{ success: boolean; access_token: string; message: string; user: ApiUser }>(
      "/login",
      payload
    ),
};