"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, token, loading: authLoading, login } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedInUser = await login(username, password);
      if (loggedInUser) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Welcome back!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });

        if (loggedInUser.is_staff) {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
        setError("Invalid username or password. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex items-center justify-center px-4 py-16 transition-colors duration-300">
      <div className="w-full max-w-md bg-[var(--card-bg)] text-[var(--foreground)] rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-[var(--card-border)] relative overflow-hidden transition-colors duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="bg-[var(--badge-bg)] text-[var(--badge-text)] text-[10px] font-bold px-3.5 py-1.5 uppercase tracking-widest rounded-md inline-block mb-4">
            Welcome Back
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[var(--foreground)]">
            Sign In
          </h1>
          <p className="text-xs opacity-70 mt-2 font-medium">
            Enter your credentials to access your VibeMart account.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-2xl font-bold text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              className="px-5 py-3.5 border border-[var(--input-border)] rounded-2xl bg-[var(--input-bg)] text-xs font-bold text-[var(--foreground)] placeholder:opacity-40 outline-none focus:ring-2 focus:ring-[var(--brand-accent)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="px-5 py-3.5 border border-[var(--input-border)] rounded-2xl bg-[var(--input-bg)] text-xs font-bold text-[var(--foreground)] placeholder:opacity-40 outline-none focus:ring-2 focus:ring-[var(--brand-accent)] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-4 bg-[var(--button-bg)] text-[var(--button-text)] rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Link to Register */}
        <div className="mt-8 pt-6 border-t border-[var(--card-border)] text-center">
          <p className="text-xs opacity-70 font-medium">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold underline hover:text-[var(--brand-accent)] transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
