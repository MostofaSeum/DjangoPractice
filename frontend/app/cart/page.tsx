"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/app/context/CartContext";
import ProductImage from "@/app/components/ProductImage";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useCart();

  const isCartEmpty = !cart || cart.items.length === 0;

  return (
    <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] font-sans">
      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-12 py-16">
        {isCartEmpty ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-sm border border-[#3a3532]/5 max-w-2xl mx-auto flex flex-col items-center">
            <div className="w-20 h-20 bg-[#f4f1eb] rounded-full flex items-center justify-center mb-6">
              <Image
                src="/HomePage/shopping-cart.png"
                width={32}
                height={32}
                alt="Empty Cart"
              />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-3">
              Your cart is empty
            </h2>
            <p className="text-sm text-[#3a3532]/60 font-medium mb-8 max-w-sm">
              Looks like you haven't added anything to your cart yet. Explore
              our latest drops and elevate your vibe!
            </p>
            <Link
              href="/products"
              className="bg-[#3a3532] text-[#e6e0d4] px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#524b47] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm border border-[#3a3532]/5 group hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                    <div className="w-20 h-20 bg-[#f4f1eb] rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                      <ProductImage title={item.product.title} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg uppercase tracking-tight">
                        {item.product.title}
                      </h3>
                      <p className="text-xs font-bold text-[#8b7a66] mt-1">
                        ${Number(item.product.unit_price).toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-8">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-[#3a3532]/20 rounded-xl overflow-hidden bg-[#f4f1eb]">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        className="px-3 py-1.5 hover:bg-[#e6e0d4] text-[#3a3532] font-black transition-colors"
                        type="button"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-xs text-[#3a3532]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="px-3 py-1.5 hover:bg-[#e6e0d4] text-[#3a3532] font-black transition-colors"
                        type="button"
                      >
                        +
                      </button>
                    </div>

                    {/* Total Price for Item */}
                    <div className="text-right min-w-[90px]">
                      <div className="font-black text-base">
                        ${Number(item.total_price).toFixed(2)}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-[#3a3532]/40 hover:text-[#cc5555] transition-colors p-2"
                      title="Remove item"
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
              ))}
            </div>

            {/* Order Summary Side Card */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-md border border-[#3a3532]/5 sticky top-28">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-6 pb-4 border-b border-[#3a3532]/10">
                Order Summary
              </h2>

              <div className="space-y-4 text-sm font-medium mb-8">
                <div className="flex justify-between text-[#3a3532]/70">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#3a3532]">
                    ${Number(cart.total_price).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[#3a3532]/70">
                  <span>Taxes</span>
                  <span className="font-bold text-[#3a3532]">$0.00</span>
                </div>

                <div className="pt-4 border-t border-[#3a3532]/10 flex justify-between items-center text-base font-black uppercase tracking-tight">
                  <span>Total</span>
                  <span className="text-2xl text-[#3a3532]">
                    ${Number(cart.total_price).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => alert("Checkout integration coming soon!")}
                className="w-full bg-[#3a3532] text-[#e6e0d4] py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#524b47] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
