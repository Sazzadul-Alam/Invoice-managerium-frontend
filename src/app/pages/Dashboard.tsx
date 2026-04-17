import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  type ApiUser,
  type ApiShop,
  type ApiPlan,
  type ApiUserSubscription,
  authApi,
  shopApi,
  subscriptionApi,
} from "../auth.utils";
import { ProductManagement } from "./ProductManagement";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Demo data (Products only — real product API is Phase 3)                  */
/* ────────────────────────────────────────────────────────────────────────── */

const DEMO_PRODUCTS = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    category: "Electronics",
    price: 2499,
    buyingPrice: 1800,
    stock: 12,
    status: "active",
    emoji: "🎧",
  },
  {
    id: 2,
    name: "Leather Executive Wallet",
    category: "Accessories",
    price: 899,
    buyingPrice: 450,
    stock: 28,
    status: "active",
    emoji: "👜",
  },
  {
    id: 3,
    name: "Ergonomic Desk Chair",
    category: "Furniture",
    price: 9500,
    buyingPrice: 6200,
    stock: 4,
    status: "active",
    emoji: "🪑",
  },
  {
    id: 4,
    name: "Stainless Steel Water Bottle",
    category: "Lifestyle",
    price: 650,
    buyingPrice: 280,
    stock: 60,
    status: "active",
    emoji: "🧴",
  },
  {
    id: 5,
    name: "Mechanical Gaming Keyboard",
    category: "Electronics",
    price: 3800,
    buyingPrice: 2500,
    stock: 0,
    status: "inactive",
    emoji: "⌨️",
  },
];

