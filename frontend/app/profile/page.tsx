"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/store/LanguageContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

import { Address } from "@/types/product";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

interface OrderItem {
  id: number;
  product: { id: number; title: string; unit_price: number; images?: { id?: number; image: string }[] };
  variant?: { id: number; name: string; color_code?: string; color_name?: string; size?: string } | null;
  variant_title?: string;
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
  delivery_area?: string;
  delivery_charge?: number | string;
  coupon_code?: string;
  is_edited_by_admin?: boolean;
  edited_at?: string | null;
  items?: OrderItem[];
}

export default function ProfilePage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const { t, formatCurrency, locale } = useLanguage();
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    birth_date: "",
  });

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [vibeCoin, setVibeCoin] = useState<number>(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    title: "Home",
    street: "",
    city: "Inside Dhaka",
    is_default: false,
  });
  const [addressSaving, setAddressSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAddresses = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/store/addresses/`, {
        headers: { Authorization: `JWT ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data) ? data : data.results || []);
      }
    } catch (e) {
      console.error("Failed to load addresses:", e);
    }
  };

  // Load user profile & customer info on mount
  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      router.push("/login?redirect=/profile");
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

        // Fetch Saved Addresses
        const addrRes = await fetch(`${API_BASE}/store/addresses/`, {
          headers: { Authorization: `JWT ${token}` },
        });
        if (addrRes.ok) {
          const addrData = await addrRes.json();
          setAddresses(Array.isArray(addrData) ? addrData : addrData.results || []);
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
          title: t("profile.profileUpdated") || "Profile updated successfully!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      } else {
        setError(t("profile.failedUpdate") || "Failed to update profile. Please check your inputs.");
      }
    } catch (err) {
      console.error(err);
      setError(locale === "bn" ? "সংরক্ষণ করার সময় একটি সমস্যা দেখা দিয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" : "An error occurred while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddAddress = () => {
    if (addresses.length >= 5) {
      Swal.fire({
        icon: "warning",
        title: t("profile.addressLimitReached") || "You have reached the maximum limit of 5 addresses.",
        confirmButtonColor: "var(--primary)",
      });
      return;
    }
    setEditingAddress(null);
    setAddressFormData({
      title: "Home",
      street: "",
      city: "Inside Dhaka",
      is_default: addresses.length === 0,
    });
    setAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressFormData({
      title: addr.title || "Home",
      street: addr.street,
      city: addr.city || "Inside Dhaka",
      is_default: addr.is_default,
    });
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAddressSaving(true);
    try {
      const url = editingAddress
        ? `${API_BASE}/store/addresses/${editingAddress.id}/`
        : `${API_BASE}/store/addresses/`;
      const method = editingAddress ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify(addressFormData),
      });

      if (res.ok) {
        setAddressModalOpen(false);
        await fetchAddresses();
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t("profile.addressSaved") || "Address saved successfully!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      } else {
        const errData = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: JSON.stringify(errData),
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!token) return;
    const result = await Swal.fire({
      title: t("profile.deleteConfirmTitle") || "Delete Address?",
      text: t("profile.deleteConfirmText") || "Are you sure you want to delete this address?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "var(--accent)",
      confirmButtonText: locale === "bn" ? "মুছে ফেলুন" : "Yes, Delete",
      cancelButtonText: locale === "bn" ? "বাতিল" : "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE}/store/addresses/${id}/`, {
          method: "DELETE",
          headers: { Authorization: `JWT ${token}` },
        });
        if (res.ok) {
          await fetchAddresses();
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: t("profile.addressDeleted") || "Address deleted successfully!",
            showConfirmButton: false,
            timer: 1800,
            toast: true,
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/store/addresses/${id}/set_default/`, {
        method: "POST",
        headers: { Authorization: `JWT ${token}` },
      });
      if (res.ok) {
        await fetchAddresses();
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t("profile.defaultUpdated") || "Default address updated!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 font-bold uppercase tracking-widest text-xs transition-colors duration-300">
        {locale === "bn" ? "প্রোফাইল লোড হচ্ছে..." : "Loading profile..."}
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
                {t("profile.myProfile")}
              </h2>
              <p className="text-xs opacity-70 font-bold uppercase tracking-wider mt-1">
                {t("profile.personalDetails")}
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
                    {t("profile.firstName")}
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder={t("profile.firstName")}
                    className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {t("profile.lastName")}
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder={t("profile.lastName")}
                    className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {t("profile.emailAddress")}
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
                  {t("profile.phoneNumber")}
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+8801XXXXXXXXX"
                  className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {t("profile.birthDate")}
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
                className="w-full mt-4 py-4 bg-button-bg text-button-fg rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {saving ? t("profile.saving") : t("profile.saveChanges")}
              </button>
            </form>

            {/* Saved Addresses Section (Up to 5) */}
            <div className="mt-10 pt-6 border-t border-foreground/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-foreground">
                    {t("profile.savedAddresses")}
                  </h3>
                  <p className="text-[10px] opacity-70 font-bold uppercase tracking-wider mt-0.5">
                    {t("profile.savedAddressesDesc")} ({addresses.length}/5)
                  </p>
                </div>
                {addresses.length < 5 && (
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="px-3 py-1.5 bg-background text-foreground border border-foreground/15 hover:border-accent rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <span>+</span> {t("profile.addNewAddress")}
                  </button>
                )}
              </div>

              {addresses.length === 0 ? (
                <div className="p-4 bg-background/50 border border-foreground/10 rounded-2xl text-center text-xs opacity-60 font-semibold">
                  {t("profile.noAddresses")}
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        addr.is_default
                          ? "bg-accent/10 border-accent/40 shadow-sm"
                          : "bg-background border-foreground/10 hover:border-foreground/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs uppercase tracking-tight text-foreground">
                            {addr.title || "Address"}
                          </span>
                          {addr.is_default && (
                            <span className="px-2 py-0.5 rounded-md bg-accent text-[9px] font-black text-white uppercase tracking-wider">
                              {t("profile.defaultBadge")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!addr.is_default && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[10px] font-bold text-accent hover:underline uppercase tracking-wider cursor-pointer"
                            >
                              {t("profile.setAsDefault")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEditAddress(addr)}
                            className="p-1 text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                            title={t("profile.editAddress")}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1 text-red-500/80 hover:text-red-500 transition-colors cursor-pointer"
                            title={t("profile.deleteAddress")}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-foreground/90 mt-1.5 whitespace-pre-wrap">
                        {addr.street}
                      </p>
                      {addr.city && (
                        <p className="text-[10px] font-bold text-foreground/60 mt-0.5 uppercase tracking-wider">
                          {addr.city}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User's Own Order History & VibeCoin (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* VibeCoin Rewards Card */}
            <div className="bg-secondary text-foreground rounded-[2.5rem] p-8 shadow-md border border-foreground/10 transition-colors duration-300 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                    <img src="/VibeCoin/VibeCoin.png" alt="VibeCoin" className="w-full h-full rounded-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
                        {t("profile.vibeCoinBalance")}
                      </h3>
                    </div>
                    <p className="text-xs opacity-75 font-semibold mt-0.5">
                      {t("profile.vibeCoinDesc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-background px-5 py-3 rounded-2xl border border-foreground/15 shadow-sm self-stretch sm:self-auto justify-between sm:justify-start">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-60 text-foreground">
                    {t("profile.totalCoins")}
                  </span>
                  <span className="text-2xl font-black text-foreground tracking-tight flex items-center gap-1 transition-colors duration-300">
                    <span>
                      {locale === "bn"
                        ? Number(vibeCoin).toLocaleString("bn-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : Number(vibeCoin).toFixed(2)}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-accent opacity-90">VC</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Order History Container */}
            <div className="bg-secondary text-foreground rounded-[2.5rem] p-8 shadow-md border border-foreground/10 transition-colors duration-300">
              <div className="flex justify-between items-center pb-4 border-b border-foreground/10 mb-6">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                    {locale === "bn"
                      ? t("profile.myOrderHistory").replace("{count}", myOrders.length.toLocaleString("bn-BD"))
                      : `My Order History (${myOrders.length})`}
                  </h2>
                  <p className="text-xs opacity-70 font-bold uppercase tracking-wider mt-1">
                    {t("profile.trackOrders")}
                  </p>
                </div>
                <Link
                  href="/products"
                  className="px-4 py-2 border border-foreground/15 bg-background text-foreground hover:bg-button-bg hover:text-button-fg rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  {t("profile.shopNow")}
                </Link>
              </div>

            {myOrders.length > 0 ? (
              <div className="space-y-6">
                {myOrders.map((ord) => {
                  const orderTotal = ord.items
                    ? ord.items.reduce((sum, i) => sum + i.quantity * Number(i.unit_price), 0)
                    : 0;

                  const orderIdText =
                    locale === "bn"
                      ? t("profile.orderNum").replace("{id}", ord.id.toLocaleString("bn-BD"))
                      : `Order #${ord.id}`;

                  const placedDateText = ord.placed_at
                    ? new Date(ord.placed_at).toLocaleString(locale === "bn" ? "bn-BD" : "en-US")
                    : "N/A";

                  const paymentStatusLabel =
                    ord.payment_status === "C"
                      ? t("profile.statusComplete")
                      : ord.payment_status === "F"
                      ? t("profile.statusFailed")
                      : t("profile.statusPending");

                  return (
                    <div
                      key={ord.id}
                      className="p-6 rounded-3xl bg-background border border-foreground/15 space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-foreground/15 pb-3">
                        <div>
                          <span className="font-black text-lg text-foreground uppercase tracking-tight">
                            {orderIdText}
                          </span>
                          <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider mt-0.5">
                            {t("profile.placedOn").replace("{date}", placedDateText)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {ord.is_edited_by_admin && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/20 text-accent border border-accent/30 flex items-center gap-1">{locale === "bn" ? "অ্যাডমিন কর্তৃক সংশোধিত" : "Edited by Store"}
                            </span>
                          )}
                          <span
                            className={`px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit ${
                              ord.payment_status === "C"
                                ? "bg-green-500/20 text-green-500 border border-green-500/30"
                                : ord.payment_status === "F"
                                ? "bg-red-500/20 text-red-500 border border-red-500/30"
                                : "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                            }`}
                          >
                            {t("profile.paymentStatus")} {paymentStatusLabel}
                          </span>
                        </div>
                      </div>

                      {/* Details & Address */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-foreground">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                            {t("profile.shippingDetails")}
                          </p>
                          <p className="font-bold">{ord.shipping_address || t("profile.addressNotSpecified")}</p>
                          <p className="text-[11px] opacity-70">{t("profile.phone")} {ord.phone || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                            {t("profile.paymentMethod")}
                          </p>
                          <p className="font-bold">
                            {ord.payment_method === "V" ? (
                              <span className="text-accent flex items-center gap-1.5">
                                <img src="/VibeCoin/VibeCoin.png" alt="VibeCoin" className="w-4 h-4 object-contain" /> {t("profile.vibeCoinPayment")}
                              </span>
                            ) : ord.payment_method === "B" || ord.payment_method === "O" ? (
                              <span className="text-bkash">
                                {locale === "bn" ? "বিকাশ পেমেন্ট" : "bKash Payment"}
                                {ord.transaction_id ? ` (TrxID: ${ord.transaction_id})` : ""}
                                {ord.transaction_phone_no ? ` [Sender: ${ord.transaction_phone_no}]` : ""}
                              </span>
                            ) : ord.payment_method === "N" ? (
                              <span className="text-nagad">
                                {locale === "bn" ? "নগদ পেমেন্ট" : "Nagad Payment"}
                                {ord.transaction_id ? ` (TrxID: ${ord.transaction_id})` : ""}
                                {ord.transaction_phone_no ? ` [Sender: ${ord.transaction_phone_no}]` : ""}
                              </span>
                            ) : (
                              t("profile.cod")
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Items Breakdown */}
                      {ord.items && ord.items.length > 0 && (
                        <div className="bg-secondary rounded-2xl p-4 border border-foreground/10 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider opacity-60 border-b border-foreground/10 pb-1">
                            {locale === "bn"
                              ? t("profile.itemsOrdered").replace(
                                  "{count}",
                                  ord.items.reduce((s, i) => s + i.quantity, 0).toLocaleString("bn-BD")
                                )
                              : `Items Ordered (${ord.items.reduce((s, i) => s + i.quantity, 0)})`}
                          </p>
                          <div className="space-y-1">
                            {ord.items.map((it: any) => {
                              const qtyFormatted = locale === "bn" ? it.quantity.toLocaleString("bn-BD") : it.quantity;
                              return (
                                <div key={it.id} className="flex justify-between items-center text-xs">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-foreground">
                                      {it.product?.title || `Product #${it.product}`} <span className="opacity-50 font-normal">x {qtyFormatted}</span>
                                    </span>
                                    {(it.variant || it.variant_title) && (
                                      <span className="text-[10px] text-accent font-semibold flex items-center gap-1">
                                        {it.variant?.color_code && (
                                          <span
                                            className="w-2.5 h-2.5 rounded-full border border-black/20 inline-block shrink-0"
                                            style={{ backgroundColor: it.variant.color_code }}
                                          />
                                        )}
                                        <span>{t("profile.option")} {it.variant?.name || it.variant_title}</span>
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-black text-accent">
                                    {formatCurrency(it.quantity * Number(it.unit_price))}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="pt-2 border-t border-foreground/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-black">
                            <div className="flex items-center gap-2">
                              <span className="uppercase text-foreground">{t("profile.totalAmount")}</span>
                              <span className="text-base text-foreground">{formatCurrency(orderTotal + Number(ord.delivery_charge || 0))}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedOrderDetails(ord)}
                              className="px-4 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                            >
                              {locale === "bn" ? "বিস্তারিত দেখুন" : "View Details"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-xs font-bold uppercase tracking-wider opacity-50">
                {t("profile.noOrders")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-secondary text-foreground rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-foreground/10 relative my-8 max-h-[90vh] flex flex-col animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-foreground/10 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black uppercase tracking-tight">
                    {locale === "bn"
                      ? `অর্ডার #${selectedOrderDetails.id.toLocaleString("bn-BD")}`
                      : `Order #${selectedOrderDetails.id}`}
                  </h3>
                  {selectedOrderDetails.is_edited_by_admin && (
                    <span className="bg-accent/20 text-accent text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                      {locale === "bn" ? "সংশোধিত" : "Edited by Store"}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider mt-0.5">
                  {selectedOrderDetails.placed_at
                    ? new Date(selectedOrderDetails.placed_at).toLocaleString(locale === "bn" ? "bn-BD" : "en-US")
                    : "N/A"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="text-xs font-bold bg-primary/5 dark:bg-primary/30 hover:bg-button-bg hover:text-button-fg px-3 py-1.5 rounded-xl transition-colors uppercase cursor-pointer"
              >
                {locale === "bn" ? "বন্ধ করুন" : "Close"}
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Shipping & Payment Info Card */}
              <div className="bg-primary/5 dark:bg-primary/20 p-4 rounded-2xl text-xs space-y-2 border border-foreground/10">
                <p>
                  <strong>{locale === "bn" ? "মোবাইল নম্বর:" : "Phone:"}</strong>{" "}
                  {selectedOrderDetails.phone || (locale === "bn" ? "নেই" : "N/A")}
                </p>
                <p>
                  <strong>{locale === "bn" ? "ডেলিভারি ঠিকানা:" : "Shipping Address:"}</strong>{" "}
                  {selectedOrderDetails.shipping_address || (locale === "bn" ? "নেই" : "N/A")}
                </p>
                <p>
                  <strong>{locale === "bn" ? "পেমেন্ট পদ্ধতি:" : "Payment Method:"}</strong>{" "}
                  {selectedOrderDetails.payment_method === "V" ? (
                    <span className="text-accent font-black uppercase inline-flex items-center gap-1">
                      <img
                        src="/VibeCoin/VibeCoin.png"
                        alt="VibeCoin"
                        className="w-3.5 h-3.5 object-contain"
                      />{" "}
                      {locale === "bn" ? "ভাইবকয়েন পেমেন্ট" : "VibeCoin Payment"}
                    </span>
                  ) : selectedOrderDetails.payment_method === "O" ||
                    selectedOrderDetails.payment_method === "B" ? (
                    <span className="text-bkash font-black uppercase">
                      {locale === "bn" ? "বিকাশ পেমেন্ট" : "Online / bKash Payment"}
                    </span>
                  ) : selectedOrderDetails.payment_method === "N" ? (
                    <span className="text-nagad font-black uppercase">
                      {locale === "bn" ? "নগদ পেমেন্ট" : "Nagad Payment"}
                    </span>
                  ) : (
                    <span className="font-black uppercase">
                      {locale === "bn" ? "ক্যাশ অন ডেলিভারি (সিওডি)" : "Cash on Delivery (COD)"}
                    </span>
                  )}
                </p>
                {(selectedOrderDetails.payment_method === "O" ||
                  selectedOrderDetails.payment_method === "B") && (
                  <p>
                    <strong>{locale === "bn" ? "বিকাশ TrxID:" : "bKash TrxID:"}</strong>{" "}
                    <code className="bg-secondary px-2 py-0.5 rounded font-mono font-bold text-bkash">
                      {selectedOrderDetails.transaction_id || "N/A"}
                    </code>{" "}
                    {selectedOrderDetails.transaction_phone_no
                      ? `[${locale === "bn" ? "প্রেরক" : "Sender"}: ${selectedOrderDetails.transaction_phone_no}]`
                      : ""}
                  </p>
                )}
                {selectedOrderDetails.payment_method === "N" && (
                  <p>
                    <strong>{locale === "bn" ? "নগদ TrxID:" : "Nagad TrxID:"}</strong>{" "}
                    <code className="bg-secondary px-2 py-0.5 rounded font-mono font-bold text-nagad">
                      {selectedOrderDetails.transaction_id || "N/A"}
                    </code>{" "}
                    {selectedOrderDetails.transaction_phone_no
                      ? `[${locale === "bn" ? "প্রেরক" : "Sender"}: ${selectedOrderDetails.transaction_phone_no}]`
                      : ""}
                  </p>
                )}
                {selectedOrderDetails.coupon_code && (
                  <p>
                    <strong>{locale === "bn" ? "ব্যবহৃত কুপন:" : "Applied Coupon:"}</strong>{" "}
                    <code className="bg-secondary px-2 py-0.5 rounded font-mono font-bold text-accent">
                      {selectedOrderDetails.coupon_code}
                    </code>
                  </p>
                )}
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-60">
                  {locale === "bn" ? "পণ্যের বিবরণ" : "Itemized Breakdown"}
                </label>
                <div className="overflow-x-auto border border-foreground/10 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-foreground/10 bg-primary/5 dark:bg-primary/20 text-[10px] font-black uppercase opacity-60">
                        <th className="py-2.5 px-3">{locale === "bn" ? "পণ্য" : "Product"}</th>
                        <th className="py-2.5 px-2 text-center">{locale === "bn" ? "পরিমাণ" : "Qty"}</th>
                        <th className="py-2.5 px-2">{locale === "bn" ? "একক মূল্য" : "Unit Price"}</th>
                        <th className="py-2.5 px-3 text-right">{locale === "bn" ? "মোট মূল্য" : "Subtotal"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/10">
                      {selectedOrderDetails.items &&
                      selectedOrderDetails.items.length > 0 ? (
                        selectedOrderDetails.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2.5 px-3 font-bold">
                              <div>
                                {item.product?.title || (locale === "bn" ? `পণ্য #${item.product}` : `Product #${item.product}`)}
                              </div>
                              {(item.variant || item.variant_title) && (
                                <div className="text-[10px] text-accent font-semibold flex items-center gap-1 mt-0.5">
                                  {item.variant?.color_code && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-black/20 inline-block shrink-0"
                                      style={{
                                        backgroundColor: item.variant.color_code,
                                      }}
                                    />
                                  )}
                                  <span>
                                    {locale === "bn" ? "ভেরিয়েন্ট: " : "Option: "}
                                    {item.variant?.name || item.variant_title}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {locale === "bn" ? `${item.quantity.toLocaleString("bn-BD")} টি` : item.quantity}
                            </td>
                            <td className="py-2.5 px-2">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-accent">
                              {formatCurrency(item.quantity * Number(item.unit_price))}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-4 text-center text-xs opacity-50"
                          >
                            {locale === "bn" ? "পণ্যের বিবরণ পাওয়া যায়নি।" : "No item breakdown available."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Price Calculation Summary */}
              {(() => {
                const items = selectedOrderDetails.items || [];
                const actualSubtotal = items.reduce((sum, i) => {
                  const origPrice = i.product?.unit_price ? Number(i.product.unit_price) : Number(i.unit_price);
                  return sum + i.quantity * Math.max(origPrice, Number(i.unit_price));
                }, 0);
                
                const discountedSubtotal = items.reduce(
                  (sum, i) => sum + i.quantity * Number(i.unit_price),
                  0
                );

                const itemDiscountSavings = Math.max(0, actualSubtotal - discountedSubtotal);
                const isOutside = selectedOrderDetails.delivery_area === "outside_dhaka";
                const baseStandardDelivery = isOutside ? 120 : 60;
                const actualDeliveryCharge = Number(selectedOrderDetails.delivery_charge ?? baseStandardDelivery);
                const deliveryDiscountSavings = Math.max(0, baseStandardDelivery - actualDeliveryCharge);

                return (
                  <div className="pt-3 border-t border-foreground/10 space-y-2">
                    {/* Original Subtotal */}
                    <div className="flex justify-between text-xs opacity-75">
                      <span>{locale === "bn" ? "পণ্যের মূল্য (আসল সাবটোটাল):" : "Items Subtotal (Original):"}</span>
                      <span className="font-bold">
                        {formatCurrency(actualSubtotal)}
                      </span>
                    </div>

                    {/* Product / Coupon Discounts (Deducted Value) */}
                    {itemDiscountSavings > 0 && (
                      <div className="flex justify-between text-xs text-accent font-bold">
                        <span>
                          {locale === "bn" ? "ডিসকাউন্ট:" : "Discount / Coupon Savings:"}
                        </span>
                        <span>-{formatCurrency(itemDiscountSavings)}</span>
                      </div>
                    )}

                    {/* Subtotal after discounts if discount exists */}
                    {itemDiscountSavings > 0 && (
                      <div className="flex justify-between text-xs opacity-75 font-semibold">
                        <span>{locale === "bn" ? "ডিসকাউন্টের পর পণ্যের মূল্য:" : "Subtotal after Discounts:"}</span>
                        <span className="font-bold">{formatCurrency(discountedSubtotal)}</span>
                      </div>
                    )}

                    {/* Standard Delivery Charge */}
                    <div className="flex justify-between text-xs opacity-75">
                      <span>
                        {locale === "bn" ? "ডেলিভারি চার্জ (" : "Delivery Charge ("}
                        {isOutside
                          ? (locale === "bn" ? "ঢাকার বাইরে" : "Outside Dhaka")
                          : (locale === "bn" ? "ঢাকার ভিতরে" : "Inside Dhaka")}
                        ):
                      </span>
                      <span className={`font-bold ${deliveryDiscountSavings > 0 ? "line-through opacity-50" : ""}`}>
                        {formatCurrency(baseStandardDelivery)}
                      </span>
                    </div>

                    {/* Free or Discounted Delivery as Minus Amount */}
                    {deliveryDiscountSavings > 0 && (
                      <div className="flex justify-between text-xs text-accent font-bold">
                        <span>
                          {actualDeliveryCharge === 0
                            ? (locale === "bn" ? "ফ্রি ডেলিভারি অফার (ডিসকাউন্ট):" : "Free Delivery Offer:")
                            : (locale === "bn" ? "ডেলিভারি ছাড়:" : "Delivery Fee Discount:")}
                        </span>
                        <span>-{formatCurrency(deliveryDiscountSavings)}</span>
                      </div>
                    )}

                    {/* Net Delivery Fee if not 0 and had discount */}
                    {deliveryDiscountSavings > 0 && actualDeliveryCharge > 0 && (
                      <div className="flex justify-between text-xs opacity-75 font-semibold">
                        <span>{locale === "bn" ? "কার্যকর ডেলিভারি চার্জ:" : "Effective Delivery Fee:"}</span>
                        <span className="font-bold">{formatCurrency(actualDeliveryCharge)}</span>
                      </div>
                    )}

                    {/* Grand Total */}
                    <div className="flex justify-between items-center pt-2 border-t border-foreground/10">
                      <span className="text-xs font-bold opacity-70 uppercase">
                        {locale === "bn" ? "পেমেন্ট অবস্থা: " : "Payment Status: "}
                        <strong className="uppercase font-black text-foreground">
                          {selectedOrderDetails.payment_status === "C"
                            ? (locale === "bn" ? "সফল (Complete)" : "Complete")
                            : selectedOrderDetails.payment_status === "F"
                              ? (locale === "bn" ? "ব্যর্থ (Failed)" : "Failed")
                              : (locale === "bn" ? "পেন্ডিং (Pending)" : "Pending")}
                        </strong>
                      </span>
                      <span className="text-base font-black text-foreground">
                        {locale === "bn" ? "সর্বমোট মূল্য: " : "Grand Total: "}
                        {formatCurrency(discountedSubtotal + actualDeliveryCharge)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Address Add / Edit Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-secondary text-foreground w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-foreground/10 relative">
            <button
              type="button"
              onClick={() => setAddressModalOpen(false)}
              className="absolute top-6 right-6 text-foreground/50 hover:text-foreground transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h3 className="text-lg font-black uppercase tracking-tight text-foreground mb-1">
              {editingAddress ? t("profile.editAddress") : t("profile.addNewAddress")}
            </h3>
            <p className="text-xs opacity-70 font-semibold mb-6">
              {t("profile.savedAddressesDesc")}
            </p>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {t("profile.addressTitle")}
                </label>
                <input
                  type="text"
                  required
                  value={addressFormData.title}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Home, Work, Office"
                  className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {t("profile.addressStreet")}
                </label>
                <textarea
                  required
                  rows={3}
                  value={addressFormData.street}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({ ...prev, street: e.target.value }))
                  }
                  placeholder="e.g. House 12, Road 5, Block B, Dhanmondi"
                  className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {t("profile.addressCity")}
                </label>
                <select
                  value={addressFormData.city}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-background text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm cursor-pointer"
                >
                  <option value="Inside Dhaka">{locale === "bn" ? "ঢাকার ভিতরে (Inside Dhaka)" : "Inside Dhaka"}</option>
                  <option value="Outside Dhaka">{locale === "bn" ? "ঢাকার বাইরে (Outside Dhaka)" : "Outside Dhaka"}</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="is_default_checkbox"
                  checked={addressFormData.is_default}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({ ...prev, is_default: e.target.checked }))
                  }
                  className="w-4 h-4 rounded accent-accent cursor-pointer"
                />
                <label
                  htmlFor="is_default_checkbox"
                  className="text-xs font-bold text-foreground cursor-pointer select-none"
                >
                  {t("profile.setAsDefault")}
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-foreground/10">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="flex-1 py-3 border border-foreground/15 bg-background text-foreground rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-foreground/5 transition-all cursor-pointer"
                >
                  {locale === "bn" ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={addressSaving}
                  className="flex-1 py-3 bg-button-bg text-button-fg rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {addressSaving ? t("profile.savingAddress") : t("profile.saveAddress")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  </div>
  );
}

