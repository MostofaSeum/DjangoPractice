"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/app/context/CartContext";
import Swal from "sweetalert2";

const CartIcon = () => (
  <Image src="/shopping-cart-white-icon.webp" width={20} height={20} alt="Cart" />
);

interface AddToCartButtonProps {
  productId: number;
  productTitle: string;
  className?: string;
}

export default function AddToCartButton({
  productId,
  productTitle,
  className,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setLoading(true);
      await addToCart(productId, 1);
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: `Added "${productTitle}" to cart!`,
        showConfirmButton: false,
        timer: 1800,
        toast: true,
      });
    } catch (err) {
      console.error("Failed to add to cart:", err);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Could not add item to cart.",
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
        "w-full py-3 border-2 border-[#3a3532] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#3a3532] hover:text-[#e6e0d4] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      }
    >
      <CartIcon />
      {loading ? "Adding..." : "Add to Cart"}
    </button>
  );
}
