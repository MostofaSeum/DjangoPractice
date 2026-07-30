"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { siteConfig } from "@/config/siteConfig";

export default function CartPage() {
  const { cart, itemCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const apiBaseUrl = siteConfig.apiBaseUrl.replace(/\/+$/, "");

  const getImageUrl = (item: any) => {
    if (item.product?.images && item.product.images.length > 0) {
      let url = item.product.images[0].image;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return `${apiBaseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
      }
      return url;
    }
    return null;
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-[#3a3532]/5 rounded-full flex items-center justify-center mb-6">
          <Image src="/shopping-cart-white-icon.webp" width={36} height={36} alt="Empty Cart" className="invert opacity-40" />
        </div>
        <h1 className="text-3xl font-black uppercase text-[#3a3532] tracking-tight">Your Cart is Empty</h1>
        <p className="text-sm font-semibold text-[#3a3532]/60 mt-2 max-w-sm">
          Explore our collection and add your favorite items to your cart.
        </p>
        <Link
          href="/products"
          className="mt-8 px-8 py-4 bg-[#3a3532] text-[#e6e0d4] font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-[#252220] transition-colors shadow-lg"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase text-[#3a3532] tracking-tight">Shopping Cart</h1>
          <p className="text-xs font-bold uppercase text-[#3a3532]/50 tracking-wider mt-1">{itemCount} items in cart</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold uppercase tracking-wider text-red-600 hover:underline"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const imgUrl = getImageUrl(item);
            return (
              <div
                key={item.id}
                className="bg-[#f4f1eb] rounded-2xl p-5 border border-[#3a3532]/10 flex gap-5 items-center shadow-sm"
              >
                <div className="w-20 h-20 bg-white rounded-xl overflow-hidden relative flex-shrink-0">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt={item.product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-[#3a3532]/20">
                      NO IMAGE
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-[#3a3532] truncate">{item.product.title}</h3>
                  <p className="text-xs font-bold text-[#8b7a66] mt-0.5">${Number(item.product.unit_price).toFixed(2)} each</p>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-[#3a3532]/20 rounded-lg bg-white overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="px-2.5 py-1 text-xs font-bold text-[#3a3532] hover:bg-[#e6e0d4] disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-bold text-[#3a3532]">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1 text-xs font-bold text-[#3a3532] hover:bg-[#e6e0d4]"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-[#3a3532]">${Number(item.total_price).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#3a3532] text-[#e6e0d4] rounded-3xl p-8 h-fit shadow-xl space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight">Order Summary</h2>

          <div className="space-y-3 text-sm font-semibold border-b border-white/10 pb-6">
            <div className="flex justify-between">
              <span className="opacity-70">Subtotal</span>
              <span className="font-bold">${Number(cart.total_price).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Shipping</span>
              <span className="text-xs uppercase font-bold text-[#8b7a66]">Calculated at checkout</span>
            </div>
          </div>

          <div className="flex justify-between text-lg font-black uppercase tracking-tight">
            <span>Total</span>
            <span className="text-xl">${Number(cart.total_price).toFixed(2)}</span>
          </div>

          <Link
            href="/checkout"
            className="block w-full text-center py-4 bg-[#8b7a66] hover:bg-[#a39079] text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
