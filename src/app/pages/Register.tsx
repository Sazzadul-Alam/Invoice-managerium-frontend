import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { authApi, saveSession } from "../auth.utils";

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
      }).then((data) => {
        saveSession(data.access_token, data.user);
      });
      navigate("/shop-setup");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength
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

  return (
    <div
      className="min-h-screen flex flex-col bg-ds-background text-ds-on-background selection:bg-ds-secondary-container selection:text-ds-on-secondary-container"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <main className="flex-grow flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* ── Branding ── */}
          <div className="text-center mb-8">
            <img
              src="/invoice_logo.png"
              alt={`${import.meta.env.VITE_APP_NAME || "Invoice Managerium"} logo`}
              className="w-26 h-26 object-contain drop-shadow-md mx-auto mb-2"
            />
            <h1
              className="text-3xl font-extrabold tracking-tight text-ds-on-surface mb-1"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {import.meta.env.VITE_APP_NAME || "Invoice Managerium"}
            </h1>
            <p className="text-ds-on-surface-variant font-medium text-sm">
              Create your professional account
            </p>
          </div>

          {/* ── Card ── */}
          <div className="bg-ds-surface-container-lowest border border-ds-outline-variant p-8 rounded-xl shadow-sm">

            {/* Error alert */}
            {error && (
              <div className="mb-5 flex items-start gap-3 bg-ds-error-container border border-ds-on-error-container/20 text-ds-on-error-container px-4 py-3 rounded-lg text-sm">
                <span className="material-symbols-outlined text-base mt-0.5">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name + Phone row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-ds-on-surface-variant ml-1" htmlFor="name">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                      person
                    </span>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-ds-surface-container-low border border-ds-outline-variant rounded-lg focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-ds-on-surface-variant ml-1" htmlFor="phone">
                    Phone
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                      phone
                    </span>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      maxLength={11}
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-ds-surface-container-low border border-ds-outline-variant rounded-lg focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-ds-on-surface-variant ml-1" htmlFor="email">
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
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-ds-surface-container-low border border-ds-outline-variant rounded-lg focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-ds-on-surface-variant ml-1" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                    lock
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleChange}
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
                {/* Strength meter */}
                {formData.password && (
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
                <label className="block text-sm font-semibold text-ds-on-surface-variant ml-1" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                    lock_reset
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    placeholder="Repeat your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 bg-ds-surface-container-low border border-ds-outline-variant rounded-lg focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-outline hover:text-ds-on-surface-variant transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showConfirm ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-ds-error mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    Passwords don't match
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 8 && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Passwords match
                  </p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-0.5 rounded border-ds-outline-variant cursor-pointer accent-ds-primary"
                />
                <label htmlFor="terms" className="text-sm text-ds-on-surface-variant cursor-pointer leading-relaxed">
                  I agree to the{" "}
                  <a href="#" className="text-ds-primary font-semibold hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-ds-primary font-semibold hover:underline">Privacy Policy</a>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-ds-primary-container text-white font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ds-outline-variant" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-ds-surface-container-lowest px-4 text-ds-outline font-bold">
                  Identity Portal
                </span>
              </div>
            </div>

            {/* Login link */}
            <div className="text-center">
              <p className="text-ds-on-surface-variant text-sm font-medium">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-ds-primary font-extrabold ml-1 hover:underline active:opacity-70 transition-all"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          {/* ── Trust badges ── */}
          <div className="mt-10 flex justify-center items-center gap-6 opacity-40 grayscale">
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