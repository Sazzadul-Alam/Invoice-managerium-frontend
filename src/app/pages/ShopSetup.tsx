import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { shopApi } from "../auth.utils";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Constants                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

const STEPS = [
    { label: "Identity", icon: "storefront" },
    { label: "Address", icon: "location_on" },
    { label: "Social", icon: "share" },
] as const;

const COUNTRIES = [
    "Bangladesh",
    "United States",
    "United Kingdom",
    "Canada",
    "India",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "Other",
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export function ShopSetup() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState<"forward" | "backward">("forward");
    const [isAnimating, setIsAnimating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form data
    const [businessName, setBusinessName] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [country, setCountry] = useState("Bangladesh");
    const [facebook, setFacebook] = useState("");
    const [instagram, setInstagram] = useState("");

    /* ── Navigation helpers ── */
    const goTo = useCallback(
        (target: number) => {
            if (isAnimating || target === step) return;
            setDirection(target > step ? "forward" : "backward");
            setIsAnimating(true);
            setTimeout(() => {
                setStep(target);
                setTimeout(() => setIsAnimating(false), 50);
            }, 300);
        },
        [isAnimating, step]
    );

    const next = () => goTo(step + 1);
    const back = () => goTo(step - 1);

    /* ── Submit ── */
    const handleFinish = async () => {
        setIsSubmitting(true);
        setError("");
        try {
            await shopApi.createShop({
                name: businessName,
                contactNumber,
                address: {
                    address_line1: addressLine1,
                    city,
                    state,
                    postal_code: postalCode,
                    country,
                },
                socialLinks: {
                    facebook,
                    instagram,
                },
            });
            navigate("/dashboard");
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Failed to save. Please try again."
            );
            setIsSubmitting(false);
        }
    };

    /* ────────────────────────────────────────────────────────────────────── */
    /*  Render                                                               */
    /* ────────────────────────────────────────────────────────────────────── */

    return (
        <div
            className="min-h-screen flex flex-col bg-ds-background text-ds-on-background overflow-hidden relative"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            {/* ── Animated background shapes ── */}
            <BackgroundShapes step={step} />

            {/* ── Top bar ── */}
            <header className="relative z-30 flex items-center justify-between px-5 pt-6 pb-2">
                <button
                    onClick={step > 0 ? back : undefined}
                    className={`p-2 rounded-full transition-all duration-200 ${step > 0
                        ? "text-ds-primary hover:bg-ds-surface-container-high active:scale-95"
                        : "opacity-0 pointer-events-none"
                        }`}
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1
                    className="text-lg font-bold text-ds-primary"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                    Shop Setup
                </h1>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="text-xs font-bold text-ds-outline hover:text-ds-on-surface-variant transition-colors uppercase tracking-wide"
                >
                    Skip
                </button>
            </header>

            {/* ── Step indicator ── */}
            <div className="relative z-30 flex items-center justify-center gap-3 py-4">
                {STEPS.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => i < step && goTo(i)}
                        className="flex flex-col items-center gap-1.5 group"
                    >
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${i === step
                                ? "bg-ds-primary-container text-white shadow-lg scale-110"
                                : i < step
                                    ? "bg-ds-secondary-container text-ds-on-secondary-container"
                                    : "bg-ds-surface-container-high text-ds-outline"
                                }`}
                        >
                            {i < step ? (
                                <span
                                    className="material-symbols-outlined text-lg"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    check_circle
                                </span>
                            ) : (
                                <span className="material-symbols-outlined text-lg">
                                    {s.icon}
                                </span>
                            )}
                        </div>
                        <span
                            className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${i === step
                                ? "text-ds-primary"
                                : i < step
                                    ? "text-ds-on-surface-variant"
                                    : "text-ds-outline"
                                }`}
                        >
                            {s.label}
                        </span>
                        {i < STEPS.length - 1 && (
                            <div
                                className={`absolute top-[26px] h-0.5 w-8 transition-colors duration-500 ${i < step ? "bg-ds-primary-container" : "bg-ds-surface-container-high"
                                    }`}
                                style={{ left: `calc(50% + ${(i - 1) * 80 + 44}px)` }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* ── Step content ── */}
            <main className="flex-grow flex items-start justify-center px-5 pt-4 pb-28 relative z-20">
                <div
                    className={`w-full max-w-md transition-all duration-300 ${isAnimating
                        ? direction === "forward"
                            ? "opacity-0 translate-x-12"
                            : "opacity-0 -translate-x-12"
                        : "opacity-100 translate-x-0"
                        }`}
                >
                    {step === 0 && <StepIdentity {...{ businessName, setBusinessName, contactNumber, setContactNumber }} />}
                    {step === 1 && (
                        <StepAddress
                            {...{ addressLine1, setAddressLine1, city, setCity, state, setState, postalCode, setPostalCode, country, setCountry }}
                        />
                    )}
                    {step === 2 && <StepSocial {...{ facebook, setFacebook, instagram, setInstagram }} />}
                </div>
            </main>

            {/* ── Error toast ── */}
            {error && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-ds-error-container text-ds-on-error-container px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium max-w-sm">
                    <span className="material-symbols-outlined text-base">error</span>
                    {error}
                </div>
            )}

            {/* ── Bottom action bar ── */}
            <nav className="fixed bottom-0 w-full z-40 bg-ds-surface-container-lowest/90 backdrop-blur-lg border-t border-ds-outline-variant/40 px-6 py-4">
                <div className="max-w-md mx-auto flex gap-3">
                    {step > 0 && (
                        <button
                            onClick={back}
                            className="flex-1 py-3.5 border border-ds-outline-variant text-ds-on-surface-variant font-bold rounded-xl hover:bg-ds-surface-container-low active:scale-[0.98] transition-all"
                            style={{ fontFamily: "'Manrope', sans-serif" }}
                        >
                            Back
                        </button>
                    )}
                    <button
                        onClick={step < 2 ? next : handleFinish}
                        disabled={isSubmitting}
                        className="flex-[2] py-3.5 bg-ds-primary-container text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Saving…
                            </>
                        ) : step < 2 ? (
                            <>
                                Continue
                                <span className="material-symbols-outlined text-lg">
                                    arrow_forward
                                </span>
                            </>
                        ) : (
                            <>
                                Finish Setup
                                <span className="material-symbols-outlined text-lg">
                                    check
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </nav>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Step Components                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StepIdentity({
    businessName,
    setBusinessName,
    contactNumber,
    setContactNumber,
}: {
    businessName: string;
    setBusinessName: (v: string) => void;
    contactNumber: string;
    setContactNumber: (v: string) => void;
}) {
    return (
        <section className="space-y-6">
            <div className="mb-2">
                <h2
                    className="text-2xl font-extrabold text-ds-primary mb-1"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                    Business Identity
                </h2>
                <p className="text-ds-on-surface-variant text-sm">
                    What should we call your store?
                </p>
            </div>

            <div className="space-y-5">
                {/* Business Name */}
                <div className="space-y-2">
                    <label className="block text-xs font-semibold text-ds-primary uppercase tracking-wider ml-1">
                        Business Name
                    </label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                            storefront
                        </span>
                        <input
                            type="text"
                            placeholder="Enter your shop name"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-ds-surface-container-lowest border border-ds-outline-variant rounded-xl focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-[15px] font-medium"
                        />
                    </div>
                </div>

                {/* Contact Number */}
                <div className="space-y-2">
                    <label className="block text-xs font-semibold text-ds-primary uppercase tracking-wider ml-1">
                        Contact Number
                    </label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ds-outline text-xl pointer-events-none">
                            call
                        </span>
                        <input
                            type="tel"
                            placeholder="+880 1XXX-XXXXXX"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-ds-surface-container-lowest border border-ds-outline-variant rounded-xl focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-[15px]"
                        />
                    </div>
                </div>
            </div>

            {/* Illustration hint */}
            <div className="flex items-center gap-3 bg-ds-surface-container-low rounded-xl p-4 mt-4">
                <span
                    className="material-symbols-outlined text-ds-primary text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    lightbulb
                </span>
                <p className="text-xs text-ds-on-surface-variant leading-relaxed">
                    Your business name appears on invoices and receipts. You can always change it later in Settings.
                </p>
            </div>
        </section>
    );
}

function StepAddress({
    addressLine1,
    setAddressLine1,
    city,
    setCity,
    state,
    setState,
    postalCode,
    setPostalCode,
    country,
    setCountry,
}: {
    addressLine1: string;
    setAddressLine1: (v: string) => void;
    city: string;
    setCity: (v: string) => void;
    state: string;
    setState: (v: string) => void;
    postalCode: string;
    setPostalCode: (v: string) => void;
    country: string;
    setCountry: (v: string) => void;
}) {
    return (
        <section className="space-y-6">
            <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                    <span
                        className="material-symbols-outlined text-ds-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        location_on
                    </span>
                    <h2
                        className="text-2xl font-extrabold text-ds-primary"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                        Physical Address
                    </h2>
                </div>
                <p className="text-ds-on-surface-variant text-sm">
                    Where is your business located?
                </p>
            </div>

            <div className="space-y-5">
                {/* Address Line 1 */}
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-ds-on-surface-variant ml-1">
                        Street Address
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. BIRDEM Hospital, Shahbagh"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="w-full px-4 py-3.5 bg-ds-surface-container-lowest border border-ds-outline-variant rounded-xl focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
                    />
                </div>

                {/* City / State row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-ds-on-surface-variant ml-1">
                            City
                        </label>
                        <input
                            type="text"
                            placeholder="Dhaka"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-4 py-3.5 bg-ds-surface-container-lowest border border-ds-outline-variant rounded-xl focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-ds-on-surface-variant ml-1">
                            State / Division
                        </label>
                        <input
                            type="text"
                            placeholder="Dhaka"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full px-4 py-3.5 bg-ds-surface-container-lowest border border-ds-outline-variant rounded-xl focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
                        />
                    </div>
                </div>

                {/* Postal / Country row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-ds-on-surface-variant ml-1">
                            Postal Code
                        </label>
                        <input
                            type="text"
                            placeholder="1000"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            className="w-full px-4 py-3.5 bg-ds-surface-container-lowest border border-ds-outline-variant rounded-xl focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface placeholder:text-ds-outline text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-ds-on-surface-variant ml-1">
                            Country
                        </label>
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full px-4 py-3.5 bg-ds-surface-container-lowest border border-ds-outline-variant rounded-xl focus:ring-2 focus:ring-ds-primary-container/30 focus:border-ds-primary-container transition-all outline-none text-ds-on-surface text-sm appearance-none"
                        >
                            {COUNTRIES.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </section>
    );
}

function StepSocial({
    facebook,
    setFacebook,
    instagram,
    setInstagram,
}: {
    facebook: string;
    setFacebook: (v: string) => void;
    instagram: string;
    setInstagram: (v: string) => void;
}) {
    return (
        <section className="space-y-6">
            <div className="mb-2">
                <h2
                    className="text-2xl font-extrabold text-ds-primary mb-1"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                    Social Presence
                </h2>
                <p className="text-ds-on-surface-variant text-sm">
                    Connect your social accounts — totally optional.
                </p>
            </div>

            <div className="space-y-4">
                {/* Facebook */}
                <div className="flex items-center gap-4 bg-ds-surface-container-low rounded-xl p-4">
                    <div className="w-10 h-10 rounded-xl bg-ds-surface-container-lowest shadow-sm flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-ds-secondary text-xl">
                            public
                        </span>
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="block text-xs font-semibold text-ds-on-surface-variant uppercase tracking-wider">
                            Facebook Page
                        </label>
                        <input
                            type="url"
                            placeholder="https://facebook.com/yourpage"
                            value={facebook}
                            onChange={(e) => setFacebook(e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-ds-outline-variant focus:border-ds-primary-container focus:ring-0 px-0 py-1.5 text-sm text-ds-on-surface placeholder:text-ds-outline outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Instagram */}
                <div className="flex items-center gap-4 bg-ds-surface-container-low rounded-xl p-4">
                    <div className="w-10 h-10 rounded-xl bg-ds-surface-container-lowest shadow-sm flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-ds-secondary text-xl">
                            photo_camera
                        </span>
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="block text-xs font-semibold text-ds-on-surface-variant uppercase tracking-wider">
                            Instagram
                        </label>
                        <input
                            type="text"
                            placeholder="@yourusername"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-ds-outline-variant focus:border-ds-primary-container focus:ring-0 px-0 py-1.5 text-sm text-ds-on-surface placeholder:text-ds-outline outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Ready card */}
            <div className="bg-ds-secondary-container/40 border border-ds-secondary-container rounded-xl p-5 mt-6 text-center">
                <span
                    className="material-symbols-outlined text-ds-primary text-3xl mb-2 block"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    celebration
                </span>
                <p className="text-sm font-semibold text-ds-on-surface mb-1">
                    You're almost done!
                </p>
                <p className="text-xs text-ds-on-surface-variant">
                    Tap <strong>Finish Setup</strong> to save and start managing invoices.
                </p>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animated Background Shapes                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function BackgroundShapes({ step }: { step: number }) {
    return (
        <div className="fixed inset-0 -z-0 overflow-hidden pointer-events-none select-none">
            {/* ── Step 0 : large floating circle ── */}
            <div
                className="absolute transition-all duration-[1200ms] ease-in-out"
                style={{
                    width: 500,
                    height: 500,
                    borderRadius: "50%",
                    background: "var(--ds-primary-container)",
                    opacity: step === 0 ? 0.08 : 0.02,
                    filter: "blur(60px)",
                    top: step === 0 ? "-10%" : "-30%",
                    right: step === 0 ? "-10%" : "-25%",
                    transform: `scale(${step === 0 ? 1 : 0.6})`,
                }}
            />
            <div
                className="absolute transition-all duration-[1400ms] ease-in-out"
                style={{
                    width: 300,
                    height: 300,
                    borderRadius: "50%",
                    background: "var(--ds-primary-container)",
                    opacity: step === 0 ? 0.06 : 0.01,
                    filter: "blur(40px)",
                    bottom: step === 0 ? "5%" : "-15%",
                    left: step === 0 ? "-8%" : "-20%",
                    transform: `scale(${step === 0 ? 1 : 0.5})`,
                }}
            />

            {/* ── Step 1 : rotating rounded rectangle ── */}
            <div
                className="absolute transition-all duration-[1200ms] ease-in-out"
                style={{
                    width: 420,
                    height: 420,
                    borderRadius: "25%",
                    background: "var(--ds-secondary-container)",
                    opacity: step === 1 ? 0.1 : 0.02,
                    filter: "blur(50px)",
                    top: step === 1 ? "8%" : "-20%",
                    left: step === 1 ? "-15%" : "-30%",
                    transform: `rotate(${step === 1 ? "25deg" : "0deg"}) scale(${step === 1 ? 1 : 0.5})`,
                }}
            />
            <div
                className="absolute transition-all duration-[1400ms] ease-in-out"
                style={{
                    width: 260,
                    height: 260,
                    borderRadius: "30%",
                    background: "var(--ds-secondary-container)",
                    opacity: step === 1 ? 0.07 : 0.01,
                    filter: "blur(30px)",
                    bottom: step === 1 ? "-5%" : "-25%",
                    right: step === 1 ? "5%" : "-15%",
                    transform: `rotate(${step === 1 ? "-15deg" : "0deg"}) scale(${step === 1 ? 1 : 0.4})`,
                }}
            />

            {/* ── Step 2 : diamond / rotated square ── */}
            <div
                className="absolute transition-all duration-[1200ms] ease-in-out"
                style={{
                    width: 380,
                    height: 380,
                    borderRadius: "15%",
                    background: "var(--ds-on-tertiary-container)",
                    opacity: step === 2 ? 0.08 : 0.01,
                    filter: "blur(50px)",
                    top: step === 2 ? "10%" : "-20%",
                    right: step === 2 ? "-5%" : "-30%",
                    transform: `rotate(${step === 2 ? "45deg" : "0deg"}) scale(${step === 2 ? 1 : 0.5})`,
                }}
            />
            <div
                className="absolute transition-all duration-[1400ms] ease-in-out"
                style={{
                    width: 240,
                    height: 240,
                    borderRadius: "20%",
                    background: "var(--ds-on-tertiary-container)",
                    opacity: step === 2 ? 0.06 : 0.01,
                    filter: "blur(35px)",
                    bottom: step === 2 ? "8%" : "-20%",
                    left: step === 2 ? "10%" : "-20%",
                    transform: `rotate(${step === 2 ? "45deg" : "0deg"}) scale(${step === 2 ? 1 : 0.4})`,
                }}
            />
        </div>
    );
}
