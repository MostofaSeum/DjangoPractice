'use client';

import { useState } from 'react';

export default function ProductInteractive({ productTitle }: { productTitle: string }) {
  const [quantity, setQuantity] = useState(1);

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
    alert(`Added ${quantity} of "${productTitle}" to cart!`);
  };

  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex items-center border border-gray-300 rounded overflow-hidden">
        <button
          onClick={handleDecrement}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
          type="button"
        >
          -
        </button>
        <span className="w-12 text-center font-medium text-gray-800">{quantity}</span>
        <button
          onClick={handleIncrement}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
          type="button"
        >
          +
        </button>
      </div>

      <button
        onClick={handleAddToCart}
        className="px-8 py-3 bg-zinc-800 hover:bg-zinc-950 text-white font-semibold rounded text-sm tracking-wider uppercase transition-colors duration-250 shadow-sm"
      >
        Add to Cart
      </button>
    </div>
  );
}
