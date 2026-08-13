'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import Swal from 'sweetalert2';

export default function ProductInteractive({
  productId,
  productTitle,
  inventory = 1,
}: {
  productId: number;
  productTitle: string;
  inventory?: number;
}) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const isSaved = isInWishlist(productId);
  const isOutOfStock = inventory <= 0;

  const handleIncrement = () => setQuantity((prev) => (prev < inventory ? prev + 1 : prev));
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
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

  const handleToggleWishlist = async () => {
    setWishlistLoading(true);
    await toggleWishlist(productId);
    setWishlistLoading(false);
  };

  return (
    <div className="space-y-4 my-6">
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
            <span className="w-12 text-center font-bold text-foreground">{quantity}</span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= inventory}
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
            className="px-8 py-3.5 bg-button-bg text-button-fg hover:opacity-90 font-bold rounded-xl text-sm tracking-widest uppercase transition-colors shadow-md disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add to Cart"}
          </button>
        )}
      </div>

      {/* Wishlist Button Placed Under Add to Cart */}
      <div>
        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm ${
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
  );
}
