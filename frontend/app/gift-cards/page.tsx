"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { getApiBaseUrl } from "@/config/siteConfig";
import { useAuth } from "@/hooks/useAuth";
import BkashPaymentUI from "@/components/BkashPaymentUI";

interface GiftCardOption {
  price: number;
  title: string;
  badge: string;
}

const GIFT_CARD_OPTIONS: GiftCardOption[] = [
  { price: 500, title: "$500 Gift Card", badge: "BRONZE" },
  { price: 1000, title: "$1,000 Gift Card", badge: "SILVER" },
  { price: 1500, title: "$1,500 Gift Card", badge: "GOLD" },
  { price: 2000, title: "$2,000 Gift Card", badge: "PLATINUM" },
  { price: 2500, title: "$2,500 Gift Card", badge: "DIAMOND" },
  { price: 3000, title: "$3,000 Gift Card", badge: "VIP ELITE" },
];

export default function GiftCardsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [selectedCard, setSelectedCard] = useState<GiftCardOption | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"B" | "N">("B");
  const [transactionId, setTransactionId] = useState("");
  const [transactionPhoneNo, setTransactionPhoneNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<{ card_code: string; price: number; expiry_date: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const handleOpenModal = (card: GiftCardOption) => {
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Please Sign In",
        text: "You must be logged in to purchase a gift card.",
        confirmButtonColor: "var(--button-bg)",
      }).then(() => {
        router.push(`/login?redirect=${encodeURIComponent("/gift-cards")}`);
      });
      return;
    }

    setSelectedCard(card);
    setEmail("");
    setPhone("");
    setTransactionId("");
    setTransactionPhoneNo("");
    setPaymentMethod("B");
    setErrorMessage("");
    setSuccessResult(null);
    setCopied(false);
  };

  const handleRedeemGiftCard = async () => {
    if (!user || !token) {
      Swal.fire({
        icon: "warning",
        title: "Please Sign In",
        text: "You must be logged in to redeem a gift card.",
        confirmButtonColor: "var(--button-bg)",
      }).then(() => {
        router.push(`/login?redirect=${encodeURIComponent("/gift-cards")}`);
      });
      return;
    }

    const { value: cardCode } = await Swal.fire({
      title: "Redeem Gift Card",
      text: "Enter your 16-digit Gift Card code below:",
      input: "text",
      inputPlaceholder: "e.g. A1B2C3D4E5F67890",
      showCancelButton: true,
      confirmButtonText: "Verify & Redeem",
      confirmButtonColor: "var(--button-bg)",
      inputAttributes: {
        maxlength: "16",
        style: "text-transform: uppercase; font-family: var(--font-mono); letter-spacing: 2px; text-align: center;",
      },
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return "Please enter a valid 16-digit Gift Card code.";
        }
      },
    });

    if (cardCode) {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const res = await fetch(`${apiBaseUrl}/store/gift-cards/redeem/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${token}`,
          },
          body: JSON.stringify({ card_code: cardCode.trim().toUpperCase() }),
        });

        const data = await res.json();

        if (res.ok) {
          Swal.fire({
            title: "🎉 Congratulations!",
            html: `
              <div style="text-align: center; margin-top: 10px;">
                <p style="font-size: 14px; font-weight: bold; color: var(--foreground); margin-bottom: 8px;">Gift Card Successfully Redeemed!</p>
                <div style="background: var(--secondary); color: var(--foreground); padding: 14px; border-radius: 14px; font-family: var(--font-sans); font-size: 24px; font-weight: 900; letter-spacing: 1px; margin: 15px 0; border: 1px solid var(--foreground)/20;">
                  +${data.vibe_coins_added} VibeCoins <img src="/VibeCoin/VibeCoin.png" alt="VibeCoin" style="width: 26px; height: 26px; display: inline-block; vertical-align: middle; margin-left: 6px;" />
                </div>
                <p style="font-size: 13px; font-weight: bold; color: var(--foreground); margin-bottom: 4px;">New VibeCoin Balance: <strong>${data.new_vibe_coin_balance} VC</strong></p>
                <p style="font-size: 11px; opacity: 0.7; margin-top: 6px;">Code: <strong>${data.card_code}</strong></p>
              </div>
            `,
            icon: "success",
            confirmButtonText: "Awesome!",
            confirmButtonColor: "var(--button-bg)",
            customClass: {
              popup: "rounded-3xl p-6",
              confirmButton: "rounded-xl font-bold uppercase tracking-wider px-6 py-2.5 text-xs",
            },
          });
        } else {
          Swal.fire({
            title: "Redemption Failed",
            text: data.error || "Invalid Gift Card code.",
            icon: "error",
            confirmButtonColor: "var(--button-bg)",
          });
        }
      } catch (err: any) {
        Swal.fire({
          title: "Network Error",
          text: err.message,
          icon: "error",
          confirmButtonColor: "var(--button-bg)",
        });
      }
    }
  };

  const handleCreateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard || !email) return;

    if (!transactionId.trim() || !transactionPhoneNo.trim()) {
      setErrorMessage(`Please enter both Sender Phone Number and ${paymentMethod === 'B' ? 'bKash' : 'Nagad'} Transaction ID (TrxID).`);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const apiBaseUrl = getApiBaseUrl();
      const authToken =
        token ||
        (typeof window !== "undefined"
          ? localStorage.getItem("access_token") || localStorage.getItem("jwt") || localStorage.getItem("token")
          : null);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers["Authorization"] = `JWT ${authToken}`;
      }

      const res = await fetch(`${apiBaseUrl}/store/gift-cards/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_email: email,
          price: selectedCard.price,
          phone: phone,
          transaction_id: transactionId,
          transaction_phone_no: transactionPhoneNo,
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const expiryFormatted = new Date(data.expiry_date).toLocaleDateString();
        setSuccessResult({
          card_code: data.card_code,
          price: Number(data.price),
          expiry_date: expiryFormatted,
        });

        // SweetAlert2 Success Notification strictly using theme colors
        Swal.fire({
          title: "Gift Card Purchased & Order Placed!",
          html: `
            <div style="text-align: left; font-size: 13px; margin-top: 10px;">
              <p style="margin-bottom: 4px;"><strong>Recipient:</strong> ${email}</p>
              <p style="margin-bottom: 4px;"><strong>Payment Method:</strong> ${paymentMethod === 'B' ? 'bKash' : 'Nagad'}</p>
              ${transactionPhoneNo ? `<p style="margin-bottom: 4px;"><strong>Sender Mobile:</strong> ${transactionPhoneNo}</p>` : ''}
              ${transactionId ? `<p style="margin-bottom: 8px;"><strong>TrxID:</strong> ${transactionId}</p>` : ''}
              <p style="margin-bottom: 12px;"><strong>Value:</strong> $${Number(data.price).toLocaleString()} USD</p>
              <p style="margin-bottom: 6px; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7;">16-Digit Card Code:</p>
              <div style="background: var(--primary); color: var(--logo-color); padding: 12px; border-radius: 12px; font-family: var(--font-mono); font-size: 18px; font-weight: 900; letter-spacing: 2px; text-align: center;">
                ${data.card_code}
              </div>
              <p style="font-size: 11px; opacity: 0.6; margin-top: 10px; text-align: center;">Order logged under your account. Code valid for 365 days.</p>
            </div>
          `,
          icon: "success",
          confirmButtonText: "Awesome!",
          confirmButtonColor: "var(--button-bg)",
          customClass: {
            popup: "rounded-3xl p-6",
            confirmButton: "rounded-xl font-bold uppercase tracking-wider px-6 py-2.5 text-xs",
          },
        });
      } else {
        const errText =
          typeof data === "object"
            ? Object.values(data).flat().join(" ")
            : "Failed to generate Gift Card. Please make sure you are signed in.";
        setErrorMessage(errText);

        Swal.fire({
          title: "Order Failed",
          text: errText,
          icon: "error",
          confirmButtonColor: "var(--button-bg)",
        });
      }
    } catch (err: any) {
      const msg = "Network error: " + err.message;
      setErrorMessage(msg);
      Swal.fire({
        title: "Network Error",
        text: msg,
        icon: "error",
        confirmButtonColor: "var(--button-bg)",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Card code copied to clipboard!",
      showConfirmButton: false,
      timer: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-24 transition-colors duration-300">
      {/* Breadcrumbs */}
      <div className="bg-primary text-logo border-b border-white/5 py-4 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs flex items-center space-x-2.5 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="opacity-50">/</span>
          <span className="opacity-80">Gift Cards</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-12">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">
              VibeMart Gift Cards
            </h1>
          </div>
          <button
            onClick={handleRedeemGiftCard}
            className="py-3 px-6 bg-button-bg text-button-fg rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-md active:scale-95 border border-foreground/20"
          >
            Redeem Gift Card
          </button>
        </div>

        {/* 6 Preset Gift Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {GIFT_CARD_OPTIONS.map((card) => (
            <div
              key={card.price}
              className="bg-secondary text-foreground rounded-3xl p-6 shadow-sm border border-foreground/10 hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                {/* Gift Card Visual Artwork strictly using theme tokens */}
                <div className="aspect-[1.6/1] bg-gradient-to-br from-accent/20 via-primary/10 to-accent/30 rounded-2xl mb-6 flex flex-col justify-between p-6 relative overflow-hidden border border-foreground/15 shadow-inner group-hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex justify-between items-start z-10">
                    <span className="font-black text-xs tracking-widest uppercase opacity-90 text-foreground">
                      VIBEMART
                    </span>
                    <span className="bg-accent text-button-fg px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-foreground/10 shadow-sm">
                      {card.badge}
                    </span>
                  </div>

                  <div className="z-10 my-auto">
                    <p className="text-3xl font-black tracking-tight drop-shadow-sm text-foreground">
                      ${card.price.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-70 mt-1 text-foreground">
                      PREPAID GIFT VOUCHER
                    </p>
                  </div>

                  <div className="flex justify-between items-end z-10 text-[9px] font-mono opacity-60 uppercase tracking-widest text-foreground">
                    <span>•••• •••• •••• ••••</span>
                    <span>1 YEAR VALIDITY</span>
                  </div>
                </div>

                {/* Card Title & Info */}
                <h2 className="font-bold text-xl text-foreground mb-1 group-hover:text-accent transition-colors">
                  {card.title}
                </h2>
                <p className="opacity-70 text-xs mb-6 font-medium leading-relaxed">
                  Includes 16-digit instant redemption code valid for 365 days across all VibeMart categories.
                </p>
              </div>

              {/* Action Area */}
              <div className="pt-4 border-t border-foreground/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 block">
                    Price Value
                  </span>
                  <span className="text-xl font-black text-accent">
                    ${card.price.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenModal(card)}
                  className="py-3 px-6 bg-button-bg text-button-fg rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-md active:scale-95"
                >
                  Purchase Card
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal Dialog for Purchasing / Issuing Card */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-secondary text-foreground rounded-3xl p-8 max-w-lg w-full border border-foreground/15 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-6 right-6 text-foreground/50 hover:text-foreground text-xl font-bold p-1"
            >
              ✕
            </button>

            {!successResult ? (
              <form onSubmit={handleCreateGiftCard} className="space-y-6">
                <div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-accent block mb-1">
                    ORDER GIFT CARD & CHECKOUT
                  </span>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">
                    {selectedCard.title}
                  </h3>
                  <p className="opacity-70 text-xs font-bold uppercase tracking-wider mt-1 text-foreground">
                    Total Amount: ${selectedCard.price.toLocaleString()} USD
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl text-accent text-xs font-bold">
                    {errorMessage}
                  </div>
                )}

                {/* Recipient & Phone inputs */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80 text-foreground">
                        Recipient Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. recipient@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-foreground/20 bg-background text-xs font-bold text-foreground placeholder:text-foreground/40 outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80 text-foreground">
                        Recipient / Contact Phone
                      </label>
                      <input
                        type="tel"
                        maxLength={11}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                        placeholder="e.g. 017XXXXXXXX"
                        className="w-full px-4 py-3 rounded-xl border border-foreground/20 bg-background text-xs font-bold text-foreground placeholder:text-foreground/40 outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  </div>

                  {user?.email && email.trim().toLowerCase() === user.email.trim().toLowerCase() && (
                    <div className="w-full p-4 rounded-2xl bg-accent/10 border border-accent/30 text-foreground text-xs font-bold leading-relaxed space-y-1 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm text-center flex flex-col items-center justify-center">
                      <p className="font-black text-accent uppercase tracking-wider text-[11px] flex items-center justify-center gap-1.5">
                        <span>💌</span> Special Note
                      </p>
                      <p className="opacity-90 max-w-sm">
                        Hope that your favourite person gifts you this card soon! Now go and buy something for yourself.
                      </p>
                      <p className="text-accent font-extrabold pt-0.5">
                        Have a Good Day ✨
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80 text-foreground">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("B")}
                      className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === "B"
                          ? "border-bkash bg-bkash/10 text-bkash font-black shadow-sm"
                          : "border-foreground/15 bg-background text-foreground/70"
                      }`}
                    >
                      bKash Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("N")}
                      className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === "N"
                          ? "border-nagad bg-nagad/10 text-nagad font-black shadow-sm"
                          : "border-foreground/15 bg-background text-foreground/70"
                      }`}
                    >
                      Nagad Payment
                    </button>
                  </div>
                </div>

                {/* bKash Payment Instructions*/}
                {paymentMethod === "B" && (
                  <BkashPaymentUI
                    amount={selectedCard ? selectedCard.price : 0}
                    currency="BDT"
                    transactionPhoneNo={transactionPhoneNo}
                    setTransactionPhoneNo={setTransactionPhoneNo}
                    transactionId={transactionId}
                    setTransactionId={setTransactionId}
                  />
                )}

                {/* Nagad Payment Instructions & Sender Phone + TrxID Fields */}
                {paymentMethod === "N" && (
                  <div className="p-5 rounded-2xl bg-nagad/10 border border-nagad/30 space-y-3">
                    <div className="text-[11px] font-bold text-foreground space-y-1">
                      <p className="font-black text-nagad uppercase tracking-wider">
                        Nagad Payment Instructions:
                      </p>
                      <p>1. Open your Nagad Mobile App or Dial *167#</p>
                      <p>2. Select <strong>Send Money</strong> or <strong>Merchant Pay</strong> to <strong>01700000000</strong></p>
                      <p>3. Pay total amount: <strong>${selectedCard.price.toLocaleString()} USD</strong></p>
                      <p>4. Enter Sender Mobile Number & TrxID below:</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-1">
                          Sender Nagad Mobile *
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={11}
                          value={transactionPhoneNo}
                          onChange={(e) => setTransactionPhoneNo(e.target.value.replace(/\D/g, "").slice(0, 11))}
                          placeholder="e.g. 01712345678"
                          className="w-full px-4 py-3 border border-nagad/40 rounded-xl bg-background text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-nagad"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-1">
                          Transaction ID (TrxID) *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={11}
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))}
                          placeholder="e.g. 7N3X9L2K8P"
                          className="w-full px-4 py-3 border border-nagad/40 rounded-xl bg-background text-xs font-bold text-foreground uppercase outline-none focus:ring-2 focus:ring-nagad"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-foreground/10">
                  <button
                    type="button"
                    onClick={() => setSelectedCard(null)}
                    className="py-3 px-5 rounded-xl text-xs font-bold uppercase tracking-wider border border-foreground/20 hover:bg-foreground/5 transition-colors text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-3 px-6 bg-button-bg text-button-fg rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? "Processing Order..." : "Place Order & Get Code"}
                  </button>
                </div>
              </form>
            ) : (
              /* Success View showing generated 16-character code */
              <div className="space-y-6 text-center py-2">
                <div className="w-16 h-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>

                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">
                    Order Successful!
                  </h3>
                  <p className="opacity-70 text-xs font-bold uppercase tracking-wider mt-1 text-foreground">
                    ${successResult.price.toLocaleString()} USD issued to {email}
                  </p>
                </div>

                <div className="bg-background p-4 rounded-2xl border border-foreground/15 text-left space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 block text-foreground">
                    Your 16-Digit Card Code:
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-lg font-black tracking-wider text-accent">
                      {successResult.card_code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(successResult.card_code)}
                      className="px-3 py-1.5 bg-button-bg text-button-fg text-[10px] font-black uppercase tracking-wider rounded-lg hover:opacity-80 transition-opacity"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-[10px] opacity-60 font-medium pt-1 text-foreground">
                    Expires on: {successResult.expiry_date}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedCard(null)}
                  className="w-full py-3 bg-button-bg text-button-fg rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
