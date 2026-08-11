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
  transaction_phone_no?: string;
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
  const [vibeCoin, setVibeCoin] = useState<number>(0);
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

        setVibeCoin(customerData.vibe_coin ?? 0);

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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 font-bold uppercase tracking-widest text-xs transition-colors duration-300">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans py-12 transition-colors duration-300">
      <main className="max-w-[1400px] mx-auto px-8 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Account Profile Form (1 Column) */}
          <div className="bg-secondary text-foreground rounded-[2.5rem] p-8 shadow-md border border-foreground/10 transition-colors duration-300">
            <div className="text-left mb-6 pb-4 border-b border-foreground/10">
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                My Profile
              </h2>
              <p className="text-xs opacity-70 font-bold uppercase tracking-wider mt-1">
                Personal details & contact info
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-2xl font-bold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    placeholder="FIRST NAME"
                    className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
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
                    placeholder="LAST NAME"
                    className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="YOU@EXAMPLE.COM"
                  className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Birth Date
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-4 py-4 bg-button-bg text-button-fg rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center"
              >
                {saving ? "Saving Changes..." : "Save Profile Changes"}
              </button>
            </form>
          </div>

          {/* User's Own Order History & VibeCoin (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* VibeCoin Rewards Card */}
            <div className="bg-secondary text-foreground rounded-[2.5rem] p-8 shadow-md border border-foreground/10 transition-colors duration-300 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-background font-black text-2xl shadow-lg shadow-amber-500/20 shrink-0">
                    🪙
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
                        VibeCoin Balance
                      </h3>
                    </div>
                    <p className="text-xs opacity-75 font-semibold mt-0.5">
                      Earn VibeCoins on every order & redeem for store perks & discounts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-background px-5 py-3 rounded-2xl border border-foreground/15 shadow-sm self-stretch sm:self-auto justify-between sm:justify-start">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-60">Total Coins</span>
                  <span className="text-2xl font-black text-amber-500 tracking-tight flex items-center gap-1">
                    <span>{vibeCoin}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500 opacity-80">VC</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Order History Container */}
            <div className="bg-secondary text-foreground rounded-[2.5rem] p-8 shadow-md border border-foreground/10 transition-colors duration-300">
              <div className="flex justify-between items-center pb-4 border-b border-foreground/10 mb-6">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                    My Order History ({myOrders.length})
                  </h2>
                  <p className="text-xs opacity-70 font-bold uppercase tracking-wider mt-1">
                    Track your previous orders and payment status
                  </p>
                </div>
                <Link
                  href="/products"
                  className="px-4 py-2 border border-foreground/15 bg-background text-foreground hover:bg-button-bg hover:text-button-fg rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
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
                      className="p-6 rounded-3xl bg-background border border-foreground/15 space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-foreground/15 pb-3">
                        <div>
                          <span className="font-black text-lg text-foreground uppercase tracking-tight">
                            Order #{ord.id}
                          </span>
                          <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider mt-0.5">
                            Placed on {ord.placed_at ? new Date(ord.placed_at).toLocaleString() : "N/A"}
                          </p>
                        </div>
                        <span
                          className={`px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit ${
                            ord.payment_status === "C"
                              ? "bg-green-500/20 text-green-500 border border-green-500/30"
                              : ord.payment_status === "F"
                              ? "bg-red-500/20 text-red-500 border border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                          }`}
                        >
                          Order Status: {ord.payment_status === "C" ? "Complete" : ord.payment_status === "F" ? "Failed" : "Pending"}
                        </span>
                      </div>

                      {/* Details & Address */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-foreground">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                            Shipping Details
                          </p>
                          <p className="font-bold">{ord.shipping_address || "Address not specified"}</p>
                          <p className="text-[11px] opacity-70">Phone: {ord.phone || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                            Payment Method
                          </p>
                          <p className="font-bold">
                            {ord.payment_method === "B" || ord.payment_method === "O" ? (
                              <span className="text-bkash">
                                bKash Payment
                                {ord.transaction_id ? ` (TrxID: ${ord.transaction_id})` : ""}
                                {ord.transaction_phone_no ? ` [Sender: ${ord.transaction_phone_no}]` : ""}
                              </span>
                            ) : ord.payment_method === "N" ? (
                              <span className="text-nagad">
                                Nagad Payment
                                {ord.transaction_id ? ` (TrxID: ${ord.transaction_id})` : ""}
                                {ord.transaction_phone_no ? ` [Sender: ${ord.transaction_phone_no}]` : ""}
                              </span>
                            ) : (
                              "Cash on Delivery (COD)"
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Items Breakdown */}
                      {ord.items && ord.items.length > 0 && (
                        <div className="bg-secondary rounded-2xl p-4 border border-foreground/10 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider opacity-60 border-b border-foreground/10 pb-1">
                            Items Ordered ({ord.items.reduce((s, i) => s + i.quantity, 0)})
                          </p>
                          <div className="space-y-1">
                            {ord.items.map((it) => (
                              <div key={it.id} className="flex justify-between items-center text-xs">
                                <span className="font-bold text-foreground">
                                  {it.product?.title || `Product #${it.product}`} <span className="opacity-50 font-normal">x {it.quantity}</span>
                                </span>
                                <span className="font-black text-accent">
                                  ${(it.quantity * Number(it.unit_price)).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-foreground/10 flex justify-between items-center text-xs font-black">
                            <span className="uppercase text-foreground">Total Amount</span>
                            <span className="text-base text-foreground">${orderTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-xs font-bold uppercase tracking-wider opacity-50">
                You haven't placed any orders yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  </div>
  );
}
