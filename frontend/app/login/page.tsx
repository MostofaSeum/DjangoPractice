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
    <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] font-sans flex items-center justify-center px-4 py-16 selection:bg-[#3a3532] selection:text-[#e6e0d4]">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-[#3a3532]/5 relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="bg-[#3a3532]/5 text-[#3a3532] text-[10px] font-bold px-3.5 py-1.5 uppercase tracking-widest rounded-md inline-block mb-4 border border-[#3a3532]/10">
            Welcome Back
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[#3a3532]">
            Sign In
          </h1>
          <p className="text-xs text-[#3a3532]/60 mt-2 font-medium">
            Enter your credentials to access your VibeMart account.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-bold text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ENTER YOUR USERNAME"
              className="px-5 py-3.5 border border-[#3a3532]/10 rounded-2xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] placeholder:text-[#3a3532]/30 outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="px-5 py-3.5 border border-[#3a3532]/10 rounded-2xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] placeholder:text-[#3a3532]/30 outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-4 bg-[#3a3532] text-[#e6e0d4] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#252220] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Link to Register */}
        <div className="mt-8 pt-6 border-t border-[#3a3532]/10 text-center">
          <p className="text-xs text-[#3a3532]/60 font-medium">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-[#3a3532] underline hover:text-[#8b7a66] transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
