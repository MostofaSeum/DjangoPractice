"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import EmailOTPModal from "@/features/auth/components/EmailOTPModal";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

  const { user, token, loading: authLoading, register, login } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading) return;
    if (token) {
      if (user?.is_staff) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }
  }, [token, user, authLoading, router]);

  if (authLoading || token) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!formData.email || !formData.email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (!formData.password) {
      setError("Password is required.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Send OTP (Backend will check email & return error if invalid or user issue)
      const res = await fetch(`${API_BASE}/auth/otp/send/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, username: formData.username }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowOTPModal(true);
      } else {
        setError(data.error || data.detail || "Failed to send verification code.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to validate account details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    // Clear any token saved during registration OTP verification so user must log in manually
    localStorage.removeItem("access_token");
    localStorage.removeItem("jwt");
    localStorage.removeItem("refresh_token");

    await Swal.fire({
      position: "top-end",
      icon: "success",
      title: "Account created successfully! Please sign in.",
      showConfirmButton: false,
      timer: 2000,
      toast: true,
    });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex items-center justify-center px-4 py-16 transition-colors duration-300">
      <div className="w-full max-w-lg bg-[var(--card-bg)] text-[var(--foreground)] rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-[var(--card-border)] relative overflow-hidden transition-colors duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="bg-[var(--badge-bg)] text-[var(--badge-text)] text-[10px] font-bold px-3.5 py-1.5 uppercase tracking-widest rounded-md inline-block mb-4">
            Join VibeMart
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[var(--foreground)]">
            Create Account
          </h1>
          <p className="text-xs opacity-70 mt-2 font-medium">
            Sign up to collect exclusive drops and manage your orders.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-2xl font-bold text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handlePreSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="JOHN"
                className="px-4 py-3 border border-[var(--input-border)] rounded-2xl bg-[var(--input-bg)] text-xs font-bold text-[var(--foreground)] placeholder:opacity-40 outline-none focus:ring-2 focus:ring-[var(--brand-accent)] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="DOE"
                className="px-4 py-3 border border-[var(--input-border)] rounded-2xl bg-[var(--input-bg)] text-xs font-bold text-[var(--foreground)] placeholder:opacity-40 outline-none focus:ring-2 focus:ring-[var(--brand-accent)] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              Username *
            </label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="CHOOSE A USERNAME"
              className="px-4 py-3 border border-[var(--input-border)] rounded-2xl bg-[var(--input-bg)] text-xs font-bold text-[var(--foreground)] placeholder:opacity-40 outline-none focus:ring-2 focus:ring-[var(--brand-accent)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="YOU@EXAMPLE.COM"
              className="px-4 py-3 border border-[var(--input-border)] rounded-2xl bg-[var(--input-bg)] text-xs font-bold text-[var(--foreground)] placeholder:opacity-40 outline-none focus:ring-2 focus:ring-[var(--brand-accent)] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Password *
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="px-4 py-3 border border-[var(--input-border)] rounded-2xl bg-[var(--input-bg)] text-xs font-bold text-[var(--foreground)] placeholder:opacity-40 outline-none focus:ring-2 focus:ring-[var(--brand-accent)] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="px-4 py-3 border border-[var(--input-border)] rounded-2xl bg-[var(--input-bg)] text-xs font-bold text-[var(--foreground)] placeholder:opacity-40 outline-none focus:ring-2 focus:ring-[var(--brand-accent)] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 bg-[var(--button-bg)] text-[var(--button-text)] rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? "Sending Verification..." : "Create Account"}
          </button>
        </form>

        <EmailOTPModal
          isOpen={showOTPModal}
          initialEmail={formData.email}
          initialStep={2}
          extraPayload={{
            username: formData.username,
            password: formData.password,
            first_name: formData.first_name,
            last_name: formData.last_name,
          }}
          onClose={() => setShowOTPModal(false)}
          onSuccess={handleCompleteRegistration}
        />

        {/* Link to Login */}
        <div className="mt-8 pt-6 border-t border-[var(--card-border)] text-center">
          <p className="text-xs opacity-70 font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold underline hover:text-[var(--brand-accent)] transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
