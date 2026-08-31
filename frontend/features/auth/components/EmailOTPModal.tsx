"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/siteConfig";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/store/LanguageContext";
import { useRouter } from "next/navigation";

interface EmailOTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialEmail?: string;
  initialStep?: 1 | 2;
  extraPayload?: Record<string, any>;
}

export default function EmailOTPModal({
  isOpen,
  onClose,
  onSuccess,
  initialEmail = "",
  initialStep = 1,
  extraPayload = {},
}: EmailOTPModalProps) {
  const { syncCart } = useCart();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(initialStep === 2 ? 60 : 0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (initialStep) {
      setStep(initialStep);
      if (initialStep === 2) setTimer(60);
    }
  }, [initialEmail, initialStep, isOpen]);

  const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

  // Timer countdown hook
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  if (!isOpen) return null;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setMessage({ type: "error", text: locale === "bn" ? "অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন।" : "Please enter a valid email address." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/auth/otp/send/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: locale === "bn" ? "আপনার ইমেইলে ভেরিফিকেশন কোড পাঠানো হয়েছে!" : "Verification code sent to your email!" });
        setStep(2);
        setTimer(30);
      } else {
        throw new Error(data.error || (locale === "bn" ? "ভেরিফিকেশন কোড পাঠানো যায়নি।" : "Failed to send verification code."));
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || (locale === "bn" ? "একটি সমস্যা দেখা দিয়েছে।" : "Something went wrong.") });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setMessage({ type: "error", text: locale === "bn" ? "অনুগ্রহ করে সম্পূর্ণ ৬ সংখ্যার কোড লিখুন।" : "Please enter the complete 6-digit verification code." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/auth/otp/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otpCode, ...extraPayload }),
      });

      const data = await res.json();

      if (res.ok) {
        await syncCart(data.access);

        if (onSuccess) {
          onSuccess();
          onClose();
        } else {
          onClose();
          router.push("/");
        }
      } else {
        throw new Error(data.error || (locale === "bn" ? "ভুল বা মেয়াদোত্তীর্ণ ভেরিফিকেশন কোড।" : "Invalid or expired verification code."));
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || (locale === "bn" ? "ভুল বা মেয়াদোত্তীর্ণ ভেরিফিকেশন কোড।" : "Invalid or expired verification code.") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-secondary text-foreground rounded-3xl p-8 max-w-md w-full shadow-2xl border border-foreground/10 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-foreground/40 hover:text-foreground font-bold text-lg transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">
            {step === 1 ? t("auth.emailLoginSignUp") : t("auth.enterVerificationCode")}
          </h3>
          <p className="text-xs font-semibold text-foreground/60 mt-1">
            {step === 1
              ? t("auth.otpSubtitleStep1")
              : t("auth.otpSubtitleStep2").replace("{email}", email)}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                {t("auth.emailAddress")}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 border border-foreground/15 rounded-xl bg-background text-sm text-foreground font-semibold outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-secondary rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/80 disabled:opacity-50 transition-colors shadow-md cursor-pointer"
            >
              {loading ? t("auth.sendingCode") : t("auth.sendVerificationCode")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                {t("auth.otpCodeLabel")}
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full px-4 py-3 border border-foreground/15 rounded-xl bg-background text-center text-xl tracking-[0.4em] font-black text-foreground outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-3.5 bg-accent hover:bg-accent/80 text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-40 transition-colors shadow-md cursor-pointer"
            >
              {loading ? t("auth.verifying") : t("auth.verifyAndLogIn")}
            </button>

            <div className="flex justify-between items-center text-xs font-bold pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-foreground/60 hover:text-foreground underline cursor-pointer"
              >
                {t("auth.changeEmail")}
              </button>
              {timer > 0 ? (
                <span className="text-foreground/40 font-mono">
                  {t("auth.resendIn").replace("{timer}", timer.toString())}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-accent hover:underline cursor-pointer"
                >
                  {t("auth.resendCode")}
                </button>
              )}
            </div>
          </form>
        )}

        {message && (
          <p className={`mt-4 text-xs font-bold text-center ${message.type === "success" ? "text-green-700" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
