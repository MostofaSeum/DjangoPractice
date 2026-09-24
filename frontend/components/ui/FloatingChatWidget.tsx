"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/store/LanguageContext";
import { useAuth } from "@/store/AuthContext";
import { useCart } from "@/store/CartContext";
import { siteConfig } from "@/config/siteConfig";

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

interface ChatActionProduct {
  productId: number;
  variantId?: number | null;
  quantity: number;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  cartAdded?: boolean;
}

export default function FloatingChatWidget() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const { user, token } = useAuth();
  const { addToCart } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"menu" | "ai_chat">("menu");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [storeName, setStoreName] = useState("VibeMart");

  // Dynamic AI & Popup settings from Admin Site Settings
  const [aiChatActive, setAiChatActive] = useState<boolean>(true);
  const [aiNudgeActive, setAiNudgeActive] = useState<boolean>(true);
  const [aiNudgeDelaySeconds, setAiNudgeDelaySeconds] = useState<number>(5);
  const [aiNudgeDurationSeconds, setAiNudgeDurationSeconds] = useState<number>(8);
  const [aiNudgeHomeMsg, setAiNudgeHomeMsg] = useState<string>("");
  const [aiNudgeHomeMsgBn, setAiNudgeHomeMsgBn] = useState<string>("");
  const [aiNudgeProductMsg, setAiNudgeProductMsg] = useState<string>("");
  const [aiNudgeProductMsgBn, setAiNudgeProductMsgBn] = useState<string>("");

  // AI Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Proactive nudge state on product pages
  const [showNudge, setShowNudge] = useState(false);
  const nudgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nudgeDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasNudgedPageRef = useRef<string>("");

  const widgetRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const prevUserIdRef = useRef<number | null | undefined>(undefined);

  // Proactive AI Nudge: triggers after admin-configured delay, then auto-closes after admin-configured duration
  useEffect(() => {
    if (nudgeTimeoutRef.current) {
      clearTimeout(nudgeTimeoutRef.current);
    }
    if (nudgeDismissTimeoutRef.current) {
      clearTimeout(nudgeDismissTimeoutRef.current);
    }
    setShowNudge(false);

    // If proactive popup or overall AI chat is turned off by admin, skip
    if (!aiChatActive || !aiNudgeActive) {
      return;
    }

    // Landing page (home '/') or product details page (e.g. /products/123)
    const isLandingPage = pathname === "/" || pathname === "";
    const isProductPage = pathname?.startsWith("/products/") && pathname.split("/").length >= 3;

    if ((isLandingPage || isProductPage) && !isOpen && hasNudgedPageRef.current !== pathname) {
      const delayMs = Math.max(1, aiNudgeDelaySeconds) * 1000;
      const durationMs = Math.max(1, aiNudgeDurationSeconds) * 1000;

      nudgeTimeoutRef.current = setTimeout(() => {
        setShowNudge(true);
        hasNudgedPageRef.current = pathname;

        // Automatically close the popup after configured duration
        nudgeDismissTimeoutRef.current = setTimeout(() => {
          setShowNudge(false);
        }, durationMs);
      }, delayMs);
    }

    return () => {
      if (nudgeTimeoutRef.current) {
        clearTimeout(nudgeTimeoutRef.current);
      }
      if (nudgeDismissTimeoutRef.current) {
        clearTimeout(nudgeDismissTimeoutRef.current);
      }
    };
  }, [pathname, isOpen, aiChatActive, aiNudgeActive, aiNudgeDelaySeconds, aiNudgeDurationSeconds]);

  // When user opens the chat, dismiss the nudge
  useEffect(() => {
    if (isOpen) {
      setShowNudge(false);
    }
  }, [isOpen]);

  // Auto-reset chat when user logs out or switches accounts
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== currentId) {
      // User logged out or changed
      setMessages([]);
      setInputVal("");
      setViewMode("menu");
    }
    prevUserIdRef.current = currentId;
  }, [user]);

  // Clear chat handler
  const handleClearChat = () => {
    lastScrollTopRef.current = null;
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: "bot",
        text: isBn
          ? `হ্যালো! আমি ${storeName}-এর এআই বিউটি সহকারী VibeBuddy। আপনার ত্বক, বয়স বা পছন্দের উপযোগী সেরা প্রোডাক্ট নির্বাচন করতে সাহায্য লাগলে বলুন, কিংবা লাইভ স্টক, মূল্য ও ডেলিভারি সম্পর্কে জিজ্ঞেস করুন!`
          : `Hello! I'm VibeBuddy, your 24/7 AI shopping & beauty companion at ${storeName}. Ask me for personalized skincare/cosmetics suggestions, or check live stock, prices, and delivery charges!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Initialize welcome message when AI chat opens
  useEffect(() => {
    if (viewMode === "ai_chat" && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          sender: "bot",
          text: isBn
            ? `হ্যালো! আমি ${storeName}-এর এআই বিউটি সহকারী VibeBuddy। আপনার ত্বক, বয়স বা পছন্দের উপযোগী সেরা প্রোডাক্ট নির্বাচন করতে সাহায্য লাগলে বলুন, কিংবা লাইভ স্টক, মূল্য ও ডেলিভারি সম্পর্কে জিজ্ঞেস করুন!`
            : `Hello! I'm VibeBuddy, your 24/7 AI shopping & beauty companion at ${storeName}. Ask me for personalized skincare/cosmetics suggestions, or check live stock, prices, and delivery charges!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [viewMode, isBn, storeName]);

  const lastScrollTopRef = useRef<number | null>(null);

  // Auto-scroll chat to bottom on new messages or restore last scroll position when reopening
  useEffect(() => {
    if (isOpen && viewMode === "ai_chat" && chatScrollRef.current) {
      // Use requestAnimationFrame / setTimeout to ensure the DOM layout has updated
      const timer = setTimeout(() => {
        if (!chatScrollRef.current) return;
        if (lastScrollTopRef.current !== null) {
          chatScrollRef.current.scrollTop = lastScrollTopRef.current;
        } else {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, viewMode]);

  // When new messages arrive or bot is typing, auto-scroll to bottom and update lastScrollTopRef
  useEffect(() => {
    if (isOpen && viewMode === "ai_chat" && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      lastScrollTopRef.current = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Fetch contact data and AI popup settings from site settings
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

            if (typeof data.ai_chat_active === "boolean") setAiChatActive(data.ai_chat_active);
            if (typeof data.ai_nudge_active === "boolean") setAiNudgeActive(data.ai_nudge_active);
            if (typeof data.ai_nudge_delay_seconds === "number") setAiNudgeDelaySeconds(data.ai_nudge_delay_seconds);
            if (typeof data.ai_nudge_duration_seconds === "number") setAiNudgeDurationSeconds(data.ai_nudge_duration_seconds);
            if (data.ai_nudge_home_msg) setAiNudgeHomeMsg(data.ai_nudge_home_msg);
            if (data.ai_nudge_home_msg_bn) setAiNudgeHomeMsgBn(data.ai_nudge_home_msg_bn);
            if (data.ai_nudge_product_msg) setAiNudgeProductMsg(data.ai_nudge_product_msg);
            if (data.ai_nudge_product_msg_bn) setAiNudgeProductMsgBn(data.ai_nudge_product_msg_bn);
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
  const formattedWhatsApp = cleanPhone.startsWith("01") ? `88${cleanPhone}` : cleanPhone;

  // Build smart context message for WhatsApp
  const getContextMessage = () => {
    let defaultMsg = isBn
      ? `হ্যালো ${storeName}, আমি আপনাদের শপ ও প্রোডাক্ট সম্পর্কে জানতে আগ্রহী!`
      : `Hi ${storeName}, I have an inquiry about your products!`;

    if (typeof window !== "undefined") {
      const siteBase = process.env.NEXT_PUBLIC_SITE_URL
        ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")
        : window.location.origin;

      const productUrl = `${siteBase}${pathname}`;
      const cleanTitle =
        (document.title || "")
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
    if (!facebookUrl) return "https://m.me/brainicontech";
    if (facebookUrl.includes("m.me/")) return facebookUrl.split("?")[0].replace(/\/+$/, "");

    const cleaned = facebookUrl
      .replace(/^https?:\/\/(www\.)?facebook\.com\//i, "")
      .replace(/\/+$/, "")
      .split("?")[0]
      .split("/")[0];

    return cleaned && cleaned.toLowerCase() !== "facebook" && cleaned.toLowerCase() !== "www"
      ? `https://m.me/${cleaned}`
      : "https://m.me/brainicontech";
  };

  const getWhatsAppUrl = () => {
    const msg = encodeURIComponent(getContextMessage());
    return `https://wa.me/${formattedWhatsApp}?text=${msg}`;
  };

  // Send message to Gemini AI API
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query || isTyping) return;

    setInputVal("");
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `JWT ${token}`;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: query,
          history: messages.slice(-6),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || (isBn ? "আমি বুঝতে পারছি। দয়া করে বিস্তারিত বলুন।" : "I understand. How else can I help?");
        
        let hasCartAction = false;
        if (Array.isArray(data.actions) && data.actions.length > 0) {
          for (const act of data.actions) {
            if (act.type === "ADD_TO_CART" && act.productId) {
              hasCartAction = true;
              try {
                await addToCart(act.productId, act.quantity || 1, act.variantId || null);
              } catch (cartErr) {
                console.error("Chatbot failed to add to cart:", cartErr);
              }
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: "bot",
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            cartAdded: hasCartAction,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: "bot",
            text: isBn
              ? "সাময়িক সংযোগজনিত সমস্যা হয়েছে। অনুগ্রহ করে হোয়াটসঅ্যাপে মেসেজ দিন।"
              : "Temporary connection error. Please message us on WhatsApp for quick assistance.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "bot",
          text: isBn
            ? "নেটওয়ার্ক ত্রুটি হয়েছে। হোয়াটসঅ্যাপে সরাসরি আমাদের সাথে যুক্ত হতে পারেন।"
            : "Network error occurred. You can reach our human team directly on WhatsApp.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = user
    ? isBn
      ? ["আমার ত্বকের জন্য প্রোডাক্ট সাজেস্ট করুন", "আমার ভাইবকয়েন ব্যালেন্স কত?", "আমার সাম্প্রতিক অর্ডার দেখাও", "গিফট কার্ড কিভাবে কিনব?"]
      : ["Suggest skincare for my skin", "What is my VibeCoin balance?", "Where is my order?", "How to buy Gift Cards?"]
    : isBn
      ? ["আমার ত্বকের জন্য প্রোডাক্ট সাজেস্ট করুন", "ডেলিভারি চার্জ কত?", "পেমেন্ট মেথড কি কি?", "গিফট কার্ড কিভাবে কিনব?"]
      : ["Suggest products for my skin", "What are delivery charges?", "What payment methods do you accept?", "How to buy Gift Cards?"];

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
      {/* Expanded Popup (Menu Mode OR AI Chat Mode) */}
      {isOpen && (
        <div
          className={`mb-2 sm:mb-3 w-[calc(100vw-2rem)] rounded-2xl bg-secondary/95 backdrop-blur-md border border-foreground/15 shadow-2xl text-foreground animate-in fade-in slide-in-from-bottom-3 duration-200 overflow-hidden flex flex-col ${
            viewMode === "ai_chat"
              ? "sm:w-96 max-w-[380px] h-[480px] sm:h-[520px]"
              : "sm:w-80 max-w-[320px] p-3 sm:p-4"
          }`}
        >
          {viewMode === "menu" ? (
            /* MENU MODE */
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-foreground/10">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-visible opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-visible"></span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-foreground truncate">
                      {isBn ? "সহায়তা কেন্দ্র" : "Support Center"}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] opacity-70 truncate">
                      {isBn ? "আমরা সাধারণত সাথে সাথেই উত্তর দেই" : "Choose how you'd like to chat"}
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
                {/* 1. AI Chat Assistant (Featured) - Only rendered when AI Chat is active */}
                {aiChatActive && (
                  <button
                    type="button"
                    onClick={() => setViewMode("ai_chat")}
                    className="w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-background hover:bg-accent/10 border border-accent/40 hover:border-accent text-foreground transition-all duration-200 group active:scale-[0.98] text-left cursor-pointer relative overflow-hidden"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-secondary border border-foreground/15 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform overflow-hidden p-2">
                      <Image
                        src="/bot.png"
                        alt="VibeBuddy"
                        width={28}
                        height={28}
                        className="w-full h-full object-contain dark:invert transition-all"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs sm:text-sm font-bold text-foreground">
                          {isBn ? "VibeBuddy এআই" : "VibeBuddy AI"}
                        </span>
                        <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-button-fg bg-accent px-1.5 py-0.5 rounded-md flex-shrink-0">
                          24/7 AI
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] opacity-75 truncate">
                        {isBn ? "প্রোডাক্ট, স্টক ও ডেলিভারি তথ্য জানুন" : "Instant answers on products & delivery"}
                      </p>
                    </div>
                  </button>
                )}

                {/* 2. WhatsApp Option */}
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-background hover:bg-foreground/5 border border-foreground/10 hover:border-foreground/20 text-foreground transition-all duration-200 group active:scale-[0.98]"
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
                    </div>
                    <p className="text-[10px] sm:text-[11px] opacity-75 truncate">
                      {isBn ? "হোয়াটসঅ্যাপে সরাসরি কথা বলুন" : "Chat directly with support team"}
                    </p>
                  </div>
                </a>

                {/* 3. Messenger Option */}
                <a
                  href={getMessengerUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-background hover:bg-foreground/5 border border-foreground/10 hover:border-foreground/20 text-foreground transition-all duration-200 group active:scale-[0.98]"
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
                    </div>
                    <p className="text-[10px] sm:text-[11px] opacity-75 truncate">
                      {isBn ? "ফেসবুক মেসেঞ্জারে মেসেজ দিন" : "Chat on Facebook Messenger"}
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
          ) : (
            /* AI CHAT MODE */
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 border-b border-foreground/10 bg-secondary/80">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setViewMode("menu")}
                    className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-foreground/10 transition-colors cursor-pointer text-xs flex items-center gap-0.5"
                    title="Back to options"
                  >
                    <span>‹</span>
                  </button>
                  <div className="relative flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden p-1">
                      <Image
                        src="/bot.png"
                        alt="VibeBuddy"
                        width={24}
                        height={24}
                        className="w-full h-full object-contain dark:invert"
                      />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-visible ring-2 ring-secondary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                      <span>VibeBuddy</span>
                      <span className="text-[8px] uppercase tracking-wider font-semibold px-1 rounded bg-accent/15 text-accent">
                        AI Bot
                      </span>
                    </h4>
                    <p className="text-[10px] opacity-60 truncate">
                      {isBn ? "২৪/৭ লাইভ শপ সহকারী" : "24/7 Live Store Assistant"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Clear / Restart Chat button */}
                  <button
                    type="button"
                    onClick={handleClearChat}
                    title={isBn ? "চ্যাট রিসেট করুন" : "Reset / Clear Chat"}
                    className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-foreground/10 text-foreground transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
                    aria-label="Reset Chat"
                  >
                    <Image
                      src="/undo.png"
                      alt="Reset Chat"
                      width={15}
                      height={15}
                      className="w-3.5 h-3.5 object-contain dark:invert transition-all"
                    />
                  </button>

                  {/* Quick WhatsApp Handoff */}
                  <a
                    href={getWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Talk to Human on WhatsApp"
                    className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-foreground/10 text-foreground transition-colors flex items-center justify-center flex-shrink-0"
                  >
                    <Image
                      src="/whatsapp.png"
                      alt="WhatsApp"
                      width={16}
                      height={16}
                      className="w-4 h-4 object-contain dark:invert"
                    />
                  </a>
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-foreground/10 text-foreground transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
                    aria-label="Close Chat"
                  >
                    <Image
                      src="/icons/close-x.png"
                      alt="Close"
                      width={12}
                      height={12}
                      className="w-3 h-3 object-contain dark:invert"
                    />
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div
                ref={chatScrollRef}
                onScroll={(e) => {
                  lastScrollTopRef.current = e.currentTarget.scrollTop;
                }}
                className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 custom-scrollbar text-xs"
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 leading-relaxed break-words shadow-xs ${
                        m.sender === "user"
                          ? "bg-accent text-button-fg rounded-br-none"
                          : "bg-background border border-foreground/10 text-foreground rounded-bl-none"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {m.text.split("\n").map((rawLine, lIdx) => {
                          // Clean leading bullet asterisks / hyphens (* or * * or -) into a neat bullet dot
                          let line = rawLine.replace(/^[\s]*[\*\-]\s*[\*\-]?\s*/g, "• ");
                          
                          // If there are broken combinations like "* *Highlights:*" normalize to "**Highlights:**"
                          line = line.replace(/\*\s+\*([^*\n]+?)\*/g, "**$1**");

                          // Regex to parse **bold**, *italic*, `code`, and markdown [link](url)
                          const parts = line.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
                          return (
                            <div key={lIdx} className={lIdx > 0 ? "mt-1" : ""}>
                              {parts.map((part, pIdx) => {
                                if (part.startsWith("**") && part.endsWith("**")) {
                                  return (
                                    <strong key={pIdx} className="font-semibold text-foreground">
                                      {part.slice(2, -2).replace(/\*/g, "")}
                                    </strong>
                                  );
                                }
                                if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
                                  return (
                                    <em key={pIdx} className="italic text-foreground/90">
                                      {part.slice(1, -1).replace(/\*/g, "")}
                                    </em>
                                  );
                                }
                                if (part.startsWith("`") && part.endsWith("`")) {
                                  return (
                                    <span
                                      key={pIdx}
                                      className="px-1 py-0.5 rounded bg-foreground/10 text-accent font-medium text-[11px]"
                                    >
                                      {part.slice(1, -1)}
                                    </span>
                                  );
                                }
                                const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                                if (linkMatch) {
                                  const linkText = linkMatch[1];
                                  const linkHref = linkMatch[2];
                                  const isInternal = linkHref.startsWith("/");
                                  return isInternal ? (
                                    <Link
                                      key={pIdx}
                                      href={linkHref}
                                      onClick={() => setIsOpen(false)}
                                      className="inline-flex items-center gap-1 font-bold text-accent underline decoration-accent/50 hover:decoration-accent transition-colors"
                                    >
                                      <span>{linkText}</span>
                                      <span className="text-[10px]">↗</span>
                                    </Link>
                                  ) : (
                                    <a
                                      key={pIdx}
                                      href={linkHref}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 font-bold text-accent underline decoration-accent/50 hover:decoration-accent transition-colors"
                                    >
                                      <span>{linkText}</span>
                                      <span className="text-[10px]">↗</span>
                                    </a>
                                  );
                                }
                                // Remove any leftover stray asterisks in plain text
                                const cleanedPart = part.replace(/\*/g, "");
                                return <span key={pIdx}>{cleanedPart}</span>;
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick action button when items are added to cart or cart is suggested */}
                    {m.sender === "bot" && (m.cartAdded || m.text.includes("/cart")) && (
                      <div className="mt-2 flex items-center gap-2">
                        <Link
                          href="/cart"
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent text-button-fg font-bold text-xs shadow-md hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span>{isBn ? "কার্টে যান ও অর্ডার করুন" : "Go to Cart & Checkout"}</span>
                          <span className="text-[11px]">→</span>
                        </Link>
                      </div>
                    )}

                    <span className="text-[9px] opacity-50 mt-1 px-1">{m.timestamp}</span>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-1.5 bg-background border border-foreground/10 text-foreground rounded-2xl rounded-bl-none px-3 py-2 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                )}
              </div>

              {/* Quick Starter Question Chips (Only shown when 1-2 messages exist) */}
              {messages.length <= 2 && (
                <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(q)}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-background border border-foreground/15 hover:border-accent hover:text-accent whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Bar */}
              <div className="p-2.5 sm:p-3 border-t border-foreground/10 bg-secondary/80">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder={
                      isBn ? "একটি প্রশ্ন লিখুন..." : "Ask about products, delivery..."
                    }
                    className="flex-1 px-3 py-2 rounded-xl bg-background border border-foreground/15 text-foreground text-xs focus:outline-none focus:border-accent placeholder:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputVal.trim() || isTyping}
                    className="px-3 py-2 rounded-xl bg-accent text-button-fg font-bold text-xs hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
                  >
                    <span>➤</span>
                  </button>
                </form>
              </div>
            </div>
          )}
          </div>
        )}

      {/* Proactive Product Details Nudge Bubble */}
      {!isOpen && showNudge && (
        <div className="mb-2 mr-1 flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div
            onClick={() => {
              setShowNudge(false);
              setViewMode("ai_chat");
              setIsOpen(true);
            }}
            className="group relative cursor-pointer rounded-2xl bg-secondary/95 backdrop-blur-md border border-accent/40 hover:border-accent p-3 shadow-xl max-w-[240px] text-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowNudge(false);
              }}
              className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground flex items-center justify-center text-[10px] font-bold transition-colors"
              title="Dismiss"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-secondary border border-foreground/15 flex items-center justify-center p-0.5 flex-shrink-0">
                <Image
                  src="/bot.png"
                  alt="VibeBuddy"
                  width={16}
                  height={16}
                  className="w-full h-full object-contain dark:invert"
                />
              </div>
              <span className="text-[11px] font-bold text-accent">VibeBuddy</span>
            </div>
            <p className="text-[11px] leading-snug font-medium text-foreground/90">
              {pathname === "/" || pathname === ""
                ? isBn
                  ? (aiNudgeHomeMsgBn || aiNudgeHomeMsg || `স্বাগতম ${storeName}-এ! কেনাকাটায় কোনো সাহায্য লাগবে? চ্যাট করুন 👋`)
                  : (aiNudgeHomeMsg || `Welcome to ${storeName}! Need any shopping help? Let's chat 👋`)
                : isBn
                ? (aiNudgeProductMsgBn || aiNudgeProductMsg || "কোনো প্রশ্ন বা দ্বিধা আছে? আমাকে জিজ্ঞেস করুন!")
                : (aiNudgeProductMsg || "Any confusion or questions? Just ask me")}
            </p>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-accent group-hover:underline">
              <span>{isBn ? "চ্যাট করুন" : "Chat with VibeBuddy"}</span>
              <span>→</span>
            </div>
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
