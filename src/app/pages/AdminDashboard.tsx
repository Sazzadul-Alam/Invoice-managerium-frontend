import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { adminApi, billingCycleApi } from "../api/subscription.api";
import { getToken, getRole, clearSession } from "../utils/session";
import type { SubStats, PopulatedSubscription, ApiPlan, ApiBillingCycle } from "../types";

/* ── helpers ─────────────────────────────────────────────────────── */
const fmt = (n: number) => new Intl.NumberFormat("en-BD").format(n);
const ago = (d: string) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#e8a735",
  active: "#2ecc71",
  expired: "#70787d",
  cancelled: "#ba1a1a",
};

const STATUS_BG: Record<string, string> = {
  pending: "rgba(232,167,53,0.10)",
  active: "rgba(46,204,113,0.10)",
  expired: "rgba(112,120,125,0.10)",
  cancelled: "rgba(186,26,26,0.10)",
};

const headlineFont = { fontFamily: "'Manrope', sans-serif" } as const;

const TABS = ["overview", "pending", "all", "plans", "profile"] as const;
type Tab = (typeof TABS)[number];

/* ══════════════════════════════════════════════════════════════════ */
export function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<SubStats | null>(null);
  const [subs, setSubs] = useState<PopulatedSubscription[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // guard
  useEffect(() => {
    if (!getToken() || getRole() !== "admin") navigate("/login", { replace: true });
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const r = await adminApi.getStats();
      setStats(r.stats);
    } catch { /* noop */ }
  }, []);

  const fetchSubs = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const r = await adminApi.listSubscriptions(status);
      setSubs(r.subscriptions);
      setTotal(r.total);
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    if (tab === "pending") { setFilter("pending"); fetchSubs("pending"); }
    else if (tab === "all") { setFilter(undefined); fetchSubs(); }
    else if (tab === "overview") { fetchSubs("pending"); }
  }, [tab, fetchSubs]);

  const handle = async (id: string, action: "approve" | "reject") => {
    setActing(id);
    try {
      const r = await adminApi.handleSubscription(id, action);
      showToast(r.message);
      fetchSubs(filter);
      fetchStats();
    } catch (e: any) {
      showToast(e.message, "error");
    }
    setActing(null);
  };

  const logout = () => { clearSession(); navigate("/login"); };

  /* ── Stat card ──────────────────────────────────────────────── */
  const StatCard = ({
    icon, label, value, color,
  }: { icon: string; label: string; value: string; color: string }) => (
    <div className="rounded-2xl border bg-ds-surface-container-lowest border-ds-outline-variant px-4 py-4 flex items-center gap-4">
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + "1a" }}
      >
        <span className="material-symbols-outlined text-[22px]" style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-ds-outline font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-xl font-extrabold text-ds-on-surface mt-0.5 truncate" style={headlineFont}>
          {value}
        </p>
      </div>
    </div>
  );

  /* ── Subscription card ──────────────────────────────────────── */
  const SubCard = ({ s }: { s: PopulatedSubscription }) => {
    const isPending = s.status === "pending";
    const statusColor = STATUS_COLORS[s.status] || "#70787d";
    const statusBg = STATUS_BG[s.status] || "rgba(112,120,125,0.10)";
    const refParts = s.paymentReference && s.paymentReference.includes(" - ")
      ? s.paymentReference.split(" - ")
      : null;

    return (
      <div
        className="rounded-2xl border bg-ds-surface-container-lowest border-ds-outline-variant overflow-hidden"
        style={{ borderLeft: `4px solid ${statusColor}` }}
      >
        {/* Header: user + status pill */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
            style={{ background: "var(--ds-primary-container)", ...headlineFont }}
          >
            {s.userId?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ds-on-surface truncate" style={headlineFont}>
              {s.userId?.name || "Unknown User"}
            </p>
            <p className="text-xs text-ds-outline truncate mt-0.5">
              {s.userId?.phone || s.userId?.email || "—"}
            </p>
            {s.shopName && (
              <p className="text-[11px] text-ds-primary font-bold truncate mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">storefront</span>
                {s.shopName}
              </p>
            )}
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full capitalize"
            style={{ background: statusBg, color: statusColor }}
          >
            {s.status}
          </span>
        </div>

        {/* Body: plan / payment / ref / submitted */}
        <div className="px-4 pb-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px] text-ds-on-surface-variant">
          <div>
            <span className="text-ds-outline">Plan: </span>
            <span className="text-ds-on-surface font-bold">{s.planId?.name || "—"}</span>
          </div>
          <div>
            <span className="text-ds-outline">Amount: </span>
            <span className="text-ds-on-surface font-bold">৳{fmt(s.paymentAmount)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-ds-outline">Method: </span>
            <span className="text-ds-on-surface font-medium">{s.paymentMethod}</span>
          </div>
          <div className="col-span-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-ds-outline">Ref:</span>
            {refParts ? (
              <>
                <span className="text-ds-outline">No:</span>
                <code className="px-1.5 py-0.5 rounded bg-ds-surface-container-high text-ds-on-surface font-mono text-[11px]">
                  {refParts[0]}
                </code>
                <span className="text-ds-outline-variant">|</span>
                <span className="text-ds-outline">TrxID:</span>
                <code className="px-1.5 py-0.5 rounded bg-ds-surface-container-high text-ds-on-surface font-mono text-[11px]">
                  {refParts[1]}
                </code>
              </>
            ) : (
              <span className="text-ds-on-surface font-medium">{s.paymentReference || "—"}</span>
            )}
          </div>
          <div className="col-span-2 text-[11px] text-ds-outline">
            Submitted {ago(s.createdAt)}
          </div>
        </div>

        {/* Actions */}
        {isPending && (
          <div className="px-4 pb-4 flex gap-2.5">
            <button
              onClick={() => handle(s._id, "approve")}
              disabled={acting === s._id}
              className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: "var(--ds-primary)" }}
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Approve
            </button>
            <button
              onClick={() => handle(s._id, "reject")}
              disabled={acting === s._id}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50 border"
              style={{ color: "var(--ds-error)", borderColor: "var(--ds-error)", background: "rgba(186,26,26,0.04)" }}
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              Reject
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ── Section header ─────────────────────────────────────────── */
  const PageHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="mb-4">
      <h1 className="text-xl font-extrabold text-ds-on-surface" style={headlineFont}>{title}</h1>
      {subtitle && <p className="text-xs text-ds-outline mt-1">{subtitle}</p>}
    </div>
  );

  const EmptyState = ({ icon, label }: { icon: string; label: string }) => (
    <div className="rounded-2xl border bg-ds-surface-container-lowest border-ds-outline-variant py-10 px-4 text-center text-ds-outline">
      <span className="material-symbols-outlined text-[40px] block mb-2 opacity-40">{icon}</span>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );

  const LoadingState = ({ label = "Loading…" }: { label?: string }) => (
    <div className="py-10 text-center text-ds-outline">
      <span className="h-7 w-7 border-2 border-ds-outline-variant border-t-ds-primary-container rounded-full animate-spin inline-block mb-2" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );

  /* ── Tabs ───────────────────────────────────────────────────── */
  const OverviewTab = () => (
    <div className="px-4 pt-5 pb-24 space-y-4">
      <PageHeader title="Admin Dashboard" subtitle="Subscription overview & quick actions" />

      <div className="grid gap-3">
        <StatCard icon="pending_actions" label="Pending Requests" value={stats ? String(stats.pending) : "—"} color="#e8a735" />
        <StatCard icon="verified" label="Active Subscribers" value={stats ? String(stats.active) : "—"} color="#2ecc71" />
        <StatCard icon="payments" label="Total Revenue" value={stats ? `৳${fmt(stats.revenue)}` : "—"} color="#005C72" />
      </div>

      <div className="pt-3">
        <h2 className="text-sm font-bold text-ds-on-surface mb-3 flex items-center gap-1.5" style={headlineFont}>
          <span className="material-symbols-outlined text-[18px]" style={{ color: "#e8a735" }}>notifications_active</span>
          Pending Approvals
        </h2>
        {loading ? (
          <LoadingState />
        ) : subs.length === 0 ? (
          <EmptyState icon="task_alt" label="No pending requests" />
        ) : (
          <div className="space-y-3">
            {subs.slice(0, 5).map(s => <SubCard key={s._id} s={s} />)}
          </div>
        )}
      </div>
    </div>
  );

  const ListTab = ({ statusFilter }: { statusFilter?: string }) => (
    <div className="px-4 pt-5 pb-24">
      <PageHeader
        title={statusFilter === "pending" ? "Pending Requests" : "All Subscriptions"}
        subtitle={`${total} record${total !== 1 ? "s" : ""} found`}
      />

      {!statusFilter && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {["all", "pending", "active", "expired", "cancelled"].map(f => {
            const active = f === "all" ? !filter : filter === f;
            return (
              <button
                key={f}
                onClick={() => { setFilter(f === "all" ? undefined : f); fetchSubs(f === "all" ? undefined : f); }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold border capitalize transition-colors ${
                  active
                    ? "text-white border-transparent"
                    : "text-ds-on-surface-variant bg-ds-surface-container-lowest border-ds-outline-variant"
                }`}
                style={active ? { background: "var(--ds-primary)" } : undefined}
              >
                {f}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : subs.length === 0 ? (
        <EmptyState icon="inbox" label="No subscriptions found" />
      ) : (
        <div className="space-y-3">
          {subs.map(s => <SubCard key={s._id} s={s} />)}
        </div>
      )}
    </div>
  );

  const PlansTab = () => {
    const [subTab, setSubTab] = useState<"plans" | "cycles">("plans");

    const [plans, setPlans] = useState<ApiPlan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState<Partial<ApiPlan>>({
      name: "", description: "", price: undefined,
      maxShops: undefined, maxModeratorsPerShop: undefined, maxProductsPerShop: undefined, maxInvoicesPerMonth: undefined,
      isActive: true, sortOrder: 0,
      features: { receiptCustomization: false, exportPdf: false, analytics: false }
    });

    const [cycles, setCycles] = useState<ApiBillingCycle[]>([]);
    const [loadingCycles, setLoadingCycles] = useState(false);
    const [showAddCycle, setShowAddCycle] = useState(false);
    const [cycleData, setCycleData] = useState<Partial<ApiBillingCycle>>({
      name: "", durationInMonths: undefined, discountAmount: undefined, isActive: true, sortOrder: 0
    });

    const loadPlans = useCallback(async () => {
      setLoadingPlans(true);
      try {
        const r = await adminApi.listPlans();
        setPlans(r.plans);
      } catch (e) { console.error(e); }
      setLoadingPlans(false);
    }, []);

    const loadCycles = useCallback(async () => {
      setLoadingCycles(true);
      try {
        const r = await billingCycleApi.getAll();
        setCycles(r.billingCycles);
      } catch (e) { console.error(e); }
      setLoadingCycles(false);
    }, []);

    useEffect(() => {
      if (subTab === "plans") loadPlans();
      else loadCycles();
    }, [loadPlans, loadCycles, subTab]);

    const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const slug = formData.name?.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        const payload = { ...formData, slug };
        const r = await adminApi.createPlan(payload);
        showToast(r.message);
        setShowAdd(false);
        loadPlans();
      } catch (err: any) {
        showToast(err.message, "error");
      }
    };

    const togglePlanStatus = async (id: string, isActive: boolean) => {
      try {
        const r = await adminApi.togglePlanStatus(id, isActive);
        showToast(r.message);
        loadPlans();
      } catch (err: any) {
        showToast(err.message, "error");
      }
    };

    const handleCreateCycle = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const r = await billingCycleApi.create(cycleData);
        showToast(r.message);
        setShowAddCycle(false);
        loadCycles();
      } catch (err: any) {
        showToast(err.message, "error");
      }
    };

    const toggleCycleStatus = async (id: string, isActive: boolean) => {
      try {
        const r = await billingCycleApi.toggleStatus(id, isActive);
        showToast(r.message);
        loadCycles();
      } catch (err: any) {
        showToast(err.message, "error");
      }
    };

    const inputClass = "w-full rounded-lg border border-ds-outline-variant bg-ds-surface-container-low px-3 py-2 text-sm text-ds-on-surface focus:outline-none focus:border-ds-primary-container transition-colors";
    const labelClass = "text-[10px] font-bold uppercase tracking-wider text-ds-outline";

    return (
      <div className="px-4 pt-5 pb-24">
        {/* Sub-tab switcher */}
        <div className="flex gap-2 mb-5 border-b border-ds-outline-variant">
          {([
            { key: "plans", label: "Pricing Plans" },
            { key: "cycles", label: "Billing Cycles" },
          ] as const).map(t => {
            const active = subTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setSubTab(t.key)}
                className={`pb-2.5 px-1 text-sm transition-colors border-b-[3px] -mb-px ${
                  active ? "text-ds-primary font-extrabold border-ds-primary" : "text-ds-outline font-bold border-transparent"
                }`}
                style={headlineFont}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {subTab === "plans" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-extrabold text-ds-on-surface" style={headlineFont}>Subscription Plans</h1>
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95"
                style={{ background: "var(--ds-primary)" }}
              >
                <span className="material-symbols-outlined text-[16px]">{showAdd ? "close" : "add"}</span>
                {showAdd ? "Cancel" : "Add Plan"}
              </button>
            </div>

            {showAdd && (
              <div className="rounded-2xl border bg-ds-surface-container-lowest border-ds-outline-variant p-4 mb-5">
                <h2 className="text-sm font-extrabold text-ds-on-surface mb-3" style={headlineFont}>Create New Plan</h2>
                <form onSubmit={handleCreate} autoComplete="off" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className={labelClass}>Name</label>
                      <input required autoComplete="off" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Price (Base)</label>
                      <input required autoComplete="off" type="number" value={formData.price ?? ""} onChange={e => setFormData({ ...formData, price: e.target.value === "" ? undefined : Number(e.target.value) })} className={inputClass} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Description</label>
                    <input required autoComplete="off" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className={labelClass}>Max Shops</label>
                      <input required autoComplete="off" type="number" value={formData.maxShops ?? ""} onChange={e => setFormData({ ...formData, maxShops: e.target.value === "" ? undefined : Number(e.target.value) })} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Max Products/Shop</label>
                      <input required autoComplete="off" type="number" value={formData.maxProductsPerShop ?? ""} onChange={e => setFormData({ ...formData, maxProductsPerShop: e.target.value === "" ? undefined : Number(e.target.value) })} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Max Moderators/Shop</label>
                      <input required autoComplete="off" type="number" value={formData.maxModeratorsPerShop ?? ""} onChange={e => setFormData({ ...formData, maxModeratorsPerShop: e.target.value === "" ? undefined : Number(e.target.value) })} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Max Invoices/Month</label>
                      <input required autoComplete="off" type="number" value={formData.maxInvoicesPerMonth ?? ""} onChange={e => setFormData({ ...formData, maxInvoicesPerMonth: e.target.value === "" ? undefined : Number(e.target.value) })} className={inputClass} />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    style={{ background: "var(--ds-primary)" }}
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Save Plan
                  </button>
                </form>
              </div>
            )}

            {loadingPlans ? (
              <LoadingState label="Loading plans…" />
            ) : (
              <div className="space-y-3">
                {plans.map(p => (
                  <div key={p._id} className="rounded-2xl border bg-ds-surface-container-lowest border-ds-outline-variant p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-ds-primary" style={headlineFont}>{p.name}</h3>
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              background: p.isActive ? "rgba(46,125,50,0.10)" : "rgba(198,40,40,0.10)",
                              color: p.isActive ? "#2e7d32" : "#c62828",
                            }}
                          >
                            {p.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <span className="inline-block text-[10px] text-ds-outline bg-ds-surface-container-high px-2 py-0.5 rounded-full font-mono mt-1.5">
                          {p.slug}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-extrabold text-ds-on-surface" style={headlineFont}>৳{fmt(p.price)}</p>
                        <p className="text-[10px] text-ds-outline uppercase tracking-wider">Base /mo</p>
                      </div>
                    </div>
                    <p className="text-xs text-ds-on-surface-variant mb-3">{p.description}</p>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[11px] font-semibold bg-ds-surface-container-high text-ds-on-surface px-2 py-1 rounded-md">
                          Shops: {p.maxShops === -1 ? "∞" : p.maxShops}
                        </span>
                        <span className="text-[11px] font-semibold bg-ds-surface-container-high text-ds-on-surface px-2 py-1 rounded-md">
                          Products: {p.maxProductsPerShop === -1 ? "∞" : p.maxProductsPerShop}
                        </span>
                        <span className="text-[11px] font-semibold bg-ds-surface-container-high text-ds-on-surface px-2 py-1 rounded-md">
                          Invoices: {p.maxInvoicesPerMonth === -1 ? "∞" : p.maxInvoicesPerMonth}
                        </span>
                      </div>
                      <button
                        onClick={() => togglePlanStatus(p._id, !p.isActive)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                          p.isActive
                            ? "border border-ds-outline-variant text-ds-on-surface-variant bg-ds-surface-container-lowest"
                            : "text-white"
                        }`}
                        style={!p.isActive ? { background: "var(--ds-primary)" } : undefined}
                      >
                        {p.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                    {!p.isActive && p.deactivatedAt && (
                      <p className="text-[10px] text-ds-outline mt-2">
                        Deactivated on {new Date(p.deactivatedAt).toLocaleDateString()} {new Date(p.deactivatedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {subTab === "cycles" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-extrabold text-ds-on-surface" style={headlineFont}>Billing Cycles</h1>
              <button
                onClick={() => setShowAddCycle(!showAddCycle)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95"
                style={{ background: "var(--ds-primary)" }}
              >
                <span className="material-symbols-outlined text-[16px]">{showAddCycle ? "close" : "add"}</span>
                {showAddCycle ? "Cancel" : "Add Cycle"}
              </button>
            </div>

            {showAddCycle && (
              <div className="rounded-2xl border bg-ds-surface-container-lowest border-ds-outline-variant p-4 mb-5">
                <h2 className="text-sm font-extrabold text-ds-on-surface mb-3" style={headlineFont}>Create New Cycle</h2>
                <form onSubmit={handleCreateCycle} autoComplete="off" className="space-y-3">
                  <div className="space-y-1">
                    <label className={labelClass}>Cycle Name (e.g. Monthly, Yearly)</label>
                    <input required autoComplete="off" value={cycleData.name} onChange={e => setCycleData({ ...cycleData, name: e.target.value })} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className={labelClass}>Duration (Months)</label>
                      <input required autoComplete="off" type="number" min={1} value={cycleData.durationInMonths ?? ""} onChange={e => setCycleData({ ...cycleData, durationInMonths: e.target.value === "" ? undefined : Number(e.target.value) })} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Discount Amount</label>
                      <input required autoComplete="off" type="number" min={0} value={cycleData.discountAmount ?? ""} onChange={e => setCycleData({ ...cycleData, discountAmount: e.target.value === "" ? undefined : Number(e.target.value) })} className={inputClass} />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    style={{ background: "var(--ds-primary)" }}
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Save Cycle
                  </button>
                </form>
              </div>
            )}

            {loadingCycles ? (
              <LoadingState label="Loading cycles…" />
            ) : cycles.length === 0 ? (
              <EmptyState icon="event_repeat" label="No billing cycles yet" />
            ) : (
              <div className="space-y-3">
                {cycles.map(c => (
                  <div key={c._id} className="rounded-2xl border bg-ds-surface-container-lowest border-ds-outline-variant p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-extrabold text-ds-on-surface" style={headlineFont}>
                        {c.name}
                        <span className="text-xs text-ds-outline font-semibold ml-2">({c.durationInMonths} months)</span>
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: c.isActive ? "rgba(46,125,50,0.10)" : "rgba(198,40,40,0.10)",
                            color: c.isActive ? "#2e7d32" : "#c62828",
                          }}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className="text-xs text-ds-on-surface-variant">
                          Discount: <span className="font-bold text-ds-on-surface">৳{fmt(c.discountAmount)}</span>
                        </span>
                      </div>
                      {!c.isActive && c.deactivatedAt && (
                        <p className="text-[10px] text-ds-outline mt-1.5">
                          Deactivated on {new Date(c.deactivatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleCycleStatus(c._id, !c.isActive)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        c.isActive
                          ? "border border-ds-outline-variant text-ds-on-surface-variant bg-ds-surface-container-lowest"
                          : "text-white"
                      }`}
                      style={!c.isActive ? { background: "var(--ds-primary)" } : undefined}
                    >
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const ProfileTab = () => {
    const name = sessionStorage.getItem("userName") || "Admin";
    const email = sessionStorage.getItem("userEmail") || "—";
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    return (
      <div className="px-4 pt-5 pb-24 space-y-4">
        <div className="rounded-2xl border bg-ds-surface-container-lowest border-ds-outline-variant p-5 flex items-center gap-4">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0"
            style={{ background: "var(--ds-primary-container)", ...headlineFont }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-ds-on-surface font-extrabold text-base truncate" style={headlineFont}>{name}</p>
            <p className="text-ds-outline text-xs truncate mt-0.5">{email}</p>
            <span
              className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,92,114,0.10)", color: "var(--ds-primary-container)" }}
            >
              Administrator
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all active:scale-[0.98]"
          style={{
            color: "var(--ds-error)",
            borderColor: "var(--ds-error)",
            background: "rgba(186,26,26,0.04)",
          }}
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          Sign out
        </button>
      </div>
    );
  };

  /* ── bottom nav config ───────────────────────────────────────── */
  const navItems: { key: Tab; icon: string; label: string }[] = [
    { key: "overview", icon: "dashboard", label: "Overview" },
    { key: "pending", icon: "pending_actions", label: "Pending" },
    { key: "all", icon: "list_alt", label: "All Subs" },
    { key: "plans", icon: "workspace_premium", label: "Plans" },
    { key: "profile", icon: "admin_panel_settings", label: "Profile" },
  ];

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen flex flex-col bg-ds-background text-ds-on-background"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-ds-surface-container-lowest/95 backdrop-blur-md border-b border-ds-outline-variant/50">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--ds-primary-container)" }}
            >
              <span className="material-symbols-outlined text-[20px] text-white">shield_person</span>
            </div>
            <span className="text-ds-primary font-extrabold text-base" style={headlineFont}>
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            {stats && stats.pending > 0 && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: "rgba(232,167,53,0.12)", color: "#b8860b" }}
              >
                {stats.pending} pending
              </span>
            )}
            <button
              onClick={logout}
              className="p-2 rounded-full text-ds-outline hover:bg-ds-surface-container-high transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto max-w-lg mx-auto w-full">
        {tab === "overview" && <OverviewTab />}
        {tab === "pending" && <ListTab statusFilter="pending" />}
        {tab === "all" && <ListTab />}
        {tab === "plans" && <PlansTab />}
        {tab === "profile" && <ProfileTab />}
      </main>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium max-w-sm"
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

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-ds-outline-variant/60 bg-ds-surface-container-lowest/95 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="max-w-lg mx-auto flex items-stretch h-16">
          {navItems.map(n => {
            const active = tab === n.key;
            const showDot = n.key === "pending" && stats && stats.pending > 0;
            return (
              <button
                key={n.key}
                onClick={() => setTab(n.key)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 relative"
              >
                <span
                  className="material-symbols-outlined text-[22px] transition-all"
                  style={{
                    fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                    color: active ? "var(--ds-primary-container)" : "var(--ds-outline)",
                  }}
                >
                  {n.icon}
                </span>
                <span
                  className="text-[10px] font-semibold tracking-wide transition-colors"
                  style={{ color: active ? "var(--ds-primary-container)" : "var(--ds-outline)" }}
                >
                  {n.label}
                </span>
                {showDot && (
                  <span
                    className="absolute top-2 right-[calc(50%-16px)] h-2 w-2 rounded-full"
                    style={{ background: "#e8a735" }}
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
