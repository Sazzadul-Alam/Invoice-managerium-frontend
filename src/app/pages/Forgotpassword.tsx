import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { authApi } from "../auth.utils";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await authApi.forgotPassword(email);
      setSuccessMsg(res.message || "OTP sent to your email!");
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("OTP is required");
      return;
    }
    if (otp.length !== 4) {
      setError("OTP must be 4 digits");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await authApi.verifyOtp(otp);
      setSuccessMsg(res.message || "OTP verified successfully!");
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await authApi.resetPassword({
        otp,
        newPassword,
        confirmPassword,
      });
      setSuccessMsg(res.message || "Password reset successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const passwordStrength = (() => {
    const p = newPassword;
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
              className="w-26 h-26 mx-auto mb-2 object-contain drop-shadow-sm"
            />
            <h1
              className="text-3xl font-extrabold tracking-tight text-ds-on-surface mb-2"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {import.meta.env.VITE_APP_NAME || "Invoice Managerium"}
            </h1>
            <p className="text-ds-on-surface-variant font-medium text-sm">
              Reset Your Password
            </p>
          </div>

          <div className="bg-ds-surface-container-lowest border border-ds-outline-variant shadow-sm rounded-xl p-8">
            {error && (
              <div className="mb-5 flex items-start gap-3 bg-ds-error-container border border-ds-on-error-container/20 text-ds-on-error-container px-4 py-3 rounded-lg text-sm">
                <span className="material-symbols-outlined text-base mt-0.5">error</span>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-5 flex items-start gap-3 bg-ds-secondary-container border text-ds-on-secondary-container px-4 py-3 rounded-lg text-sm" style={{ borderColor: "rgba(0,128,0,0.1)" }}>
                <span className="material-symbols-outlined text-base mt-0.5">check_circle</span>
                {successMsg}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-ds-on-surface-variant ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                      mail
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-3 bg-ds-surface-container-low border border-ds-outline-variant rounded-lg focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-ds-primary-container text-white font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </form>
            ) : step === 2 ? (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-ds-on-surface-variant ml-1">
                    4-Digit OTP
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                      pin
                    </span>
                    <input
                      type="text"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 4-digit OTP"
                      className="w-full pl-10 pr-4 py-3 bg-ds-surface-container-low border border-ds-outline-variant rounded-lg focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm tracking-widest font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-ds-primary-container text-white font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-ds-on-surface-variant ml-1">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                      lock
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full pl-10 pr-12 py-3 bg-ds-surface-container-low border border-ds-outline-variant rounded-lg focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-outline hover:text-ds-on-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {/* Strength meter */}
                  {newPassword && (
                    <div className="mt-2 space-y-1.5 px-1">
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

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-ds-on-surface-variant ml-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                      lock
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-4 py-3 bg-ds-surface-container-low border border-ds-outline-variant rounded-lg focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-ds-primary-container text-white font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 text-center">
              <Link
                to="/login"
                className="text-sm font-semibold text-ds-primary hover:underline transition-colors inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back to Login
              </Link>
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