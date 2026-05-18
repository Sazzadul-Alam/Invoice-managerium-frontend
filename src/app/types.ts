// ─── Shared TypeScript interfaces ─────────────────────────────────────────────

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

export interface SubStats {
  pending: number;
  active: number;
  revenue: number;
}

export interface PopulatedSubscription {
  _id: string;
  userId: { _id: string; name: string; email: string; phone: string; image: string } | null;
  shopName?: string;
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

export interface ApiInvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ApiInvoice {
  _id: string;
  shopId: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  items: ApiInvoiceItem[];
  subtotal: number;
  discountType: "flat" | "percentage";
  discount: number;
  discountAmount: number;
  tax: number;
  advanceAmount: number;
  deliveryCharge: number;
  isDeliveryPaid: boolean;
  grandTotal: number;
  notes: string;
  status: "draft" | "issued" | "paid" | "void" | "printed";
  invoiceDate: string;
  createdAt: string;
  updatedAt: string;
}
