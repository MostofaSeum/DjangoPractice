"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export default function CheckoutPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { cart, clearCart } = useCart();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"C" | "O" | "N" | "V">("C");
  const [vibeCoin, setVibeCoin] = useState<number>(0);
  const [transactionId, setTransactionId] = useState("");
  const [transactionPhoneNo, setTransactionPhoneNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Prefill phone/customer info on load
  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Please Sign In",
        text: "You must be logged in to proceed to checkout.",
      });
      router.push("/login");
      return;
    }

    const fetchCustomerInfo = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/store/customers/me/`, {
          headers: { Authorization: `JWT ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.phone) setPhone(data.phone);
          if (data.vibe_coin !== undefined) setVibeCoin(data.vibe_coin);
        }
      } catch (err) {
        console.error("Failed to fetch customer data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerInfo();
  }, [token, authLoading, router]);

  const isCartEmpty = !cart || cart.items.length === 0;

  const cartTotal = cart
    ? cart.items.reduce((sum, item) => sum + item.quantity * Number(item.product.unit_price), 0)
    : 0;
  const requiredCoins = Math.ceil(cartTotal);
  const hasSufficientVibeCoin = vibeCoin > 0 && vibeCoin >= requiredCoins;

  // Validation: Online/bKash/Nagad requires TrxID and Sender Phone, VibeCoin requires sufficient balance
  const isOnlinePayment = paymentMethod === "O" || paymentMethod === "N";
  const isVibeCoinPayment = paymentMethod === "V";
  const isOrderValid =
    phone.trim().length > 0 &&
    shippingAddress.trim().length > 0 &&
    (!isOnlinePayment || (transactionId.trim().length > 0 && transactionPhoneNo.trim().length > 0)) &&
    (!isVibeCoinPayment || hasSufficientVibeCoin);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !cart || !isOrderValid) return;

    setSubmitting(true);

    try {
      const payload = {
        cart_id: cart.id,
        shipping_address: shippingAddress,
        phone: phone,
        payment_method: paymentMethod,
        transaction_id: isOnlinePayment ? transactionId : "",
        transaction_phone_no: isOnlinePayment ? transactionPhoneNo : "",
      };

      const res = await fetch(`${API_BASE}/store/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const orderData = await res.json();
        
        // Reset local cart storage
        localStorage.removeItem("cart_id");
        await clearCart();

        await Swal.fire({
          icon: "success",
          title: "Order Placed Successfully!",
          text: `Your Order #${orderData.id} has been received. Thank you for shopping with VibeMart!`,
          confirmButtonColor: "var(--primary)",
        });

        router.push("/profile");
      } else {
        const errData = await res.json();
        Swal.fire({
          icon: "error",
          title: "Order Placement Failed",
          text: JSON.stringify(errData),
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "An Error Occurred",
        text: "Could not submit your order. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 font-bold text-xs uppercase tracking-widest transition-colors duration-300">
        Loading Checkout...
      </div>
    );
  }

  if (isCartEmpty) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 text-center transition-colors duration-300">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-4">
          Your Cart is Empty
        </h2>
        <p className="text-sm font-medium opacity-70 mb-6">
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link
          href="/products"
          className="bg-primary text-secondary px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-colors shadow-md"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-24 transition-colors duration-300">
      {/* Breadcrumb */}
      <div className="bg-primary text-background dark:text-foreground border-b border-white/5 py-4 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs flex items-center space-x-2.5 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="opacity-50">/</span>
          <Link href="/cart" className="hover:underline">
            Cart
          </Link>
          <span className="opacity-50">/</span>
          <span className="opacity-80">Checkout</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-12">
        <h1 className="text-4xl font-black mb-10 uppercase tracking-tighter">
          Checkout & Shipping
        </h1>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Shipping & Payment Info (2 Columns) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact & Address Section */}
            <div className="bg-secondary text-foreground rounded-3xl p-8 border border-foreground/10 shadow-sm space-y-6 transition-colors duration-300">
              <h2 className="text-xl font-black uppercase tracking-tight pb-3 border-b border-foreground/10 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-button-bg text-button-fg font-black flex items-center justify-center text-xs">
                  1
                </span>
                Shipping Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                    Phone Number (11 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    placeholder="e.g. 01700000000"
                    className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                    Shipping Address (Street, House/Flat, City/District) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="e.g. House 12, Road 5, Block B, Dhanmondi, Dhaka"
                    className="px-4 py-3 border border-foreground/15 rounded-2xl bg-background text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-secondary text-foreground rounded-3xl p-8 border border-foreground/10 shadow-sm space-y-6 transition-colors duration-300">
              <h2 className="text-xl font-black uppercase tracking-tight pb-3 border-b border-foreground/10 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-button-bg text-button-fg font-black flex items-center justify-center text-xs">
                  2
                </span>
                Payment Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cash on Delivery Option */}
                <div
                  onClick={() => setPaymentMethod("C")}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    paymentMethod === "C"
                      ? "border-accent bg-accent/10 shadow-sm"
                      : "border-foreground/10 bg-secondary hover:border-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-xs uppercase tracking-tight">
                      Cash on Delivery (COD)
                    </span>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === "C"}
                      onChange={() => setPaymentMethod("C")}
                      className="w-4 h-4 accent-accent"
                    />
                  </div>
                  <p className="text-xs opacity-70 font-medium">
                    Pay in cash when delivered.
                  </p>
                </div>

                {/* bKash Option */}
                <div
                  onClick={() => setPaymentMethod("O")}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    paymentMethod === "O"
                      ? "border-bkash bg-bkash/10 shadow-sm"
                      : "border-foreground/10 bg-secondary hover:border-bkash/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-xs uppercase tracking-tight text-bkash">
                      bKash Payment
                    </span>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === "O"}
                      onChange={() => setPaymentMethod("O")}
                      className="w-4 h-4 accent-bkash"
                    />
                  </div>
                  <p className="text-xs opacity-70 font-medium">
                    Pay via bKash TrxID.
                  </p>
                </div>

                {/* Nagad Option */}
                <div
                  onClick={() => setPaymentMethod("N")}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    paymentMethod === "N"
                      ? "border-nagad bg-nagad/10 shadow-sm"
                      : "border-foreground/10 bg-secondary hover:border-nagad/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-xs uppercase tracking-tight text-nagad">
                      Nagad Payment
                    </span>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === "N"}
                      onChange={() => setPaymentMethod("N")}
                      className="w-4 h-4 accent-nagad"
                    />
                  </div>
                  <p className="text-xs opacity-70 font-medium">
                    Pay via Nagad TrxID.
                  </p>
                </div>

                {/* VibeCoin Option */}
                <div
                  onClick={() => {
                    if (hasSufficientVibeCoin) setPaymentMethod("V");
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    !hasSufficientVibeCoin
                      ? "opacity-50 cursor-not-allowed border-foreground/10 bg-secondary"
                      : paymentMethod === "V"
                      ? "border-accent bg-accent/10 shadow-sm cursor-pointer"
                      : "border-foreground/10 bg-secondary hover:border-accent/50 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-xs uppercase tracking-tight flex items-center gap-1 text-foreground">
                      🪙 VibeCoin
                    </span>
                    <input
                      type="radio"
                      name="payment_method"
                      disabled={!hasSufficientVibeCoin}
                      checked={paymentMethod === "V"}
                      onChange={() => {
                        if (hasSufficientVibeCoin) setPaymentMethod("V");
                      }}
                      className="w-4 h-4 accent-accent"
                    />
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    {!hasSufficientVibeCoin ? (
                      <span className="opacity-70 font-bold block">
                        Blocked (Balance: {vibeCoin} VC, Needed: {requiredCoins} VC)
                      </span>
                    ) : (
                      <span className="opacity-80">
                        Pay with VibeCoins ({vibeCoin} VC available).
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* VibeCoin Selected Instructions */}
              {paymentMethod === "V" && (
                <div className="mt-6 p-6 rounded-2xl bg-secondary border border-foreground/15 space-y-2">
                  <p className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <span>🪙</span> VibeCoin Payment Ready
                  </p>
                  <p className="text-xs font-semibold text-foreground opacity-80">
                    Your order total of <strong>{requiredCoins} VC</strong> will be automatically deducted from your VibeCoin profile balance (Current: <strong>{vibeCoin} VC</strong>) upon order confirmation.
                  </p>
                </div>
              )}

              {/* bKash Extra Fields */}
              {paymentMethod === "O" && (
                <div className="mt-6 p-6 rounded-2xl bg-bkash/10 border border-bkash/30 space-y-4">
                  <div className="text-xs font-bold text-bkash space-y-1">
                    <p className="font-black uppercase tracking-wider">
                      bKash Payment Instructions:
                    </p>
                    <p>1. Go to your bKash Mobile App or Dial *247#</p>
                    <p>2. Select <strong>Send Money</strong> or <strong>Payment</strong> to <strong>01700000000</strong></p>
                    <p>3. Complete payment for <strong>${Number(cart.total_price).toFixed(2)}</strong></p>
                    <p>4. Enter Sender Mobile Number & TrxID below:</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Sender bKash Mobile*
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        value={transactionPhoneNo}
                        onChange={(e) => setTransactionPhoneNo(e.target.value.replace(/\D/g, "").slice(0, 11))}
                        placeholder="e.g. 01712345678"
                        className="px-4 py-3 border border-bkash/40 rounded-xl bg-background text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-bkash shadow-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        bKash Transaction ID (TrxID) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))}
                        placeholder="e.g. 9B7X2K1L8M"
                        className="px-4 py-3 border border-bkash/40 rounded-xl bg-background text-xs font-bold text-foreground uppercase outline-none focus:ring-2 focus:ring-bkash shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Nagad Extra Fields */}
              {paymentMethod === "N" && (
                <div className="mt-6 p-6 rounded-2xl bg-nagad/10 border border-nagad/30 space-y-4">
                  <div className="text-xs font-bold text-nagad space-y-1">
                    <p className="font-black uppercase tracking-wider">
                      Nagad Payment Instructions:
                    </p>
                    <p>1. Go to your Nagad Mobile App or Dial *167#</p>
                    <p>2. Select <strong>Send Money</strong> or <strong>Merchant Pay</strong> to <strong>01700000000</strong></p>
                    <p>3. Complete payment for <strong>${Number(cart.total_price).toFixed(2)}</strong></p>
                    <p>4. Enter Sender Mobile Number & TrxID below:</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Sender Nagad Mobile*
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        value={transactionPhoneNo}
                        onChange={(e) => setTransactionPhoneNo(e.target.value.replace(/\D/g, "").slice(0, 11))}
                        placeholder="e.g. 01712345678"
                        className="px-4 py-3 border border-nagad/40 rounded-xl bg-background text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-nagad shadow-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Nagad Transaction ID (TrxID) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))}
                        placeholder="e.g. 7N3X9L2K8P"
                        className="px-4 py-3 border border-nagad/40 rounded-xl bg-background text-xs font-bold text-foreground uppercase outline-none focus:ring-2 focus:ring-nagad shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Side Card (1 Column) */}
          <div className="bg-secondary text-foreground rounded-3xl p-8 border border-foreground/10 shadow-md sticky top-28 space-y-6 transition-colors duration-300">
            <h2 className="text-2xl font-black uppercase tracking-tight pb-4 border-b border-foreground/10">
              Order Summary
            </h2>

            {/* Items Mini List */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-foreground">{item.product.title}</p>
                    <p className="text-[10px] opacity-60 font-bold">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-black text-accent">
                    ${(item.quantity * Number(item.product.unit_price)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-foreground/10 space-y-3 text-sm">
              <div className="flex justify-between opacity-80 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-foreground">
                  ${Number(cart.total_price).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between opacity-80 font-medium">
                <span>Shipping</span>
                <span className="font-bold text-green-500 uppercase text-xs">Free</span>
              </div>
              <div className="pt-3 border-t border-foreground/10 flex justify-between items-center text-base font-black">
                <span>Total Amount</span>
                <span className="text-2xl text-accent">
                  ${Number(cart.total_price).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isOrderValid}
              className="w-full py-4 bg-button-bg text-button-fg rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? "Processing Order..." : "Confirm & Place Order"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
