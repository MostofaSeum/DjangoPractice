"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { getApiBaseUrl } from "@/config/siteConfig";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [selectedCard, setSelectedCard] = useState<GiftCardOption | null>(null);
  const [email, setEmail] = useState("");
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
      }).then(() => {
        router.push(`/login?redirect=${encodeURIComponent("/gift-cards")}`);
      });
      return;
    }

    setSelectedCard(card);
    setEmail(user.email || "");
    setErrorMessage("");
    setSuccessResult(null);
    setCopied(false);
  };

  const handleCreateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard || !email) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `JWT ${token}`;
      }

      const res = await fetch(`${apiBaseUrl}/store/gift-cards/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_email: email,
          price: selectedCard.price,
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

        // Trigger SweetAlert2 Success Popup as well
        Swal.fire({
          title: "Gift Card Issued!",
          html: `
            <div style="text-align: left; font-size: 13px; margin-top: 10px;">
              <p style="margin-bottom: 4px;"><strong>Recipient:</strong> ${email}</p>
              <p style="margin-bottom: 12px;"><strong>Value:</strong> $${Number(data.price).toLocaleString()} USD</p>
              <p style="margin-bottom: 6px; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7;">16-Digit Card Code:</p>
              <div style="background: #11100f; color: #f3efe6; padding: 12px; border-radius: 12px; font-family: monospace; font-size: 18px; font-weight: 900; letter-spacing: 2px; text-align: center;">
                ${data.card_code}
              </div>
              <p style="font-size: 11px; opacity: 0.6; margin-top: 10px; text-align: center;">Valid for 365 days (Expires: ${expiryFormatted})</p>
            </div>
          `,
          icon: "success",
          confirmButtonText: "Awesome!",
          confirmButtonColor: "#3a3532",
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
          title: "Error Generating Card",
          text: errText,
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err: any) {
      const msg = "Network error: " + err.message;
      setErrorMessage(msg);
      Swal.fire({
        title: "Network Error",
        text: msg,
        icon: "error",
        confirmButtonColor: "#ef4444",
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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">
              VibeMart Gift Cards
            </h1>
          </div>
          <p className="opacity-70 text-xs font-bold uppercase tracking-wider max-w-md">
            Select a card tier below. Gift cards are valid for 1 full year from issuance and can be redeemed at checkout.
          </p>
        </div>

        {/* 6 Preset Gift Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {GIFT_CARD_OPTIONS.map((card) => (
            <div
              key={card.price}
              className="bg-secondary text-foreground rounded-3xl p-6 shadow-sm border border-foreground/10 hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                {/* Gift Card Visual Artwork using theme CSS variables */}
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
          <div className="bg-secondary text-foreground rounded-3xl p-8 max-w-md w-full border border-foreground/15 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
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
                    ISSUE GIFT CARD
                  </span>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">
                    {selectedCard.title}
                  </h3>
                  <p className="opacity-70 text-xs font-bold uppercase tracking-wider mt-1 text-foreground">
                    Value: ${selectedCard.price.toLocaleString()} USD
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-bold">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80 text-foreground">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address (e.g. friend@example.com)"
                    className="w-full px-4 py-3 rounded-xl border border-foreground/15 bg-background text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
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
                    {loading ? "Generating..." : "Confirm & Issue"}
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
                    Gift Card Issued!
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
