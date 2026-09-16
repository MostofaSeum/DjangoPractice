"use client";

import { useState, useEffect, useRef } from "react";
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

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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

  // Extract Facebook page username or fallback
  const getMessengerUrl = () => {
    if (!facebookUrl) {
      return "https://m.me/brainicontech";
    }
    // Check if it's already an m.me link
    if (facebookUrl.includes("m.me/")) {
      return facebookUrl;
    }
    // Clean up facebook.com URL to extract page name/id
    const cleaned = facebookUrl
      .replace(/^https?:\/\/(www\.)?facebook\.com\//i, "")
      .replace(/\/+$/, "")
      .split("?")[0]
      .split("/")[0];

    return cleaned ? `https://m.me/${cleaned}` : "https://m.me/brainicontech";
  };

  // Build smart context message
  const getWhatsAppUrl = () => {
    let defaultMsg = isBn
      ? `হ্যালো ${storeName}, আমি আপনাদের শপ ও প্রোডাক্ট সম্পর্কে জানতে আগ্রহী!`
      : `Hi ${storeName}, I have an inquiry about your products!`;

    if (typeof window !== "undefined") {
      const currentUrl = window.location.href;
      const pageTitle = document.title || "";
      if (pathname.includes("/products/")) {
        defaultMsg = isBn
          ? `হ্যালো ${storeName}! আমি এই পণ্যটি সম্পর্কে জানতে চাই:\n${pageTitle}\nলিঙ্ক: ${currentUrl}`
          : `Hello ${storeName}! I am inquiring about this item:\n${pageTitle}\nLink: ${currentUrl}`;
      }
    }

    return `https://wa.me/${formattedWhatsApp}?text=${encodeURIComponent(defaultMsg)}`;
  };

  return (
    <div
      ref={widgetRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden select-none"
    >
      {/* Expanded Chat Options Popup */}
      {isOpen && (
        <div className="mb-3 w-72 sm:w-80 rounded-2xl bg-secondary/95 backdrop-blur-md border border-foreground/15 shadow-2xl p-4 text-foreground animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {isBn ? "সরাসরি যোগাযোগ করুন" : "Live Chat Support"}
                </h4>
                <p className="text-[11px] opacity-70">
                  {isBn ? "আমরা সাধারণত সাথে সাথেই উত্তর দেই" : "We usually reply within minutes"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-foreground/10 transition-colors"
              aria-label="Close Chat"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Chat Options */}
          <div className="mt-3 space-y-2.5">
            {/* WhatsApp Option */}
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-foreground transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.771.815 2.796.815 3.18 0 5.767-2.587 5.768-5.766.001-3.181-2.586-5.767-5.768-5.767zm9.969 5.766c-.003 5.519-4.49 9.998-10 9.998-1.678 0-3.321-.424-4.787-1.229l-5.213 1.368 1.393-5.086c-.886-1.528-1.393-3.289-1.393-5.051 0-5.518 4.491-10 10-10 5.513 0 10 4.482 10 10z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">WhatsApp</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-[#25D366] bg-[#25D366]/15 px-1.5 py-0.5 rounded">
                    {isBn ? "অনলাইন" : "Online"}
                  </span>
                </div>
                <p className="text-[11px] opacity-75 truncate">
                  {isBn ? "হোয়াটসঅ্যাপে দ্রুত মেসেজ দিন" : "Chat with us on WhatsApp"}
                </p>
              </div>
            </a>

            {/* Messenger Option */}
            <a
              href={getMessengerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#0084FF]/10 hover:bg-[#0084FF]/20 border border-[#0084FF]/30 text-foreground transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0084FF] via-[#00C6FF] to-[#A800FF] text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.727 7.185V22l3.41-1.871c.905.251 1.868.388 2.863.388 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.07 12.443l-2.618-2.793-5.109 2.793 5.617-5.964 2.684 2.793 5.043-2.793-5.617 5.964z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Messenger</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-[#0084FF] bg-[#0084FF]/15 px-1.5 py-0.5 rounded">
                    Facebook
                  </span>
                </div>
                <p className="text-[11px] opacity-75 truncate">
                  {isBn ? "ফেসবুক মেসেঞ্জারে চ্যাট করুন" : "Chat on Facebook Messenger"}
                </p>
              </div>
            </a>
          </div>

          <div className="mt-3 pt-2 text-center border-t border-foreground/10">
            <span className="text-[10px] opacity-60 tracking-wider">
              Powered by {storeName}
            </span>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-accent text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-accent/30 group"
        aria-label="Open Chat Widget"
      >
        {/* Glow / Pulse ring */}
        <span className="absolute -inset-1 rounded-full bg-accent opacity-30 group-hover:opacity-60 animate-pulse pointer-events-none" />

        {/* Dynamic Icon toggling */}
        {isOpen ? (
          <svg
            className="w-6 h-6 transform rotate-0 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <div className="relative flex items-center justify-center">
            {/* Chat bubble icon */}
            <svg
              className="w-7 h-7 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
              <circle cx="8" cy="10" r="1.2" />
              <circle cx="12" cy="10" r="1.2" />
              <circle cx="16" cy="10" r="1.2" />
            </svg>
            {/* Online badge */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-accent"></span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
