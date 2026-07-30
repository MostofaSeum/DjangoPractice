"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

interface OrderItem {
  id: number;
  product: { id: number; title: string; unit_price: number };
  quantity: number;
  unit_price: number;
}

interface Order {
  id: number;
  customer: number;
  payment_status: string;
  placed_at?: string;
  shipping_address?: string;
  phone?: string;
  payment_method?: string;
  transaction_id?: string;
  items?: OrderItem[];
}

export default function ProfilePage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    birth_date: "",
  });

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load user profile & customer info on mount
  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      router.push("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        // Fetch User Info 
        const userRes = await fetch(`${API_BASE}/auth/users/me/`, {
          headers: { Authorization: `JWT ${token}` },
        });
        const userData = userRes.ok ? await userRes.json() : {};

        // Fetch Customer Info
        const customerRes = await fetch(`${API_BASE}/store/customers/me/`, {
          headers: { Authorization: `JWT ${token}` },
        });
        const customerData = customerRes.ok ? await customerRes.json() : {};

        // Fetch User's Own Orders
        const ordersRes = await fetch(`${API_BASE}/store/orders/`, {
          headers: { Authorization: `JWT ${token}` },
        });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setMyOrders(Array.isArray(ordersData) ? ordersData : ordersData.results || []);
        }

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
  }, [token, authLoading, router]);

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
    <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] font-sans py-12 selection:bg-[#3a3532] selection:text-[#e6e0d4]">
      <main className="max-w-[1400px] mx-auto px-8 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Account Profile Form (1 Column) */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-md border border-[#3a3532]/5">
            <div className="text-left mb-6 pb-4 border-b border-[#3a3532]/10">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#3a3532]">
                My Profile
              </h2>
              <p className="text-xs text-[#3a3532]/60 font-bold uppercase tracking-wider mt-1">
                Personal details & contact info
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-bold text-center">
                {error}
              </div>
            )}

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

          {/* User's Own Order History (2 Columns) */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-md border border-[#3a3532]/5">
            <div className="flex justify-between items-center pb-4 border-b border-[#3a3532]/10 mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-[#3a3532]">
                  My Order History ({myOrders.length})
                </h2>
                <p className="text-xs text-[#3a3532]/60 font-bold uppercase tracking-wider mt-1">
                  Track your previous orders and payment status
                </p>
              </div>
              <Link
                href="/products"
                className="px-4 py-2 bg-[#f4f1eb] text-[#3a3532] hover:bg-[#3a3532] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Shop Now
              </Link>
            </div>

            {myOrders.length > 0 ? (
              <div className="space-y-6">
                {myOrders.map((ord) => {
                  const orderTotal = ord.items
                    ? ord.items.reduce((sum, i) => sum + i.quantity * Number(i.unit_price), 0)
                    : 0;

                  return (
                    <div
                      key={ord.id}
                      className="p-6 rounded-3xl bg-[#f4f1eb] border border-[#3a3532]/10 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3a3532]/10 pb-3">
                        <div>
                          <span className="font-black text-lg text-[#3a3532] uppercase tracking-tight">
                            Order #{ord.id}
                          </span>
                          <p className="text-[10px] font-bold text-[#3a3532]/60 uppercase tracking-wider mt-0.5">
                            Placed on {ord.placed_at ? new Date(ord.placed_at).toLocaleString() : "N/A"}
                          </p>
                        </div>
                        <span
                          className={`px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit ${
                            ord.payment_status === "C"
                              ? "bg-green-200 text-green-900 border border-green-300"
                              : ord.payment_status === "F"
                              ? "bg-red-200 text-red-900 border border-red-300"
                              : "bg-yellow-200 text-yellow-900 border border-yellow-300"
                          }`}
                        >
                          Order Status: {ord.payment_status === "C" ? "Complete" : ord.payment_status === "F" ? "Failed" : "Pending"}
                        </span>
                      </div>

                      {/* Details & Address */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-[#3a3532]">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/50">
                            Shipping Details
                          </p>
                          <p className="font-bold">{ord.shipping_address || "Address not specified"}</p>
                          <p className="text-[11px] text-[#3a3532]/70">Phone: {ord.phone || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/50">
                            Payment Method
                          </p>
                          <p className="font-bold">
                            {ord.payment_method === "O" ? (
                              <span className="text-[#e2136e]">bKash Payment (TrxID: {ord.transaction_id || "N/A"})</span>
                            ) : (
                              "Cash on Delivery (COD)"
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Items Breakdown */}
                      {ord.items && ord.items.length > 0 && (
                        <div className="bg-white rounded-2xl p-4 border border-[#3a3532]/5 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-[#3a3532]/60 border-b border-[#3a3532]/5 pb-1">
                            Items Ordered ({ord.items.reduce((s, i) => s + i.quantity, 0)})
                          </p>
                          <div className="space-y-1">
                            {ord.items.map((it) => (
                              <div key={it.id} className="flex justify-between items-center text-xs">
                                <span className="font-bold text-[#3a3532]">
                                  {it.product?.title || `Product #${it.product}`} <span className="text-[#3a3532]/50 font-normal">x {it.quantity}</span>
                                </span>
                                <span className="font-black text-[#8b7a66]">
                                  ${(it.quantity * Number(it.unit_price)).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-[#3a3532]/10 flex justify-between items-center text-xs font-black">
                            <span className="uppercase text-[#3a3532]">Total Amount</span>
                            <span className="text-base text-[#3a3532]">${orderTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-xs font-bold uppercase tracking-wider text-[#3a3532]/50">
                You haven't placed any orders yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
