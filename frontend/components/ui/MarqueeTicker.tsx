"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { useLanguage } from "@/store/LanguageContext";

export interface MarqueeItemConfig {
  id: string;
  icon: string;
  text_en: string;
  text_bn: string;
  is_active: boolean;
}

export const DEFAULT_MARQUEE_ITEMS: MarqueeItemConfig[] = [
  {
    id: "authentic",
    icon: "/icons/check-circle.png",
    text_en: "100% Authentic & Premium Beauty Products",
    text_bn: "১০০% খাঁটি ও প্রিমিয়াম বিউটি প্রোডাক্টস",
    is_active: true,
  },
  {
    id: "delivery",
    icon: "/icons/truck.png",
    text_en: "Fast Home Delivery Across Bangladesh",
    text_bn: "সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি",
    is_active: true,
  },
  {
    id: "payment",
    icon: "/bKash.png",
    text_en: "Cash on Delivery & Instant bKash Support",
    text_bn: "ক্যাশ অন ডেলিভারি এবং বিকাশ পেমেন্ট সুবিধা",
    is_active: true,
  },
  {
    id: "support",
    icon: "/bubble-chat.png",
    text_en: "24/7 Dedicated Customer Support",
    text_bn: "২৪/৭ সার্বক্ষণিক কাস্টমার কেয়ার সহায়তা",
    is_active: true,
  },
  {
    id: "rewards",
    icon: "/icons/star-filled.png",
    text_en: "Exclusive Rewards for Club Members",
    text_bn: "ক্লাব সদস্যদের জন্য এক্সক্লুসিভ রিওয়ার্ডস ও অফার",
    is_active: true,
  },
  {
    id: "returns",
    icon: "/icons/return-arrow.png",
    text_en: "Tamper-proof Packaging & Easy Returns",
    text_bn: "নিরাপদ প্যাকেজিং ও সহজ রিটার্ন পলিসি",
    is_active: true,
  },
];

interface MarqueeTickerProps {
  siteSettings?: any;
}

export default function MarqueeTicker({ siteSettings }: MarqueeTickerProps) {
  const { locale } = useLanguage();
  const isBn = locale === "bn";

  // Check if marquee is disabled by admin
  const isMarqueeActive = siteSettings
    ? siteSettings.marquee_is_active !== false
    : true;

  const items: MarqueeItemConfig[] = useMemo(() => {
    if (siteSettings?.marquee_items_json) {
      try {
        const parsed = JSON.parse(siteSettings.marquee_items_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.error("Failed to parse marquee_items_json:", err);
      }
    }
    return DEFAULT_MARQUEE_ITEMS;
  }, [siteSettings?.marquee_items_json]);

  // Filter only active items
  const activeItems = items.filter((item) => item.is_active !== false);

  if (!isMarqueeActive || activeItems.length === 0) {
    return null;
  }

  // Duplicate items 3 times for seamless infinite loop
  const marqueeItems = [...activeItems, ...activeItems, ...activeItems];

  return (
    <div className="w-full relative overflow-hidden py-3 bg-secondary/80 backdrop-blur-md border-y border-foreground/10 select-none">
      {/* Soft edge blur masks for continuous flow effect */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="animate-marquee flex items-center gap-8 md:gap-12 whitespace-nowrap cursor-default">
        {marqueeItems.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="flex items-center gap-3 text-xs md:text-sm font-bold tracking-wide uppercase text-foreground/85 hover:text-foreground transition-colors"
          >
            <div className="w-4 h-4 md:w-5 md:h-5 relative flex-shrink-0 flex items-center justify-center">
              <Image
                src={item.icon || "/icons/check-circle.png"}
                alt=""
                width={20}
                height={20}
                unoptimized
                className="object-contain max-h-5 max-w-5"
              />
            </div>
            <span>{isBn ? item.text_bn || item.text_en : item.text_en}</span>
            <span className="text-foreground/30 text-xs ml-4">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
