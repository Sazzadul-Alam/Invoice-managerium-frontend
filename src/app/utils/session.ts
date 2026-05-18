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
export function saveSession(token: string, user: { role?: "admin" | "customer"; email: string; name: string }) {
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
