'use client';

import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';
import Swal from 'sweetalert2';

export default function ProductInteractive({ productId, productTitle }: { productId: number, productTitle: string }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(false);

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      await addToCart(productId, quantity);
      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: `Added ${quantity} of "${productTitle}" to cart!`,
        showConfirmButton: false,
        timer: 1800,
        toast: true,
      });
    } catch (err) {
      console.error("Failed to add to cart:", err);
      Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: 'Could not add item to cart.',
        showConfirmButton: false,
        timer: 1800,
        toast: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex items-center border border-[#3a3532]/20 rounded-xl overflow-hidden bg-white">
        <button
          onClick={handleDecrement}
          className="px-4 py-2 hover:bg-[#f4f1eb] text-[#3a3532] font-black transition-colors"
          type="button"
        >
          -
        </button>
        <span className="w-12 text-center font-bold text-[#3a3532]">{quantity}</span>
        <button
          onClick={handleIncrement}
          className="px-4 py-2 hover:bg-[#f4f1eb] text-[#3a3532] font-black transition-colors"
          type="button"
        >
          +
        </button>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="px-8 py-3 bg-[#3a3532] hover:bg-[#252220] text-[#e6e0d4] font-bold rounded-xl text-sm tracking-widest uppercase transition-colors shadow-md disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add to Cart"}
      </button>
    </div>
  );
}
