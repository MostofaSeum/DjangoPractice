"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import ProductImage from "@/components/ui/ProductImage";
import Swal from "sweetalert2";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useCart();

  const handleRemoveItem = async (itemId: number, itemTitle: string) => {
    const confirm = await Swal.fire({
      title: "Remove from Cart?",
      text: `Are you sure you want to remove "${itemTitle}" from your cart?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#cc5555",
      cancelButtonColor: "#3a3532",
      confirmButtonText: "Yes, Remove",
    });

    if (confirm.isConfirmed) {
      await removeFromCart(itemId);
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Item removed from cart",
        showConfirmButton: false,
        timer: 1500,
        toast: true,
      });
    }
  };

  const isCartEmpty = !cart || cart.items.length === 0;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans transition-colors duration-300">
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
              Your cart is empty
            </h2>
            <p className="text-sm opacity-70 font-medium mb-8 max-w-sm">
              Looks like you haven't added anything to your cart yet. Explore
              our latest drops and elevate your vibe!
            </p>
            <Link
              href="/products"
              className="bg-primary text-secondary px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
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
                  className="bg-secondary text-foreground rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm border border-foreground/10 group hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                    <div className="w-20 h-20 bg-primary/5 dark:bg-primary/40 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                      <ProductImage title={item.product.title} images={(item.product as any).images} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg uppercase tracking-tight">
                        {item.product.title}
                      </h3>
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
                        className="px-3 py-1.5 hover:bg-secondary text-foreground font-black transition-colors"
                        type="button"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-xs text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="px-3 py-1.5 hover:bg-secondary text-foreground font-black transition-colors"
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
                      onClick={() => handleRemoveItem(item.id, item.product.title)}
                      className="opacity-50 hover:text-red-500 transition-colors p-2"
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
            <div className="bg-secondary text-foreground rounded-[2.5rem] p-8 shadow-md border border-foreground/10 sticky top-28 transition-colors duration-300">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-6 pb-4 border-b border-foreground/10">
                Order Summary
              </h2>

              <div className="space-y-4 text-sm font-medium mb-8">
                <div className="flex justify-between opacity-80">
                  <span>Subtotal</span>
                  <span className="font-bold">
                    ${Number(cart.total_price).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between opacity-80">
                  <span>Taxes</span>
                  <span className="font-bold">$0.00</span>
                </div>

                <div className="pt-4 border-t border-foreground/10 flex justify-between items-center text-base font-black uppercase tracking-tight">
                  <span>Total</span>
                  <span className="text-2xl">
                    ${Number(cart.total_price).toFixed(2)}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full bg-primary text-secondary py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 text-center"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
