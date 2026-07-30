"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import Swal from "sweetalert2";

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
  const { login } = useAuth();
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

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

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
      setMessage({ type: "error", text: "Please enter a valid email address." });
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
        setMessage({ type: "success", text: "Verification code sent to your email!" });
        setStep(2);
        setTimer(60);
      } else {
        throw new Error(data.error || "Failed to send verification code.");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setMessage({ type: "error", text: "Please enter the complete 6-digit verification code." });
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
        if (data.access) {
          localStorage.setItem("access_token", data.access);
          localStorage.setItem("jwt", data.access);
          if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
        }

        if (onSuccess) {
          onSuccess();
          onClose();
        } else {
          window.location.href = "/";
        }
      } else {
        throw new Error(data.error || "Invalid or expired verification code.");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Invalid or expired verification code." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#3a3532]/10 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#3a3532]/40 hover:text-[#3a3532] font-bold text-lg transition-colors"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#8b7a66]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#8b7a66]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-[#3a3532]">
            {step === 1 ? "Email Login & Sign Up" : "Enter Verification Code"}
          </h3>
          <p className="text-xs font-semibold text-[#3a3532]/60 mt-1">
            {step === 1
              ? "Enter your email to receive a 6-digit one-time password"
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 border border-[#3a3532]/15 rounded-xl bg-[#f4f1eb] text-sm text-[#3a3532] font-semibold outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#3a3532] text-[#e6e0d4] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#252220] disabled:opacity-50 transition-colors shadow-md"
            >
              {loading ? "Sending Code..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full px-4 py-3 border border-[#3a3532]/15 rounded-xl bg-[#f4f1eb] text-center text-xl tracking-[0.4em] font-black text-[#3a3532] outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-3.5 bg-[#8b7a66] hover:bg-[#726453] text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-40 transition-colors shadow-md"
            >
              {loading ? "Verifying..." : "Verify & Log In"}
            </button>

            <div className="flex justify-between items-center text-xs font-bold pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[#3a3532]/60 hover:text-[#3a3532] underline"
              >
                Change Email
              </button>
              {timer > 0 ? (
                <span className="text-[#3a3532]/40 font-mono">Resend in {timer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-[#8b7a66] hover:underline"
                >
                  Resend Code
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
