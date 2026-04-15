import { NavLink } from "react-router";
import {
  UserPlus,
  ClipboardList,
  PackagePlus,
  BarChart3,
  Package,
  ChevronRight,
} from "lucide-react";
import { cn } from "./utils";
import { getRole } from "../../auth.utils";

const navItems = [
  {
    to: "/admin/approve-users",
    icon: ClipboardList,
    label: "Approve Users",
    description: "Review pending registrations",
    accent: "from-amber-500 to-orange-500",
    glow: "shadow-amber-900/30",
    adminOnly: true,
  },
  {
    to: "/admin/create-product",
    icon: PackagePlus,
    label: "Create Product",
    description: "Add new items to catalogue",
    accent: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-900/30",
    adminOnly: false,
  },
  {
    to: "/admin/inventory",
    icon: BarChart3,
    label: "Generate Inventory",
    description: "Export & review stock reports",
    accent: "from-violet-500 to-purple-500",
    glow: "shadow-violet-900/30",
    adminOnly: false,
  },
];

export function AdminSidebar() {
  const userEmail = sessionStorage.getItem("userEmail") ?? "admin@company.com";
  const userName = sessionStorage.getItem("userName") ?? "Admin User";
  const isAdmin = getRole() === "admin";

  // Initials for avatar
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="w-64 min-h-screen bg-zinc-950 border-r border-zinc-800/60 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-lg flex-shrink-0">
            <Package className="h-5 w-5 text-zinc-900" />
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              InvenFlow
            </p>
            <p className="text-amber-500/70 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Pending users quick-link — admin only */}
      {isAdmin && (
        <div className="px-4 pt-5 pb-2">
          <NavLink
            to="/admin/approve-users"
            className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 hover:bg-amber-500/15 transition-colors"
          >
            <UserPlus className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-amber-300 text-xs font-semibold">New Users Waiting</p>
              <p className="text-amber-500/70 text-xs">3 pending approvals</p>
            </div>
            <span className="bg-amber-500 text-zinc-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
              3
            </span>
          </NavLink>
        </div>
      )}

      {/* Nav */}
      <nav className={`flex-1 px-3 space-y-1 ${isAdmin ? "py-2" : "pt-5 pb-2"}`}>
        <p className="text-zinc-600 text-xs font-semibold uppercase tracking-widest px-2 pb-2">
          Management
        </p>
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                isActive ? "bg-zinc-800/80" : "hover:bg-zinc-800/50"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "relative flex-shrink-0 p-2 rounded-lg bg-gradient-to-br transition-all duration-200",
                    item.accent,
                    isActive
                      ? `shadow-lg ${item.glow}`
                      : "opacity-70 group-hover:opacity-100"
                  )}
                >
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold leading-tight transition-colors",
                      isActive ? "text-white" : "text-zinc-300 group-hover:text-white"
                    )}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{item.description}</p>
                </div>
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 transition-all duration-200",
                    isActive ? "text-amber-400 translate-x-0.5" : "text-zinc-700 group-hover:text-zinc-400"
                  )}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / user info */}
      <div className="px-4 py-4 border-t border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-zinc-900 text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{userName}</p>
            <p className="text-zinc-500 text-xs truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}