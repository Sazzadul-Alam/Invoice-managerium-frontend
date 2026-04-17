import { useState } from "react";
import { Link, useNavigate } from "react-router";
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
      saveSession(data.access_token, data.user);
      if (data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-ds-background text-ds-on-background selection:bg-ds-secondary-container selection:text-ds-on-secondary-container"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* ── Branding ── */}
          <div className="text-center mb-10">
            <img
              src="/invoice_logo.png"
              alt="Invoice Managerium logo"
              className="w-26 h-26 object-contain drop-shadow-md mx-auto mb-2"
            />
            <h1
              className="text-3xl font-extrabold tracking-tight text-ds-on-surface mb-2"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Invoice Managerium
            </h1>
            <p className="text-ds-on-surface-variant font-medium text-sm">
              Secure Professional Invoice Manager
            </p>
          </div>

          {/* ── Login Card ── */}
          <div className="bg-ds-surface-container-lowest border border-ds-outline-variant p-8 rounded-xl shadow-sm">

            {/* Error alert */}
            {error && (
              <div className="mb-5 flex items-start gap-3 bg-ds-error-container border border-ds-on-error-container/20 text-ds-on-error-container px-4 py-3 rounded-lg text-sm">
                <span className="material-symbols-outlined text-base mt-0.5">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-ds-on-surface-variant ml-1"
                  htmlFor="email"
                >
                  Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                    mail
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="w-full pl-10 pr-4 py-3 bg-ds-surface-container-low border border-ds-outline-variant rounded-lg focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label
                    className="block text-sm font-semibold text-ds-on-surface-variant"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-ds-primary hover:underline transition-opacity active:opacity-70"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                    lock
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="w-full pl-10 pr-12 py-3 bg-ds-surface-container-low border border-ds-outline-variant rounded-lg focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-outline hover:text-ds-on-surface-variant transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-ds-primary-container text-white font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ds-outline-variant" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-ds-surface-container-lowest px-4 text-ds-outline font-bold">
                  Identity Portal
                </span>
              </div>
            </div>

            {/* Register link */}
            <div className="text-center">
              <p className="text-ds-on-surface-variant text-sm font-medium">
                New to the platform?{" "}
                <Link
                  to="/register"
                  className="text-ds-primary font-extrabold ml-1 hover:underline active:opacity-70 transition-all"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>

          {/* ── Trust badges ── */}
          <div className="mt-12 flex justify-center items-center gap-6 opacity-40 grayscale">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">shield</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Secure TLS</span>
            </div>
          </div>

        </div>
      </main>

      {/* ── Decorative background blobs ── */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-full overflow-hidden opacity-10 pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full bg-ds-primary-container blur-3xl -mr-64 -mt-64" />
      </div>
      <div className="fixed bottom-0 left-0 -z-10 w-1/4 h-full overflow-hidden opacity-5 pointer-events-none">
        <div className="w-[400px] h-[400px] rounded-full bg-ds-secondary-container blur-2xl -ml-32 -mb-32" />
      </div>
    </div>
  );
}