/// <reference types="vite/client" />
import { getToken } from "../utils/session";

// ─── API Base URL ─────────────────────────────────────────────────────────────
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.memobook.shop/api";

// ─── HTTP primitives ──────────────────────────────────────────────────────────

const BASE = `${API_BASE}/user`;

export async function post<T>(path: string, body: unknown): Promise<T> {
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

export async function authedGet<T>(url: string): Promise<T> {
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

export async function authedPut<T>(basePath: string, path: string, body: unknown): Promise<T> {
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

export async function authedPost<T>(basePath: string, path: string, body: unknown): Promise<T> {
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

export async function authedPatch<T>(url: string, body: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    method: "PATCH",
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

export async function authedDelete<T>(basePath: string, path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${basePath}${path}`, {
    method: "DELETE",
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
