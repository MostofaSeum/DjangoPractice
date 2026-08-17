"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import Swal from "sweetalert2";
import { ProductVariant } from "@/types/product";

interface ProductInteractiveProps {
  productId: number;
  productTitle: string;
  basePrice: number;
  discountPercent?: number;
  inventory?: number;
  variants?: ProductVariant[];
  shortDescription?: string;
}

export default function ProductInteractive({
  productId,
  productTitle,
  basePrice,
  discountPercent = 0,
  inventory = 1,
  variants = [],
  shortDescription = "",
}: ProductInteractiveProps) {
  const activeVariants = variants.filter((v) => v.is_active !== false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    activeVariants.length > 0 ? activeVariants[0] : null
  );

  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

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
          ${currentPrice.toFixed(2)}
        </span>
        {isOnSale && (
          <>
            <span className="text-base line-through opacity-50 font-bold">
              ${originalPrice.toFixed(2)}
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
              Save ${savedAmount.toFixed(2)}
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
                In stock (<span className="text-emerald-500 font-bold">{currentStock}</span> available)
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

      {/* Product Variants Section (Colors / Shades & Sizes) */}
      {activeVariants.length > 0 && (
        <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 space-y-3.5 my-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-foreground">
              Choose Shade / Option:
            </label>
            {selectedVariant && (
              <span className="text-xs font-bold text-accent">
                {selectedVariant.name}
              </span>
            )}
          </div>

          {/* Color Swatches Grid */}
          <div className="flex flex-wrap gap-2.5 items-center">
            {activeVariants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const hasColor = Boolean(v.color_code);

              if (hasColor) {
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVariant(v);
                      setQuantity(1);
                    }}
                    title={`${v.name} - $${Number(v.effective_price || basePrice).toFixed(2)}`}
                    className={`group relative p-0.5 rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-accent ring-offset-2 ring-offset-secondary scale-110"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full border border-black/20 shadow-xs flex items-center justify-center"
                      style={{ backgroundColor: v.color_code! }}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
                      )}
                    </div>
                  </button>
                );
              }

              // Text/Size pill fallback
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

      <hr className="border-foreground/10 my-3" />

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
      </div>
    </div>
  );
}
