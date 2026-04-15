import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  LogOut,
  ShieldCheck,
  UserCircle,
  Bell,
  Search,
  ChevronRight,
} from "lucide-react";
import { AdminSidebar } from "../components/ui/adminsidebar";

// ─── Shared stats data ───────────────────────────────────────────────────────
const adminStats = [
  { title: "Total Products", value: "1,234", change: "+12.5%", up: true, icon: Package, accent: "from-blue-500 to-cyan-500" },
  { title: "Low Stock Items", value: "23", change: "-8.2%", up: false, icon: TrendingUp, accent: "from-orange-500 to-amber-500" },
  { title: "Total Orders", value: "456", change: "+23.1%", up: true, icon: ShoppingCart, accent: "from-emerald-500 to-green-500" },
  { title: "Active Users", value: "89", change: "+5.4%", up: true, icon: Users, accent: "from-purple-500 to-violet-500" },
];

const customerStats = [
  { title: "My Orders", value: "12", change: "+2 this month", up: true, icon: ShoppingCart, accent: "from-amber-500 to-yellow-500" },
  { title: "Pending Deliveries", value: "3", change: "On the way", up: true, icon: Package, accent: "from-orange-500 to-amber-500" },
  { title: "Wishlist Items", value: "7", change: "Saved for later", up: true, icon: TrendingUp, accent: "from-rose-500 to-pink-500" },
  { title: "Loyalty Points", value: "480", change: "+60 this week", up: true, icon: Users, accent: "from-violet-500 to-purple-500" },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  change,
  up,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card className="bg-zinc-900/60 border border-zinc-800/60 backdrop-blur-sm hover:border-zinc-700/60 transition-all duration-200 group">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {title}
        </CardTitle>
        <div
          className={`p-2 rounded-lg bg-gradient-to-br ${accent} opacity-80 group-hover:opacity-100 transition-opacity`}
        >
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          {value}
        </p>
        <p className={`text-xs mt-1 ${up ? "text-emerald-400" : "text-red-400"}`}>
          {change}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Top Header Bar ──────────────────────────────────────────────────────────
function TopBar({
  role,
  onLogout,
}: {
  role: string;
  onLogout: () => void;
}) {
  const isAdmin = role === "admin";
  return (
    <header className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60 sticky top-0 z-20">
      <div className="flex justify-between items-center h-14 px-5">
        <div className="flex items-center gap-3">
          {!isAdmin && (
            <div className="flex items-center gap-2.5">
              <div className="bg-amber-500 p-1.5 rounded-lg">
                <Package className="h-5 w-5 text-zinc-900" />
              </div>
              <span
                className="text-white font-bold text-base"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                InvenFlow
              </span>
            </div>
          )}
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isAdmin
                ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
            }`}
          >
            {isAdmin ? (
              <ShieldCheck className="h-3 w-3" />
            ) : (
              <UserCircle className="h-3 w-3" />
            )}
            {isAdmin ? "Admin" : "Customer"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <Search className="h-4 w-4" />
          </button>
          <button className="relative h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="h-8 border-zinc-700 bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

// ─── Customer Dashboard ───────────────────────────────────────────────────────
function CustomerDashboard() {
  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h2
          className="text-xl font-bold text-white"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          My Dashboard
        </h2>
        <p className="text-zinc-400 text-sm mt-0.5">
          Track your orders, wishlist and loyalty rewards.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {customerStats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Recent Orders */}
      <div className="mt-6">
        <h3
          className="text-sm font-semibold text-zinc-300 mb-3"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Recent Orders
        </h3>
        <Card className="bg-zinc-900/60 border border-zinc-800/60">
          <CardContent className="p-0">
            {[
              { id: "#ORD-001", product: "Wireless Headphones", status: "Delivered", date: "Apr 12", amount: "$89.00" },
              { id: "#ORD-002", product: "USB-C Hub 7-in-1", status: "In Transit", date: "Apr 14", amount: "$45.00" },
              { id: "#ORD-003", product: "Mechanical Keyboard", status: "Processing", date: "Apr 15", amount: "$120.00" },
            ].map((order, i, arr) => (
              <div
                key={order.id}
                className={`flex items-center justify-between px-4 py-3 hover:bg-zinc-800/40 transition-colors cursor-pointer ${
                  i < arr.length - 1 ? "border-b border-zinc-800/60" : ""
                }`}
              >
                <div>
                  <p className="text-white text-sm font-medium">{order.product}</p>
                  <p className="text-zinc-500 text-xs">{order.id} · {order.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-white text-sm font-semibold">{order.amount}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === "Delivered"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : order.status === "In Transit"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-zinc-500/15 text-zinc-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

// ─── Admin Dashboard Content ──────────────────────────────────────────────────
function AdminDashboardContent() {
  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h2
          className="text-xl font-bold text-white"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Overview
        </h2>
        <p className="text-zinc-400 text-sm mt-0.5">
          Here's what's happening with your inventory today.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {adminStats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Quick action cards */}
      <div className="mt-6">
        <h3
          className="text-sm font-semibold text-zinc-300 mb-3"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Approve Users",
              desc: "3 waiting for review",
              color: "border-amber-500/30 hover:border-amber-500/60",
              dot: "bg-amber-400",
              badge: "3",
              badgeColor: "bg-amber-500/15 text-amber-400",
            },
            {
              label: "Create Product",
              desc: "Add to catalogue",
              color: "border-emerald-500/30 hover:border-emerald-500/60",
              dot: "bg-emerald-400",
              badge: null,
              badgeColor: "",
            },
            {
              label: "Generate Report",
              desc: "Export latest inventory",
              color: "border-violet-500/30 hover:border-violet-500/60",
              dot: "bg-violet-400",
              badge: null,
              badgeColor: "",
            },
          ].map((a) => (
            <Card
              key={a.label}
              className={`bg-zinc-900/40 border ${a.color} cursor-pointer transition-all duration-200 hover:bg-zinc-800/50`}
            >
              <CardContent className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${a.dot}`} />
                  <div>
                    <p className="text-white text-sm font-semibold">{a.label}</p>
                    <p className="text-zinc-500 text-xs">{a.desc}</p>
                  </div>
                </div>
                {a.badge && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.badgeColor}`}>
                    {a.badge}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div className="mt-6">
        <h3
          className="text-sm font-semibold text-zinc-300 mb-3"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Recent Activity
        </h3>
        <Card className="bg-zinc-900/60 border border-zinc-800/60">
          <CardContent className="p-0">
            {[
              { action: "New order placed", detail: "#ORD-456 · $340.00", time: "2 min ago", dot: "bg-emerald-400" },
              { action: "Stock alert triggered", detail: "USB-C Cables — 4 left", time: "18 min ago", dot: "bg-amber-400" },
              { action: "User approved", detail: "jane.doe@acme.com", time: "1 hr ago", dot: "bg-blue-400" },
              { action: "Report generated", detail: "March inventory export", time: "3 hr ago", dot: "bg-violet-400" },
            ].map((item, i, arr) => (
              <div
                key={item.action + item.time}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors ${
                  i < arr.length - 1 ? "border-b border-zinc-800/60" : ""
                }`}
              >
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${item.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.action}</p>
                  <p className="text-zinc-500 text-xs truncate">{item.detail}</p>
                </div>
                <span className="text-zinc-600 text-xs flex-shrink-0">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

// ─── Root Dashboard (role router) ─────────────────────────────────────────────
export function Dashboard() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem("userRole") ?? "customer";
  const isAdmin = role === "admin";

  const handleLogout = () => {
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-zinc-950"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <TopBar role={role} onLogout={handleLogout} />
      <div className="flex flex-1">
        {isAdmin && <AdminSidebar />}
        {isAdmin ? <AdminDashboardContent /> : <CustomerDashboard />}
      </div>
    </div>
  );
}