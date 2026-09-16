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
    if (facebookUrl.includes("m.me/")) {
      return facebookUrl;
    }
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-visible opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-visible"></span>
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
              className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-foreground/10 text-foreground transition-colors flex items-center justify-center"
              aria-label="Close Chat"
            >
              <Image
                src="/icons/close-x.png"
                alt="Close"
                width={14}
                height={14}
                className="w-3.5 h-3.5 object-contain dark:invert"
              />
            </button>
          </div>

          {/* Chat Options */}
          <div className="mt-3 space-y-2.5">
            {/* WhatsApp Option */}
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-background hover:bg-accent/10 border border-foreground/10 hover:border-accent/40 text-foreground transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-secondary border border-foreground/15 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform overflow-hidden p-2">
                <Image
                  src="/whatsapp.png"
                  alt="WhatsApp"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain dark:invert transition-all"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">WhatsApp</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-visible bg-visible/10 px-1.5 py-0.5 rounded">
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
              className="flex items-center gap-3 p-3 rounded-xl bg-background hover:bg-accent/10 border border-foreground/10 hover:border-accent/40 text-foreground transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-secondary border border-foreground/15 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform overflow-hidden p-2">
                <Image
                  src="/messenger.png"
                  alt="Messenger"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain dark:invert transition-all"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Messenger</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded">
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
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-accent text-button-fg shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-accent/30 group"
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
            className="w-5 h-5 object-contain brightness-0 invert"
          />
        ) : (
          <div className="relative flex items-center justify-center">
            {/* Chat bubble image */}
            <Image
              src="/bubble-chat.png"
              alt="Chat"
              width={30}
              height={30}
              className="w-7 h-7 object-contain brightness-0 invert"
            />
            {/* Online badge */}
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-visible opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-visible border-2 border-secondary"></span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
