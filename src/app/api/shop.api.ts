import { API_BASE, authedGet, authedPost } from "../lib/http";
import { getToken } from "../utils/session";
import type { ApiUser, ApiShop } from "../types";

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
