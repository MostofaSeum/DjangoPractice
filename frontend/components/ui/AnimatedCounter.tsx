"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { useLanguage } from "@/store/LanguageContext";

export interface StatItemConfig {
  id: string;
  target: number;
  suffix: string;
  prefix?: string;
  decimals?: number;
  labelEn: string;
  labelBn: string;
  subEn: string;
  subBn: string;
  icon: string;
  is_active: boolean;
}

export const DEFAULT_STAT_ITEMS: StatItemConfig[] = [
  {
    id: "customers",
    target: 15000,
    suffix: "+",
    labelEn: "Happy Customers",
    labelBn: "সন্তুষ্ট কাস্টমার",
    subEn: "Loved nationwide",
    subBn: "দেশজুড়ে বিশ্বস্ত",
    icon: "/love.png",
    is_active: true,
  },
  {
    id: "authentic",
    target: 100,
    suffix: "%",
    labelEn: "Authentic Products",
    labelBn: "খাঁটি পণ্য",
    subEn: "Direct from brands",
    subBn: "সরাসরি ব্র‍্যান্ড সোর্সড",
    icon: "/icons/check-circle.png",
    is_active: true,
  },
  {
    id: "coverage",
    target: 64,
    suffix: " Districts",
    labelEn: "Full BD Coverage",
    labelBn: "৬৪ জেলায় ডেলিভারি",
    subEn: "Prompt doorstep service",
    subBn: "দ্রুততম হোম ডেলিভারি",
    icon: "/icons/truck.png",
    is_active: true,
  },
  {
    id: "rating",
    target: 4.9,
    suffix: "★",
    decimals: 1,
    labelEn: "Average Rating",
    labelBn: "গড় রেটিং",
    subEn: "Based on 3,400+ reviews",
    subBn: "৩,৪০০+ রিভিউ ভিত্তিতে",
    icon: "/icons/star-filled.png",
    is_active: true,
  },
];

function SingleCounter({
  target,
  suffix,
  prefix = "",
  decimals = 0,
  animate,
}: {
  target: number;
  suffix: string;
  prefix?: string;
  decimals?: number;
  animate: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!animate) return;

    let startTime: number | null = null;
    const duration = 2000; // 2 seconds

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic formula
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = easeOut * target;

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [animate, target]);

  const formatted =
    decimals > 0
      ? count.toFixed(decimals)
      : Math.floor(count).toLocaleString();

  return (
    <span className="font-mono tabular-nums tracking-tight">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

interface AnimatedCounterProps {
  siteSettings?: any;
}

export default function AnimatedCounter({ siteSettings }: AnimatedCounterProps) {
  const { locale } = useLanguage();
  const isBn = locale === "bn";
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isStatsActive = siteSettings
    ? siteSettings.stats_is_active !== false
    : true;

  const statsList: StatItemConfig[] = useMemo(() => {
    if (siteSettings?.stats_items_json) {
      try {
        const parsed = JSON.parse(siteSettings.stats_items_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.error("Failed to parse stats_items_json:", err);
      }
    }
    return DEFAULT_STAT_ITEMS;
  }, [siteSettings?.stats_items_json]);

  const activeStats = statsList.filter((s) => s.is_active !== false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  if (!isStatsActive || activeStats.length === 0) {
    return null;
  }

  // Determine grid columns dynamically based on number of active cards
  const gridColsClass =
    activeStats.length === 1
      ? "grid-cols-1 max-w-sm"
      : activeStats.length === 2
      ? "grid-cols-1 sm:grid-cols-2 max-w-2xl"
      : activeStats.length === 3
      ? "grid-cols-1 sm:grid-cols-3 max-w-4xl"
      : "grid-cols-2 lg:grid-cols-4";

  return (
    <div
      ref={containerRef}
      className={`grid ${gridColsClass} gap-4 md:gap-6 w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 my-10 md:my-16`}
    >
      {activeStats.map((stat, idx) => (
        <div
          key={`${stat.id}-${idx}`}
          className="relative bg-secondary/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-foreground/10 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-accent/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 relative flex items-center justify-center">
              <Image
                src={stat.icon || "/icons/star-filled.png"}
                alt=""
                width={28}
                height={28}
                unoptimized
                className="object-contain max-h-7 max-w-7"
              />
            </div>
          </div>

          <div className="text-2xl sm:text-4xl font-black text-foreground group-hover:text-accent transition-colors duration-300">
            <SingleCounter
              target={Number(stat.target) || 0}
              suffix={stat.suffix || ""}
              prefix={stat.prefix || ""}
              decimals={stat.decimals || 0}
              animate={isInView}
            />
          </div>

          <div className="mt-2 text-sm sm:text-base font-bold text-foreground">
            {isBn ? stat.labelBn || stat.labelEn : stat.labelEn}
          </div>

          <div className="text-[11px] sm:text-xs text-foreground/60 font-medium mt-0.5">
            {isBn ? stat.subBn || stat.subEn : stat.subEn}
          </div>
        </div>
      ))}
    </div>
  );
}
