import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Package,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { authApi, saveSession } from "../auth.utils";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await authApi.login({ email, password });
      // Decode JWT → extract role, persist everything to sessionStorage
      saveSession(data.access_token, data.user);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex bg-zinc-950"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-2/5 bg-zinc-900 border-r border-zinc-800 flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 border border-amber-500/10 rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-20 left-0 w-48 h-48 border border-amber-500/10 rounded-full -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 border border-zinc-700/30 rounded-full -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Package className="h-5 w-5 text-zinc-900" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              InvenFlow
            </span>
          </div>
          <h2 className="text-4xl text-white leading-tight mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Welcome<br />
            <span className="text-amber-400">back.</span>
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Sign in to manage your inventory, track orders, and keep your business running smoothly.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-4">Roles</p>
          <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3">
            <div className="bg-indigo-500/20 p-1.5 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Admin</p>
              <p className="text-zinc-500 text-xs">Full inventory & user management</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3">
            <div className="bg-emerald-500/20 p-1.5 rounded-lg">
              <UserCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Customer</p>
              <p className="text-zinc-500 text-xs">Orders, wishlist & rewards</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Package className="h-5 w-5 text-zinc-900" />
            </div>
            <span className="text-white font-bold text-lg" style={{ fontFamily: "'DM Serif Display', serif" }}>
              InvenFlow
            </span>
          </div>

          <h1 className="text-3xl text-white mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Sign in
          </h1>
          <p className="text-zinc-500 text-sm mb-8">
            New here?{" "}
            <Link to="/register" className="text-amber-400 hover:text-amber-300 transition-colors">
              Create an account
            </Link>
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Email Address
              </Label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  required
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20 h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="remember"
                className="rounded border-zinc-700 bg-zinc-900 accent-amber-500 cursor-pointer"
              />
              <Label htmlFor="remember" className="text-sm text-zinc-400 cursor-pointer">
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold text-sm tracking-wide border-0 transition-all duration-200 group mt-2 disabled:opacity-40"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-zinc-900/40 border-t-zinc-900 rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}