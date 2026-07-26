"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      const res = await register(payload);
      if (res.success) {
        // Auto-login after successful registration
        await login(formData.username, formData.password);
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Account created successfully!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
        router.push("/");
      } else {
        setError(res.error || "Could not create account. Please check your inputs.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] font-sans flex items-center justify-center px-4 py-16 selection:bg-[#3a3532] selection:text-[#e6e0d4]">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-[#3a3532]/5 relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="bg-[#3a3532]/5 text-[#3a3532] text-[10px] font-bold px-3.5 py-1.5 uppercase tracking-widest rounded-md inline-block mb-4 border border-[#3a3532]/10">
            Join VibeMart
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[#3a3532]">
            Create Account
          </h1>
          <p className="text-xs text-[#3a3532]/60 mt-2 font-medium">
            Sign up to collect exclusive drops and manage your orders.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-bold text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="JOHN"
                className="px-4 py-3 border border-[#3a3532]/10 rounded-2xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] placeholder:text-[#3a3532]/30 outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="DOE"
                className="px-4 py-3 border border-[#3a3532]/10 rounded-2xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] placeholder:text-[#3a3532]/30 outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
              Username *
            </label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="CHOOSE A USERNAME"
              className="px-4 py-3 border border-[#3a3532]/10 rounded-2xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] placeholder:text-[#3a3532]/30 outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="YOU@EXAMPLE.COM"
              className="px-4 py-3 border border-[#3a3532]/10 rounded-2xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] placeholder:text-[#3a3532]/30 outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
                Password *
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="px-4 py-3 border border-[#3a3532]/10 rounded-2xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] placeholder:text-[#3a3532]/30 outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="********"
                className="px-4 py-3 border border-[#3a3532]/10 rounded-2xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] placeholder:text-[#3a3532]/30 outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 bg-[#3a3532] text-[#e6e0d4] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#252220] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Link to Login */}
        <div className="mt-8 pt-6 border-t border-[#3a3532]/10 text-center">
          <p className="text-xs text-[#3a3532]/60 font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#3a3532] underline hover:text-[#8b7a66] transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
