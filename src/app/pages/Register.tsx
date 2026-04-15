import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Package, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { authApi } from "../auth.utils";

export function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/^01\d{9}$/.test(formData.phone)) {
      setError("Phone must be 11 digits and start with 01");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });
      navigate("/verify-email", {
        state: { email: formData.email },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = (() => {
    const p = formData.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9!@#$%]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const strengthColor = ["", "bg-red-500", "bg-amber-500", "bg-yellow-400", "bg-emerald-500"][passwordStrength];

  return (
    <div
      className="min-h-screen flex bg-zinc-950"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Left panel */}
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
            Build your<br />
            <span className="text-amber-400">inventory</span><br />
            empire.
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Join thousands of businesses managing their stock, orders, and warehouses — all in one place.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            "Real-time stock tracking",
            "Role-based access control",
            "Automated inventory reports",
          ].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span className="text-zinc-400 text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto relative">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
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
            Create account
          </h1>
          <p className="text-zinc-500 text-sm mb-8">
            Already have one?{" "}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
              Sign in
            </Link>
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name + Phone row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Full Name">
                <Input
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20 h-11"
                />
              </FieldGroup>
              <FieldGroup label="Phone">
                <Input
                  name="phone"
                  placeholder="01XXXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  maxLength={11}
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20 h-11"
                />
              </FieldGroup>
            </div>

            <FieldGroup label="Email Address">
              <Input
                name="email"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20 h-11"
              />
            </FieldGroup>

            <FieldGroup label="Password">
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
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
              {formData.password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= passwordStrength ? strengthColor : "bg-zinc-800"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Strength:{" "}
                    <span
                      className={`font-medium ${
                        passwordStrength <= 1 ? "text-red-400" :
                        passwordStrength === 2 ? "text-amber-400" :
                        passwordStrength === 3 ? "text-yellow-400" : "text-emerald-400"
                      }`}
                    >
                      {strengthLabel}
                    </span>
                  </p>
                </div>
              )}
            </FieldGroup>

            <FieldGroup label="Confirm Password">
              <div className="relative">
                <Input
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20 h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
              )}
            </FieldGroup>

            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-0.5 rounded border-zinc-700 bg-zinc-900 accent-amber-500 cursor-pointer"
              />
              <Label htmlFor="terms" className="text-sm text-zinc-400 cursor-pointer leading-relaxed">
                I agree to the{" "}
                <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors">Terms of Service</a>{" "}
                and{" "}
                <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors">Privacy Policy</a>
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
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
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

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}