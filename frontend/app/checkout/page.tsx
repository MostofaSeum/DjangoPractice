"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import BkashPaymentUI from "@/components/BkashPaymentUI";
import NagadPaymentUI from "@/components/NagadPaymentUI";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

interface DeliveryRuleItem {
  id: number;
  title: string;
  target_type: "product" | "collection";
  rule_type: "free" | "reduced";
  inside_dhaka_charge: number | string;
  outside_dhaka_charge: number | string;
  collection?: number | null;
  products?: number[];
  products_details?: { id: number; title: string; unit_price: number }[];
  is_active: boolean;
}

export default function CheckoutPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { cart, clearCart } = useCart();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"C" | "O" | "N" | "V">(
    "C",
  );
  const [vibeCoin, setVibeCoin] = useState<number>(0);
  const [transactionId, setTransactionId] = useState("");
  const [transactionPhoneNo, setTransactionPhoneNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
    applicableProductIds: number[];
  } | null>(null);

  const [paymentSettings, setPaymentSettings] = useState<{
    bkash_number: string;
    bkash_active: boolean;
    nagad_number: string;
    nagad_active: boolean;
    cod_active: boolean;
    vibecoin_active: boolean;
  }>({
    bkash_number: "01711111111",
    bkash_active: true,
    nagad_number: "01711111111",
    nagad_active: true,
    cod_active: true,
    vibecoin_active: true,
  });

  const [deliverySettings, setDeliverySettings] = useState<{
    inside_dhaka_charge: number;
    outside_dhaka_charge: number;
    estimated_days_inside: string;
    estimated_days_outside: string;
  }>({
    inside_dhaka_charge: 60,
    outside_dhaka_charge: 130,
    estimated_days_inside: "1-2 Days",
    estimated_days_outside: "3-5 Days",
  });

  const [deliveryRules, setDeliveryRules] = useState<DeliveryRuleItem[]>([]);

  const [deliveryArea, setDeliveryArea] = useState<"inside_dhaka" | "outside_dhaka">("inside_dhaka");

  // Prefill phone/customer info, payment settings, delivery settings, delivery rules, and load applied coupon
  useEffect(() => {
    try {
      const savedCoupon = localStorage.getItem("applied_coupon");
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon));
      }
    } catch (e) {
      console.error("Failed to load applied coupon:", e);
    }

    // Fetch Delivery Settings & Rules
    const fetchDeliveryData = async () => {
      try {
        const [settingsRes, rulesRes] = await Promise.all([
          fetch(`${API_BASE}/store/delivery-settings/`, { cache: "no-store" }),
          fetch(`${API_BASE}/store/delivery-rules/`, { cache: "no-store" }),
        ]);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setDeliverySettings({
            inside_dhaka_charge: Number(data.inside_dhaka_charge ?? 60),
            outside_dhaka_charge: Number(data.outside_dhaka_charge ?? 130),
            estimated_days_inside: data.estimated_days_inside || "1-2 Days",
            estimated_days_outside: data.estimated_days_outside || "3-5 Days",
          });
        }

        if (rulesRes.ok) {
          const rulesData = await rulesRes.json();
          const list = Array.isArray(rulesData) ? rulesData : rulesData.results || [];
          setDeliveryRules(list.filter((r: DeliveryRuleItem) => r.is_active));
        }
      } catch (err) {
        console.error("Failed to fetch delivery settings/rules:", err);
      }
    };
    fetchDeliveryData();

    // Fetch Payment Settings
    const fetchPaymentSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/store/payment-settings/`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setPaymentSettings({
            bkash_number: data.bkash_number || "01711111111",
            bkash_active: data.bkash_active ?? true,
            nagad_number: data.nagad_number || "01711111111",
            nagad_active: data.nagad_active ?? true,
            cod_active: data.cod_active ?? true,
            vibecoin_active: data.vibecoin_active ?? true,
          });

          // Auto-select first available payment method if default COD is disabled
          if (data.cod_active === false) {
            if (data.bkash_active) setPaymentMethod("O");
            else if (data.nagad_active) setPaymentMethod("N");
            else if (data.vibecoin_active) setPaymentMethod("V");
          }
        }
      } catch (err) {
        console.error("Failed to fetch payment settings:", err);
      }
    };
    fetchPaymentSettings();

    if (authLoading) return;

    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Please Sign In",
        text: "You must be logged in to proceed to checkout.",
      });
      router.push("/login");
      return;
    }

    const fetchCustomerInfo = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/store/customers/me/`, {
          headers: { Authorization: `JWT ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.phone) setPhone(data.phone);
          if (data.vibe_coin !== undefined) setVibeCoin(data.vibe_coin);
        }
      } catch (err) {
        console.error("Failed to fetch customer data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerInfo();
  }, [token, authLoading, router]);

  // Automatically remove coupon if no eligible items remain in cart
  useEffect(() => {
    if (!appliedCoupon || !cart) return;

    if (cart.items.length === 0) {
      setAppliedCoupon(null);
      localStorage.removeItem("applied_coupon");
      return;
    }

    const hasMatchingProduct = cart.items.some((item) =>
      appliedCoupon.applicableProductIds.includes(item.product.id),
    );

    if (!hasMatchingProduct) {
      setAppliedCoupon(null);
      localStorage.removeItem("applied_coupon");
      Swal.fire({
        position: "top-end",
        icon: "info",
        title: `Coupon "${appliedCoupon.code}" was removed because eligible items are no longer in your cart.`,
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });
    }
  }, [cart, appliedCoupon]);

  const isCartEmpty = !cart || cart.items.length === 0;

  // Calculate Subtotals, Product Discounts, and Coupon Savings
  const originalSubtotal =
    cart?.items.reduce((sum, item) => {
      const variant = (item as any).variant;
      const unitPrice = variant?.price_override
        ? Number(variant.price_override)
        : Number(item.product.unit_price || 0);
      return sum + unitPrice * item.quantity;
    }, 0) || 0;

  const discountedSubtotal =
    cart?.items.reduce((sum, item) => {
      const variant = (item as any).variant;
      const unitPrice = variant?.price_override
        ? Number(variant.price_override)
        : Number(item.product.unit_price || 0);
      const discountPercent = Number(
        (item.product as any).discount_percent || 0,
      );
      const effectiveUnitPrice =
        variant?.discounted_price !== undefined
          ? Number(variant.discounted_price)
          : (item.product as any).discounted_price !== undefined
          ? Number((item.product as any).discounted_price)
          : discountPercent > 0
          ? unitPrice * (1 - discountPercent / 100)
          : unitPrice;
      return sum + effectiveUnitPrice * item.quantity;
    }, 0) || 0;

  const productDiscountSavings = Math.max(
    0,
    originalSubtotal - discountedSubtotal,
  );

  const couponSavings = appliedCoupon
    ? cart?.items.reduce((sum, item) => {
        if (appliedCoupon.applicableProductIds.includes(item.product.id)) {
          const variant = (item as any).variant;
          const unitPrice = variant?.price_override
            ? Number(variant.price_override)
            : Number(item.product.unit_price || 0);
          const discountPercent = Number(
            (item.product as any).discount_percent || 0,
          );
          const effectiveUnitPrice =
            variant?.discounted_price !== undefined
              ? Number(variant.discounted_price)
              : (item.product as any).discounted_price !== undefined
              ? Number((item.product as any).discounted_price)
              : discountPercent > 0
              ? unitPrice * (1 - discountPercent / 100)
              : unitPrice;
          return (
            sum +
            ((effectiveUnitPrice * appliedCoupon.discountPercent) / 100) *
              item.quantity
          );
        }
        return sum;
      }, 0) || 0
    : 0;

  const itemsTotal = Math.max(0, discountedSubtotal - couponSavings);

  // Compute delivery charge based on Delivery Rules for cart items
  const baseInsideCharge = Number(deliverySettings.inside_dhaka_charge ?? 60);
  const baseOutsideCharge = Number(deliverySettings.outside_dhaka_charge ?? 130);

  let effectiveInsideCharge = baseInsideCharge;
  let effectiveOutsideCharge = baseOutsideCharge;
  let matchingInsideRule: DeliveryRuleItem | null = null;
  let matchingOutsideRule: DeliveryRuleItem | null = null;

  if (cart && cart.items && cart.items.length > 0 && deliveryRules.length > 0) {
    // For each cart item, determine its specific inside & outside charges
    const itemCharges = cart.items.map((item) => {
      const itemColId =
        typeof (item.product as any).collection === "object" &&
        (item.product as any).collection !== null
          ? Number((item.product as any).collection.id)
          : (item.product as any).collection !== undefined &&
            (item.product as any).collection !== null
          ? Number((item.product as any).collection)
          : (item.product as any).collection_id !== undefined &&
            (item.product as any).collection_id !== null
          ? Number((item.product as any).collection_id)
          : null;

      // Find rules matching this item
      const matchedRules = deliveryRules.filter((rule) => {
        if (!rule.is_active) return false;
        if (rule.target_type === "product") {
          if (rule.products && Array.isArray(rule.products)) {
            return rule.products.map(Number).includes(Number(item.product.id));
          } else if (rule.products_details && Array.isArray(rule.products_details)) {
            return rule.products_details.some((p) => Number(p.id) === Number(item.product.id));
          }
        } else if (rule.target_type === "collection") {
          return itemColId !== null && Number(rule.collection) === itemColId;
        }
        return false;
      });

      if (matchedRules.length === 0) {
        // Standard base charges
        return {
          inside: baseInsideCharge,
          outside: baseOutsideCharge,
          rule: null,
        };
      }

      // If item matches a rule, take the lowest charge among its matched rules
      let itemInside = baseInsideCharge;
      let itemOutside = baseOutsideCharge;
      let itemRule: DeliveryRuleItem | null = null;

      for (const rule of matchedRules) {
        const rInside = rule.rule_type === "free" ? 0 : Number(rule.inside_dhaka_charge ?? 0);
        const rOutside = rule.rule_type === "free" ? 0 : Number(rule.outside_dhaka_charge ?? 0);
        if (rInside <= itemInside) {
          itemInside = rInside;
          itemRule = rule;
        }
        if (rOutside <= itemOutside) {
          itemOutside = rOutside;
          itemRule = rule;
        }
      }

      return {
        inside: itemInside,
        outside: itemOutside,
        rule: itemRule,
      };
    });

    // Across all items in cart, the parcel delivery charge is the HIGHEST charge among all products
    let maxInside = 0;
    let maxOutside = 0;
    let maxInsideRule: DeliveryRuleItem | null = null;
    let maxOutsideRule: DeliveryRuleItem | null = null;

    itemCharges.forEach((ic) => {
      if (ic.inside >= maxInside) {
        maxInside = ic.inside;
        maxInsideRule = ic.rule;
      }
      if (ic.outside >= maxOutside) {
        maxOutside = ic.outside;
        maxOutsideRule = ic.rule;
      }
    });

    effectiveInsideCharge = maxInside;
    effectiveOutsideCharge = maxOutside;
    matchingInsideRule = maxInsideRule;
    matchingOutsideRule = maxOutsideRule;
  }

  const deliveryCharge =
    deliveryArea === "outside_dhaka"
      ? effectiveOutsideCharge
      : effectiveInsideCharge;

  const currentAppliedRule =
    deliveryArea === "outside_dhaka" ? matchingOutsideRule : matchingInsideRule;

  const finalTotal = itemsTotal + deliveryCharge;
  const requiredCoins = Number(finalTotal.toFixed(2));
  const userCoins = Number(Number(vibeCoin).toFixed(2));
  const hasSufficientVibeCoin = userCoins > 0 && userCoins >= requiredCoins;

  // Validation: Online/bKash/Nagad requires TrxID and Sender Phone, VibeCoin requires sufficient balance
  const isOnlinePayment = paymentMethod === "O" || paymentMethod === "N";
  const isVibeCoinPayment = paymentMethod === "V";
  const isOrderValid =
    phone.trim().length > 0 &&
    shippingAddress.trim().length > 0 &&
    (!isOnlinePayment ||
      (transactionId.trim().length > 0 &&
        transactionPhoneNo.trim().length > 0)) &&
    (!isVibeCoinPayment || hasSufficientVibeCoin);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !cart || !isOrderValid) return;

    setSubmitting(true);

    try {
      // 1. Verify if coupon is still valid & active before placing order
      if (appliedCoupon) {
        const couponRes = await fetch(`${API_BASE}/store/coupons/validate/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: appliedCoupon.code,
            cart_items: cart.items.map((item) => ({
              product_id: item.product.id,
              quantity: item.quantity,
              unit_price: item.product.unit_price,
            })),
          }),
        });

        const couponData = await couponRes.json();
        if (!couponRes.ok || !couponData.valid) {
          const errorMsg =
            couponData.error ||
            `Coupon "${appliedCoupon.code}" is no longer active or valid. Please review your order total.`;
          setAppliedCoupon(null);
          try {
            localStorage.removeItem("applied_coupon");
          } catch (e) {}

          await Swal.fire({
            icon: "error",
            title: "Coupon No Longer Valid",
            text: errorMsg,
            confirmButtonColor: "#ef4444",
          });
          setSubmitting(false);
          return;
        }
      }

      // 2. Submit order to backend
      const payload = {
        cart_id: cart.id,
        shipping_address: shippingAddress,
        phone: phone,
        payment_method: paymentMethod,
        transaction_id: isOnlinePayment ? transactionId : "",
        transaction_phone_no: isOnlinePayment ? transactionPhoneNo : "",
        coupon_code: appliedCoupon?.code || "",
        delivery_area: deliveryArea,
      };

      const res = await fetch(`${API_BASE}/store/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const orderData = await res.json();

        // Reset local cart storage & coupon storage
        localStorage.removeItem("cart_id");
        localStorage.removeItem("applied_coupon");
        await clearCart();

        await Swal.fire({
          icon: "success",
          title: "Order Placed Successfully!",
          text: `Your Order #${orderData.id} has been received. Thank you for shopping with VibeMart!`,
          confirmButtonColor: "var(--primary)",
        });

        router.push("/profile");
      } else {
        const errData = await res.json();
        Swal.fire({
          icon: "error",
          title: "Order Placement Failed",
          text: JSON.stringify(errData),
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "An Error Occurred",
        text: "Could not submit your order. Please try again.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 font-bold text-xs uppercase tracking-widest transition-colors duration-300">
        Loading Checkout...
      </div>
    );
  }

  if (isCartEmpty) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 text-center transition-colors duration-300">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-4">
          Your Cart is Empty
        </h2>
        <p className="text-sm font-medium opacity-70 mb-6">
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link
          href="/products"
          className="bg-primary text-secondary px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-colors shadow-md"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-24 transition-colors duration-300">
      {/* Breadcrumb */}
      <div className="bg-primary text-background dark:text-foreground border-b border-white/5 py-4 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs flex items-center space-x-2.5 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="opacity-50">/</span>
          <Link href="/cart" className="hover:underline">
            Cart
          </Link>
          <span className="opacity-50">/</span>
          <span className="opacity-80">Checkout</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-12">
        <h1 className="text-4xl font-black mb-10 uppercase tracking-tighter">
          Checkout & Shipping
        </h1>

        <form
          onSubmit={handleSubmitOrder}
          className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start"
        >
          {/* Shipping & Payment Info (2 Columns) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact & Address Section */}
            <div className="bg-secondary text-foreground rounded-3xl p-8 border border-foreground/10 shadow-sm space-y-6 transition-colors duration-300">
              <h2 className="text-xl font-black uppercase tracking-tight pb-3 border-b border-foreground/10 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-button-bg text-button-fg font-black flex items-center justify-center text-xs">
                  1
                </span>
                Shipping Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                    Phone Number (11 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                    }
                    placeholder="e.g. 01700000000"
                    className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                    Shipping Address (Street, House/Flat, City/District) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="e.g. House 12, Road 5, Block B, Dhanmondi, Dhaka"
                    className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                  />
                </div>

                {/* Delivery Zone Selection */}
                <div className="flex flex-col gap-2.5 sm:col-span-2 pt-2 border-t border-foreground/10">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      Delivery Area & Charges *
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* In Side Dhaka Option */}
                    <div
                      onClick={() => setDeliveryArea("inside_dhaka")}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        deliveryArea === "inside_dhaka"
                          ? "border-accent bg-accent/10 shadow-sm"
                          : "border-foreground/10 bg-background hover:border-accent/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delivery_area"
                          checked={deliveryArea === "inside_dhaka"}
                          onChange={() => setDeliveryArea("inside_dhaka")}
                          className="w-4 h-4 accent-accent cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs uppercase tracking-tight block text-foreground">
                              In Side Dhaka
                            </span>
                          </div>
                          <span className="text-[10px] opacity-70 font-medium block">
                            Est. {deliverySettings.estimated_days_inside || "1-2 Days"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-accent">
                          {effectiveInsideCharge === 0 ? "FREE" : `৳${effectiveInsideCharge}`}
                        </div>
                        {matchingInsideRule && effectiveInsideCharge < baseInsideCharge && (
                          <div className="text-[10px] line-through opacity-50">
                            ৳{baseInsideCharge}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Out Side Dhaka Option */}
                    <div
                      onClick={() => setDeliveryArea("outside_dhaka")}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        deliveryArea === "outside_dhaka"
                          ? "border-accent bg-accent/10 shadow-sm"
                          : "border-foreground/10 bg-background hover:border-accent/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delivery_area"
                          checked={deliveryArea === "outside_dhaka"}
                          onChange={() => setDeliveryArea("outside_dhaka")}
                          className="w-4 h-4 accent-accent cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs uppercase tracking-tight block text-foreground">
                              Out Side Dhaka
                            </span>
                          </div>
                          <span className="text-[10px] opacity-70 font-medium block">
                            Est. {deliverySettings.estimated_days_outside || "3-5 Days"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-accent">
                          {effectiveOutsideCharge === 0 ? "FREE" : `৳${effectiveOutsideCharge}`}
                        </div>
                        {matchingOutsideRule && effectiveOutsideCharge < baseOutsideCharge && (
                          <div className="text-[10px] line-through opacity-50">
                            ৳{baseOutsideCharge}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-secondary text-foreground rounded-3xl p-8 border border-foreground/10 shadow-sm space-y-6 transition-colors duration-300">
              <h2 className="text-xl font-black uppercase tracking-tight pb-3 border-b border-foreground/10 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-button-bg text-button-fg font-black flex items-center justify-center text-xs">
                  2
                </span>
                Payment Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cash on Delivery Option */}
                {paymentSettings.cod_active && (
                  <div
                    onClick={() => setPaymentMethod("C")}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === "C"
                        ? "border-accent bg-accent/10 shadow-sm"
                        : "border-foreground/10 bg-secondary hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-xs uppercase tracking-tight">
                        Cash on Delivery (COD)
                      </span>
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === "C"}
                        onChange={() => setPaymentMethod("C")}
                        className="w-4 h-4 accent-accent cursor-pointer"
                      />
                    </div>
                    <p className="text-xs opacity-70 font-medium">
                      Pay in cash when delivered.
                    </p>
                  </div>
                )}

                {/* bKash Option */}
                {paymentSettings.bkash_active && (
                  <div
                    onClick={() => setPaymentMethod("O")}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === "O"
                        ? "border-bkash bg-bkash/10 shadow-sm"
                        : "border-foreground/10 bg-secondary hover:border-bkash/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-xs uppercase tracking-tight text-bkash">
                        bKash Payment
                      </span>
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === "O"}
                        onChange={() => setPaymentMethod("O")}
                        className="w-4 h-4 accent-bkash cursor-pointer"
                      />
                    </div>
                    <p className="text-xs opacity-70 font-medium">
                      Pay via bKash TrxID.
                    </p>
                  </div>
                )}

                {/* Nagad Option */}
                {paymentSettings.nagad_active && (
                  <div
                    onClick={() => setPaymentMethod("N")}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === "N"
                        ? "border-nagad bg-nagad/10 shadow-sm"
                        : "border-foreground/10 bg-secondary hover:border-nagad/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-xs uppercase tracking-tight text-nagad">
                        Nagad Payment
                      </span>
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === "N"}
                        onChange={() => setPaymentMethod("N")}
                        className="w-4 h-4 accent-nagad cursor-pointer"
                      />
                    </div>
                    <p className="text-xs opacity-70 font-medium">
                      Pay via Nagad TrxID.
                    </p>
                  </div>
                )}

                {/* VibeCoin Option */}
                {paymentSettings.vibecoin_active && (
                  <div
                    onClick={() => {
                      if (hasSufficientVibeCoin) setPaymentMethod("V");
                    }}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      !hasSufficientVibeCoin
                        ? "opacity-50 cursor-not-allowed border-foreground/10 bg-secondary"
                        : paymentMethod === "V"
                          ? "border-accent bg-accent/10 shadow-sm cursor-pointer"
                          : "border-foreground/10 bg-secondary hover:border-accent/50 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-xs uppercase tracking-tight flex items-center gap-1.5 text-foreground">
                        <img
                          src="/VibeCoin/VibeCoin.png"
                          alt="VibeCoin"
                          className="w-5 h-5 object-contain"
                        />{" "}
                        VIBECOIN
                      </span>
                      <input
                        type="radio"
                        name="payment_method"
                        disabled={!hasSufficientVibeCoin}
                        checked={paymentMethod === "V"}
                        onChange={() => {
                          if (hasSufficientVibeCoin) setPaymentMethod("V");
                        }}
                        className="w-4 h-4 accent-accent cursor-pointer"
                      />
                    </div>
                    <p className="text-xs font-medium text-foreground">
                      {!hasSufficientVibeCoin ? (
                        <span className="opacity-70 font-bold block">
                          Blocked (Balance: {Number(vibeCoin).toFixed(2)} VC,
                          Needed: {requiredCoins.toFixed(2)} VC)
                        </span>
                      ) : (
                        <span className="opacity-80">
                          Pay with VibeCoins ({Number(vibeCoin).toFixed(2)} VC
                          available).
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* VibeCoin Selected Instructions */}
              {paymentMethod === "V" && paymentSettings.vibecoin_active && (
                <div className="mt-6 p-6 rounded-2xl bg-secondary border border-foreground/15 space-y-2">
                  <p className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <img
                      src="/VibeCoin/VibeCoin.png"
                      alt="VibeCoin"
                      className="w-4 h-4 object-contain"
                    />{" "}
                    VibeCoin Payment Ready
                  </p>
                  <p className="text-xs font-semibold text-foreground opacity-80">
                    Your order total of{" "}
                    <strong>{requiredCoins.toFixed(2)} VC</strong> will be
                    automatically deducted from your VibeCoin profile balance
                    (Current: <strong>{Number(vibeCoin).toFixed(2)} VC</strong>)
                    upon order confirmation.
                  </p>
                </div>
              )}

              {/* bKash Extra Fields */}
              {paymentMethod === "O" && paymentSettings.bkash_active && (
                <div className="mt-6">
                  <BkashPaymentUI
                    amount={finalTotal.toFixed(2)}
                    currency="BDT"
                    receiverNumber={paymentSettings.bkash_number}
                    transactionPhoneNo={transactionPhoneNo}
                    setTransactionPhoneNo={setTransactionPhoneNo}
                    transactionId={transactionId}
                    setTransactionId={setTransactionId}
                  />
                </div>
              )}

              {/* Nagad Extra Fields */}
              {paymentMethod === "N" && paymentSettings.nagad_active && (
                <div className="mt-6">
                  <NagadPaymentUI
                    amount={finalTotal.toFixed(2)}
                    currency="BDT"
                    receiverNumber={paymentSettings.nagad_number}
                    transactionPhoneNo={transactionPhoneNo}
                    setTransactionPhoneNo={setTransactionPhoneNo}
                    transactionId={transactionId}
                    setTransactionId={setTransactionId}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Side Card (1 Column) */}
          <div className="bg-secondary text-foreground rounded-3xl p-8 border border-foreground/10 shadow-md sticky top-28 space-y-6 transition-colors duration-300">
            <h2 className="text-2xl font-black uppercase tracking-tight pb-4 border-b border-foreground/10">
              Order Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between opacity-80 font-medium">
                <span>
                  {productDiscountSavings > 0
                    ? "Original Subtotal"
                    : "Subtotal"}
                </span>
                <span className="font-bold text-foreground">
                  ৳{originalSubtotal.toFixed(2)}
                </span>
              </div>

              {productDiscountSavings > 0 && (
                <div className="flex justify-between text-accent font-bold">
                  <span>Product Discounts</span>
                  <span>-৳{productDiscountSavings.toFixed(2)}</span>
                </div>
              )}

              {appliedCoupon && couponSavings > 0 && (
                <div className="flex justify-between text-accent font-bold">
                  <span>
                    Coupon ({appliedCoupon.code} -{" "}
                    {appliedCoupon.discountPercent}% OFF)
                  </span>
                  <span>-৳{couponSavings.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center opacity-80 font-medium">
                <div>
                  <span>
                    Delivery Charge ({deliveryArea === "outside_dhaka" ? "Outside Dhaka" : "Inside Dhaka"})
                  </span>
                  {currentAppliedRule && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded bg-accent/20 text-accent text-[9px] font-black uppercase inline-block">
                      {(currentAppliedRule as DeliveryRuleItem).rule_type === "free" ? "Free Delivery Offer" : "Delivery Charge Discount"}
                    </span>
                  )}
                </div>
                <span className="font-bold text-accent">
                  {deliveryCharge === 0 ? "FREE (৳0.00)" : `+৳${deliveryCharge.toFixed(2)}`}
                </span>
              </div>
              <div className="pt-3 border-t border-foreground/10 flex justify-between items-center text-base font-black">
                <span>Total Amount</span>
                <span className="text-2xl text-accent">
                  ৳{finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isOrderValid}
              className="w-full py-4 bg-button-bg text-button-fg rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? "Processing Order..." : "Confirm & Place Order"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
