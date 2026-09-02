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
  courier_partner?: number | null;
  courier_partner_details?: {
    id: number;
    name: string;
    provider_code: string;
    tracking_url?: string;
  } | null;
  tracking_code?: string;
  tracking_status?: string;
  tracking_status_display?: string;
  courier_consignment_id?: string;
}

const PRESET_COURIER_LOGOS: Record<string, string> = {
  steadfast: "/DeliveryPartner/steadfast.jpg",
  pathao: "/DeliveryPartner/pathaocourier.png",
  redx: "/DeliveryPartner/redx.png",
  paperfly: "/DeliveryPartner/paperfly.png",
};

export default function ProfilePage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const { t, formatCurrency, locale } = useLanguage();
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: "",
    birth_date: "",
  });

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [currentOrdersPage, setCurrentOrdersPage] = useState<number>(1);
  const ORDERS_PER_PAGE = 5;
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);
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

  const [loading, setLoading] = useState(!user);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCopyTrackingId = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedTrackingId(true);
    setTimeout(() => setCopiedTrackingId(false), 2000);
  };

  const getExternalTrackingUrl = (order: Order) => {
    if (!order.tracking_code) return null;
    const template = order.courier_partner_details?.tracking_url;
    if (template && template.includes("{tracking_code}")) {
      return template.replace("{tracking_code}", encodeURIComponent(order.tracking_code));
    }
    if (template && template.trim()) {
      return `${template}${encodeURIComponent(order.tracking_code)}`;
    }
    const code = order.courier_partner_details?.provider_code?.toLowerCase();
    if (code === "steadfast") {
      return `https://steadfast.com.bd/t/${encodeURIComponent(order.tracking_code)}`;
    }
    if (code === "pathao") {
      return `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(order.tracking_code)}`;
    }
    if (code === "redx") {
      return `https://redx.com.bd/track-order?trackingId=${encodeURIComponent(order.tracking_code)}`;
    }
    if (code === "paperfly") {
      return `https://paperfly.com.bd/track?tracking_id=${encodeURIComponent(order.tracking_code)}`;
    }
    return null;
  };

  const getTrackingMilestoneState = (status?: string) => {
    const normalized = (status || "").toLowerCase().trim().replace(/[\s/-]+/g, "_");
    if (normalized.includes("return") || normalized.includes("fail") || normalized.includes("cancel")) {
      return { stepIndex: -1, isReturned: true, progressPercent: 100 };
    }
    if (normalized === "delivered" || (normalized.includes("deliver") && !normalized.includes("out"))) {
      return { stepIndex: 4, isReturned: false, progressPercent: 100 };
    }
    if (normalized.includes("out_for_delivery") || normalized.includes("out")) {
      return { stepIndex: 3, isReturned: false, progressPercent: 75 };
    }
    if (normalized.includes("transit") || normalized.includes("dispatch")) {
      return { stepIndex: 2, isReturned: false, progressPercent: 45 };
    }
    if (normalized.includes("pack")) {
      return { stepIndex: 1, isReturned: false, progressPercent: 15 };
    }
    return { stepIndex: 0, isReturned: false, progressPercent: 0 };
  };

  const getCourierPartnerName = (order: Order) => {
    if (order.courier_partner_details?.name) {
      return order.courier_partner_details.name;
    }
    return locale === "bn" ? "ম্যানুয়াল ট্র্যাকিং (ইন-হাউস)" : "Manual Tracking (In-House)";
  };

  const getTrackingStatusLabel = (status?: string, fallbackDisplay?: string) => {
    const raw = (status || fallbackDisplay || "").toLowerCase().replace(/[\s/-]+/g, "_");
    if (raw.includes("pending")) return t("profile.statusPending") || (locale === "bn" ? "পেন্ডিং (অপেক্ষারত)" : "Pending Dispatch");
    if (raw.includes("pack")) return t("profile.step1Title") || (locale === "bn" ? "প্যাকড ও প্রস্তুত" : "Packed & Ready");
    if (raw.includes("transit") || raw.includes("dispatch")) return t("profile.step2Title") || (locale === "bn" ? "কুরিয়ারে পাঠানো হয়েছে" : "Dispatched / In Transit");
    if (raw.includes("out_for_delivery") || raw.includes("out")) return t("profile.step3Title") || (locale === "bn" ? "ডেলিভারির জন্য বের হয়েছে" : "Out for Delivery");
    if (raw.includes("deliver")) return t("profile.step4Title") || (locale === "bn" ? "ডেলিভারি সম্পন্ন" : "Delivered");
    if (raw.includes("return") || raw.includes("fail")) return t("profile.statusReturnedBadge") || (locale === "bn" ? "ফেরত / বাতিল" : "Returned / Cancelled");
    return fallbackDisplay || status || (locale === "bn" ? "প্রস্তুত হচ্ছে" : "Processing");
  };

  const getProductId = (item: any): number => {
    if (typeof item.product === "object" && item.product?.id) {
      return item.product.id;
    }
    if (typeof item.product === "number") {
      return item.product;
    }
    if (item.product_id) {
      return item.product_id;
    }
    return 0;
  };

  const getProductTitle = (item: any): string => {
    if (typeof item.product === "object" && item.product?.title) {
      return item.product.title;
    }
    return `Product #${getProductId(item)}`;
  };

  const getProductImage = (item: any): string | null => {
    if (typeof item.product === "object" && item.product?.images && item.product.images.length > 0) {
      return item.product.images[0]?.image || null;
    }
    return null;
  };

  const handleOpenReview = (order: Order) => {
    const items = order.items || [];
    if (items.length === 0) return;

    const uniqueProductIds = Array.from(
      new Set(items.map((i) => getProductId(i)).filter(Boolean))
    );

    if (uniqueProductIds.length <= 1) {
      const pId = uniqueProductIds[0] || getProductId(items[0]);
      if (pId) {
        router.push(`/products/${pId}?tab=reviews#reviews`);
      }
    } else {
      setReviewOrder(order);
    }
  };

  const fetchAddresses = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `JWT ${token}`;
      const res = await fetch(`${API_BASE}/store/addresses/`, {
        headers,
        credentials: "include",
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

    if (!user) {
      router.push("/login?redirect=/profile");
      return;
    }

    const loadProfile = async () => {
      try {
        setOrdersLoading(true);
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `JWT ${token}`;

        // Fetch User Info, Customer Info, Saved Addresses, and Orders simultaneously in a single fast parallel bundle
        const [userRes, customerRes, addrRes, ordersRes] = await Promise.all([
          fetch(`${API_BASE}/auth/users/me/`, { headers, credentials: "include" }),
          fetch(`${API_BASE}/store/customers/me/`, { headers, credentials: "include" }),
          fetch(`${API_BASE}/store/addresses/`, { headers, credentials: "include" }),
          fetch(`${API_BASE}/store/orders/`, { headers, credentials: "include" }),
        ]);

        const userData = userRes.ok ? await userRes.json() : (user || {});
        const customerData = customerRes.ok ? await customerRes.json() : {};

        if (addrRes.ok) {
          const addrData = await addrRes.json();
          setAddresses(Array.isArray(addrData) ? addrData : addrData.results || []);
        }

        setVibeCoin(customerData.vibe_coin ?? 0);

        setFormData({
          first_name: userData.first_name || user?.first_name || "",
          last_name: userData.last_name || user?.last_name || "",
          email: userData.email || user?.email || "",
          phone: customerData.phone || "",
          birth_date: customerData.birth_date || "",
        });

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setMyOrders(Array.isArray(ordersData) ? ordersData : ordersData.results || []);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
        setOrdersLoading(false);
      }
    };

    loadProfile();
  }, [user, token, authLoading, router]);

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
        let errMessage = "Failed to save address. Please try again.";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await res.json();
            errMessage = typeof errData === "string" ? errData : JSON.stringify(errData);
          } else {
            const textData = await res.text();
            errMessage = `Server error (${res.status}): ${textData.substring(0, 150)}`;
          }
        } catch {
          errMessage = `Server responded with status ${res.status}`;
        }

        Swal.fire({
          icon: "error",
          title: "Error",
          text: errMessage,
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Could not connect to backend server. Please ensure Django is running.",
        confirmButtonColor: "#ef4444",
      });
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
            <div className="mt-8 pt-6 border-t border-foreground/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    {t("profile.savedAddresses")} ({addresses.length}/5)
                  </h3>
                </div>
                {addresses.length < 5 && (
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="text-xs font-bold text-accent hover:underline uppercase tracking-wider cursor-pointer"
                  >
                    + {t("profile.addNewAddress")}
                  </button>
                )}
              </div>

              {addresses.length === 0 ? (
                <div className="p-4 bg-background/50 border border-foreground/10 rounded-xl text-center text-xs opacity-60 font-semibold">
                  {t("profile.noAddresses")}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        addr.is_default
                          ? "bg-secondary border-accent/40"
                          : "bg-background border-foreground/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs uppercase text-foreground">
                            {addr.title || "Address"}
                          </span>
                          {addr.is_default && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/20 text-accent uppercase tracking-wider">
                              {t("profile.defaultBadge")}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!addr.is_default && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[10px] font-bold text-accent hover:underline uppercase cursor-pointer"
                            >
                              {t("profile.setAsDefault")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEditAddress(addr)}
                            className="text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
                            title={t("profile.editAddress")}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-red-500/60 hover:text-red-500 transition-colors cursor-pointer"
                            title={t("profile.deleteAddress")}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-foreground/80 mt-1.5 whitespace-pre-wrap">
                        {addr.street}
                      </p>
                      {addr.city && (
                        <p className="text-[10px] text-foreground/50 mt-0.5 uppercase tracking-wider">
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

              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="p-4 sm:p-5 rounded-2xl border border-foreground/12 bg-background/40 space-y-3 animate-pulse"
                    >
                      <div className="flex justify-between items-center pb-2.5 border-b border-foreground/5">
                        <div className="h-4 w-44 bg-foreground/10 rounded-md" />
                        <div className="h-5 w-20 bg-foreground/10 rounded-full" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-60 bg-foreground/10 rounded-md" />
                        <div className="h-3.5 w-48 bg-foreground/10 rounded-md" />
                      </div>
                      <div className="pt-2.5 border-t border-foreground/5 flex justify-between items-center">
                        <div className="h-4 w-32 bg-foreground/10 rounded-md" />
                        <div className="h-7 w-28 bg-foreground/10 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : myOrders.length > 0 ? (() => {
                const totalOrders = myOrders.length;
                const totalOrdersPages = Math.ceil(totalOrders / ORDERS_PER_PAGE) || 1;
                const startOrderIndex = (currentOrdersPage - 1) * ORDERS_PER_PAGE;
                const paginatedOrders = myOrders.slice(startOrderIndex, startOrderIndex + ORDERS_PER_PAGE);
                const endOrderIndex = Math.min(startOrderIndex + ORDERS_PER_PAGE, totalOrders);

                return (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {paginatedOrders.map((ord) => {
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
                        : ord.payment_status === "P"
                        ? t("profile.statusPending")
                        : t("profile.statusFailed");

                    return (
                      <div
                        key={ord.id}
                        className="p-4 sm:p-5 rounded-2xl border border-foreground/12 bg-background/50 hover:bg-background/80 hover:border-foreground/25 space-y-3 transition-all duration-200 shadow-xs"
                      >
                        {/* Row 1: Header (Order ID, Date, Payment Method on Left, Status Badge on Right) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-foreground/10">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span className="font-black text-sm uppercase tracking-tight text-foreground">
                              {orderIdText}
                            </span>
                            {ord.is_edited_by_admin && (
                              <span className="bg-accent/20 text-accent text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {locale === "bn" ? "সংশোধিত" : "Edited"}
                              </span>
                            )}
                            <span className="text-[11px] opacity-60 font-semibold">
                              • {placedDateText}
                            </span>
                            <span className="text-[11px] font-bold text-foreground/80 flex items-center gap-1">
                              • {ord.payment_method === "V" ? (
                                <span className="text-accent flex items-center gap-1">
                                  <img src="/VibeCoin/VibeCoin.png" alt="VibeCoin" className="w-3.5 h-3.5 object-contain" /> {t("profile.vibeCoinPayment")}
                                </span>
                              ) : ord.payment_method === "B" || ord.payment_method === "O" ? (
                                <span className="text-bkash">bKash</span>
                              ) : ord.payment_method === "N" ? (
                                <span className="text-nagad">Nagad</span>
                              ) : (
                                <span>{t("profile.cod") || "Cash on Delivery"}</span>
                              )}
                            </span>
                          </div>

                          <span
                            className={`self-start sm:self-auto px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                              ord.payment_status === "C"
                                ? "bg-visible/10 text-visible border-visible/20"
                                : ord.payment_status === "P"
                                ? "bg-accent/15 text-accent border-accent/25"
                                : "bg-hidden/10 text-hidden border-hidden/20"
                            }`}
                          >
                            {paymentStatusLabel}
                          </span>
                        </div>

                        {/* Row 2: Compact Items List */}
                        {ord.items && ord.items.length > 0 && (
                          <div className="space-y-1.5">
                            {ord.items.map((it: any) => {
                              const qtyFormatted = locale === "bn" ? it.quantity.toLocaleString("bn-BD") : it.quantity;
                              return (
                                <div key={it.id} className="flex justify-between items-center text-xs">
                                  <div className="flex flex-wrap items-center gap-x-2">
                                    <span className="font-bold text-foreground">
                                      {it.product?.title || `Product #${it.product}`}
                                    </span>
                                    <span className="opacity-50 text-[11px] font-semibold">x {qtyFormatted}</span>
                                    {it.variant && (
                                      <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.2 rounded-md">
                                        {it.variant.name || it.variant.color_name || it.variant.size}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-bold text-foreground opacity-90 text-xs shrink-0 ml-2">
                                    {formatCurrency(Number(it.unit_price) * it.quantity)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Row 3: Bottom Bar (Total & Address summary on Left, Action Buttons on Right) */}
                        <div className="pt-2.5 border-t border-foreground/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                                {t("profile.totalAmount")}:
                              </span>
                              <span className="text-sm font-black text-foreground">
                                {formatCurrency(orderTotal + Number(ord.delivery_charge || 0))}
                              </span>
                            </div>
                            {ord.shipping_address && (
                              <span className="text-[11px] opacity-60 font-medium hidden md:inline truncate max-w-[280px]">
                                • {ord.shipping_address} {ord.phone ? `(${ord.phone})` : ""}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                            {ord.payment_status === "C" && (
                              <button
                                type="button"
                                onClick={() => setTrackingOrder(ord)}
                                className="px-3.5 py-1.5 bg-accent/15 text-accent hover:bg-accent hover:text-button-fg border border-accent/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                                </svg>
                                <span>{t("profile.trackOrderBtn") || (locale === "bn" ? "ট্র্যাক করুন" : "Track")}</span>
                              </button>
                            )}
                            {ord.tracking_status === "delivered" && (
                              <button
                                type="button"
                                onClick={() => handleOpenReview(ord)}
                                className="px-3.5 py-1.5 bg-visible/15 text-visible hover:bg-visible hover:text-button-fg border border-visible/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                <span>{t("profile.reviewProductBtn") || (locale === "bn" ? "রিভিউ দিন" : "Review")}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedOrderDetails(ord)}
                              className="px-3.5 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                            >
                              {locale === "bn" ? "বিস্তারিত দেখুন" : "View Details"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                    {/* Pagination Controls (5 Orders Per Page) */}
                    {totalOrdersPages > 1 && (
                      <div className="pt-6 border-t border-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs opacity-70 font-semibold">
                          {locale === "bn"
                            ? (t("profile.showingOrders") || "মোট {total}টির মধ্যে {start} - {end}টি অর্ডার প্রদর্শিত হচ্ছে")
                                .replace("{start}", (startOrderIndex + 1).toLocaleString("bn-BD"))
                                .replace("{end}", endOrderIndex.toLocaleString("bn-BD"))
                                .replace("{total}", totalOrders.toLocaleString("bn-BD"))
                            : (t("profile.showingOrders") || "Showing {start} - {end} of {total} orders")
                                .replace("{start}", String(startOrderIndex + 1))
                                .replace("{end}", String(endOrderIndex))
                                .replace("{total}", String(totalOrders))}
                        </p>

                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                          {/* Previous Page Button */}
                          <button
                            type="button"
                            disabled={currentOrdersPage === 1}
                            onClick={() => setCurrentOrdersPage((prev) => Math.max(1, prev - 1))}
                            className="px-3 py-1.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold uppercase tracking-wider hover:bg-foreground/5 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            <span>{t("profile.prev") || (locale === "bn" ? "পূর্ববর্তী" : "Previous")}</span>
                          </button>

                          {/* Page Number Buttons */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalOrdersPages }, (_, idx) => idx + 1).map((pageNum) => {
                              const isActive = pageNum === currentOrdersPage;
                              return (
                                <button
                                  key={pageNum}
                                  type="button"
                                  onClick={() => setCurrentOrdersPage(pageNum)}
                                  className={`w-8 h-8 rounded-xl text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                                    isActive
                                      ? "bg-accent text-button-fg shadow-xs border border-accent"
                                      : "bg-background border border-foreground/15 text-foreground hover:bg-foreground/5"
                                  }`}
                                >
                                  {locale === "bn" ? pageNum.toLocaleString("bn-BD") : pageNum}
                                </button>
                              );
                            })}
                          </div>

                          {/* Next Page Button */}
                          <button
                            type="button"
                            disabled={currentOrdersPage === totalOrdersPages}
                            onClick={() => setCurrentOrdersPage((prev) => Math.min(totalOrdersPages, prev + 1))}
                            className="px-3 py-1.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold uppercase tracking-wider hover:bg-foreground/5 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <span>{t("profile.next") || (locale === "bn" ? "পরবর্তী" : "Next")}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })() : (
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
              <div className="flex items-center gap-2 flex-wrap">
                {selectedOrderDetails.payment_status === "C" && (
                  <button
                    type="button"
                    onClick={() => {
                      const ord = selectedOrderDetails;
                      setSelectedOrderDetails(null);
                      setTrackingOrder(ord);
                    }}
                    className="text-xs font-bold bg-accent/15 text-accent hover:bg-accent hover:text-button-fg border border-accent/30 px-3 py-1.5 rounded-xl transition-all uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                    </svg>
                    <span>{t("profile.trackOrderBtn") || (locale === "bn" ? "ট্র্যাক করুন" : "Track")}</span>
                  </button>
                )}
                {selectedOrderDetails.tracking_status === "delivered" && (
                  <button
                    type="button"
                    onClick={() => {
                      const ord = selectedOrderDetails;
                      setSelectedOrderDetails(null);
                      handleOpenReview(ord);
                    }}
                    className="text-xs font-bold bg-visible/15 text-visible hover:bg-visible hover:text-button-fg border border-visible/30 px-3 py-1.5 rounded-xl transition-all uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>{t("profile.reviewProductBtn") || (locale === "bn" ? "রিভিউ দিন" : "Review")}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="text-xs font-bold bg-primary/5 dark:bg-primary/30 hover:bg-button-bg hover:text-button-fg px-3.5 py-1.5 rounded-xl transition-colors uppercase cursor-pointer"
                >
                  {locale === "bn" ? "বন্ধ করুন" : "Close"}
                </button>
              </div>
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
      {/* Live Order Parcel Tracking Modal */}
      {trackingOrder && (() => {
        const milestoneState = getTrackingMilestoneState(trackingOrder.tracking_status);
        const externalTrackingUrl = getExternalTrackingUrl(trackingOrder);
        const courierPartnerName = getCourierPartnerName(trackingOrder);
        const courierCode = trackingOrder.courier_partner_details?.provider_code?.toLowerCase() || "manual";
        const courierLogo = PRESET_COURIER_LOGOS[courierCode];

        const steps = [
          {
            index: 1,
            title: t("profile.step1Title") || (locale === "bn" ? "প্যাকড ও প্রস্তুত" : "Packed & Ready"),
            desc: t("profile.step1Desc") || (locale === "bn" ? "অর্ডারটি ওয়্যারহাউসে প্রস্তুত ও প্যাকেজিং সম্পন্ন" : "Parcel packed at store warehouse"),
            icon: (
              <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7.5 4.27 9 5.15"></path>
                <polyline points="3.29 7 12 12 20.71 7"></polyline>
                <line x1="12" y1="22" x2="12" y2="12"></line>
                <path d="M21 8.5V17a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 17V8.5a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8.5z"></path>
              </svg>
            ),
          },
          {
            index: 2,
            title: t("profile.step2Title") || (locale === "bn" ? "কুরিয়ারে পাঠানো হয়েছে" : "Dispatched / In Transit"),
            desc: t("profile.step2Desc") || (locale === "bn" ? "পার্সেলটি কুরিয়ার সার্ভিস সেন্টারে স্থানান্তর করা হয়েছে" : "Handed over to courier hub"),
            icon: (
              <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            ),
          },
          {
            index: 3,
            title: t("profile.step3Title") || (locale === "bn" ? "ডেলিভারির জন্য বের হয়েছে" : "Out for Delivery"),
            desc: t("profile.step3Desc") || (locale === "bn" ? "ডেলিভারি রাইডার আপনার ঠিকানায় আসার পথে রয়েছে" : "Rider out for final delivery"),
            icon: (
              <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            ),
          },
          {
            index: 4,
            title: t("profile.step4Title") || (locale === "bn" ? "ডেলিভারি সম্পন্ন" : "Delivered"),
            desc: t("profile.step4Desc") || (locale === "bn" ? "পার্সেলটি সফলভাবে আপনার কাছে পৌঁছে দেওয়া হয়েছে" : "Parcel safely delivered to recipient"),
            icon: (
              <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            ),
          },
        ];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-secondary text-foreground rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-foreground/10 relative my-8 max-h-[90vh] flex flex-col animate-in fade-in duration-200">
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-foreground/10 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
                    <h3 className="text-base md:text-lg font-black uppercase tracking-tight">
                      {t("profile.trackOrderModalTitle") || (locale === "bn" ? "লাইভ পার্সেল ট্র্যাকিং" : "Live Parcel Tracking")}
                    </h3>
                    <span className="bg-accent/15 text-accent text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                      {locale === "bn" ? `অর্ডার #${trackingOrder.id.toLocaleString("bn-BD")}` : `Order #${trackingOrder.id}`}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider mt-0.5">
                    {trackingOrder.placed_at
                      ? new Date(trackingOrder.placed_at).toLocaleString(locale === "bn" ? "bn-BD" : "en-US")
                      : "N/A"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTrackingOrder(null)}
                  className="text-xs font-bold bg-primary/5 dark:bg-primary/30 hover:bg-button-bg hover:text-button-fg px-3.5 py-1.5 rounded-xl transition-colors uppercase cursor-pointer"
                >
                  {locale === "bn" ? "বন্ধ করুন" : "Close"}
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                {/* Courier & Consignment ID Hero Card */}
                <div className="p-5 rounded-2xl bg-background border border-foreground/10 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-foreground/10 overflow-hidden shrink-0 flex items-center justify-center p-1">
                        {courierLogo ? (
                          <img
                            src={courierLogo}
                            alt={courierPartnerName}
                            className="w-full h-full object-contain rounded-xl"
                          />
                        ) : (
                          <svg className="w-6 h-6 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13"></rect>
                            <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
                            <circle cx="5.5" cy="18.5" r="2.5"></circle>
                            <circle cx="18.5" cy="18.5" r="2.5"></circle>
                          </svg>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 block">
                          {t("profile.courierPartner") || (locale === "bn" ? "কুরিয়ার পার্টনার" : "Courier Partner")}
                        </span>
                        <h4 className="text-sm font-black text-foreground">
                          {courierPartnerName}
                        </h4>
                      </div>
                    </div>

                    {/* Current Status Badge */}
                    <div className="self-start sm:self-auto">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                          milestoneState.isReturned
                            ? "bg-hidden/15 text-hidden border-hidden/30"
                            : milestoneState.stepIndex === 4
                            ? "bg-visible/15 text-visible border-visible/30"
                            : "bg-accent/15 text-accent border-accent/30"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {getTrackingStatusLabel(trackingOrder.tracking_status, trackingOrder.tracking_status_display)}
                      </span>
                    </div>
                  </div>

                  {/* Consignment Code Box */}
                  <div className="pt-3 border-t border-foreground/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 block">
                        {t("profile.trackingId") || (locale === "bn" ? "ট্র্যাকিং / কনসাইনমেন্ট নম্বর" : "Tracking ID / Consignment No")}
                      </span>
                      {trackingOrder.tracking_code ? (
                        <div className="flex items-center gap-2 mt-1">
                          <code className="font-mono bg-secondary px-3 py-1 rounded-lg border border-foreground/10 text-xs font-black tracking-wider text-accent select-all">
                            {trackingOrder.tracking_code}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyTrackingId(trackingOrder.tracking_code || "")}
                            className="p-1.5 rounded-lg bg-secondary hover:bg-foreground/10 text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                            title={t("profile.copyTrackingCode") || (locale === "bn" ? "ট্র্যাকিং নম্বর কপি করুন" : "Copy Tracking ID")}
                          >
                            {copiedTrackingId ? (
                              <svg className="w-3.5 h-3.5 text-visible" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            )}
                          </button>
                          {copiedTrackingId && (
                            <span className="text-[10px] font-bold text-visible animate-fadeIn">
                              {t("profile.codeCopied") || (locale === "bn" ? "কপি হয়েছে!" : "Copied!")}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-foreground/70 mt-0.5">
                          {locale === "bn" ? "কুরিয়ার ট্র্যাকিং কোড প্রস্তুত হচ্ছে..." : "Tracking code will be updated once dispatched"}
                        </p>
                      )}
                    </div>

                    {externalTrackingUrl && (
                      <a
                        href={externalTrackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-button-bg hover:text-button-fg text-foreground text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-foreground/10 shadow-xs"
                      >
                        <span>{t("profile.openCourierTracking") || (locale === "bn" ? "কুরিয়ার ট্র্যাকিং পেজ দেখুন" : "Open Courier Tracking")}</span>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                {/* 4-Stoppage Visual Milestone Line Tracker */}
                <div className="p-6 rounded-2xl bg-background border border-foreground/10 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                      <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                      </svg>
                      {t("profile.trackingMilestoneTitle") || (locale === "bn" ? "ডেলিভারি অগ্রগতি" : "Delivery Progress")}
                    </h4>
                    {milestoneState.isReturned ? (
                      <span className="text-[10px] font-bold text-hidden uppercase px-2 py-0.5 rounded bg-hidden/10">
                        {t("profile.statusReturnedBadge") || (locale === "bn" ? "পার্সেল ফেরত" : "Parcel Returned")}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-accent uppercase">
                        {milestoneState.stepIndex === 4
                          ? (locale === "bn" ? "৪/৪ ধাপ সম্পন্ন" : "Step 4/4 Completed")
                          : (locale === "bn" ? `${milestoneState.stepIndex.toLocaleString("bn-BD")}/৪ ধাপ সম্পন্ন` : `Step ${milestoneState.stepIndex}/4 Completed`)}
                      </span>
                    )}
                  </div>

                  {/* Desktop / Tablet Horizontal Line Stepper */}
                  <div className="relative pt-2 pb-4">
                    {/* Track Background Line */}
                    <div className="absolute top-6 left-6 right-6 h-1 bg-foreground/10 rounded-full z-0" />

                    {/* Active Progress Bar Line */}
                    <div
                      className={`absolute top-6 left-6 h-1 rounded-full z-0 transition-all duration-700 ease-out ${
                        milestoneState.isReturned
                          ? "bg-hidden"
                          : milestoneState.stepIndex === 4
                          ? "bg-visible"
                          : "bg-accent"
                      }`}
                      style={{
                        width: milestoneState.isReturned
                          ? "calc(100% - 3rem)"
                          : `calc(${Math.min(100, Math.max(0, milestoneState.progressPercent))}% - ${
                              milestoneState.progressPercent === 100 ? "3rem" : "1.5rem"
                            })`,
                      }}
                    />

                    {/* 4 Stop Nodes */}
                    <div className="relative z-10 grid grid-cols-4 gap-2">
                      {steps.map((step) => {
                        const isCompleted = milestoneState.stepIndex >= step.index;
                        const isCurrent =
                          (milestoneState.stepIndex === step.index) ||
                          (milestoneState.stepIndex === 0 && step.index === 1);

                        return (
                          <div key={step.index} className="flex flex-col items-center text-center">
                            {/* Node Circle */}
                            <div
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                                isCompleted
                                  ? milestoneState.stepIndex === 4
                                    ? "bg-visible text-button-fg border-2 border-visible shadow-sm"
                                    : "bg-accent text-button-fg border-2 border-accent shadow-sm"
                                  : isCurrent
                                  ? "bg-background text-accent border-2 border-accent ring-4 ring-accent/20"
                                  : "bg-secondary text-foreground/30 border-2 border-foreground/15"
                              }`}
                            >
                              {isCompleted && milestoneState.stepIndex > step.index ? (
                                <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              ) : (
                                step.icon
                              )}
                            </div>

                            {/* Node Label & Description */}
                            <div className="mt-3 space-y-0.5">
                              <p
                                className={`text-[11px] md:text-xs font-black uppercase tracking-tight leading-tight ${
                                  isCompleted || isCurrent ? "text-foreground" : "text-foreground/40"
                                }`}
                              >
                                {step.title}
                              </p>
                              <p className="text-[9px] md:text-[10px] text-foreground/60 hidden sm:block leading-snug">
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Shipping Destination & Summary Card */}
                <div className="p-4 rounded-2xl bg-background border border-foreground/10 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-foreground/10 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                      {t("profile.shippingDetails")}
                    </span>
                    <span className="text-[10px] font-bold text-accent uppercase">
                      {trackingOrder.delivery_area === "outside_dhaka"
                        ? (locale === "bn" ? "ঢাকার বাইরে" : "Outside Dhaka")
                        : (locale === "bn" ? "ঢাকার ভিতরে" : "Inside Dhaka")}
                    </span>
                  </div>
                  <p className="font-bold text-foreground">
                    {trackingOrder.shipping_address || t("profile.addressNotSpecified")}
                  </p>
                  <p className="text-[11px] opacity-75 font-medium">
                    {t("profile.phone")} {trackingOrder.phone || "N/A"}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-foreground/10 flex items-center justify-between gap-3">
                {trackingOrder.tracking_status === "delivered" ? (
                  <button
                    type="button"
                    onClick={() => {
                      const ord = trackingOrder;
                      setTrackingOrder(null);
                      handleOpenReview(ord);
                    }}
                    className="px-4 py-2 bg-visible/15 text-visible hover:bg-visible hover:text-button-fg border border-visible/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>{t("profile.reviewProductBtn") || (locale === "bn" ? "রিভিউ দিন" : "Review Product")}</span>
                  </button>
                ) : <div />}

                <button
                  type="button"
                  onClick={() => setTrackingOrder(null)}
                  className="px-6 py-2.5 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-md"
                >
                  {locale === "bn" ? "বন্ধ করুন" : "Close"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Select Product to Review Modal (Delivered Order with Multiple Products) */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-secondary text-foreground w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-foreground/10 relative max-h-[90vh] flex flex-col animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-foreground/10 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <h3 className="text-base md:text-lg font-black uppercase tracking-tight text-foreground">
                    {t("profile.selectProductToReviewTitle") || (locale === "bn" ? "রিভিউ দেওয়ার পণ্য নির্বাচন করুন" : "Select Product to Review")}
                  </h3>
                </div>
                <p className="text-[11px] opacity-70 font-semibold mt-1">
                  {t("profile.selectProductToReviewSubtitle") || (locale === "bn" ? "এই ডেলিভারড অর্ডারের কোন পণ্যটির রিভিউ আপনি আগে দিতে চান তা নির্বাচন করুন।" : "Choose which product from this delivered order you'd like to review first.")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewOrder(null)}
                className="text-xs font-bold bg-primary/5 dark:bg-primary/30 hover:bg-button-bg hover:text-button-fg px-3.5 py-1.5 rounded-xl transition-colors uppercase cursor-pointer"
              >
                {locale === "bn" ? "বন্ধ করুন" : "Close"}
              </button>
            </div>

            {/* Product Items List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {reviewOrder.items && reviewOrder.items.length > 0 ? (
                reviewOrder.items.map((it, idx) => {
                  const pId = getProductId(it);
                  const pTitle = getProductTitle(it);
                  const pImg = getProductImage(it);

                  return (
                    <div
                      key={it.id || idx}
                      className="p-4 rounded-2xl bg-background border border-foreground/10 hover:border-accent/40 transition-all flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-primary/5 border border-foreground/10 overflow-hidden shrink-0 flex items-center justify-center p-1">
                          {pImg ? (
                            <img src={pImg} alt={pTitle} className="w-full h-full object-contain rounded-lg" />
                          ) : (
                            <svg className="w-6 h-6 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m7.5 4.27 9 5.15"></path>
                              <polyline points="3.29 7 12 12 20.71 7"></polyline>
                              <line x1="12" y1="22" x2="12" y2="12"></line>
                              <path d="M21 8.5V17a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 17V8.5a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8.5z"></path>
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-foreground truncate">
                            {pTitle}
                          </h4>
                          {it.variant && (
                            <span className="text-[10px] text-accent font-semibold block truncate">
                              {it.variant.name || it.variant.color_name || it.variant.size}
                            </span>
                          )}
                          <span className="text-[10px] opacity-60 font-bold block">
                            {formatCurrency(Number(it.unit_price))} • {locale === "bn" ? `পরিমাণ: ${it.quantity.toLocaleString("bn-BD")} টি` : `Qty: ${it.quantity}`}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!pId}
                        onClick={() => {
                          if (pId) {
                            setReviewOrder(null);
                            router.push(`/products/${pId}?tab=reviews#reviews`);
                          }
                        }}
                        className="px-4 py-2 bg-accent text-button-fg hover:opacity-90 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span>{t("profile.writeReview") || (locale === "bn" ? "রিভিউ লিখুন" : "Write Review")}</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs opacity-50 font-bold uppercase">
                  {locale === "bn" ? "কোনো পণ্য পাওয়া যায়নি" : "No products found in this order"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  </div>
  );
}

