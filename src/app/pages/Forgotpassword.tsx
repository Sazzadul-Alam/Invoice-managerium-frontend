import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Package,
  ArrowLeft,
  ArrowRight,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";

type Step = "email" | "otp" | "reset" | "done";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  // Step 1 — Send reset email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email address"); return; }
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setStep("otp");
      startCountdown();
    } catch {
      setError("Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Enter all 6 digits"); return; }
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      setStep("reset");
    } catch {
      setError("Invalid code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3 — Set new password
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setStep("done");
    } catch {
      setError("Reset failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setOtp("");
      startCountdown();
    } catch {
      setError("Failed to resend.");
    } finally {
      setIsLoading(false);
    }
  };

  const steps: Step[] = ["email", "otp", "reset"];
  const currentStepIdx = steps.indexOf(step as Step);

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(b.length) + c);

  const passwordStrength = (() => {
    const p = newPassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9!@#$%]/.test(p)) s++;
    return s;
  })();
  const strengthColor = ["", "bg-red-500", "bg-amber-500", "bg-yellow-400", "bg-emerald-500"][passwordStrength];

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Background */}
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

      <div className="w-full max-w-sm relative z-10">
        {/* Back */}
        {step !== "done" && (
          <button
            onClick={() => (step === "email" ? navigate("/login") : setStep(step === "otp" ? "email" : "otp"))}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            {step === "email" ? "Back to login" : "Back"}
          </button>
        )}

        {/* Step indicator (not on done screen) */}
        {step !== "done" && (
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold transition-all duration-300 ${
                    i < currentStepIdx
                      ? "bg-amber-500 text-zinc-900"
                      : i === currentStepIdx
                      ? "bg-amber-500/20 border border-amber-500 text-amber-400"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-600"
                  }`}
                >
                  {i < currentStepIdx ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px w-8 transition-all duration-300 ${i < currentStepIdx ? "bg-amber-500" : "bg-zinc-800"}`} />
                )}
              </div>
            ))}
            <span className="ml-2 text-xs text-zinc-600 capitalize">{step === "reset" ? "New password" : step}</span>
          </div>
        )}

        {/* ── STEP 1: Email ── */}
        {step === "email" && (
          <>
            <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
              <Mail className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-3xl text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Reset password
            </h1>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
              Enter your account email and we'll send a verification code to reset your password.
            </p>

            {error && <div className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-lg text-sm mb-5">{error}</div>}

            <form onSubmit={handleSendEmail} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Email Address</Label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20 h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold border-0 group"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-zinc-900/40 border-t-zinc-900 rounded-full animate-spin" />Sending…</span>
                ) : (
                  <span className="flex items-center gap-2">Send Reset Code <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></span>
                )}
              </Button>
              <p className="text-center text-sm text-zinc-600">
                Remember your password?{" "}
                <Link to="/login" className="text-amber-400 hover:text-amber-300 transition-colors">Sign in</Link>
              </p>
            </form>
          </>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === "otp" && (
          <>
            <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
              <KeyRound className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-3xl text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Enter code
            </h1>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
              We sent a 6-digit code to <span className="text-zinc-300 font-medium">{maskedEmail}</span>
            </p>

            {error && <div className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-lg text-sm mb-5">{error}</div>}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={(v) => { setOtp(v); setError(""); }}>
                  <InputOTPGroup className="gap-2">
                    {[0,1,2,3,4,5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-12 w-10 rounded-lg border-zinc-700 bg-zinc-900 text-white text-lg font-bold focus:border-amber-500 data-[active=true]:border-amber-500"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex justify-center gap-1.5">
                {[0,1,2,3,4,5].map((i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-200 ${i < otp.length ? "w-4 bg-amber-500" : "w-1.5 bg-zinc-800"}`} />
                ))}
              </div>
              <Button
                type="submit"
                disabled={otp.length !== 6 || isLoading}
                className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold border-0 disabled:opacity-40"
              >
                {isLoading ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-zinc-900/40 border-t-zinc-900 rounded-full animate-spin" />Verifying…</span> : "Verify Code"}
              </Button>
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-zinc-600 text-sm">
                    Resend in <span className="text-amber-500 font-semibold tabular-nums">0:{String(countdown).padStart(2,"0")}</span>
                  </p>
                ) : (
                  <button type="button" onClick={handleResend} disabled={isLoading} className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-amber-400 transition-colors">
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    Resend code
                  </button>
                )}
              </div>
            </form>
          </>
        )}

        {/* ── STEP 3: New Password ── */}
        {step === "reset" && (
          <>
            <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
              <KeyRound className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-3xl text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              New password
            </h1>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
              Choose a strong password. It can't be the same as your previous one.
            </p>

            {error && <div className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-lg text-sm mb-5">{error}</div>}

            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">New Password</Label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20 h-11 pr-10"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor : "bg-zinc-800"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-600">
                      Strength:{" "}
                      <span className={passwordStrength <= 1 ? "text-red-400" : passwordStrength === 2 ? "text-amber-400" : passwordStrength === 3 ? "text-yellow-400" : "text-emerald-400"}>
                        {["","Weak","Fair","Good","Strong"][passwordStrength]}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20 h-11 pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-400 pt-0.5">Passwords don't match</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold border-0 group disabled:opacity-40 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-zinc-900/40 border-t-zinc-900 rounded-full animate-spin" />Updating…</span>
                ) : (
                  <span className="flex items-center gap-2">Set New Password <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></span>
                )}
              </Button>
            </form>
          </>
        )}

        {/* ── STEP 4: Done ── */}
        {step === "done" && (
          <div className="text-center">
            <div className="inline-flex p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl text-white mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Password reset!
            </h1>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
              Your password has been updated. You can now sign in with your new credentials.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold border-0 group"
            >
              <span className="flex items-center gap-2">
                Back to Sign In
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}