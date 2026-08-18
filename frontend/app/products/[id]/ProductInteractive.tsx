"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import Swal from "sweetalert2";
import { ProductVariant } from "@/types/product";
import { getApiBaseUrl } from "@/config/siteConfig";

interface ProductInteractiveProps {
  productId: number;
  productTitle: string;
  basePrice: number;
  discountPercent?: number;
  inventory?: number;
  variants?: ProductVariant[];
  shortDescription?: string;
  collectionId?: number;
}

export default function ProductInteractive({
  productId,
  productTitle,
  basePrice,
  discountPercent = 0,
  inventory = 1,
  variants = [],
  shortDescription = "",
  collectionId,
}: ProductInteractiveProps) {
  const activeVariants = variants.filter((v) => v.is_active !== false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    activeVariants.length > 0 ? activeVariants[0] : null
  );

  const [quantity, setQuantity] = useState(1);
  const { cart, addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Delivery data state
  const [deliverySettings, setDeliverySettings] = useState<{
    inside_dhaka_charge: number;
    outside_dhaka_charge: number;
  }>({
    inside_dhaka_charge: 60,
    outside_dhaka_charge: 130,
  });
  const [matchedDeliveryRule, setMatchedDeliveryRule] = useState<{
    target_type: "product" | "collection";
    rule_type: "free" | "reduced";
    inside_dhaka_charge: number;
    outside_dhaka_charge: number;
    min_quantity: number;
  } | null>(null);

  useEffect(() => {
    const fetchDeliveryInfo = async () => {
      try {
        const [settingsRes, rulesRes] = await Promise.all([
          fetch(`${getApiBaseUrl()}/store/delivery-settings/`, { cache: "no-store" }),
          fetch(`${getApiBaseUrl()}/store/delivery-rules/`, { cache: "no-store" }),
        ]);

        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          setDeliverySettings({
            inside_dhaka_charge: Number(sData.inside_dhaka_charge ?? 60),
            outside_dhaka_charge: Number(sData.outside_dhaka_charge ?? 130),
          });
        }

        if (rulesRes.ok) {
          const rData = await rulesRes.json();
          const rules = Array.isArray(rData) ? rData : rData.results || [];
          // Find matching rule for this product or its collection
          const activeRules = rules.filter((r: any) => r.is_active);
          for (const rule of activeRules) {
            let isMatch = false;
            if (rule.target_type === "product") {
              if (rule.products && Array.isArray(rule.products)) {
                isMatch = rule.products.map(Number).includes(Number(productId));
              } else if (rule.products_details && Array.isArray(rule.products_details)) {
                isMatch = rule.products_details.some((p: any) => Number(p.id) === Number(productId));
              }
            } else if (rule.target_type === "collection" && collectionId) {
              isMatch = Number(rule.collection) === Number(collectionId);
            }

            if (isMatch) {
              setMatchedDeliveryRule({
                target_type: rule.target_type,
                rule_type: rule.rule_type,
                inside_dhaka_charge: Number(rule.inside_dhaka_charge ?? 0),
                outside_dhaka_charge: Number(rule.outside_dhaka_charge ?? 0),
                min_quantity: Number(rule.min_quantity || 1),
              });
              break;
            }
          }
        }
      } catch (err) {
        console.error("Error fetching delivery info for product:", err);
      }
    };
    fetchDeliveryInfo();
  }, [productId, collectionId]);

  const isSaved = isInWishlist(productId);

  // Price calculations
  const originalPrice = selectedVariant
    ? Number(selectedVariant.price_override || basePrice)
    : Number(basePrice);

  const currentPrice = selectedVariant
    ? Number(
        selectedVariant.discounted_price !== undefined
          ? selectedVariant.discounted_price
          : discountPercent > 0
          ? originalPrice * (1 - discountPercent / 100)
          : originalPrice
      )
    : discountPercent > 0
    ? originalPrice * (1 - discountPercent / 100)
    : originalPrice;

  const isOnSale =
    discountPercent > 0 ||
    (selectedVariant?.price_override && Number(selectedVariant.price_override) < originalPrice);

  const savedAmount = Math.max(0, originalPrice - currentPrice);

  // Stock calculations
  const currentStock = selectedVariant
    ? Number(selectedVariant.inventory ?? 0)
    : Number(inventory ?? 0);

  const isOutOfStock = currentStock <= 0;

  const handleIncrement = () =>
    setQuantity((prev) => (prev < currentStock ? prev + 1 : prev));
  const handleDecrement = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    try {
      setLoading(true);
      await addToCart(productId, quantity, selectedVariant ? selectedVariant.id : null);
      
      const variantText = selectedVariant ? ` (${selectedVariant.name})` : "";
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: `Added ${quantity}x "${productTitle}${variantText}" to cart!`,
        showConfirmButton: false,
        timer: 1800,
        toast: true,
      });
    } catch (err: any) {
      console.error("Failed to add to cart:", err);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: err?.message || "Could not add item to cart.",
        showConfirmButton: false,
        timer: 1800,
        toast: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    setWishlistLoading(true);
    await toggleWishlist(productId);
    setWishlistLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Price Section */}
      <div className="flex flex-wrap items-center gap-2.5 mb-2 mt-1">
        <span className="text-2xl sm:text-3xl font-black text-accent">
          ৳{currentPrice.toFixed(2)}
        </span>
        {isOnSale && (
          <>
            <span className="text-base line-through opacity-50 font-bold">
              ৳{originalPrice.toFixed(2)}
            </span>
            {discountPercent > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-accent text-button-fg font-extrabold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                <img
                  src="/discount.png"
                  alt="Discount"
                  className="w-3.5 h-3.5 object-contain brightness-0 invert"
                />
                -{Math.round(discountPercent)}% OFF
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-md bg-accent/15 text-accent font-bold text-xs border border-accent/20">
              Save ৳{savedAmount.toFixed(2)}
            </span>
          </>
        )}
      </div>

      {/* Stock Status Urgency Indicator */}
      <div className="flex items-center gap-2 mb-2">
        {currentStock > 0 ? (
          currentStock <= 10 ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="text-rose-500 text-base leading-none select-none">🔥</span>
              <span>
                Only <span className="text-rose-500 font-black">{currentStock}</span> items left in stock
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground opacity-90">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span>
                In stock
              </span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            <span>Out of stock</span>
          </div>
        )}
      </div>

      {/* Short Description */}
      {shortDescription && (
        <p className="opacity-80 leading-relaxed text-xs mb-3 font-medium whitespace-pre-line break-words [overflow-wrap:anywhere]">
          {shortDescription}
        </p>
      )}

      {/* Product Variants Section (Separate Color Swatches & Size Dropdown) */}
      {activeVariants.length > 0 && (() => {
        // Collect unique color variants (variants with color_code or distinct color_name)
        const colorVariants = activeVariants.filter((v) => Boolean(v.color_code || v.color_name));
        // Collect unique sizes available
        const sizeVariants = activeVariants.filter((v) => Boolean(v.size));
        const uniqueSizes = Array.from(new Set(sizeVariants.map((v) => v.size!).filter(Boolean)));

        // If no explicit color or size attributes were filled, fall back to standard list
        const hasSpecificColors = colorVariants.length > 0;
        const hasSpecificSizes = uniqueSizes.length > 0;

        return (
          <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 space-y-4 my-3">
            {/* 1. COLOR / SHADE SELECTION */}
            {hasSpecificColors && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-foreground">
                    Color / Shade:
                  </label>
                  {selectedVariant && (selectedVariant.color_name || selectedVariant.name) && (
                    <span className="text-xs font-bold text-accent">
                      {selectedVariant.color_name || selectedVariant.name}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5 items-center">
                  {colorVariants.map((v) => {
                    const isSelected =
                      selectedVariant?.id === v.id ||
                      (selectedVariant?.color_name && selectedVariant.color_name === v.color_name) ||
                      (selectedVariant?.color_code && selectedVariant.color_code === v.color_code);

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          // If current size exists, try to find a variant matching both new color and current size
                          if (selectedVariant?.size) {
                            const match = activeVariants.find(
                              (item) =>
                                (item.color_name === v.color_name || item.color_code === v.color_code) &&
                                item.size === selectedVariant.size
                            );
                            if (match) {
                              setSelectedVariant(match);
                              setQuantity(1);
                              return;
                            }
                          }
                          setSelectedVariant(v);
                          setQuantity(1);
                        }}
                        title={`${v.color_name || v.name} - ৳${Number(v.effective_price || basePrice).toFixed(2)}`}
                        className={`group relative p-0.5 rounded-full transition-all cursor-pointer ${
                          isSelected
                            ? "ring-2 ring-accent ring-offset-2 ring-offset-secondary scale-110"
                            : "hover:scale-105 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full border border-black/20 shadow-xs flex items-center justify-center"
                          style={{ backgroundColor: v.color_code || "#C84248" }}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. SIZE DROPDOWN SELECTION */}
            {hasSpecificSizes && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-foreground">
                    Select Size:
                  </label>
                </div>

                <div className="relative">
                  <select
                    value={selectedVariant?.size || ""}
                    onChange={(e) => {
                      const newSize = e.target.value;
                      // Match variant with newSize and current color if possible
                      const match = activeVariants.find((item) => {
                        if (selectedVariant?.color_name && item.color_name === selectedVariant.color_name) {
                          return item.size === newSize;
                        }
                        if (selectedVariant?.color_code && item.color_code === selectedVariant.color_code) {
                          return item.size === newSize;
                        }
                        return item.size === newSize;
                      }) || activeVariants.find((item) => item.size === newSize);

                      if (match) {
                        setSelectedVariant(match);
                        setQuantity(1);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-secondary text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent cursor-pointer transition-all appearance-none"
                  >
                    <option value="" disabled>
                      Choose a size...
                    </option>
                    {uniqueSizes.map((sz) => {
                      const displaySize = /^\d+(\.\d+)?$/.test(sz.trim()) ? `${sz.trim()}ml` : sz;
                      return (
                        <option key={sz} value={sz} className="bg-secondary text-foreground font-semibold">
                          {displaySize}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-foreground opacity-60">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Fallback if variant only has name and no explicit color/size field */}
            {!hasSpecificColors && !hasSpecificSizes && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-foreground">
                    Choose Option:
                  </label>
                  {selectedVariant && (
                    <span className="text-xs font-bold text-accent">
                      {selectedVariant.name}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {activeVariants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariant(v);
                          setQuantity(1);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-accent text-button-fg border-accent shadow-sm scale-105"
                            : "bg-secondary text-foreground border-foreground/15 hover:border-foreground/40"
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <hr className="border-foreground/10 my-3" />

      {/* Delivery Offer Dynamic Progress Banner Above Add to Cart */}
      {matchedDeliveryRule && (() => {
        const requiredQty = matchedDeliveryRule.min_quantity || 1;
        const isFree = matchedDeliveryRule.rule_type === "free";
        const offerName = isFree ? "Free Delivery" : "Discounted Delivery";

        // Count qualifying items in cart
        const inCartQty =
          cart?.items
            ?.filter((item) => {
              if (matchedDeliveryRule.target_type === "product") {
                return Number(item.product.id) === Number(productId);
              }
              const itemColId =
                typeof item.product.collection === "object" &&
                item.product.collection !== null
                  ? Number(item.product.collection.id)
                  : item.product.collection !== undefined &&
                    item.product.collection !== null
                  ? Number(item.product.collection)
                  : null;
              return itemColId !== null && itemColId === Number(collectionId);
            })
            .reduce((sum, item) => sum + item.quantity, 0) || 0;

        const remaining = Math.max(0, requiredQty - inCartQty);
        const isQualified = inCartQty >= requiredQty;

        return (
          <div
            className={`p-3 rounded-2xl border transition-all text-xs font-bold flex items-center justify-between gap-3 ${
              isQualified
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-xs"
                : "bg-accent/10 border-accent/25 text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{isQualified ? "🎉" : "📦"}</span>
              <div>
                {isQualified ? (
                  <p className="font-extrabold uppercase tracking-tight text-emerald-600 dark:text-emerald-400">
                    Congratulations! You got {offerName}!
                  </p>
                ) : inCartQty > 0 ? (
                  <p>
                    Buy <span className="text-accent font-black">{remaining} more</span> to get {offerName}!
                  </p>
                ) : (
                  <p>
                    Buy <span className="text-accent font-black">{requiredQty} items</span> to get {offerName}!
                  </p>
                )}
                {!isQualified && (
                  <p className="text-[10px] opacity-70 font-normal mt-0.5">
                    {inCartQty} of {requiredQty} added to cart
                  </p>
                )}
              </div>
            </div>

            {requiredQty > 1 && (
              <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-primary/10 tracking-wider">
                {isQualified ? "Applied" : `${inCartQty}/${requiredQty}`}
              </span>
            )}
          </div>
        );
      })()}

      {/* Quantity Selector & Add to Cart Client Area */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {!isOutOfStock && (
            <div className="flex items-center border border-foreground/15 rounded-xl overflow-hidden bg-background shadow-sm">
              <button
                onClick={handleDecrement}
                className="px-4 py-2.5 hover:bg-secondary text-foreground font-black transition-colors"
                type="button"
              >
                -
              </button>
              <span className="w-12 text-center font-bold text-foreground">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={quantity >= currentStock}
                className="px-4 py-2.5 hover:bg-secondary text-foreground font-black transition-colors disabled:opacity-40"
                type="button"
              >
                +
              </button>
            </div>
          )}

          {isOutOfStock ? (
            <span className="px-8 py-3.5 bg-red-500/10 text-red-500 font-bold rounded-xl text-xs tracking-widest uppercase border border-red-500/30">
              Out of Stock
            </span>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={loading}
              className="px-8 py-3.5 bg-button-bg text-button-fg hover:opacity-90 font-bold rounded-xl text-sm tracking-widest uppercase transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-button-fg border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add to Cart</span>
              )}
            </button>
          )}
        </div>

        {/* Wishlist Button */}
        <div>
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm cursor-pointer ${
              isSaved
                ? "bg-red-500/15 text-red-500 border-red-500/30 hover:bg-red-500/25"
                : "bg-background text-foreground/80 border-foreground/15 hover:border-accent hover:text-accent"
            }`}
          >
            <img
              src={isSaved ? "/favorite.png" : "/love.png"}
              alt="Wishlist"
              className={`w-4 h-4 object-contain transition-transform duration-200 ${
                isSaved ? "scale-110" : "opacity-80"
              }`}
            />
            <span>
              {wishlistLoading
                ? "Processing..."
                : isSaved
                ? "Saved in Wishlist"
                : "Add to Wishlist"}
            </span>
          </button>
        </div>

        {/* Delivery Charge Info Under Wishlist */}
        {(() => {
          const inCartQty =
            cart?.items
              ?.filter((item) => {
                if (matchedDeliveryRule?.target_type === "product") {
                  return Number(item.product.id) === Number(productId);
                }
                const itemColId =
                  typeof item.product.collection === "object" &&
                  item.product.collection !== null
                    ? Number(item.product.collection.id)
                    : item.product.collection !== undefined &&
                      item.product.collection !== null
                    ? Number(item.product.collection)
                    : null;
                return itemColId !== null && itemColId === Number(collectionId);
              })
              .reduce((sum, item) => sum + item.quantity, 0) || 0;

          const isQualified =
            matchedDeliveryRule &&
            inCartQty >= (matchedDeliveryRule.min_quantity || 1);

          return (
            <div className="pt-2 text-xs font-bold text-foreground/80 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="opacity-70 font-semibold uppercase text-[10px] tracking-wider">
                  Delivery:
                </span>

                {/* Inside Dhaka */}
                <span className="inline-flex items-center gap-1 bg-primary/5 dark:bg-primary/20 px-2 py-1 rounded-lg border border-foreground/10">
                  <span className="text-[11px] text-foreground font-semibold">Inside Dhaka:</span>
                  {matchedDeliveryRule?.rule_type === "free" ? (
                    <span className="flex items-center gap-1 font-bold">
                      <span className="line-through opacity-50 text-[10px]">
                        ৳{deliverySettings.inside_dhaka_charge}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase text-[11px]">
                        {isQualified ? "Free" : "Free (on qualified qty)"}
                      </span>
                    </span>
                  ) : matchedDeliveryRule?.rule_type === "reduced" ? (
                    <span className="flex items-center gap-1 font-bold">
                      <span className="line-through opacity-50 text-[10px]">
                        ৳{deliverySettings.inside_dhaka_charge}
                      </span>
                      <span className="text-accent font-extrabold text-[11px]">
                        ৳{matchedDeliveryRule.inside_dhaka_charge}
                      </span>
                    </span>
                  ) : (
                    <span className="text-accent font-extrabold text-[11px]">
                      ৳{deliverySettings.inside_dhaka_charge}
                    </span>
                  )}
                </span>

                {/* Outside Dhaka */}
                <span className="inline-flex items-center gap-1 bg-primary/5 dark:bg-primary/20 px-2 py-1 rounded-lg border border-foreground/10">
                  <span className="text-[11px] text-foreground font-semibold">Outside Dhaka:</span>
                  {matchedDeliveryRule?.rule_type === "free" ? (
                    <span className="flex items-center gap-1 font-bold">
                      <span className="line-through opacity-50 text-[10px]">
                        ৳{deliverySettings.outside_dhaka_charge}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase text-[11px]">
                        {isQualified ? "Free" : "Free (on qualified qty)"}
                      </span>
                    </span>
                  ) : matchedDeliveryRule?.rule_type === "reduced" ? (
                    <span className="flex items-center gap-1 font-bold">
                      <span className="line-through opacity-50 text-[10px]">
                        ৳{deliverySettings.outside_dhaka_charge}
                      </span>
                      <span className="text-accent font-extrabold text-[11px]">
                        ৳{matchedDeliveryRule.outside_dhaka_charge}
                      </span>
                    </span>
                  ) : (
                    <span className="text-accent font-extrabold text-[11px]">
                      ৳{deliverySettings.outside_dhaka_charge}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
