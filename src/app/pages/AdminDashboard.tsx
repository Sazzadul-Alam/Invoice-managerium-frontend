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
              {s.userId?.email || "—"}
            </div>
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
          <div><span style={{ opacity: .6 }}>Ref:</span> {s.paymentReference || "—"}</div>
          <div style={{ gridColumn: "1/-1" }}><span style={{ opacity: .6 }}>Submitted:</span> {ago(s.createdAt)}</div>
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
    const [plans, setPlans] = useState<ApiPlan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState<Partial<ApiPlan>>({
      name: "", slug: "", description: "", price: 0, billingCycle: "monthly",
      maxShops: 1, maxModeratorsPerShop: 0, maxProductsPerShop: 10, maxInvoicesPerMonth: 20,
      isActive: true, sortOrder: 0,
      features: { receiptCustomization: false, exportPdf: false, analytics: false }
    });

    const loadPlans = useCallback(async () => {
      setLoadingPlans(true);
      try {
        const r = await adminApi.listPlans();
        setPlans(r.plans);
      } catch (e) { console.error(e); }
      setLoadingPlans(false);
    }, []);

    useEffect(() => { loadPlans(); }, [loadPlans]);

    const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const r = await adminApi.createPlan(formData);
        setToast(r.message);
        setTimeout(() => setToast(""), 2600);
        setShowAdd(false);
        loadPlans();
      } catch (err: any) {
        setToast(err.message);
        setTimeout(() => setToast(""), 2600);
      }
    };

    return (
      <div style={{ padding: "20px 16px 100px" }}>
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
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Name</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Slug</label>
                  <input required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Price</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Billing Cycle</label>
                  <select value={formData.billingCycle} onChange={e => setFormData({ ...formData, billingCycle: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Description</label>
                <input required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Max Shops</label>
                  <input required type="number" value={formData.maxShops} onChange={e => setFormData({ ...formData, maxShops: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-on-surface-variant)" }}>Max Products/Shop</label>
                  <input required type="number" value={formData.maxProductsPerShop} onChange={e => setFormData({ ...formData, maxProductsPerShop: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ds-outline-variant)", marginTop: 4, fontSize: 13 }} />
                </div>
              </div>
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
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ds-primary)" }}>{p.name}</h3>
                    <span style={{ fontSize: 11, color: "var(--ds-on-surface-variant)", background: "var(--ds-surface-container-high)", padding: "2px 8px", borderRadius: 10 }}>{p.slug}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>৳{fmt(p.price)}</div>
                    <div style={{ fontSize: 10, color: "var(--ds-on-surface-variant)", textTransform: "uppercase" }}>{p.billingCycle}</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, margin: "0 0 12px", color: "var(--ds-on-surface-variant)" }}>{p.description}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11 }}>
                  <span style={{ background: "#e6e8e9", padding: "4px 8px", borderRadius: 6 }}>Shops: {p.maxShops === -1 ? "∞" : p.maxShops}</span>
                  <span style={{ background: "#e6e8e9", padding: "4px 8px", borderRadius: 6 }}>Products: {p.maxProductsPerShop === -1 ? "∞" : p.maxProductsPerShop}</span>
                  <span style={{ background: "#e6e8e9", padding: "4px 8px", borderRadius: 6 }}>Invoices: {p.maxInvoicesPerMonth === -1 ? "∞" : p.maxInvoicesPerMonth}</span>
                </div>
              </div>
            ))}
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
            Kanto Admin
          </span>
        </div>
        {stats && stats.pending > 0 && (
          <span style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: "#e8a73520", color: "#e8a735",
          }}>
            {stats.pending} pending
          </span>
        )}
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
