"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ProfilePage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    birth_date: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load user profile & customer info on mount
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        // Fetch User Info (/auth/users/me/)
        const userRes = await fetch(`${API_BASE}/auth/users/me/`, {
          headers: { Authorization: `JWT ${token}` },
        });
        const userData = userRes.ok ? await userRes.json() : {};

        // Fetch Customer Info (/store/customers/me/) - Triggers get_or_create on backend
        const customerRes = await fetch(`${API_BASE}/store/customers/me/`, {
          headers: { Authorization: `JWT ${token}` },
        });
        const customerData = customerRes.ok ? await customerRes.json() : {};

        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
          phone: customerData.phone || "",
          birth_date: customerData.birth_date || "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError("");
    setSaving(true);

    try {
      // 1. Update User info (first_name, last_name, email)
      const userRes = await fetch(`${API_BASE}/auth/users/me/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
        }),
      });

      // 2. Update Customer info (phone, birth_date)
      const customerRes = await fetch(`${API_BASE}/store/customers/me/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          phone: formData.phone,
          birth_date: formData.birth_date || null,
        }),
      });

      if (userRes.ok && customerRes.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Profile updated successfully!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      } else {
        setError("Failed to update profile. Please check your inputs.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] flex items-center justify-center p-8 font-bold uppercase tracking-widest text-xs">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] font-sans flex items-center justify-center px-4 py-16 selection:bg-[#3a3532] selection:text-[#e6e0d4]">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-[#3a3532]/5 relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="bg-[#3a3532]/5 text-[#3a3532] text-[10px] font-bold px-3.5 py-1.5 uppercase tracking-widest rounded-md inline-block mb-4 border border-[#3a3532]/10">
            Account Management
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[#3a3532]">
            My Profile
          </h1>
          <p className="text-xs text-[#3a3532]/60 mt-2 font-medium">
            Logged in as <span className="font-bold text-[#3a3532]">{user?.username}</span>
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
                placeholder="FIRST NAME"
                className="px-4 py-3 border border-[#3a3532]/10 rounded-2xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
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
                placeholder="LAST NAME"
                className="px-4 py-3 border border-[#3a3532]/10 rounded-2xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="YOU@EXAMPLE.COM"
              className="px-4 py-3 border border-[#3a3532]/10 rounded-2xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 234 567 8900"
              className="px-4 py-3 border border-[#3a3532]/10 rounded-2xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
              Birth Date
            </label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              className="px-4 py-3 border border-[#3a3532]/10 rounded-2xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] outline-none focus:ring-2 focus:ring-[#8b7a66] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-4 py-4 bg-[#3a3532] text-[#e6e0d4] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#252220] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center"
          >
            {saving ? "Saving Changes..." : "Save Profile Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
