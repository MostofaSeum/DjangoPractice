"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/store/LanguageContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import BkashPaymentUI from "@/components/BkashPaymentUI";
import NagadPaymentUI from "@/components/NagadPaymentUI";
import { Address } from "@/types/product";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

interface DeliveryRuleItem {
  id: number;
  title: string;
  target_type: "product" | "collection" | "order_total";
  rule_type: "free" | "reduced";
  inside_dhaka_charge: number | string;
  outside_dhaka_charge: number | string;
  collection?: number | null;
  products?: number[];
  products_details?: { id: number; title: string; unit_price: number }[];
  min_quantity?: number;
  min_order_amount?: number;
  is_active: boolean;
}

export default function CheckoutPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { cart, clearCart } = useCart();
  const { t, formatCurrency, locale } = useLanguage();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
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

    if (authLoading) return;

    if (!user) {
      Swal.fire({
        icon: "warning",
        title: locale === "bn" ? "অনুগ্রহ করে সাইন ইন করুন" : "Please Sign In",
        text: locale === "bn" ? "চেকআউটে এগিয়ে যেতে আপনাকে অবশ্যই লগইন করতে হবে।" : "You must be logged in to proceed to checkout.",
      });
      router.push("/login?redirect=/checkout");
      return;
    }

    // Load all checkout configuration, customer profile, and addresses in a single fast parallel bundle
    const initializeCheckout = async () => {
      try {
        setLoading(true);
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `JWT ${token}`;
        }

        const [delivSetRes, delivRuleRes, paySetRes, custRes, addrRes] = await Promise.all([
          fetch(`${API_BASE}/store/delivery-settings/`),
          fetch(`${API_BASE}/store/delivery-rules/`),
          fetch(`${API_BASE}/store/payment-settings/`),
          fetch(`${API_BASE}/store/customers/me/`, { headers, credentials: "include" }),
          fetch(`${API_BASE}/store/addresses/`, { headers, credentials: "include" }),
        ]);

        if (delivSetRes.ok) {
          const data = await delivSetRes.json();
          setDeliverySettings({
            inside_dhaka_charge: Number(data.inside_dhaka_charge ?? 60),
            outside_dhaka_charge: Number(data.outside_dhaka_charge ?? 130),
            estimated_days_inside: data.estimated_days_inside || "1-2 Days",
            estimated_days_outside: data.estimated_days_outside || "3-5 Days",
          });
        }

        if (delivRuleRes.ok) {
          const rulesData = await delivRuleRes.json();
          const list = Array.isArray(rulesData) ? rulesData : rulesData.results || [];
          setDeliveryRules(list.filter((r: DeliveryRuleItem) => r.is_active));
        }

        if (paySetRes.ok) {
          const data = await paySetRes.json();
          setPaymentSettings({
            bkash_number: data.bkash_number || "01711111111",
            bkash_active: data.bkash_active ?? true,
            nagad_number: data.nagad_number || "01711111111",
            nagad_active: data.nagad_active ?? true,
            cod_active: data.cod_active ?? true,
            vibecoin_active: data.vibecoin_active ?? true,
          });

          if (data.cod_active === false) {
            if (data.bkash_active) setPaymentMethod("O");
            else if (data.nagad_active) setPaymentMethod("N");
            else if (data.vibecoin_active) setPaymentMethod("V");
          }
        }

        if (custRes.ok) {
          const data = await custRes.json();
          if (data.phone) setPhone(data.phone);
          if (data.vibe_coin !== undefined) setVibeCoin(Number(data.vibe_coin));
        }

        if (addrRes.ok) {
          const addrData = await addrRes.json();
          const list: Address[] = Array.isArray(addrData) ? addrData : addrData.results || [];
          setSavedAddresses(list);

          const defaultAddr = list.find((a) => a.is_default) || list[0];
          if (defaultAddr) {
            setSelectedAddressId(String(defaultAddr.id));
            setShippingAddress(defaultAddr.street);
            if (defaultAddr.city) {
              if (defaultAddr.city.toLowerCase().includes("outside")) {
                setDeliveryArea("outside_dhaka");
              } else if (defaultAddr.city.toLowerCase().includes("inside")) {
                setDeliveryArea("inside_dhaka");
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to initialize checkout:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [user, token, authLoading, router]);

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
        title: (t("cart.couponRemovedReason") || `Coupon "${appliedCoupon.code}" was removed because eligible items are no longer in your cart.`).replace("{code}", appliedCoupon.code),
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });
    }
  }, [cart, appliedCoupon, t]);

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
        const reqQty = Number(rule.min_quantity || 1);
        const reqAmount = Number(rule.min_order_amount || 0);

        if (rule.target_type === "product") {
          const isProductMatch =
            (rule.products && Array.isArray(rule.products) && rule.products.map(Number).includes(Number(item.product.id))) ||
            (rule.products_details && Array.isArray(rule.products_details) && rule.products_details.some((p) => Number(p.id) === Number(item.product.id)));

          if (!isProductMatch) return false;

          if (reqAmount > 0) {
            // Check total spend on this product in cart
            const totalProdSpend = cart.items
              .filter((ci) => Number(ci.product.id) === Number(item.product.id))
              .reduce((sum, ci) => {
                const ciPrice = Number(ci.product.discounted_price ?? ci.product.unit_price ?? 0);
                return sum + ciPrice * ci.quantity;
              }, 0);
            return totalProdSpend >= reqAmount;
          } else {
            // Total quantity of this product in cart
            const totalProdQty = cart.items
              .filter((ci) => Number(ci.product.id) === Number(item.product.id))
              .reduce((sum, ci) => sum + ci.quantity, 0);

            return totalProdQty >= reqQty;
          }
        } else if (rule.target_type === "collection") {
          if (itemColId === null || Number(rule.collection) !== itemColId) return false;

          if (reqAmount > 0) {
            // Check total spend on this collection in cart
            const totalColSpend = cart.items
              .filter((ci) => {
                const cId =
                  typeof (ci.product as any).collection === "object" && (ci.product as any).collection !== null
                    ? Number((ci.product as any).collection.id)
                    : Number((ci.product as any).collection);
                return cId === itemColId;
              })
              .reduce((sum, ci) => {
                const ciPrice = Number(ci.product.discounted_price ?? ci.product.unit_price ?? 0);
                return sum + ciPrice * ci.quantity;
              }, 0);
            return totalColSpend >= reqAmount;
          } else {
            // Total quantity of this collection in cart
            const totalColQty = cart.items
              .filter((ci) => {
                const cId =
                  typeof (ci.product as any).collection === "object" && (ci.product as any).collection !== null
                    ? Number((ci.product as any).collection.id)
                    : Number((ci.product as any).collection);
                return cId === itemColId;
              })
              .reduce((sum, ci) => sum + ci.quantity, 0);

            return totalColQty >= reqQty;
          }
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

      // If item matches rules, determine the item's charges
      const firstRule = matchedRules[0];
      let itemInside =
        firstRule.rule_type === "free"
          ? 0
          : Number(firstRule.inside_dhaka_charge ?? 0);
      let itemOutside =
        firstRule.rule_type === "free"
          ? 0
          : Number(firstRule.outside_dhaka_charge ?? 0);
      let itemRule: DeliveryRuleItem | null = firstRule;

      for (let i = 1; i < matchedRules.length; i++) {
        const rule = matchedRules[i];
        const rInside =
          rule.rule_type === "free"
            ? 0
            : Number(rule.inside_dhaka_charge ?? 0);
        const rOutside =
          rule.rule_type === "free"
            ? 0
            : Number(rule.outside_dhaka_charge ?? 0);

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

  // Check Order Total / Cart Threshold Delivery Rules
  if (deliveryRules.length > 0) {
    const orderTotalRules = deliveryRules.filter(
      (r) =>
        r.is_active &&
        r.target_type === "order_total" &&
        itemsTotal >= Number(r.min_order_amount || 0)
    );

    if (orderTotalRules.length > 0) {
      // Find the most beneficial rule (lowest delivery charge or highest threshold reached)
      orderTotalRules.sort(
        (a, b) => Number(b.min_order_amount || 0) - Number(a.min_order_amount || 0)
      );
      const topOrderRule = orderTotalRules[0];

      const thresholdInsideCharge =
        topOrderRule.rule_type === "free"
          ? 0
          : Number(topOrderRule.inside_dhaka_charge ?? 0);
      const thresholdOutsideCharge =
        topOrderRule.rule_type === "free"
          ? 0
          : Number(topOrderRule.outside_dhaka_charge ?? 0);

      if (thresholdInsideCharge <= effectiveInsideCharge) {
        effectiveInsideCharge = thresholdInsideCharge;
        matchingInsideRule = topOrderRule;
      }
      if (thresholdOutsideCharge <= effectiveOutsideCharge) {
        effectiveOutsideCharge = thresholdOutsideCharge;
        matchingOutsideRule = topOrderRule;
      }
    }
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
          title: t("checkout.orderPlacedSuccess") || "Order Placed Successfully!",
          text: (t("checkout.orderPlacedText") || `Your Order #${orderData.id} has been received. Thank you for shopping with VibeMart!`).replace("{id}", locale === "bn" ? orderData.id.toLocaleString("bn-BD") : orderData.id),
          confirmButtonColor: "var(--primary)",
        });

        router.push("/profile");
      } else {
        const errData = await res.json();
        let errorMsg = locale === "bn" ? "অর্ডার সম্পন্ন করতে সমস্যা হয়েছে।" : "Order Placement Failed.";
        if (typeof errData === "object" && errData !== null) {
          const messages = Object.entries(errData).map(([key, val]) => {
            const text = Array.isArray(val) ? val.join(" ") : String(val);
            return text;
          });
          errorMsg = messages.join("\n");
        }
        Swal.fire({
          icon: "error",
          title: t("checkout.orderFailed") || "Order Placement Failed",
          text: errorMsg,
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: locale === "bn" ? "সমস্যা দেখা দিয়েছে" : "An Error Occurred",
        text: locale === "bn" ? "অর্ডার সাবমিট করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।" : "Could not submit your order. Please try again.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 font-bold text-xs uppercase tracking-widest transition-colors duration-300">
        {t("checkout.loadingCheckout")}
      </div>
    );
  }

  if (isCartEmpty) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 text-center transition-colors duration-300">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-4">
          {t("checkout.cartEmpty")}
        </h2>
        <p className="text-sm font-medium opacity-70 mb-6">
          {t("checkout.cartEmptySubtitle")}
        </p>
        <Link
          href="/products"
          className="bg-primary text-secondary px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-colors shadow-md cursor-pointer"
        >
          {t("checkout.browseProducts")}
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
            {t("nav.home")}
          </Link>
          <span className="opacity-50">/</span>
          <Link href="/cart" className="hover:underline">
            {t("nav.cart") || "Cart"}
          </Link>
          <span className="opacity-50">/</span>
          <span className="opacity-80">{t("checkout.breadcrumbCheckout")}</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-12">
        <h1 className="text-4xl font-black mb-10 uppercase tracking-tighter">
          {t("checkout.title")}
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
                {t("checkout.shippingInfo")}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                    {t("checkout.phoneNumberLabel")}
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                    }
                    placeholder={t("checkout.phonePlaceholder")}
                    className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                  />
                </div>

                {/* Delivery Zone Selection (Placed before Shipping Address) */}
                <div className="flex flex-col gap-2.5 sm:col-span-2 pt-2 border-t border-foreground/10">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      {t("checkout.deliveryAreaTitle")}
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
                              {t("checkout.insideDhaka")}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-70 font-medium block">
                            {locale === "bn" ? "আনুমানিক সময়ঃ ১-২ দিন" : `Est. ${deliverySettings.estimated_days_inside || "1-2 Days"}`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-accent">
                          {effectiveInsideCharge === 0 ? t("checkout.free") : formatCurrency(effectiveInsideCharge)}
                        </div>
                        {matchingInsideRule && effectiveInsideCharge < baseInsideCharge && (
                          <div className="text-[10px] line-through opacity-50">
                            {formatCurrency(baseInsideCharge)}
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
                              {t("checkout.outsideDhaka")}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-70 font-medium block">
                            {locale === "bn" ? "আনুমানিক সময়ঃ ৩-৫ দিন" : `Est. ${deliverySettings.estimated_days_outside || "3-5 Days"}`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-accent">
                          {effectiveOutsideCharge === 0 ? t("checkout.free") : formatCurrency(effectiveOutsideCharge)}
                        </div>
                        {matchingOutsideRule && effectiveOutsideCharge < baseOutsideCharge && (
                          <div className="text-[10px] line-through opacity-50">
                            {formatCurrency(baseOutsideCharge)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                    {t("checkout.shippingAddressLabel")}
                  </label>

                  {savedAddresses.length > 0 && (
                    <div className="flex flex-col gap-1 mb-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                        {t("checkout.useSavedAddress")}
                      </label>
                      <select
                        value={selectedAddressId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedAddressId(val);
                          if (val === "custom") {
                            setShippingAddress("");
                          } else {
                            const found = savedAddresses.find((a) => String(a.id) === val);
                            if (found) {
                              setShippingAddress(found.street);
                              if (found.city) {
                                if (found.city.toLowerCase().includes("outside")) {
                                  setDeliveryArea("outside_dhaka");
                                } else if (found.city.toLowerCase().includes("inside")) {
                                  setDeliveryArea("inside_dhaka");
                                }
                              }
                            }
                          }
                        }}
                        className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm cursor-pointer"
                      >
                        {savedAddresses.map((addr) => (
                          <option key={addr.id} value={String(addr.id)}>
                            {addr.title || "Address"} {addr.is_default ? `(${t("profile.defaultBadge") || "DEFAULT"})` : ""}: {addr.street.length > 40 ? addr.street.slice(0, 40) + "..." : addr.street}
                          </option>
                        ))}
                        <option value="custom">
                          {t("checkout.customAddressOption")}
                        </option>
                      </select>
                    </div>
                  )}

                  <textarea
                    required
                    rows={3}
                    value={shippingAddress}
                    onChange={(e) => {
                      setShippingAddress(e.target.value);
                      if (selectedAddressId !== "custom" && savedAddresses.length > 1) {
                        const matching = savedAddresses.find((a) => String(a.id) === selectedAddressId);
                        if (matching && matching.street !== e.target.value) {
                          setSelectedAddressId("custom");
                        }
                      }
                    }}
                    placeholder={t("checkout.addressPlaceholder")}
                    className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-secondary text-foreground rounded-3xl p-8 border border-foreground/10 shadow-sm space-y-6 transition-colors duration-300">
              <h2 className="text-xl font-black uppercase tracking-tight pb-3 border-b border-foreground/10 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-button-bg text-button-fg font-black flex items-center justify-center text-xs">
                  2
                </span>
                {t("checkout.paymentMethod")}
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
                        {t("checkout.cod")}
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
                      {t("checkout.codDesc")}
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
                        {t("checkout.bkash")}
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
                      {t("checkout.bkashDesc")}
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
                        {t("checkout.nagad")}
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
                      {t("checkout.nagadDesc")}
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
                        {t("checkout.vibeCoin")}
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
                          {t("checkout.vibeCoinBlocked")
                            .replace("{balance}", locale === "bn" ? Number(vibeCoin).toLocaleString("bn-BD", { minimumFractionDigits: 2 }) : Number(vibeCoin).toFixed(2))
                            .replace("{needed}", locale === "bn" ? requiredCoins.toLocaleString("bn-BD", { minimumFractionDigits: 2 }) : requiredCoins.toFixed(2))}
                        </span>
                      ) : (
                        <span className="opacity-80">
                          {t("checkout.vibeCoinAvailable").replace("{coins}", locale === "bn" ? Number(vibeCoin).toLocaleString("bn-BD", { minimumFractionDigits: 2 }) : Number(vibeCoin).toFixed(2))}
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
                    {t("checkout.vibeCoinReady")}
                  </p>
                  <p className="text-xs font-semibold text-foreground opacity-80">
                    {t("checkout.vibeCoinReadyDesc")
                      .replace("{coins}", locale === "bn" ? requiredCoins.toLocaleString("bn-BD", { minimumFractionDigits: 2 }) : requiredCoins.toFixed(2))
                      .replace("{balance}", locale === "bn" ? Number(vibeCoin).toLocaleString("bn-BD", { minimumFractionDigits: 2 }) : Number(vibeCoin).toFixed(2))}
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
              {t("checkout.orderSummary")}
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between opacity-80 font-medium">
                <span>
                  {productDiscountSavings > 0
                    ? t("checkout.originalSubtotal")
                    : t("checkout.subtotal")}
                </span>
                <span className="font-bold text-foreground">
                  {formatCurrency(originalSubtotal)}
                </span>
              </div>

              {productDiscountSavings > 0 && (
                <div className="flex justify-between text-accent font-bold">
                  <span>{t("checkout.productDiscounts")}</span>
                  <span>-{formatCurrency(productDiscountSavings)}</span>
                </div>
              )}

              {appliedCoupon && couponSavings > 0 && (
                <div className="flex justify-between text-accent font-bold">
                  <span>
                    {t("checkout.coupon")
                      .replace("{code}", appliedCoupon.code)
                      .replace("{percent}", locale === "bn" ? appliedCoupon.discountPercent.toLocaleString("bn-BD") : appliedCoupon.discountPercent.toString())}
                  </span>
                  <span>-{formatCurrency(couponSavings)}</span>
                </div>
              )}

              <div className="flex justify-between items-center opacity-80 font-medium">
                <div>
                  <span>
                    {t("checkout.deliveryCharge").replace(
                      "{area}",
                      deliveryArea === "outside_dhaka"
                        ? t("checkout.outsideDhaka")
                        : t("checkout.insideDhaka")
                    )}
                  </span>
                  {currentAppliedRule && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded bg-accent/20 text-accent text-[9px] font-black uppercase inline-block">
                      {(currentAppliedRule as DeliveryRuleItem).rule_type === "free"
                        ? t("checkout.freeDeliveryOffer")
                        : t("checkout.deliveryDiscount")}
                    </span>
                  )}
                </div>
                <span className="font-bold text-accent">
                  {deliveryCharge === 0 ? t("checkout.freeZero") : `+${formatCurrency(deliveryCharge)}`}
                </span>
              </div>
              <div className="pt-3 border-t border-foreground/10 flex justify-between items-center text-base font-black">
                <span>{t("checkout.totalAmount")}</span>
                <span className="text-2xl text-accent">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isOrderValid}
              className="w-full py-4 bg-button-bg text-button-fg rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? t("checkout.processingOrder") : t("checkout.confirmOrder")}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
