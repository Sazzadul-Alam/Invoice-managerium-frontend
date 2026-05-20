import { API_BASE, authedGet, authedPost, authedPut, authedPatch, authedDelete } from "../lib/http";
import type { ApiInvoice } from "../types";

const INVOICE_BASE = `${API_BASE}/invoice`;

export const invoiceApi = {
  createInvoice: (shopId: string, payload: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    items: { name: string; quantity: number; unitPrice: number }[];
    discountType?: "flat" | "percentage";
    discount?: number;
    tax?: number;
    advanceAmount?: number;
    deliveryCharge?: number;
    isDeliveryPaid?: boolean;
    notes?: string;
    status?: string;
    date?: string;
  }) =>
    authedPost<{ success: boolean; invoice: ApiInvoice; message: string }>(
      INVOICE_BASE,
      `/shop/${shopId}`,
      payload
    ),

  updateInvoice: (shopId: string, invoiceId: string, payload: Partial<{
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    items: { name: string; quantity: number; unitPrice: number }[];
    discountType: "flat" | "percentage";
    discount: number;
    tax: number;
    advanceAmount: number;
    deliveryCharge: number;
    isDeliveryPaid: boolean;
    notes: string;
    status: string;
    date: string;
  }>) =>
    authedPut<{ success: boolean; invoice: ApiInvoice; message: string }>(
      INVOICE_BASE,
      `/shop/${shopId}/${invoiceId}`,
      payload
    ),

  updateStatus: (shopId: string, invoiceId: string, status: string) =>
    authedPatch<{ success: boolean; invoice: ApiInvoice; message: string }>(
      `${INVOICE_BASE}/shop/${shopId}/${invoiceId}`,
      { status }
    ),

  listInvoices: (shopId: string, page = 1, limit = 20, dateFrom?: string, dateTo?: string, search?: string) => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    if (search) query.set("search", search);
    return authedGet<{ success: boolean; invoices: ApiInvoice[]; total: number }>(
      `${INVOICE_BASE}/shop/${shopId}?${query.toString()}`
    );
  },

  deleteInvoice: (shopId: string, invoiceId: string) =>
    authedDelete<{ success: boolean; message: string }>(
      INVOICE_BASE,
      `/shop/${shopId}/${invoiceId}`,
    ),
};
