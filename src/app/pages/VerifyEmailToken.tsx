import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { authApi } from "../auth.utils";

type Status = "loading" | "success" | "error";

export function VerifyEmailToken() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    authApi
      .verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message || "Email verified successfully!");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch((err: Error) => {
        setStatus("error");
        setMessage(err.message || "Verification failed. The link may have expired.");
      });
  }, [token, navigate]);

  return (
    <div
      className="min-h-screen flex flex-col bg-ds-background text-ds-on-background selection:bg-ds-secondary-container selection:text-ds-on-secondary-container"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* ── Branding ── */}
          <div className="text-center mb-8">
            <img
              src="/invoice_logo.png"
              alt="Invoice Managerium logo"
              className="w-26 h-26 object-contain drop-shadow-md mx-auto mb-2"
            />
            <h1
              className="text-3xl font-extrabold tracking-tight text-ds-on-surface mb-1"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Invoice Managerium
            </h1>
            <p className="text-ds-on-surface-variant font-medium text-sm">
              Email Verification
            </p>
          </div>

          {/* ── Card ── */}
          <div className="bg-ds-surface-container-lowest border border-ds-outline-variant p-8 rounded-xl shadow-sm text-center">

            {/* Status icon */}
            <div className="flex justify-center mb-6">
              {status === "loading" && (
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ds-secondary-container">
                  <span className="material-symbols-outlined text-ds-primary text-3xl animate-spin">
                    progress_activity
                  </span>
                </div>
              )}
              {status === "success" && (
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 animate-in zoom-in duration-300">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                </div>
              )}
              {status === "error" && (
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ds-error-container animate-in zoom-in duration-300">
                  <span className="material-symbols-outlined text-ds-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    cancel
                  </span>
                </div>
              )}
            </div>

            {/* Heading */}
            <h2
              className="text-2xl font-extrabold text-ds-on-surface mb-3"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {status === "loading" && "Verifying your email…"}
              {status === "success" && "You're verified!"}
              {status === "error" && "Verification Failed"}
            </h2>

            {/* Message */}
            <p className="text-sm text-ds-on-surface-variant leading-relaxed mb-6">
              {status === "loading" && (
                "Please wait while we confirm your email address."
              )}
              {status === "success" && (
                <>
                  {message}
                  <br />
                  <span className="text-ds-primary font-semibold">
                    Redirecting you to login in 3 seconds…
                  </span>
                </>
              )}
              {status === "error" && (
                <span className="text-ds-error">{message}</span>
              )}
            </p>

            {/* Progress bar for success */}
            {status === "success" && (
              <div className="h-1.5 w-full bg-ds-surface-container rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ animation: "ds-progress 3s linear forwards" }}
                />
              </div>
            )}

            {/* Action buttons */}
            {status === "error" && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate("/register")}
                  className="w-full py-3 bg-ds-primary-container text-white font-bold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Register again
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3 border border-ds-outline-variant text-ds-on-surface-variant hover:border-ds-primary hover:text-ds-primary font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined text-lg">login</span>
                  Go to Login
                </button>
              </div>
            )}

            {status === "success" && (
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-ds-primary font-semibold hover:underline transition-colors flex items-center gap-1 mx-auto"
              >
                Go to Login now
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            )}
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

      {/* Progress animation keyframe */}
      <style>{`
        @keyframes ds-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
