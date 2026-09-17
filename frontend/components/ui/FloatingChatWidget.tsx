"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/store/LanguageContext";
import { siteConfig } from "@/config/siteConfig";

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

export default function FloatingChatWidget() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const isBn = locale === "bn";

  const [isOpen, setIsOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [storeName, setStoreName] = useState("VibeMart");
  const widgetRef = useRef<HTMLDivElement>(null);

  // Fetch contact data from site settings
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/store/site-settings/`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number.trim());
            if (data.facebook_url) setFacebookUrl(data.facebook_url.trim());
            if (data.site_title) setStoreName(data.site_title.trim());
          }
        }
      } catch (err) {
        console.error("Failed to load chat settings:", err);
      }
    };
    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close popup when clicking outside (support both click and touchstart)
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Don't render on admin dashboard
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Sanitize WhatsApp number (remove +, spaces, dashes)
  const cleanPhone = (whatsappNumber || "01722785605").replace(/[^0-9]/g, "");
  // Ensure country code 880 if BD number starts with 01
  const formattedWhatsApp = cleanPhone.startsWith("01") ? `88${cleanPhone}` : cleanPhone;

  // Build smart context message
  const getContextMessage = () => {
    let defaultMsg = isBn
      ? `হ্যালো ${storeName}, আমি আপনাদের শপ ও প্রোডাক্ট সম্পর্কে জানতে আগ্রহী!`
      : `Hi ${storeName}, I have an inquiry about your products!`;

    if (typeof window !== "undefined") {
      const siteBase = process.env.NEXT_PUBLIC_SITE_URL
        ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")
        : window.location.origin;

      const productUrl = `${siteBase}${pathname}`;

      const cleanTitle = (document.title || "")
        .split("|")[0]
        .replace(new RegExp(storeName, "gi"), "")
        .trim() || document.title || "Product";

      if (pathname.includes("/products/")) {
        defaultMsg = isBn
          ? `হ্যালো ${storeName}! আমি এই পণ্যটি সম্পর্কে জানতে চাই:\n${cleanTitle}\nলিঙ্ক: ${productUrl}`
          : `Hello ${storeName}! I am inquiring about this item:\n${cleanTitle}\nLink: ${productUrl}`;
      }
    }

    return defaultMsg;
  };

  // Extract Facebook page username or fallback
  const getMessengerUrl = () => {
    // If empty, fallback to brainicontech
    if (!facebookUrl) {
      return "https://m.me/brainicontech";
    }
    // If it's already an m.me link
    if (facebookUrl.includes("m.me/")) {
      return facebookUrl.split("?")[0].replace(/\/+$/, "");
    }
    // Extract page name or ID from facebook.com URL
    const cleaned = facebookUrl
      .replace(/^https?:\/\/(www\.)?facebook\.com\//i, "")
      .replace(/\/+$/, "")
      .split("?")[0]
      .split("/")[0];

    // If page is just "facebook.com" or empty, fallback
    return cleaned && cleaned.toLowerCase() !== "facebook" && cleaned.toLowerCase() !== "www"
      ? `https://m.me/${cleaned}`
      : "https://m.me/brainicontech";
  };

  // Build smart context message for WhatsApp
  const getWhatsAppUrl = () => {
    const msg = encodeURIComponent(getContextMessage());
    return `https://wa.me/${formattedWhatsApp}?text=${msg}`;
  };

  return (
    <div
      ref={widgetRef}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end print:hidden select-none pointer-events-auto"
      style={{
        zIndex: 9999,
        bottom: "max(1rem, calc(1rem + env(safe-area-inset-bottom, 0px)))",
        right: "max(1rem, calc(1rem + env(safe-area-inset-right, 0px)))",
      }}
    >
      {/* Expanded Chat Options Popup */}
      {isOpen && (
        <div className="mb-2 sm:mb-3 w-[calc(100vw-2rem)] sm:w-80 max-w-[320px] rounded-2xl bg-secondary/95 backdrop-blur-md border border-foreground/15 shadow-2xl p-3 sm:p-4 text-foreground animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-foreground/10">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-visible opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-visible"></span>
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-foreground truncate">
                  {isBn ? "সরাসরি যোগাযোগ করুন" : "Live Chat Support"}
                </h4>
                <p className="text-[10px] sm:text-[11px] opacity-70 truncate">
                  {isBn ? "আমরা সাধারণত সাথে সাথেই উত্তর দেই" : "We usually reply within minutes"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-foreground/10 text-foreground transition-colors flex items-center justify-center flex-shrink-0 ml-1 cursor-pointer"
              aria-label="Close Chat"
            >
              <Image
                src="/icons/close-x.png"
                alt="Close"
                width={14}
                height={14}
                priority
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain dark:invert"
              />
            </button>
          </div>

          {/* Chat Options */}
          <div className="mt-2.5 sm:mt-3 space-y-2 sm:space-y-2.5">
            {/* WhatsApp Option */}
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-background hover:bg-accent/10 border border-foreground/10 hover:border-accent/40 text-foreground transition-all duration-200 group active:scale-[0.98]"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-secondary border border-foreground/15 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform overflow-hidden p-2">
                <Image
                  src="/whatsapp.png"
                  alt="WhatsApp"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain dark:invert transition-all"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs sm:text-sm font-bold text-foreground truncate">WhatsApp</span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider text-visible bg-visible/10 px-1.5 py-0.5 rounded flex-shrink-0">
                    {isBn ? "অনলাইন" : "Online"}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] opacity-75 truncate">
                  {isBn ? "হোয়াটসঅ্যাপে দ্রুত মেসেজ দিন" : "Chat with us on WhatsApp"}
                </p>
              </div>
            </a>

            {/* Messenger Option */}
            <a
              href={getMessengerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-background hover:bg-accent/10 border border-foreground/10 hover:border-accent/40 text-foreground transition-all duration-200 group active:scale-[0.98]"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-secondary border border-foreground/15 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform overflow-hidden p-2">
                <Image
                  src="/messenger.png"
                  alt="Messenger"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain dark:invert transition-all"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs sm:text-sm font-bold text-foreground truncate">Messenger</span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded flex-shrink-0">
                    Facebook
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] opacity-75 truncate">
                  {isBn ? "ফেসবুক মেসেঞ্জারে চ্যাট করুন" : "Chat on Facebook Messenger"}
                </p>
              </div>
            </a>
          </div>

          <div className="mt-2.5 sm:mt-3 pt-2 text-center border-t border-foreground/10">
            <span className="text-[9px] sm:text-[10px] opacity-60 tracking-wider">
              Powered by {storeName}
            </span>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-accent text-button-fg shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-accent/30 group cursor-pointer"
        aria-label="Open Chat Widget"
      >
        {/* Glow / Pulse ring */}
        <span className="absolute -inset-1 rounded-full bg-accent opacity-30 group-hover:opacity-60 animate-pulse pointer-events-none" />

        {/* Dynamic Icon toggling with Image */}
        {isOpen ? (
          <Image
            src="/icons/close-x.png"
            alt="Close"
            width={20}
            height={20}
            priority
            className="w-4 h-4 sm:w-5 sm:h-5 object-contain brightness-0 invert"
          />
        ) : (
          <div className="relative flex items-center justify-center">
            {/* Chat bubble image */}
            <Image
              src="/bubble-chat.png"
              alt="Chat"
              width={30}
              height={30}
              priority
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain brightness-0 invert"
            />
            {/* Online badge */}
            <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-visible opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-visible border-2 border-secondary"></span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
