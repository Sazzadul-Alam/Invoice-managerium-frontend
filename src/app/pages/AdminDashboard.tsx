import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  adminApi,
  getToken,
  getRole,
  clearSession,
  type SubStats,
  type PopulatedSubscription,
  type ApiPlan,
  billingCycleApi,
  type ApiBillingCycle,
} from "../auth.utils";

/* ── tiny helpers ─────────────────────────────────────────────────── */
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
  const [toast, setToast] = useState("");

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
      setToast(r.message);
      setTimeout(() => setToast(""), 2600);
      fetchSubs(filter);
      fetchStats();
    } catch (e: any) { setToast(e.message); setTimeout(() => setToast(""), 2600); }
    setActing(null);
  };

  const logout = () => { clearSession(); navigate("/login"); };

  /* ── icon helper ─────────────────────────────────────────────── */
  const Icon = ({ name, style }: { name: string; style?: React.CSSProperties }) => (
    <span className="material-symbols-outlined" style={{ fontSize: 22, ...style }}>{name}</span>
  );

  /* ── stat card ───────────────────────────────────────────────── */
  const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) => (
    <div style={{
      background: "var(--ds-surface-container-lowest)",
      border: "1px solid var(--ds-outline-variant)",
      borderRadius: 16, padding: "18px 16px",
      display: "flex", alignItems: "center", gap: 14,
      transition: "transform .15s", cursor: "default",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: color + "18", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} style={{ color, fontSize: 24 }} />
      </div>
      <div>
        <div style={{ fontSize: 13, color: "var(--ds-on-surface-variant)", fontFamily: "var(--font-body)" }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ds-on-surface)", fontFamily: "var(--font-headline)" }}>{value}</div>
      </div>
    </div>
  );

  /* ── subscription card ───────────────────────────────────────── */
  const SubCard = ({ s }: { s: PopulatedSubscription }) => {
    const isPending = s.status === "pending";
    const statusColor = STATUS_COLORS[s.status] || "#70787d";
    return (
      <div style={{
        background: "var(--ds-surface-container-lowest)",
        border: "1px solid var(--ds-outline-variant)",
        borderRadius: 16, padding: 16, marginBottom: 12,
        borderLeft: `4px solid ${statusColor}`,
      }}>
        {/* user */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--ds-primary-container)", color: "var(--ds-on-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14, fontFamily: "var(--font-headline)",
          }}>
            {s.userId?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ds-on-surface)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.userId?.name || "Unknown User"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ds-on-surface-variant)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.userId?.phone || s.userId?.email || "—"}
            </div>
            {s.shopName && (
              <div style={{ fontSize: 11, color: "var(--ds-primary)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                <Icon name="storefront" style={{ fontSize: 13, verticalAlign: "middle", marginRight: 2 }} />
                Shop: {s.shopName}
              </div>
            )}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "3px 10px",
            borderRadius: 20, background: statusColor + "1a", color: statusColor,
            textTransform: "capitalize",
          }}>{s.status}</span>
        </div>

        {/* plan + payment */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
          fontSize: 12, color: "var(--ds-on-surface-variant)", marginBottom: isPending ? 12 : 0,
        }}>
          <div><span style={{ opacity: .6 }}>Plan:</span> <b style={{ color: "var(--ds-on-surface)" }}>{s.planId?.name || "—"}</b></div>
          <div><span style={{ opacity: .6 }}>Amount:</span> <b style={{ color: "var(--ds-on-surface)" }}>৳{fmt(s.paymentAmount)}</b></div>
          <div><span style={{ opacity: .6 }}>Method:</span> {s.paymentMethod}</div>
          <div style={{ gridColumn: "1/-1" }}>
            <span style={{ opacity: .6 }}>Ref:</span>
            {s.paymentReference && s.paymentReference.includes(" - ") ? (
              <span style={{ color: "var(--ds-on-surface)", marginLeft: 4 }}>
                No: <b style={{ background: "var(--ds-surface-container-high)", padding: "2px 6px", borderRadius: 4 }}>{s.paymentReference.split(" - ")[0]}</b>
                <span style={{ margin: "0 6px", opacity: 0.5 }}>|</span>
                TrxID: <b style={{ background: "var(--ds-surface-container-high)", padding: "2px 6px", borderRadius: 4 }}>{s.paymentReference.split(" - ")[1]}</b>
              </span>
            ) : (
              <span style={{ marginLeft: 4 }}>{s.paymentReference || "—"}</span>
            )}
          </div>
          <div style={{ gridColumn: "1/-1", marginTop: 4 }}><span style={{ opacity: .6 }}>Submitted:</span> {ago(s.createdAt)}</div>
        </div>

        {/* actions */}
        {isPending && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handle(s._id, "approve")} disabled={acting === s._id}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 12, border: "none",
                background: "var(--ds-primary-container)", color: "var(--ds-on-primary)",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
                opacity: acting === s._id ? .5 : 1,
                fontFamily: "var(--font-body)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
              <Icon name="check_circle" style={{ fontSize: 18 }} /> Approve
            </button>
            <button onClick={() => handle(s._id, "reject")} disabled={acting === s._id}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 12,
                border: "1px solid var(--ds-error)", background: "transparent",
                color: "var(--ds-error)", fontWeight: 600, fontSize: 13, cursor: "pointer",
                opacity: acting === s._id ? .5 : 1,
                fontFamily: "var(--font-body)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
              <Icon name="cancel" style={{ fontSize: 18 }} /> Reject
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ── tab content renderers ───────────────────────────────────── */
  const OverviewTab = () => (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--ds-on-surface)", fontFamily: "var(--font-headline)", margin: 0 }}>
        Admin Dashboard
      </h1>
      <p style={{ fontSize: 13, color: "var(--ds-on-surface-variant)", margin: "4px 0 20px", fontFamily: "var(--font-body)" }}>
        Subscription overview & quick actions
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        <StatCard icon="pending_actions" label="Pending Requests" value={stats ? String(stats.pending) : "—"} color="#e8a735" />
        <StatCard icon="verified" label="Active Subscribers" value={stats ? String(stats.active) : "—"} color="#2ecc71" />
        <StatCard icon="payments" label="Total Revenue" value={stats ? `৳${fmt(stats.revenue)}` : "—"} color="var(--ds-primary)" />
      </div>

      {/* pending preview */}
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ds-on-surface)", margin: "28px 0 12px", fontFamily: "var(--font-headline)" }}>
        <Icon name="notifications_active" style={{ fontSize: 18, verticalAlign: "text-bottom", color: "#e8a735", marginRight: 6 }} />
        Pending Approvals
      </h2>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--ds-on-surface-variant)" }}>Loading…</div>
      ) : subs.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "36px 16px", color: "var(--ds-on-surface-variant)",
          background: "var(--ds-surface-container-lowest)", borderRadius: 16,
          border: "1px solid var(--ds-outline-variant)",
        }}>
          <Icon name="task_alt" style={{ fontSize: 40, display: "block", margin: "0 auto 8px", opacity: .4 }} />
          No pending requests
        </div>
      ) : subs.slice(0, 5).map(s => <SubCard key={s._id} s={s} />)}
    </div>
  );

  const ListTab = ({ statusFilter }: { statusFilter?: string }) => (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--ds-on-surface)", fontFamily: "var(--font-headline)", margin: "0 0 4px" }}>
        {statusFilter === "pending" ? "Pending Requests" : "All Subscriptions"}
      </h1>
      <p style={{ fontSize: 13, color: "var(--ds-on-surface-variant)", margin: "0 0 16px", fontFamily: "var(--font-body)" }}>
        {total} record{total !== 1 ? "s" : ""} found
      </p>

      {/* filter pills for "all" tab */}
      {!statusFilter && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          {["all", "pending", "active", "expired", "cancelled"].map(f => (
            <button key={f} onClick={() => { setFilter(f === "all" ? undefined : f); fetchSubs(f === "all" ? undefined : f); }}
              style={{
                padding: "6px 16px", borderRadius: 20, border: "1px solid var(--ds-outline-variant)",
                background: (f === "all" ? !filter : filter === f) ? "var(--ds-primary-container)" : "transparent",
                color: (f === "all" ? !filter : filter === f) ? "var(--ds-on-primary)" : "var(--ds-on-surface-variant)",
                fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                fontFamily: "var(--font-body)", textTransform: "capitalize",
              }}>{f}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--ds-on-surface-variant)" }}>Loading…</div>
      ) : subs.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "36px 16px", color: "var(--ds-on-surface-variant)",
          background: "var(--ds-surface-container-lowest)", borderRadius: 16,
          border: "1px solid var(--ds-outline-variant)",
        }}>
          <Icon name="inbox" style={{ fontSize: 40, display: "block", margin: "0 auto 8px", opacity: .4 }} />
          No subscriptions found
        </div>
      ) : subs.map(s => <SubCard key={s._id} s={s} />)}
    </div>
  );

  const PlansTab = () => {
    const [subTab, setSubTab] = useState<"plans" | "cycles">("plans");

    // --- Plans State ---
    const [plans, setPlans] = useState<ApiPlan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState<Partial<ApiPlan>>({
      name: "", description: "", price: undefined,
      maxShops: undefined, maxModeratorsPerShop: undefined, maxProductsPerShop: undefined, maxInvoicesPerMonth: undefined,
      isActive: true, sortOrder: 0,
      features: { receiptCustomization: false, exportPdf: false, analytics: false }
    });

    // --- Cycles State ---
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
        // Auto-generate slug from name
        const slug = formData.name?.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        const payload = { ...formData, slug };

        const r = await adminApi.createPlan(payload);
        setToast(r.message);
        setTimeout(() => setToast(""), 2600);
        setShowAdd(false);
        loadPlans();
      } catch (err: any) {
        setToast(err.message);
        setTimeout(() => setToast(""), 2600);
      }
    };

    const togglePlanStatus = async (id: string, isActive: boolean) => {
      try {
        const r = await adminApi.togglePlanStatus(id, isActive);
        setToast(r.message);
        setTimeout(() => setToast(""), 2600);
        loadPlans();
      } catch (err: any) {
        setToast(err.message);
        setTimeout(() => setToast(""), 2600);
      }
    };

    const handleCreateCycle = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const r = await billingCycleApi.create(cycleData);
        setToast(r.message);
        setTimeout(() => setToast(""), 2600);
        setShowAddCycle(false);
        loadCycles();
      } catch (err: any) {
        setToast(err.message);
        setTimeout(() => setToast(""), 2600);
      }
    };

    const toggleCycleStatus = async (id: string, isActive: boolean) => {
      try {
        const r = await billingCycleApi.toggleStatus(id, isActive);
        setToast(r.message);
        setTimeout(() => setToast(""), 2600);
        loadCycles();
      } catch (err: any) {
        setToast(err.message);
        setTimeout(() => setToast(""), 2600);
      }
    };

    return (
      <div style={{ padding: "20px 16px 100px" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 20, borderBottom: "1px solid var(--ds-outline-variant)" }}>
          <button onClick={() => setSubTab("plans")} style={{
            background: "none", border: "none", padding: "8px 0", cursor: "pointer",
            fontWeight: subTab === "plans" ? 800 : 600, fontSize: 16,
            color: subTab === "plans" ? "var(--ds-primary)" : "var(--ds-on-surface-variant)",
            borderBottom: subTab === "plans" ? "3px solid var(--ds-primary)" : "3px solid transparent",
            fontFamily: "var(--font-headline)"
          }}>Pricing Plans</button>

          {/* <button onClick={() => setSubTab("cycles")} style={{
            background: "none", border: "none", padding: "8px 0", cursor: "pointer",
            fontWeight: subTab === "cycles" ? 800 : 600, fontSize: 16,
            color: subTab === "cycles" ? "var(--ds-primary)" : "var(--ds-on-surface-variant)",
            borderBottom: subTab === "cycles" ? "3px solid var(--ds-primary)" : "3px solid transparent",
            fontFamily: "var(--font-headline)"
          }}>Billing Cycles</button> */}
        </div>

        {subTab === "plans" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--ds-on-surface)", fontFamily: "var(--font-headline)", margin: 0 }}>
                Subscription Plans
              </h1>
              <button onClick={() => setShowAdd(!showAdd)} style={{
                background: "var(--ds-primary-container)", color: "var(--ds-on-primary)",
                border: "none", padding: "6px 12px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 4, cursor: "pointer"
              }}>
                <Icon name={showAdd ? "close" : "add"} style={{ fontSize: 18 }} /> {showAdd ? "Cancel" : "Add Plan"}
              </button>
            </div>

            {showAdd && (
              <div style={{
                background: "var(--ds-surface-container-lowest)", border: "1px solid var(--ds-outline-variant)",
                borderRadius: 16, padding: 16, marginBottom: 20
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Create New Plan</h2>

                <form onSubmit={handleCreate} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Name</label>
                      <input required autoComplete="off" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Price</label>
                      <input required autoComplete="off" type="number" value={formData.price ?? ""} onChange={e => setFormData({ ...formData, price: e.target.value === "" ? undefined : Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Description</label>
                    <input required autoComplete="off" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                  </div>
                  {/* <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Max Shops</label>
                      <input required autoComplete="off" type="number" value={formData.maxShops ?? ""} onChange={e => setFormData({ ...formData, maxShops: e.target.value === "" ? undefined : Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Max Products/Shop</label>
                      <input required autoComplete="off" type="number" value={formData.maxProductsPerShop ?? ""} onChange={e => setFormData({ ...formData, maxProductsPerShop: e.target.value === "" ? undefined : Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Max Moderators/Shop</label>
                      <input required autoComplete="off" type="number" value={formData.maxModeratorsPerShop ?? ""} onChange={e => setFormData({ ...formData, maxModeratorsPerShop: e.target.value === "" ? undefined : Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Max Invoices/Month</label>
                      <input required autoComplete="off" type="number" value={formData.maxInvoicesPerMonth ?? ""} onChange={e => setFormData({ ...formData, maxInvoicesPerMonth: e.target.value === "" ? undefined : Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                    </div>
                  </div> */}
                  <button type="submit" style={{
                    background: "var(--ds-primary)", color: "white", padding: "10px", borderRadius: 8,
                    border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 8
                  }}>
                    Save Plan
                  </button>
                </form>
              </div>
            )}

            {loadingPlans ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--ds-on-surface-variant)" }}>Loading plans…</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {plans.map(p => (
                  <div key={p._id} style={{
                    background: "var(--ds-surface-container-lowest)", border: "1px solid var(--ds-outline-variant)",
                    borderRadius: 16, padding: 16
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ds-primary)" }}>{p.name}</h3>
                          <span style={{
                            padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                            background: p.isActive ? "#e8f5e9" : "#ffebee", color: p.isActive ? "#2e7d32" : "#c62828"
                          }}>
                            {p.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--ds-on-surface-variant)", background: "var(--ds-surface-container-high)", padding: "2px 8px", borderRadius: 10 }}>{p.slug}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>৳{fmt(p.price)} /mo Base</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, margin: "0 0 12px", color: "var(--ds-on-surface-variant)" }}>{p.description}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        {/* <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11 }}>
                          <span style={{ background: "#e6e8e9", padding: "4px 8px", borderRadius: 6 }}>Shops: {p.maxShops === -1 ? "∞" : p.maxShops}</span>
                          <span style={{ background: "#e6e8e9", padding: "4px 8px", borderRadius: 6 }}>Products: {p.maxProductsPerShop === -1 ? "∞" : p.maxProductsPerShop}</span>
                          <span style={{ background: "#e6e8e9", padding: "4px 8px", borderRadius: 6 }}>Invoices: {p.maxInvoicesPerMonth === -1 ? "∞" : p.maxInvoicesPerMonth}</span>
                        </div> */}
                        {!p.isActive && p.deactivatedAt && (
                          <div style={{ fontSize: 10, color: "var(--ds-on-surface-variant)", marginTop: 6 }}>
                            Deactivated on: {new Date(p.deactivatedAt).toLocaleDateString()} {new Date(p.deactivatedAt).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                      <button onClick={() => togglePlanStatus(p._id, !p.isActive)} style={{
                        background: p.isActive ? "transparent" : "var(--ds-primary-container)",
                        color: p.isActive ? "var(--ds-on-surface-variant)" : "var(--ds-on-primary)",
                        padding: "6px 12px", borderRadius: 10, border: p.isActive ? "1px solid var(--ds-outline-variant)" : "none",
                        cursor: "pointer", fontSize: 12, fontWeight: 600
                      }}>
                        {p.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {subTab === "cycles" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--ds-on-surface)", fontFamily: "var(--font-headline)", margin: 0 }}>
                Billing Cycles
              </h1>
              <button onClick={() => setShowAddCycle(!showAddCycle)} style={{
                background: "var(--ds-primary-container)", color: "var(--ds-on-primary)",
                border: "none", padding: "6px 12px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 4, cursor: "pointer"
              }}>
                <Icon name={showAddCycle ? "close" : "add"} style={{ fontSize: 18 }} /> {showAddCycle ? "Cancel" : "Add Cycle"}
              </button>
            </div>

            {showAddCycle && (
              <div style={{
                background: "var(--ds-surface-container-lowest)", border: "1px solid var(--ds-outline-variant)",
                borderRadius: 16, padding: 16, marginBottom: 20
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Create New Cycle</h2>
                <form onSubmit={handleCreateCycle} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Cycle Name (e.g., Monthly)</label>
                      <input required autoComplete="off" value={cycleData.name} onChange={e => setCycleData({ ...cycleData, name: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Duration (Months)</label>
                        <input required autoComplete="off" type="number" min={1} value={cycleData.durationInMonths ?? ""} onChange={e => setCycleData({ ...cycleData, durationInMonths: e.target.value === "" ? undefined : Number(e.target.value) })}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Discount (Flat Amount)</label>
                        <input required autoComplete="off" type="number" min={0} value={cycleData.discountAmount ?? ""} onChange={e => setCycleData({ ...cycleData, discountAmount: e.target.value === "" ? undefined : Number(e.target.value) })}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                      </div>
                    </div>
                  </div>
                  <button type="submit" style={{
                    background: "var(--ds-primary)", color: "white", padding: "10px", borderRadius: 8,
                    border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 8
                  }}>
                    Save Cycle
                  </button>
                </form>
              </div>
            )}

            {loadingCycles ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--ds-on-surface-variant)" }}>Loading cycles…</div>
            ) : cycles.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--ds-on-surface-variant)" }}>No billing cycles created.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {cycles.map(c => (
                  <div key={c._id} style={{
                    background: "var(--ds-surface-container-lowest)", border: "1px solid var(--ds-outline-variant)",
                    borderRadius: 16, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ds-on-surface)" }}>
                        {c.name} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ds-on-surface-variant)", marginLeft: 6 }}>({c.durationInMonths} Months)</span>
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{
                          padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                          background: c.isActive ? "#e8f5e9" : "#ffebee", color: c.isActive ? "#2e7d32" : "#c62828"
                        }}>
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                        <span style={{ fontSize: 13, color: "var(--ds-on-surface-variant)" }}>
                          Discount: ৳{fmt(c.discountAmount)}
                        </span>
                      </div>
                      {!c.isActive && c.deactivatedAt && (
                        <div style={{ fontSize: 10, color: "var(--ds-on-surface-variant)", marginTop: 6 }}>
                          Deactivated on: {new Date(c.deactivatedAt).toLocaleDateString()} {new Date(c.deactivatedAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => toggleCycleStatus(c._id, !c.isActive)} style={{
                        background: c.isActive ? "transparent" : "var(--ds-primary-container)",
                        color: c.isActive ? "var(--ds-on-surface-variant)" : "var(--ds-on-primary)",
                        padding: "6px 12px", borderRadius: 10, border: c.isActive ? "1px solid var(--ds-outline-variant)" : "none",
                        cursor: "pointer", fontSize: 12, fontWeight: 600
                      }}>
                        {c.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
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
      <div style={{ padding: "20px 16px 100px" }}>
        <div style={{
          background: "var(--ds-surface-container-lowest)", borderRadius: 20,
          border: "1px solid var(--ds-outline-variant)", padding: "28px 20px",
          textAlign: "center", marginBottom: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px",
            background: "var(--ds-primary-container)", color: "var(--ds-on-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 700, fontFamily: "var(--font-headline)",
          }}>{initials}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ds-on-surface)", fontFamily: "var(--font-headline)" }}>{name}</div>
          <div style={{ fontSize: 13, color: "var(--ds-on-surface-variant)" }}>{email}</div>
          <span style={{
            display: "inline-block", marginTop: 8, padding: "4px 14px", borderRadius: 20,
            background: "var(--ds-primary-container)", color: "var(--ds-on-primary)",
            fontSize: 12, fontWeight: 600,
          }}>Administrator</span>
        </div>

        <button onClick={logout} style={{
          width: "100%", padding: "14px 0", borderRadius: 14, border: "1px solid var(--ds-error)",
          background: "transparent", color: "var(--ds-error)", fontWeight: 600, fontSize: 14,
          cursor: "pointer", fontFamily: "var(--font-body)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <Icon name="logout" style={{ fontSize: 20 }} /> Sign Out
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
    <div style={{
      minHeight: "100dvh", background: "var(--ds-background)",
      fontFamily: "var(--font-body)", maxWidth: 480, margin: "0 auto",
      position: "relative",
    }}>
      {/* top bar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "var(--ds-surface-container-lowest)",
        borderBottom: "1px solid var(--ds-outline-variant)",
        padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "var(--ds-primary-container)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="shield_person" style={{ fontSize: 20, color: "var(--ds-on-primary)" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--ds-on-surface)", fontFamily: "var(--font-headline)" }}>
            Admin
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {stats && stats.pending > 0 && (
            <span style={{
              padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: "#e8a73520", color: "#e8a735",
            }}>
              {stats.pending} pending
            </span>
          )}
          <button
            onClick={logout}
            style={{
              background: "transparent", border: "none", padding: 8, borderRadius: "50%",
              color: "var(--ds-on-surface-variant)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="Logout"
          >
            <Icon name="logout" style={{ fontSize: 20 }} />
          </button>
        </div>
      </header>

      {/* content */}
      <main>
        {tab === "overview" && <OverviewTab />}
        {tab === "pending" && <ListTab statusFilter="pending" />}
        {tab === "all" && <ListTab />}
        {tab === "plans" && <PlansTab />}
        {tab === "profile" && <ProfileTab />}
      </main>

      {/* toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)",
          background: "var(--ds-on-surface)", color: "var(--ds-surface-container-lowest)",
          padding: "10px 24px", borderRadius: 12, fontSize: 13, fontWeight: 600,
          zIndex: 50, boxShadow: "0 4px 20px rgba(0,0,0,.15)",
          animation: "fadeInUp .25s ease",
        }}>{toast}</div>
      )}

      {/* bottom nav */}
      <nav style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "var(--ds-surface-container-lowest)",
        borderTop: "1px solid var(--ds-outline-variant)",
        display: "flex", justifyContent: "space-around",
        padding: "6px 0 env(safe-area-inset-bottom, 8px)",
        zIndex: 40,
      }}>
        {navItems.map(n => {
          const active = tab === n.key;
          return (
            <button key={n.key} onClick={() => setTab(n.key)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                gap: 2, padding: "6px 0", border: "none", background: "transparent",
                cursor: "pointer", transition: "color .15s",
                color: active ? "var(--ds-primary)" : "var(--ds-on-surface-variant)",
              }}>
              <Icon name={n.icon} style={{
                fontSize: 24,
                fontVariationSettings: active ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400",
              }} />
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>{n.label}</span>
              {n.key === "pending" && stats && stats.pending > 0 && (
                <span style={{
                  position: "absolute", top: 2, marginLeft: 20,
                  width: 8, height: 8, borderRadius: "50%", background: "#e8a735",
                }} />
              )}
            </button>
          );
        })}
      </nav>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
