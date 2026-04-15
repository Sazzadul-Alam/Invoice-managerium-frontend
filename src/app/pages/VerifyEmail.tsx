import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "../components/ui/button";
import { Package, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";

export function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email: string = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!email) navigate("/register");
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Enter all 6 digits");
      return;
    }
    setIsVerifying(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setVerified(true);
      setSuccess("Email verified!");
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch {
      setError("Invalid code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError("");
    setSuccess("");
    try {
      await new Promise((r) => setTimeout(r, 900));
      setSuccess("A new code has been sent.");
      setCountdown(60);
      setOtp("");
    } catch {
      setError("Failed to resend. Try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Mask email
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(b.length) + c);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Background geometry */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full border border-amber-500/5" />
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full border border-amber-500/5 translate-x-12 translate-y-12" />
        <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full border border-zinc-700/40" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #f59e0b 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Back button */}
        <button
          onClick={() => navigate("/register")}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to registration
        </button>

        {/* Icon */}
        <div className="mb-6">
          <div
            className={`relative inline-flex p-4 rounded-2xl transition-all duration-500 ${
              verified
                ? "bg-emerald-500/15 border border-emerald-500/30"
                : "bg-amber-500/10 border border-amber-500/20"
            }`}
          >
            {verified ? (
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
            ) : (
              <Package className="h-8 w-8 text-amber-400" />
            )}
          </div>
        </div>

        <h1
          className="text-3xl text-white mb-2"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          {verified ? "You're in!" : "Check your inbox"}
        </h1>
        <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
          {verified
            ? "Email verified. Redirecting to your dashboard…"
            : <>We sent a 6-digit code to <span className="text-zinc-300 font-medium">{maskedEmail}</span>. Enter it below to continue.</>}
        </p>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-lg text-sm mb-5">
            {error}
          </div>
        )}
        {success && !verified && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-4 py-3 rounded-lg text-sm mb-5">
            {success}
          </div>
        )}

        {!verified && (
          <form onSubmit={handleVerify} className="space-y-6">
            {/* OTP input */}
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(v) => { setOtp(v); setError(""); }}
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-12 w-10 rounded-lg border-zinc-700 bg-zinc-900 text-white text-lg font-bold focus:border-amber-500 focus:ring-amber-500/20 data-[active=true]:border-amber-500"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i < otp.length ? "w-4 bg-amber-500" : "w-1.5 bg-zinc-800"
                  }`}
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={otp.length !== 6 || isVerifying}
              className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold border-0 transition-all duration-200 disabled:opacity-40"
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-zinc-900/40 border-t-zinc-900 rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : (
                "Verify & Continue"
              )}
            </Button>

            {/* Resend */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-zinc-600 text-sm">
                  Resend in{" "}
                  <span className="text-amber-500 font-semibold tabular-nums">
                    0:{String(countdown).padStart(2, "0")}
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-amber-400 transition-colors disabled:opacity-40"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`} />
                  {isResending ? "Sending…" : "Resend code"}
                </button>
              )}
            </div>
          </form>
        )}

        {/* Verified state */}
        {verified && (
          <div className="flex justify-center">
            <div className="h-1 w-24 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-[grow_1.8s_ease-in-out_forwards]" style={{ width: "100%", transformOrigin: "left", animation: "none", transition: "width 1.8s ease-in-out" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}