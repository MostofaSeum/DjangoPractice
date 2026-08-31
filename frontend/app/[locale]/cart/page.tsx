"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/store/LanguageContext";
import ProductImage from "@/components/ui/ProductImage";
import Swal from "sweetalert2";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export default function CartPage() {
  const router = useRouter();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const { t, formatCurrency, locale } = useLanguage();
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
    applicableProductIds: number[];
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  // Fetch related products from the collections of items in the cart
  useEffect(() => {
    if (!cart?.items || cart.items.length === 0) {
      setRelatedProducts([]);
      return;
    }

    // Only run if the set of item IDs actually changed
    const cartProductIds = new Set(cart.items.map((i) => i.product.id));
    const collectionIds = Array.from(
      new Set(
        cart.items
          .map((i) => {
            const col = i.product.collection;
            if (typeof col === "object" && col !== null) return (col as any).id;
            if (typeof col === "number") return col;
            return null;
          })
          .filter(Boolean),
      ),
    ).slice(0, 2); // Limit to top 2 collections to avoid excessive parallel calls

    const controller = new AbortController();

    if (collectionIds.length === 0) {
      fetch(`${API_BASE}/store/products/?page_size=6`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data.results || [];
          setRelatedProducts(
            list.filter((p: any) => !cartProductIds.has(p.id)).slice(0, 4),
          );
        })
        .catch((e) => {
          if (e.name !== "AbortError") console.error("Failed to fetch related products:", e);
        });
      return () => controller.abort();
    }

    Promise.all(
      collectionIds.map((cid) =>
        fetch(`${API_BASE}/store/products/?collection_id=${cid}&page_size=4`, { signal: controller.signal })
          .then((res) => res.json())
          .then((data) => (Array.isArray(data) ? data : data.results || []))
          .catch(() => []),
      ),
    ).then((results) => {
      const flattened = results.flat();
      const unique = new Map<number, any>();
      for (const p of flattened) {
        if (!cartProductIds.has(p.id) && !unique.has(p.id)) {
          unique.set(p.id, p);
        }
      }
      setRelatedProducts(Array.from(unique.values()).slice(0, 4));
    }).catch((e) => {
      if (e.name !== "AbortError") console.error(e);
    });

    return () => controller.abort();
  }, [cart?.items?.length]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("applied_coupon");
      if (saved) {
        setAppliedCoupon(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load saved coupon:", e);
    }
  }, []);

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
  }, [cart, appliedCoupon]);

  const handleRemoveItem = async (itemId: number, itemTitle: string) => {
    const confirm = await Swal.fire({
      title: t("cart.removeFromCartTitle") || "Remove from Cart?",
      text: (t("cart.removeFromCartText") || `Are you sure you want to remove "${itemTitle}" from your cart?`).replace("{title}", itemTitle),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent)",
      cancelButtonColor: "var(--button-bg)",
      confirmButtonText: t("cart.yesRemove") || "Yes, Remove",
      cancelButtonText: locale === "bn" ? "বাতিল" : "Cancel",
    });

    if (confirm.isConfirmed) {
      await removeFromCart(itemId);
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: t("cart.itemRemoved") || "Item removed from cart",
        showConfirmButton: false,
        timer: 1500,
        toast: true,
      });
    }
  };

  const isCartEmpty = !cart || cart.items.length === 0;

  // Calculate Subtotals & Product Discounts
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

  // Handle Coupon Application via Backend Validation
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const cleanCode = couponInput.trim().toUpperCase();

    if (!cleanCode) {
      setCouponError(locale === "bn" ? "অনুগ্রহ করে একটি কুপন কোড লিখুন।" : "Please enter a coupon code.");
      return;
    }

    if (!cart || cart.items.length === 0) {
      Swal.fire({
        icon: "info",
        title: locale === "bn" ? "কার্ট খালি" : "Cart is Empty",
        text: locale === "bn" ? "কুপন ব্যবহারের পূর্বে কার্টে পণ্য যোগ করুন।" : "Please add products to your cart before applying a coupon.",
        confirmButtonColor: "var(--accent)",
      });
      return;
    }

    try {
      setCouponValidating(true);
      const res = await fetch(`${API_BASE}/store/coupons/validate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          cart_items: cart.items.map((item) => {
            const variant = (item as any).variant;
            const unitPrice = variant?.price_override
              ? Number(variant.price_override)
              : Number(item.product.unit_price || 0);
            return {
              product_id: item.product.id,
              quantity: item.quantity,
              unit_price: unitPrice,
            };
          }),
        }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        const couponData = {
          code: data.code,
          discountPercent: data.discount_percent,
          applicableProductIds: data.applicable_product_ids || [],
        };
        setAppliedCoupon(couponData);
        try {
          localStorage.setItem("applied_coupon", JSON.stringify(couponData));
        } catch (e) {}
        setCouponError("");
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: locale === "bn"
            ? `কুপন "${data.code}" যুক্ত হয়েছে! (${data.discount_percent.toLocaleString("bn-BD")}% ছাড়)`
            : `Coupon "${data.code}" Applied! (${data.discount_percent}% OFF)`,
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
      } else {
        const errorMsg = data.error || (locale === "bn" ? "এই কুপন কোডটি সঠিক নয়।" : "This coupon code is invalid.");
        setCouponError(errorMsg);
        Swal.fire({
          icon: "error",
          title: locale === "bn" ? "কুপন ত্রুটি" : "Coupon Error",
          text: errorMsg,
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err) {
      console.error("Coupon validation error:", err);
      Swal.fire({
        icon: "error",
        title: locale === "bn" ? "ভ্যালিডেশন ত্রুটি" : "Validation Error",
        text: locale === "bn" ? "কুপন যাচাই করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" : "Failed to validate coupon. Please check your network and try again.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setCouponValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    try {
      localStorage.removeItem("applied_coupon");
    } catch (e) {}
    setCouponInput("");
    setCouponError("");
  };

  // Calculate savings on eligible products
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

  const finalTotal = Math.max(0, discountedSubtotal - couponSavings);

  const handleProceedToCheckout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) return;

    // Check delivery rules for mixed cart items (some free delivery, some non-free delivery)
    try {
      const rulesRes = await fetch(`${API_BASE}/store/delivery-rules/`, {
        cache: "no-store",
      });
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        const activeRules: any[] = (
          Array.isArray(rulesData) ? rulesData : rulesData.results || []
        ).filter((r: any) => r.is_active && r.rule_type === "free");

        // If entire cart qualifies via an order_total threshold rule, all items qualify
        const isCartTotalFree = activeRules.some(
          (rule) =>
            rule.target_type === "order_total" &&
            finalTotal >= Number(rule.min_order_amount || 0)
        );

        if (isCartTotalFree) {
          router.push("/checkout");
          return;
        }

        if (activeRules.length > 0) {
          const isItemFree = (item: any) => {
            const itemColId =
              typeof item.product.collection === "object" &&
              item.product.collection !== null
                ? Number(item.product.collection.id)
                : item.product.collection !== undefined &&
                  item.product.collection !== null
                ? Number(item.product.collection)
                : item.product.collection_id !== undefined &&
                  item.product.collection_id !== null
                ? Number(item.product.collection_id)
                : null;

            return activeRules.some((rule) => {
              const reqQty = Number(rule.min_quantity || 1);

              if (rule.target_type === "product") {
                const isProductMatch =
                  (rule.products && Array.isArray(rule.products) && rule.products.map(Number).includes(Number(item.product.id))) ||
                  (rule.products_details && Array.isArray(rule.products_details) && rule.products_details.some((p: any) => Number(p.id) === Number(item.product.id)));

                if (!isProductMatch) return false;

                // Total quantity of this product in cart
                const totalProdQty = cart.items
                  .filter((ci) => Number(ci.product.id) === Number(item.product.id))
                  .reduce((sum, ci) => sum + ci.quantity, 0);

                return totalProdQty >= reqQty;
              } else if (rule.target_type === "collection") {
                if (itemColId === null || Number(rule.collection) !== itemColId) return false;

                // Total quantity of this collection in cart
                const totalColQty = cart.items
                  .filter((ci) => {
                    const cId =
                      typeof ci.product.collection === "object" && ci.product.collection !== null
                        ? Number(ci.product.collection.id)
                        : Number(ci.product.collection);
                    return cId === itemColId;
                  })
                  .reduce((sum, ci) => sum + ci.quantity, 0);

                return totalColQty >= reqQty;
              }
              return false;
            });
          };

          const freeItems = cart.items.filter(isItemFree);
          const nonFreeItems = cart.items.filter((item) => !isItemFree(item));

          // If cart has at least one free item AND at least one non-free item
          if (freeItems.length > 0 && nonFreeItems.length > 0) {
            const nonFreeNames = nonFreeItems
              .map((i) => `• <strong>${i.product.title}</strong>`)
              .join("<br/>");

            const popupResult = await Swal.fire({
              title: t("cart.freeDeliveryOffer") || "Free Delivery Offer",
              customClass: {
                popup: "rounded-3xl border border-foreground/15 shadow-2xl p-6",
              },
              html: `
                <div class="text-left text-xs space-y-3.5 pt-2">
                  <p class="font-medium text-foreground/80 leading-relaxed">
                    ${t("cart.nonQualifyingNotice")}
                  </p>
                  <div class="p-3.5 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 rounded-2xl font-bold text-foreground space-y-1.5 shadow-2xs">
                    ${nonFreeNames}
                  </div>
                  <p class="font-medium text-foreground/80 leading-relaxed">
                    ${t("cart.nonQualifyingSubNotice")}
                  </p>
                </div>
              `,
              icon: "info",
              iconColor: "var(--accent)",
              showCancelButton: true,
              confirmButtonText: t("cart.removeNonFreeItems") || "Remove Non-Free Items",
              cancelButtonText: t("cart.goToCheckout") || "Go to Checkout",
              confirmButtonColor: "#ef4444",
              cancelButtonColor: "var(--accent)",
              reverseButtons: true,
            });

            if (popupResult.isConfirmed) {
              // Remove non-free items
              setCheckingOut(true);
              try {
                for (const item of nonFreeItems) {
                  await removeFromCart(item.id);
                }
                Swal.fire({
                  position: "top-end",
                  icon: "success",
                  title: t("cart.freeDeliveryAppliedToast") || "Non-qualifying items removed. You now get Free Delivery!",
                  showConfirmButton: false,
                  timer: 2000,
                  toast: true,
                });
              } catch (err) {
                console.error("Failed to remove non-free items:", err);
              } finally {
                setCheckingOut(false);
              }
              return;
            }
            // If user clicked "Go to Checkout" (cancel button), proceed to checkout with standard charges
          }
        }
      }
    } catch (err) {
      console.error("Delivery rule check error:", err);
    }

    if (appliedCoupon) {
      try {
        setCheckingOut(true);
        const res = await fetch(`${API_BASE}/store/coupons/validate/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: appliedCoupon.code,
            cart_items: cart.items.map((item) => {
              const variant = (item as any).variant;
              const unitPrice = variant?.price_override
                ? Number(variant.price_override)
                : Number(item.product.unit_price || 0);
              return {
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: unitPrice,
              };
            }),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.valid) {
          const errorMsg =
            data.error ||
            `Coupon "${appliedCoupon.code}" is no longer active or valid. Please review your order total.`;
          setAppliedCoupon(null);
          try {
            localStorage.removeItem("applied_coupon");
          } catch (e) {}
          setCouponError(errorMsg);

          await Swal.fire({
            icon: "error",
            title: "Coupon No Longer Valid",
            text: errorMsg,
            confirmButtonColor: "#ef4444",
          });
          return;
        }

        // Save latest verified coupon data
        const couponData = {
          code: data.code,
          discountPercent: data.discount_percent,
          applicableProductIds: data.applicable_product_ids || [],
        };
        setAppliedCoupon(couponData);
        try {
          localStorage.setItem("applied_coupon", JSON.stringify(couponData));
        } catch (e) {}
      } catch (err) {
        console.error("Coupon re-validation error on proceed to checkout:", err);
      } finally {
        setCheckingOut(false);
      }
    }

    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-12 py-16">
        {isCartEmpty ? (
          <div className="bg-secondary text-foreground rounded-[2.5rem] p-16 text-center shadow-sm border border-foreground/10 max-w-2xl mx-auto flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/5 dark:bg-primary/30 rounded-full flex items-center justify-center mb-6">
              <Image
                src="/HomePage/shopping-cart.png"
                width={32}
                height={32}
                alt="Empty Cart"
              />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-3">
              {t("cart.emptyCartTitle")}
            </h2>
            <p className="text-sm opacity-70 font-medium mb-8 max-w-sm">
              {t("cart.emptyCartSubtitle")}
            </p>
            <Link
              href="/products"
              className="bg-primary text-secondary px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              {t("cart.exploreProducts")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const variant = (item as any).variant;
                const unitPrice = variant?.price_override
                  ? Number(variant.price_override)
                  : Number(item.product.unit_price || 0);
                const discountPercent = Number(
                  (item.product as any).discount_percent || 0,
                );
                const hasDiscount = discountPercent > 0;
                const effectiveUnitPrice = variant?.discounted_price !== undefined
                  ? Number(variant.discounted_price)
                  : (item.product as any).discounted_price !== undefined
                    ? Number((item.product as any).discounted_price)
                    : hasDiscount
                      ? unitPrice * (1 - discountPercent / 100)
                      : unitPrice;
                const itemTotal = effectiveUnitPrice * item.quantity;
                const originalItemTotal = unitPrice * item.quantity;

                const qtyFormatted = locale === "bn" ? item.quantity.toLocaleString("bn-BD") : item.quantity;

                return (
                  <div
                    key={item.id}
                    className="bg-secondary text-foreground rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm border border-foreground/10 group hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                      <Link
                        href={`/products/${item.product.id}`}
                        className="w-20 h-20 bg-primary/5 dark:bg-primary/40 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden group/img hover:opacity-90 transition-opacity"
                      >
                        {hasDiscount && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-accent text-button-fg font-extrabold text-[8px] uppercase tracking-wider shadow-md z-10 flex items-center gap-0.5">
                            <img
                              src="/discount.png"
                              alt="Discount"
                              className="w-2.5 h-2.5 object-contain brightness-0 invert"
                            />
                            -{locale === "bn" ? Math.round(discountPercent).toLocaleString("bn-BD") : Math.round(discountPercent)}%
                          </span>
                        )}
                        <ProductImage
                          title={item.product.title}
                          images={(item.product as any).images}
                        />
                      </Link>
                      <div>
                        <Link
                          href={`/products/${item.product.id}`}
                          className="font-black text-lg uppercase tracking-tight hover:text-accent transition-colors block"
                        >
                          {item.product.title}
                        </Link>

                        {/* Variant Badge / Swatch */}
                        {variant && (
                          <div className="flex items-center gap-2 mt-1 mb-1">
                            {variant.color_code && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs inline-block shrink-0"
                                style={{ backgroundColor: variant.color_code }}
                                title={variant.color_name || variant.name}
                              />
                            )}
                            <span className="text-xs font-bold opacity-80">
                              {variant.name}
                            </span>
                          </div>
                        )}

                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-accent font-extrabold text-sm">
                            {formatCurrency(effectiveUnitPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs line-through opacity-50 font-bold">
                              {formatCurrency(unitPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-8">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-foreground/15 rounded-xl overflow-hidden bg-primary/5 dark:bg-primary/30">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              Math.max(1, item.quantity - 1),
                            )
                          }
                          className="px-3 py-1.5 hover:bg-secondary text-foreground font-black transition-colors cursor-pointer"
                          type="button"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-xs text-foreground">
                          {qtyFormatted}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="px-3 py-1.5 hover:bg-secondary text-foreground font-black transition-colors cursor-pointer"
                          type="button"
                        >
                          +
                        </button>
                      </div>

                      {/* Total Price for Item */}
                      <div className="text-right min-w-[90px]">
                        <div className="font-black text-base text-accent">
                          {formatCurrency(itemTotal)}
                        </div>
                        {hasDiscount && (
                          <div className="text-[10px] line-through opacity-50 font-bold">
                            {formatCurrency(originalItemTotal)}
                          </div>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() =>
                          handleRemoveItem(item.id, item.product.title)
                        }
                        className="opacity-50 hover:text-red-500 transition-colors p-2 cursor-pointer"
                        title={locale === "bn" ? "কার্ট থেকে সরান" : "Remove item"}
                        type="button"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Related Products From Same Collection */}
              {relatedProducts.length > 0 && (
                <div className="mt-12 pt-8 border-t border-foreground/10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-foreground">
                        {t("cart.youMayAlsoLike")}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedProducts.map((p) => {
                      const discountPercent = Number(p.discount_percent || 0);
                      const hasDiscount = discountPercent > 0;
                      const unitPrice = Number(p.unit_price || 0);
                      const effectivePrice =
                        p.discounted_price !== undefined
                          ? Number(p.discounted_price)
                          : hasDiscount
                          ? unitPrice * (1 - discountPercent / 100)
                          : unitPrice;

                      return (
                        <div
                          key={p.id}
                          className="bg-secondary rounded-2xl p-4 border border-foreground/10 flex items-center justify-between gap-4 hover:shadow-md transition-shadow group"
                        >
                          <Link
                            href={`/products/${p.id}`}
                            className="flex items-center gap-3 min-w-0"
                          >
                            <div className="w-16 h-16 bg-primary/5 dark:bg-primary/40 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                              {hasDiscount && (
                                <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-accent text-button-fg font-extrabold text-[7px] uppercase tracking-wider shadow-xs z-10">
                                  -{locale === "bn" ? Math.round(discountPercent).toLocaleString("bn-BD") : Math.round(discountPercent)}%
                                </span>
                              )}
                              <ProductImage
                                title={p.title}
                                images={p.images}
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm line-clamp-1 group-hover:text-accent transition-colors">
                                {p.title}
                              </h4>
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-accent font-extrabold text-sm">
                                  {formatCurrency(effectivePrice)}
                                </span>
                                {hasDiscount && (
                                  <span className="text-[10px] line-through opacity-50 font-bold">
                                    {formatCurrency(unitPrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>

                          <button
                            onClick={async () => {
                              try {
                                await addToCart(p.id, 1);
                                Swal.fire({
                                  position: "top-end",
                                  icon: "success",
                                  title: (t("cart.addedToCart") || `Added "${p.title}" to cart`).replace("{title}", p.title),
                                  showConfirmButton: false,
                                  timer: 1500,
                                  toast: true,
                                });
                              } catch (e) {
                                console.error("Failed to add to cart:", e);
                              }
                            }}
                            className="px-3 py-2 bg-button-bg text-button-fg rounded-xl font-bold text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity shrink-0 flex items-center gap-1 shadow-sm cursor-pointer"
                            type="button"
                          >
                            {t("cart.add")}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Side Card */}
            <div className="bg-secondary text-foreground rounded-[2.5rem] p-8 shadow-md border border-foreground/10 sticky top-28 transition-colors duration-300">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-6 pb-4 border-b border-foreground/10">
                {t("cart.orderSummary")}
              </h2>

              <div className="space-y-3.5 text-sm font-medium mb-6">
                <div className="flex justify-between opacity-80">
                  <span>
                    {productDiscountSavings > 0
                      ? t("cart.originalSubtotal")
                      : t("cart.subtotal")}
                  </span>
                  <span className="font-bold">
                    {formatCurrency(originalSubtotal)}
                  </span>
                </div>

                {productDiscountSavings > 0 && (
                  <>
                    <div className="flex justify-between text-accent font-bold">
                      <span className="flex items-center gap-1">
                        {t("cart.productDiscounts")}
                      </span>
                      <span>-{formatCurrency(productDiscountSavings)}</span>
                    </div>

                    <div className="flex justify-between opacity-80 pt-1 border-t border-foreground/10">
                      <span>{t("cart.discountedSubtotal")}</span>
                      <span className="font-bold">
                        {formatCurrency(discountedSubtotal)}
                      </span>
                    </div>
                  </>
                )}

                {/* Coupon Input Form */}
                <div className="pt-3 border-t border-foreground/10">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                    {t("cart.couponCode")}
                  </label>
                  {!appliedCoupon ? (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        maxLength={20}
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase().slice(0, 20))}
                        placeholder={t("cart.couponPlaceholder")}
                        disabled={couponValidating}
                        className="flex-1 bg-background border border-foreground/15 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase text-foreground outline-none focus:ring-2 focus:ring-accent"
                      />
                      <button
                        type="submit"
                        disabled={couponValidating || !couponInput.trim()}
                        className="px-4 py-2.5 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {couponValidating ? t("cart.checking") : t("cart.apply")}
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-accent/15 border border-accent/30">
                      <div>
                        <span className="text-xs font-black text-accent uppercase tracking-wider block">
                          {appliedCoupon.code} ({locale === "bn" ? appliedCoupon.discountPercent.toLocaleString("bn-BD") : appliedCoupon.discountPercent}%{" "}
                          {t("cart.off")})
                        </span>
                        <span className="text-[10px] text-accent font-bold">
                          {t("cart.saved").replace("{amount}", formatCurrency(couponSavings))}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs font-bold opacity-60 hover:opacity-100 hover:underline px-2 py-1 cursor-pointer"
                      >
                        {t("cart.remove")}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <div className="p-2.5 mt-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                      {couponError}
                    </div>
                  )}
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-accent font-bold">
                    <span>{t("cart.couponDiscount")}</span>
                    <span>-{formatCurrency(couponSavings)}</span>
                  </div>
                )}

                <div className="flex justify-between opacity-80">
                  <span>{t("cart.estimatedTaxes")}</span>
                  <span className="font-bold">{formatCurrency(0)}</span>
                </div>

                <div className="pt-4 border-t border-foreground/10 flex justify-between items-center text-base font-black uppercase tracking-tight">
                  <span>{t("cart.totalAmount")}</span>
                  <span className="text-2xl text-accent font-black">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={checkingOut}
                className="w-full bg-button-bg text-button-fg py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 text-center disabled:opacity-50 cursor-pointer"
              >
                {checkingOut ? t("cart.verifyingCart") : t("cart.proceedToCheckout")}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
