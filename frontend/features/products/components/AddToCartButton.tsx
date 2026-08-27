"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/store/LanguageContext";
import Swal from "sweetalert2";

const CartIcon = () => (
  <Image src="/shopping-cart-white-icon.webp" width={20} height={20} alt="Cart" />
);

interface AddToCartButtonProps {
  productId: number;
  productTitle: string;
  inventory?: number;
  variants?: Array<{ id: number; name: string; is_active?: boolean; inventory?: number }>;
  variantId?: number | null;
  className?: string;
}

export default function AddToCartButton({
  productId,
  productTitle,
  inventory = 1,
  variants,
  variantId,
  className,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(false);

  const activeVariant = variants?.find((v) => v.is_active !== false);
  const targetVariantId = variantId !== undefined ? variantId : activeVariant ? activeVariant.id : null;

  const isOutOfStock = inventory <= 0;

  if (isOutOfStock) {
    return (
      <button
        disabled
        className={
          className ||
          "w-full py-3 bg-red-100 text-red-700 font-bold text-xs uppercase tracking-widest rounded-xl border border-red-300 cursor-not-allowed opacity-80 flex items-center justify-center gap-2"
        }
      >
        {t("trending.outOfStock")}
      </button>
    );
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inventory <= 0) return;

    try {
      setLoading(true);
      await addToCart(productId, 1, targetVariantId);
      
      const variantObj = variants?.find((v) => v.id === targetVariantId);
      const displayTitle = variantObj?.name ? `${productTitle} (${variantObj.name})` : productTitle;

      const title =
        locale === "bn"
          ? t("swal.addedToCart").replace("{title}", displayTitle)
          : `Added "${displayTitle}" to cart!`;
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: title || `Added "${displayTitle}" to cart!`,
        showConfirmButton: false,
        timer: 1800,
        toast: true,
      });
    } catch (err) {
      console.error("Failed to add to cart:", err);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: t("swal.couldNotAddToCart") || "Could not add item to cart.",
        showConfirmButton: false,
        timer: 1800,
        toast: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      className={
        className ||
        "w-full py-3 border border-current rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-button-bg hover:text-button-fg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      }
    >
      <CartIcon />
      {loading ? (locale === "bn" ? "যোগ হচ্ছে..." : "Adding...") : t("trending.addToCart")}
    </button>
  );
}