const DEMO_INVOICE_ITEMS = [
  { name: "Premium Wireless Headphones", qty: 1, price: 2499 },
  { name: "Stainless Steel Water Bottle", qty: 2, price: 650 },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  Tabs                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

const TABS = [
  { key: "plan", icon: "workspace_premium", label: "Buy Plan" },
  { key: "products", icon: "inventory_2", label: "Products" },
  { key: "invoice", icon: "receipt_long", label: "Demo Invoice" },
  { key: "profile", icon: "manage_accounts", label: "Profile" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function formatAddress(addr: ApiShop["address"]): string {
  const parts = [
    addr.address_line1,
    addr.address_line2,
    addr.city,
    addr.state,
    addr.postal_code,
    addr.country,
  ].filter(Boolean);
  return parts.join(", ");
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function planColor(slug: string): string {
  switch (slug) {
    case "free":
      return "#70787d";
    case "starter":
      return "#005C72";
    case "business":
      return "#5d3300";
    case "enterprise":
      return "#005C72";
    default:
      return "#005C72";
  }
}

function planBg(slug: string): string {
  switch (slug) {
    case "free":
      return "var(--ds-surface-container-low)";
    case "starter":
      return "rgba(0,92,114,0.04)";
    case "business":
      return "rgba(93,51,0,0.04)";
    case "enterprise":
      return "rgba(0,92,114,0.08)";
    default:
      return "var(--ds-surface-container-low)";
  }
}

function planBorder(slug: string): string {
  switch (slug) {
    case "free":
      return "var(--ds-outline-variant)";
    case "starter":
      return "#005C72";
    case "business":
      return "var(--ds-on-tertiary-container)";
    case "enterprise":
      return "#005C72";
    default:
      return "var(--ds-outline-variant)";
  }
}

function planFeatures(plan: ApiPlan): string[] {
  const features: string[] = [];
  features.push(plan.maxShops === -1 ? "Unlimited Shops" : `${plan.maxShops} Shop${plan.maxShops > 1 ? "s" : ""}`);
  features.push(
    plan.maxProductsPerShop === -1
      ? "Unlimited Products"
      : `${plan.maxProductsPerShop} Products`
  );
  features.push(
    plan.maxInvoicesPerMonth === -1
      ? "Unlimited Invoices"
      : `${plan.maxInvoicesPerMonth} Invoices/mo`
  );
  features.push(
    plan.maxModeratorsPerShop === 0
      ? "No moderators"
      : `${plan.maxModeratorsPerShop} Moderator${plan.maxModeratorsPerShop > 1 ? "s" : ""}`
  );
  if (plan.features.receiptCustomization) features.push("Receipt Branding");
  if (plan.features.analytics) features.push("Analytics");
  return features;
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  Root Dashboard                                                            */
/* ════════════════════════════════════════════════════════════════════════════ */

export function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("plan");

  // ── API state ──
  const [user, setUser] = useState<ApiUser | null>(null);
  const [shop, setShop] = useState<ApiShop | null>(null);
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [mySub, setMySub] = useState<ApiUserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, shopsRes, plansRes, subRes] = await Promise.all([
        authApi.me(),
        shopApi.myShops(),
        subscriptionApi.listPlans(),
        subscriptionApi.mySubscription(),
      ]);
      setUser(userRes.user);
      // Use first owned shop as primary
      setShop(shopsRes.ownedShops[0] ?? null);
      setPlans(plansRes.plans);
      setMySub(subRes.subscription);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const currentPlanSlug = mySub?.planId?.slug ?? "free";
  const currentPlanName = mySub?.planId?.name ?? "Free";

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-ds-background"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="text-center space-y-3">
          <span
            className="h-8 w-8 border-3 rounded-full animate-spin block mx-auto"
            style={{ borderColor: "var(--ds-outline-variant)", borderTopColor: "var(--ds-primary-container)" }}
          />
          <p className="text-sm text-ds-outline font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-ds-background text-ds-on-background"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Top App Bar ── */}
      <header
        className="sticky top-0 z-30 bg-ds-surface-container-lowest/95 backdrop-blur-md border-b border-ds-outline-variant/50"
      >
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--ds-primary-container)" }}
            >
              <span
                className="material-symbols-outlined text-white text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                storefront
              </span>
            </div>
            <span
              className="text-ds-primary font-extrabold text-base"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Kanto Invoice
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Plan badge */}
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
              style={{
                color: planColor(currentPlanSlug),
                borderColor: planBorder(currentPlanSlug),
                background: planBg(currentPlanSlug),
              }}
            >
              {currentPlanName}
            </span>
            <button
              onClick={handleLogout}
              className="ml-1 p-2 rounded-full text-ds-outline hover:bg-ds-surface-container-high transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="flex-1 overflow-y-auto pb-24 max-w-lg mx-auto w-full">
        {activeTab === "plan" && (
          <TabBuyPlan
            user={user}
            plans={plans}
            mySub={mySub}
            currentPlanSlug={currentPlanSlug}
            onRefresh={fetchData}
          />
        )}
        {activeTab === "products" && <ProductManagement mySub={mySub} />}
        {activeTab === "invoice" && <TabDemoInvoice shop={shop} />}
        {activeTab === "profile" && (
          <TabProfile
            user={user}
            shop={shop}
            mySub={mySub}
            currentPlanName={currentPlanName}
            onLogout={handleLogout}
            onUserUpdated={(u) => setUser(u)}
            onShopUpdated={(s) => setShop(s)}
          />
        )}
      </main>

      {/* ── Bottom Nav ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t"
        style={{
          background: "rgba(248,250,251,0.97)",
          borderColor: "var(--ds-outline-variant)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="max-w-lg mx-auto flex items-stretch h-16">
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
              >
                <span
                  className="material-symbols-outlined text-[22px] transition-all"
                  style={{
                    fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                    color: active
                      ? "var(--ds-primary-container)"
                      : "var(--ds-outline)",
                  }}
                >
                  {tab.icon}
                </span>
                <span
                  className="text-[10px] font-semibold tracking-wide transition-colors"
                  style={{
                    color: active
                      ? "var(--ds-primary-container)"
                      : "var(--ds-outline)",
                  }}
                >
                  {tab.label}
                </span>
                {active && (
                  <div
                    className="absolute bottom-0 h-0.5 w-10 rounded-full"
                    style={{ background: "var(--ds-primary-container)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  Tab 1 — Buy Plan                                                          */
/* ════════════════════════════════════════════════════════════════════════════ */

function TabBuyPlan({
  user,
  plans,
  mySub,
  currentPlanSlug,
  onRefresh,
}: {
  user: ApiUser | null;
  plans: ApiPlan[];
  mySub: ApiUserSubscription | null;
  currentPlanSlug: string;
  onRefresh: () => void;
}) {
  const userName = user?.name ?? sessionStorage.getItem("userName") ?? "Shop Owner";
  const subStatus = mySub?.status;

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [toast, setToast] = useState("");

  const handlePurchase = async (plan: ApiPlan) => {
    if (!mobileNumber || !transactionId) {
      setToast("Mobile number and Transaction ID are required.");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    setLoadingPurchase(true);
    try {
      await subscriptionApi.purchase({
        planId: plan._id,
        paymentMethod: "bKash",
        paymentReference: `${mobileNumber} - ${transactionId}`,
        paymentAmount: plan.price,
      });
      setToast("Upgrade requested successfully. Waiting for admin approval.");
      setTimeout(() => setToast(""), 3000);
      setSelectedPlanId(null);
      setMobileNumber("");
      setTransactionId("");
      onRefresh();
    } catch (err: any) {
      setToast(err.message || "Failed to purchase plan.");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setLoadingPurchase(false);
    }
  };

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      {/* Welcome banner */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "var(--ds-primary-container)" }}
      >
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h2
            className="text-white text-xl font-extrabold mb-0.5"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {userName}
          </h2>
          <p className="text-white/60 text-xs">
            You're on the <strong className="text-white">{mySub?.planId?.name ?? "Free"}</strong> plan.
            {subStatus === "pending" && (
              <span className="ml-1 text-yellow-200">⏳ Upgrade pending approval</span>
            )}
            {subStatus !== "pending" && " Upgrade anytime to unlock more."}
          </p>
        </div>
        <div
          className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10"
          style={{ background: "white" }}
        />
        <div
          className="absolute bottom-0 right-4 w-16 h-16 rounded-full opacity-10"
          style={{ background: "white" }}
        />
      </div>

      <h3
        className="text-sm font-bold text-ds-on-surface uppercase tracking-widest pt-1"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        Subscription Plans
      </h3>

      {plans.length === 0 && (
        <p className="text-sm text-ds-outline text-center py-8">No plans available.</p>
      )}

      {plans.map((plan) => {
        const isCurrent = plan.slug === currentPlanSlug;
        const color = planColor(plan.slug);
        const bg = planBg(plan.slug);
        const border = planBorder(plan.slug);
        const features = planFeatures(plan);

        return (
          <div
            key={plan._id}
            className="rounded-2xl border p-5 transition-all"
            style={{
              background: bg,
              borderColor: border,
              borderWidth: isCurrent ? 1 : plan.slug === "starter" ? 2 : 1,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span
                  className="text-lg font-extrabold"
                  style={{ color, fontFamily: "'Manrope', sans-serif" }}
                >
                  {plan.name}
                </span>
                {isCurrent && (
                  <span
                    className="ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--ds-surface-container-high)",
                      color: "var(--ds-outline)",
                    }}
                  >
                    Active
                  </span>
                )}
              </div>
              <div className="text-right">
                {plan.price === 0 ? (
                  <span className="text-xl font-bold" style={{ color }}>
                    Free
                  </span>
                ) : (
                  <div>
                    <span className="text-xl font-bold" style={{ color }}>
                      ৳{plan.price}
                    </span>
                    <span className="text-xs text-ds-outline">/{plan.billingCycle === "yearly" ? "yr" : "mo"}</span>
                  </div>
                )}
              </div>
            </div>

            {plan.description && (
              <p className="text-xs text-ds-on-surface-variant mb-3">{plan.description}</p>
            )}

            <ul className="space-y-1.5 mb-4">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-ds-on-surface-variant">
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1", color }}
                  >
                    check_circle
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            {!isCurrent && selectedPlanId !== plan._id && (
              <button
                onClick={() => plan.slug !== "enterprise" && setSelectedPlanId(plan._id)}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] text-white"
                style={{ background: color }}
              >
                {plan.slug === "enterprise" ? "Contact Us" : "Upgrade"} →
              </button>
            )}

            {!isCurrent && selectedPlanId === plan._id && (
              <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: color, background: "var(--ds-surface-container-lowest)" }}>
                <p className="text-xs text-ds-on-surface-variant mb-3 font-semibold leading-relaxed">
                  {plan.description}
                </p>
                <div className="p-3 mb-4 rounded-lg text-xs" style={{ background: "rgba(232,167,53,0.1)", border: "1px solid rgba(232,167,53,0.3)" }}>
                  <p className="font-semibold text-ds-on-surface mb-1">To continue, please send money to:</p>
                  <p className="text-ds-on-surface-variant font-medium">• bKash: 01732570221</p>
                  <p className="text-ds-on-surface-variant font-medium">• Bank Account: 1444444444</p>
                  <p className="text-ds-on-surface-variant font-medium mt-1">and provide the transaction details below.</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ds-outline mb-1">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 017..."
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ borderColor: "var(--ds-outline-variant)", background: "var(--ds-surface-container-highest)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ds-outline mb-1">Transaction ID</label>
                    <input
                      type="text"
                      placeholder="e.g. TRXR123456"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ borderColor: "var(--ds-outline-variant)", background: "var(--ds-surface-container-highest)" }}
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setSelectedPlanId(null)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all border"
                      style={{ borderColor: "var(--ds-outline)", color: "var(--ds-outline)" }}
                      disabled={loadingPurchase}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handlePurchase(plan)}
                      className="flex-[2] py-2 rounded-lg text-xs font-bold transition-all text-white flex items-center justify-center gap-2"
                      style={{ background: color, opacity: loadingPurchase ? 0.7 : 1 }}
                      disabled={loadingPurchase}
                    >
                      {loadingPurchase ? "Submitting..." : "Submit Payment"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isCurrent && (
              <div
                className="text-center text-xs font-semibold py-2 rounded-xl"
                style={{
                  color: "var(--ds-outline)",
                  background: "var(--ds-surface-container)",
                }}
              >
                Current plan
              </div>
            )}
          </div>
        );
      })}

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg z-50 transition-all"
          style={{ background: "var(--ds-on-surface)", color: "var(--ds-surface-container-lowest)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  Tab 2 — Products                                                          */
/* ════════════════════════════════════════════════════════════════════════════ */

function TabProducts({ mySub }: { mySub: ApiUserSubscription | null }) {
  const maxProducts = mySub?.planId?.maxProductsPerShop ?? 10;
  const planName = mySub?.planId?.name ?? "Free";

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-lg font-extrabold text-ds-primary"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            My Products
          </h2>
          <p className="text-xs text-ds-outline">
            {DEMO_PRODUCTS.length} of {maxProducts === -1 ? "∞" : maxProducts} used · {planName} plan
          </p>
        </div>
        <button
          className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl text-white active:scale-95 transition-all"
          style={{ background: "var(--ds-primary-container)" }}
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add
        </button>
      </div>

      {/* Free plan nudge */}
      <div
        className="flex items-center gap-3 rounded-xl p-3 mb-4 border"
        style={{
          background: "rgba(254,187,125,0.12)",
          borderColor: "var(--ds-on-tertiary-container)",
        }}
      >
        <span
          className="material-symbols-outlined text-xl flex-shrink-0"
          style={{
            color: "var(--ds-tertiary)",
            fontVariationSettings: "'FILL' 1",
          }}
        >
          lock
        </span>
        <p className="text-xs text-ds-on-surface-variant leading-relaxed">
          <strong className="text-ds-on-surface">{planName} plan</strong> allows up to{" "}
          {maxProducts === -1 ? "unlimited" : maxProducts} products.{" "}
          {maxProducts !== -1 && (
            <span className="font-semibold" style={{ color: "var(--ds-primary-container)" }}>
              Upgrade to add more.
            </span>
          )}
        </p>
      </div>

      {/* Product cards */}
      <div className="space-y-3">
        {DEMO_PRODUCTS.map((product) => (
          <div
            key={product.id}
            className="rounded-2xl border p-4 flex items-center gap-4 transition-all active:scale-[0.99]"
            style={{
              background: "var(--ds-surface-container-lowest)",
              borderColor: "var(--ds-outline-variant)",
            }}
          >
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: "var(--ds-surface-container-low)" }}
            >
              {product.emoji}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ds-on-surface truncate">
                {product.name}
              </p>
              <p className="text-xs text-ds-outline mt-0.5">{product.category}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-sm font-bold" style={{ color: "var(--ds-primary-container)" }}>
                  ৳{product.price.toLocaleString()}
                </span>
                <span className="text-xs text-ds-outline">
                  Stock:{" "}
                  {product.stock === 0 ? (
                    <span className="text-red-500 font-semibold">Out</span>
                  ) : (
                    product.stock
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                style={{
                  background:
                    product.status === "active"
                      ? "rgba(0,92,114,0.1)"
                      : "var(--ds-surface-container-high)",
                  color:
                    product.status === "active"
                      ? "var(--ds-primary-container)"
                      : "var(--ds-outline)",
                }}
              >
                {product.status}
              </span>
              <button className="p-1.5 rounded-lg text-ds-outline hover:bg-ds-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-base">edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-ds-outline mt-5">
        ✦ These are demo products loaded for preview
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  Tab 3 — Demo Invoice (POS Receipt Style)                                  */
/* ════════════════════════════════════════════════════════════════════════════ */

function TabDemoInvoice({ shop }: { shop: ApiShop | null }) {
  const shopName = shop?.name ?? "Your Shop Name";
  const shopAddress = shop ? formatAddress(shop.address) : "Shop address will appear here";
  const shopPhone = shop?.contactNumber || "+880 1XXX-XXXXXX";
  const fbLink = shop?.socialLinks?.facebook || "";
  const igLink = shop?.socialLinks?.instagram || "";

  const invNumber = "INV-2026-0001";
  const invDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const items = DEMO_INVOICE_ITEMS;
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const discount = 200;
  const grandTotal = subtotal - discount;

  return (
    <div className="px-4 pt-5 pb-4">
      <div className="mb-4">
        <h2
          className="text-lg font-extrabold text-ds-primary"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Demo Receipt
        </h2>
        <p className="text-xs text-ds-outline mt-0.5">
          Preview how your invoices will look to customers.
        </p>
      </div>

      {/* Unlock banner */}
      <div
        className="flex items-center gap-3 rounded-xl p-3 mb-5 border"
        style={{
          background: "rgba(0,92,114,0.06)",
          borderColor: "var(--ds-primary-container)",
        }}
      >
        <span
          className="material-symbols-outlined text-xl flex-shrink-0"
          style={{
            color: "var(--ds-primary-container)",
            fontVariationSettings: "'FILL' 1",
          }}
        >
          star
        </span>
        <p className="text-xs text-ds-on-surface-variant leading-relaxed">
          Unlock <strong className="text-ds-on-surface">receipt branding</strong> and custom colors on the{" "}
          <span className="font-semibold" style={{ color: "var(--ds-primary-container)" }}>
            Business plan
          </span>
          .
        </p>
      </div>

      {/* ── POS Receipt Card ── */}
      <div
        className="rounded-2xl border overflow-hidden shadow-sm"
        style={{
          background: "var(--ds-surface-container-lowest)",
          borderColor: "var(--ds-outline-variant)",
        }}
      >
        {/* Receipt header with shop info */}
        <div
          className="py-5 px-5 text-center text-white"
          style={{ background: "var(--ds-primary-container)" }}
        >
          <h3
            className="text-xl font-extrabold"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {shopName}
          </h3>
          <p className="text-xs text-white/70 mt-1 leading-relaxed">{shopAddress}</p>
          <p className="text-xs text-white/80 font-semibold mt-0.5">{shopPhone}</p>
        </div>

        {/* POS Invoice label */}
        <div className="text-center py-2 border-b" style={{ borderColor: "var(--ds-outline-variant)" }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ds-outline">
            ─ ─ ─ &nbsp; POS Invoice &nbsp; ─ ─ ─
          </p>
        </div>

        {/* Invoice no + Date */}
        <div
          className="flex justify-between px-5 py-3 text-xs border-b"
          style={{ borderColor: "var(--ds-outline-variant)" }}
        >
          <div>
            <p className="text-ds-outline font-medium">Invoice No.</p>
            <p className="text-ds-on-surface font-bold mt-0.5">{invNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-ds-outline font-medium">Date</p>
            <p className="text-ds-on-surface font-bold mt-0.5">{invDate}</p>
          </div>
        </div>

        {/* Customer */}
        <div
          className="px-5 py-3 border-b"
          style={{ borderColor: "var(--ds-outline-variant)" }}
        >
          <p className="text-ds-outline text-[10px] font-bold uppercase tracking-wider mb-1">
            Billed To
          </p>
          <p className="text-ds-on-surface text-sm font-semibold">Rahim Ahmed</p>
          <p className="text-ds-outline text-xs">+880 1934-567890</p>
        </div>

        {/* Items table header */}
        <div className="px-5 pt-3 pb-1">
          <div className="flex text-[10px] font-bold uppercase tracking-wider text-ds-outline border-b pb-1.5" style={{ borderColor: "var(--ds-outline-variant)" }}>
            <span className="flex-1">Item</span>
            <span className="w-10 text-center">Qty</span>
            <span className="w-16 text-right">Rate</span>
            <span className="w-16 text-right">Amount</span>
          </div>
        </div>

        {/* Items */}
        <div className="px-5 py-2 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start text-xs">
              <span className="flex-1 text-ds-on-surface font-medium pr-2 leading-snug">
                {item.name}
              </span>
              <span className="w-10 text-center text-ds-outline">{item.qty}</span>
              <span className="w-16 text-right text-ds-outline">৳{item.price.toLocaleString()}</span>
              <span className="w-16 text-right text-ds-on-surface font-bold">
                ৳{(item.qty * item.price).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Dashed divider */}
        <div className="px-5 py-1">
          <div className="border-t border-dashed" style={{ borderColor: "var(--ds-outline-variant)" }} />
        </div>

        {/* Totals */}
        <div className="px-5 py-2 space-y-1.5">
          <div className="flex justify-between text-xs text-ds-on-surface-variant">
            <span>Subtotal</span>
            <span>৳{subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-green-600">
              <span>Discount</span>
              <span>−৳{discount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Grand total */}
        <div
          className="mx-5 mb-4 rounded-xl px-4 py-3 flex justify-between items-center"
          style={{ background: "var(--ds-surface-container-low)" }}
        >
          <span
            className="font-extrabold text-ds-primary"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Grand Total
          </span>
          <span
            className="text-xl font-extrabold"
            style={{
              color: "var(--ds-primary-container)",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            ৳{grandTotal.toLocaleString()}
          </span>
        </div>

        {/* Dashed divider */}
        <div className="px-5">
          <div className="border-t border-dashed" style={{ borderColor: "var(--ds-outline-variant)" }} />
        </div>

        {/* Footer — Thank you + Social Links */}
        <div className="text-center px-5 py-4 space-y-2.5">
          <p className="text-ds-on-surface text-xs font-semibold">
            {shop?.receiptConfig?.footerText || "Thank you for your purchase!"}
          </p>

          {/* Social links */}
          {(fbLink || igLink) && (
            <div className="space-y-1.5 pt-1">
              <div className="border-t border-dashed mx-8 mb-2" style={{ borderColor: "var(--ds-outline-variant)" }} />
              {fbLink && (
                <div className="flex items-center justify-center gap-2 text-xs text-ds-on-surface-variant">
                  <span className="material-symbols-outlined text-sm" style={{ color: "#1877F2" }}>
                    public
                  </span>
                  <span className="truncate max-w-[220px]">{fbLink}</span>
                </div>
              )}
              {igLink && (
                <div className="flex items-center justify-center gap-2 text-xs text-ds-on-surface-variant">
                  <span className="material-symbols-outlined text-sm" style={{ color: "#E4405F" }}>
                    photo_camera
                  </span>
                  <span className="truncate max-w-[220px]">{igLink}</span>
                </div>
              )}
            </div>
          )}

          <p className="text-[10px] text-ds-outline/60 mt-1">
            ✦ Demo receipt — upgrade for real invoicing
          </p>
        </div>
      </div>

      {/* Print / share */}
      <div className="flex gap-3 mt-4">
        <button
          className="flex-1 py-3 rounded-xl border text-sm font-bold text-ds-outline flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
          disabled
          style={{ borderColor: "var(--ds-outline-variant)" }}
        >
          <span className="material-symbols-outlined text-base">print</span>
          Print
        </button>
        <button
          className="flex-1 py-3 rounded-xl border text-sm font-bold text-ds-outline flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
          disabled
          style={{ borderColor: "var(--ds-outline-variant)" }}
        >
          <span className="material-symbols-outlined text-base">share</span>
          Share
        </button>
      </div>
      <p className="text-center text-[10px] text-ds-outline mt-2">
        Print &amp; Share unlocked on Starter plan+
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/*  Tab 4 — Profile (Fully Dynamic)                                           */
/* ════════════════════════════════════════════════════════════════════════════ */

function TabProfile({
  user,
  shop,
  mySub,
  currentPlanName,
  onLogout,
  onUserUpdated,
  onShopUpdated,
}: {
  user: ApiUser | null;
  shop: ApiShop | null;
  mySub: ApiUserSubscription | null;
  currentPlanName: string;
  onLogout: () => void;
  onUserUpdated: (u: ApiUser) => void;
  onShopUpdated: (s: ApiShop) => void;
}) {
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleResendVerification = async () => {
    setVerifyLoading(true);
    try {
      // The send-verify-mail endpoint is commented out in routes,
      // so we just show a message for now
      showToast("Verification email feature coming soon.", "success");
    } catch {
      showToast("Failed to send verification email.", "error");
    } finally {
      setVerifyLoading(false);
    }
  };

  const memberSince = user?.createdAt ? formatDate(user.createdAt) : "—";
  const subExpiry = mySub?.endDate
    ? new Date(mySub.endDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "—";

  return (
    <div className="px-4 pt-5 pb-4 space-y-4 relative">
      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium max-w-sm animate-in"
          style={{
            background: toast.type === "success" ? "var(--ds-secondary-container)" : "var(--ds-error-container)",
            color: toast.type === "success" ? "var(--ds-on-secondary-container)" : "var(--ds-on-error-container)",
          }}
        >
          <span className="material-symbols-outlined text-base">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Avatar + name */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4 border"
        style={{
          background: "var(--ds-surface-container-lowest)",
          borderColor: "var(--ds-outline-variant)",
        }}
      >
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white flex-shrink-0 overflow-hidden"
          style={{ background: "var(--ds-primary-container)" }}
        >
          {user?.image ? (
            <img
              src={user.image.startsWith("http") ? user.image : `https://api.memobook.shop/uploads/image/${user.image}`}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            (user?.name ?? "U").charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-ds-on-surface font-extrabold text-base truncate"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {user?.name ?? "—"}
          </p>
          <p className="text-ds-outline text-xs truncate mt-0.5">
            {user?.email ?? "No email"}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(0,92,114,0.08)",
                color: "var(--ds-primary-container)",
              }}
            >
              Shop Owner
            </span>
            {user?.isVerified && (
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5"
                style={{
                  background: "rgba(0,128,0,0.08)",
                  color: "#2e7d32",
                }}
              >
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Email verification notice */}
      {user && !user.isVerified && (
        <div
          className="rounded-xl px-4 py-3.5 flex items-center gap-3 border"
          style={{
            background: "rgba(254,187,125,0.10)",
            borderColor: "var(--ds-on-tertiary-container)",
          }}
        >
          <span
            className="material-symbols-outlined text-xl flex-shrink-0"
            style={{
              color: "var(--ds-tertiary)",
              fontVariationSettings: "'FILL' 1",
            }}
          >
            mark_email_unread
          </span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-ds-on-surface">
              Email not verified
            </p>
            <p className="text-[11px] text-ds-on-surface-variant mt-0.5">
              Verify your email to secure your account.
            </p>
          </div>
          <button
            onClick={handleResendVerification}
            disabled={verifyLoading}
            className="text-xs font-bold px-2.5 py-1.5 rounded-lg text-white flex-shrink-0 disabled:opacity-50"
            style={{ background: "var(--ds-tertiary)" }}
          >
            {verifyLoading ? "Sending…" : "Verify"}
          </button>
        </div>
      )}

      {/* Info tiles */}
      {[
        {
          icon: "storefront",
          label: "Shop Name",
          value: shop?.name ?? "No shop yet",
        },
        {
          icon: "badge",
          label: "Account Type",
          value: `${currentPlanName} Plan`,
          sub: mySub?.endDate ? `Expires ${subExpiry}` : undefined,
        },
        {
          icon: "calendar_today",
          label: "Member Since",
          value: memberSince,
        },
        {
          icon: "phone",
          label: "Phone",
          value: user?.phone || "Not set",
        },
      ].map((row) => (
        <div
          key={row.label}
          className="rounded-xl px-4 py-3.5 flex items-center gap-3 border"
          style={{
            background: "var(--ds-surface-container-lowest)",
            borderColor: "var(--ds-outline-variant)",
          }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: "var(--ds-primary-container)", fontVariationSettings: "'FILL' 1" }}
          >
            {row.icon}
          </span>
          <div className="flex-1">
            <p className="text-[10px] text-ds-outline font-semibold uppercase tracking-wider">
              {row.label}
            </p>
            <p className="text-sm font-semibold text-ds-on-surface mt-0.5">{row.value}</p>
            {row.sub && (
              <p className="text-[10px] text-ds-outline mt-0.5">{row.sub}</p>
            )}
          </div>
          <span className="material-symbols-outlined text-base text-ds-outline-variant">
            chevron_right
          </span>
        </div>
      ))}

      {/* Settings row */}
      <div className="pt-1 space-y-2">
        {[
          { icon: "edit", label: "Edit Profile", action: () => setEditProfileOpen(true) },
          { icon: "lock", label: "Change Password", action: () => setChangePasswordOpen(true) },
          { icon: "help", label: "Help & Support", action: () => setHelpOpen(true) },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all active:scale-[0.98]"
            style={{
              background: "var(--ds-surface-container-lowest)",
              borderColor: "var(--ds-outline-variant)",
            }}
          >
            <span className="material-symbols-outlined text-xl text-ds-on-surface-variant">
              {item.icon}
            </span>
            <span className="text-sm font-medium text-ds-on-surface flex-1 text-left">
              {item.label}
            </span>
            <span className="material-symbols-outlined text-base text-ds-outline-variant">
              chevron_right
            </span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all active:scale-[0.98]"
        style={{
          color: "var(--ds-error)",
          borderColor: "var(--ds-error)",
          background: "rgba(186,26,26,0.04)",
        }}
      >
        <span className="material-symbols-outlined text-xl">logout</span>
        Logout
      </button>

      {/* ── Modals ── */}
      {editProfileOpen && user && (
        <EditProfileModal
          user={user}
          shop={shop}
          onClose={() => setEditProfileOpen(false)}
          onSaved={(u, s) => {
            onUserUpdated(u);
            if (s) onShopUpdated(s);
            showToast("Profile updated!");
            setEditProfileOpen(false);
          }}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {changePasswordOpen && (
        <ChangePasswordModal
          onClose={() => setChangePasswordOpen(false)}
          onSaved={() => {
            showToast("Password changed!");
            setChangePasswordOpen(false);
          }}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {helpOpen && (
        <HelpModal onClose={() => setHelpOpen(false)} />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Edit Profile Modal                                                         */
/* ──────────────────────────────────────────────────────────────────────────── */

function EditProfileModal({
  user,
  shop,
  onClose,
  onSaved,
  onError,
}: {
  user: ApiUser;
  shop: ApiShop | null;
  onClose: () => void;
  onSaved: (user: ApiUser, shop: ApiShop | null) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [bio, setBio] = useState(user.bio || "");
  const [shopName, setShopName] = useState(shop?.name || "");
  const [shopContact, setShopContact] = useState(shop?.contactNumber || "");
  const [shopAddr, setShopAddr] = useState(shop?.address?.address_line1 || "");
  const [shopCity, setShopCity] = useState(shop?.address?.city || "");
  const [shopFb, setShopFb] = useState(shop?.socialLinks?.facebook || "");
  const [shopIg, setShopIg] = useState(shop?.socialLinks?.instagram || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update user profile
      const userRes = await authApi.updateProfile({ name, phone, bio });
      // Update session storage too
      sessionStorage.setItem("userName", name);

      // Update shop if it exists
      let updatedShop: ApiShop | null = null;
      if (shop) {
        const shopRes = await shopApi.updateShop(shop._id, {
          name: shopName,
          contactNumber: shopContact,
          address: {
            address_line1: shopAddr,
            city: shopCity,
          },
          socialLinks: {
            facebook: shopFb,
            instagram: shopIg,
          },
        });
        updatedShop = shopRes.shop;
      }

      onSaved(userRes.user, updatedShop);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-ds-surface-container-lowest rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-ds-outline-variant" />
        </div>

        <div className="px-5 pb-8 space-y-5">
          <div className="flex items-center justify-between">
            <h3
              className="text-lg font-extrabold text-ds-primary"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Edit Profile
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-ds-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-xl text-ds-outline">close</span>
            </button>
          </div>

          {/* User fields */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-ds-outline">Personal Info</p>
          <InputField icon="person" label="Full Name" value={name} onChange={setName} />
          <InputField icon="call" label="Phone" value={phone} onChange={setPhone} type="tel" />
          <InputField icon="info" label="Bio" value={bio} onChange={setBio} multiline />

          {/* Shop fields */}
          {shop && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ds-outline pt-2">Shop Info</p>
              <InputField icon="storefront" label="Shop Name" value={shopName} onChange={setShopName} />
              <InputField icon="call" label="Shop Phone" value={shopContact} onChange={setShopContact} type="tel" />
              <InputField icon="location_on" label="Address" value={shopAddr} onChange={setShopAddr} />
              <InputField icon="location_city" label="City" value={shopCity} onChange={setShopCity} />
              <InputField icon="public" label="Facebook URL" value={shopFb} onChange={setShopFb} />
              <InputField icon="photo_camera" label="Instagram" value={shopIg} onChange={setShopIg} />
            </>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ background: "var(--ds-primary-container)" }}
          >
            {saving ? (
              <>
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">save</span>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Change Password Modal                                                      */
/* ──────────────────────────────────────────────────────────────────────────── */

function ChangePasswordModal({
  onClose,
  onSaved,
  onError,
}: {
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Password strength
  const passwordStrength = (() => {
    const p = newPass;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9!@#$%]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const strengthColor = [
    "",
    "bg-red-500",
    "bg-amber-500",
    "bg-yellow-400",
    "bg-emerald-500",
  ][passwordStrength];
  const strengthTextColor = [
    "",
    "text-red-600",
    "text-amber-600",
    "text-yellow-600",
    "text-emerald-600",
  ][passwordStrength];

  const handleSave = async () => {
    if (!oldPass || !newPass || !confirmPass) {
      onError("All fields are required");
      return;
    }
    if (newPass !== confirmPass) {
      onError("New passwords don't match");
      return;
    }
    if (newPass.length < 6) {
      onError("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      await authApi.updatePassword({
        oldPassword: oldPass,
        newPassword: newPass,
        confirmPassword: confirmPass,
      });
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-ds-surface-container-lowest rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-ds-outline-variant" />
        </div>

        <div className="px-5 pb-8 space-y-5">
          <div className="flex items-center justify-between">
            <h3
              className="text-lg font-extrabold text-ds-primary"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Change Password
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-ds-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-xl text-ds-outline">close</span>
            </button>
          </div>

          {/* Old Password */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ds-on-surface-variant ml-1">Current Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                lock
              </span>
              <input
                type={showOld ? "text" : "password"}
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-11 pr-11 py-3.5 bg-ds-surface-container-lowest border border-ds-outline-variant rounded-xl focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-outline"
              >
                <span className="material-symbols-outlined text-xl">
                  {showOld ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ds-on-surface-variant ml-1">New Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                key
              </span>
              <input
                type={showNew ? "text" : "password"}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-11 pr-11 py-3.5 bg-ds-surface-container-lowest border border-ds-outline-variant rounded-xl focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-outline"
              >
                <span className="material-symbols-outlined text-xl">
                  {showNew ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {newPass && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor : "bg-ds-surface-container-high"
                        }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-ds-on-surface-variant">
                  Strength:{" "}
                  <span className={`font-semibold ${strengthTextColor}`}>
                    {strengthLabel}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ds-on-surface-variant ml-1">Confirm Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                key
              </span>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-11 pr-4 py-3.5 bg-ds-surface-container-lowest border border-ds-outline-variant rounded-xl focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
              />
            </div>
            {newPass && confirmPass && newPass !== confirmPass && (
              <p className="text-xs text-red-500 ml-1">Passwords don't match</p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ background: "var(--ds-primary-container)" }}
          >
            {saving ? (
              <>
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Updating…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">lock_reset</span>
                Update Password
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Help & Support Modal                                                       */
/* ──────────────────────────────────────────────────────────────────────────── */

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-ds-surface-container-lowest rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-ds-outline-variant" />
        </div>

        <div className="px-5 pb-8 space-y-5">
          <div className="flex items-center justify-between">
            <h3
              className="text-lg font-extrabold text-ds-primary"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Help &amp; Support
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-ds-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-xl text-ds-outline">close</span>
            </button>
          </div>

          {/* FAQ / support options */}
          {[
            {
              icon: "quiz",
              title: "FAQ",
              desc: "Find answers to commonly asked questions about plans, invoices, and features.",
            },
            {
              icon: "mail",
              title: "Email Support",
              desc: "Reach us at support@kantoinvoice.com for any issues or feedback.",
            },
            {
              icon: "chat",
              title: "Live Chat",
              desc: "Chat with our support team. Available Sun–Thu, 10am–6pm BST.",
            },
            {
              icon: "bug_report",
              title: "Report a Bug",
              desc: "Found something broken? Let us know and we'll fix it ASAP.",
            },
          ].map((item) => (
            <button
              key={item.title}
              className="w-full flex items-start gap-4 p-4 rounded-xl border transition-all active:scale-[0.98]"
              style={{
                background: "var(--ds-surface-container-lowest)",
                borderColor: "var(--ds-outline-variant)",
              }}
            >
              <span
                className="material-symbols-outlined text-2xl mt-0.5"
                style={{ color: "var(--ds-primary-container)", fontVariationSettings: "'FILL' 1" }}
              >
                {item.icon}
              </span>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-ds-on-surface">{item.title}</p>
                <p className="text-xs text-ds-on-surface-variant mt-0.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <span className="material-symbols-outlined text-base text-ds-outline-variant mt-1">
                chevron_right
              </span>
            </button>
          ))}

          {/* App version */}
          <div className="text-center pt-2">
            <p className="text-[10px] text-ds-outline">
              Kanto Invoice v1.0.0 · Built with ♥ in Dhaka
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Shared Input Component                                                     */
/* ──────────────────────────────────────────────────────────────────────────── */

function InputField({
  icon,
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
}: {
  icon: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  const cls =
    "w-full pl-11 pr-4 py-3.5 bg-ds-surface-container-lowest border border-ds-outline-variant rounded-xl focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm";

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-ds-on-surface-variant ml-1">
        {label}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-3.5 text-ds-outline text-xl pointer-events-none">
          {icon}
        </span>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={label}
            rows={3}
            className={cls + " resize-none"}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={label}
            className={cls}
          />
        )}
      </div>
    </div>
  );
}