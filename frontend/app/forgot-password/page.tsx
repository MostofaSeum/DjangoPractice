"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { siteConfig } from "@/config/siteConfig";

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Inputs
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // States
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: Check if username and email match in DB
  const handleVerifyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No matching account found.");
      }

      setIsVerified(true);
      setSuccessMsg("Account verified! Please set your new password below.");
    } catch (err: any) {
      setError(err.message || "Failed to verify account details.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Set and save new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        let errMessage = data.error;
        if (Array.isArray(errMessage)) {
          errMessage = errMessage.join(" ");
        }
        throw new Error(errMessage || "Failed to reset password.");
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Password Changed!",
        text: "Your password has been successfully updated. Redirecting to sign in...",
        showConfirmButton: false,
        timer: 2200,
      });

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center px-4 py-16 transition-colors duration-300">
      <div className="w-full max-w-md bg-secondary text-foreground rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-foreground/10 relative overflow-hidden transition-colors duration-300">
        
        {/* Header */}
        <div className="text-center mb-8">
          <span className="bg-accent/20 text-foreground text-[10px] font-bold px-3.5 py-1.5 uppercase tracking-widest rounded-md inline-block mb-4">
            Security & Recovery
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">
            Reset Password
          </h1>
          <p className="text-xs opacity-70 mt-2 font-medium">
            {!isVerified
              ? "Enter your registered username and email to verify your identity."
              : "Enter and confirm your new password below."}
          </p>
        </div>

        {/* Status Indicators / Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${
              !isVerified
                ? "bg-button-bg text-button-fg"
                : "bg-accent/20 text-accent font-bold"
            }`}
          >
            <span>1</span>
            <span>Verify Info</span>
          </div>
          <div className="w-4 h-[1px] bg-foreground/20" />
          <div
            className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${
              isVerified
                ? "bg-button-bg text-button-fg"
                : "bg-foreground/10 text-foreground/40"
            }`}
          >
            <span>2</span>
            <span>New Password</span>
          </div>
        </div>

        {/* Error Alert using --nagad (or foreground/15) from globals.css */}
        {error && (
          <div className="mb-6 p-4 bg-nagad/10 border border-nagad/30 text-nagad text-xs rounded-2xl font-bold text-center">
            {error}
          </div>
        )}

        {/* Success Alert using --accent from globals.css */}
        {successMsg && !error && (
          <div className="mb-6 p-4 bg-accent/15 border border-accent/30 text-foreground text-xs rounded-2xl font-bold text-center">
            {successMsg}
          </div>
        )}

        {/* STEP 1: Verify Username & Email Form */}
        {!isVerified ? (
          <form onSubmit={handleVerifyAccount} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ENTER YOUR USERNAME"
                className="px-5 py-3.5 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ENTER YOUR EMAIL"
                className="px-5 py-3.5 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-4 bg-button-bg text-button-fg rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {loading ? "Checking Account..." : "Verify & Continue"}
            </button>
          </form>
        ) : (
          /* STEP 2: Enter New Passwords Form */
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            <div className="p-3 bg-background/60 rounded-2xl border border-foreground/10 text-xs flex justify-between items-center">
              <div>
                <p className="text-[10px] opacity-60 font-bold uppercase">Account</p>
                <p className="font-extrabold text-foreground">{username} ({email})</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsVerified(false);
                  setSuccessMsg("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="text-[10px] uppercase font-bold text-accent hover:underline"
              >
                Change
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                New Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-5 pr-12 py-3.5 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 text-foreground/50 hover:text-foreground transition-colors p-1 cursor-pointer"
                >
                  {showNewPassword ? (
                    /* Eye Off SVG */
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    /* Eye Open SVG */
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Confirm New Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-5 pr-12 py-3.5 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 text-foreground/50 hover:text-foreground transition-colors p-1 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    /* Eye Off SVG */
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    /* Eye Open SVG */
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-4 bg-button-bg text-button-fg rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {loading ? "Updating Password..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="mt-8 pt-6 border-t border-foreground/10 text-center flex flex-col gap-2">
          <p className="text-xs opacity-70 font-medium">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-bold underline hover:text-accent transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
