import { API_BASE, post, authedGet, authedPut } from "../lib/http";
import type { ApiUser, RegisterPayload, LoginPayload } from "../types";

const BASE = `${API_BASE}/user`;

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
