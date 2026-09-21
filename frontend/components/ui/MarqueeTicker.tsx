"use client";

import React from "react";
import { useLanguage } from "@/store/LanguageContext";

export default function MarqueeTicker() {
  const { locale } = useLanguage();
  const isBn = locale === "bn";

  const perks = isBn
    ? [
        { icon: "✨", text: "১০০% খাঁটি ও প্রিমিয়াম বিউটি প্রোডাক্টস" },
        { icon: "🚚", text: "সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি" },
        { icon: "💳", text: "ক্যাশ অন ডেলিভারি এবং বিকাশ পেমেন্ট সুবিধা" },
        { icon: "💬", text: "২৪/৭ সার্বক্ষণিক কাস্টমার কেয়ার সহায়তা" },
        { icon: "💎", text: "ক্লাব সদস্যদের জন্য এক্সক্লুসিভ রিওয়ার্ডস ও অফার" },
        { icon: "🛡️", text: "নিরাপদ প্যাকেজিং ও সহজ রিটার্ন পলিসি" },
      ]
    : [
        { icon: "✨", text: "100% Authentic & Premium Beauty Products" },
        { icon: "🚚", text: "Fast Home Delivery Across Bangladesh" },
        { icon: "💳", text: "Cash on Delivery & Instant bKash Support" },
        { icon: "💬", text: "24/7 Dedicated Customer Support" },
        { icon: "💎", text: "Exclusive Rewards for Club Members" },
        { icon: "🛡️", text: "Tamper-proof Packaging & Easy Returns" },
      ];

  // Duplicate items twice to ensure endless continuous loop
  const marqueeItems = [...perks, ...perks, ...perks];

  return (
    <div className="w-full relative overflow-hidden py-3 bg-secondary/80 backdrop-blur-md border-y border-foreground/10 select-none">
      {/* Soft edge blur masks for continuous flow effect */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="animate-marquee flex items-center gap-8 md:gap-12 whitespace-nowrap cursor-default">
        {marqueeItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 text-xs md:text-sm font-bold tracking-wide uppercase text-foreground/80 hover:text-foreground transition-colors"
          >
            <span className="text-base md:text-lg animate-float-subtle">{item.icon}</span>
            <span>{item.text}</span>
            <span className="text-foreground/30 text-xs ml-4">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
