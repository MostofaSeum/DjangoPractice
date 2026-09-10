"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/config/siteConfig";
import { useLanguage } from "@/store/LanguageContext";

interface DeliveryRule {
  id: number;
  target_type: "product" | "collection";
  rule_type: "free" | "reduced";
  inside_dhaka_charge: number | string;
  outside_dhaka_charge: number | string;
  products?: number[];
  products_details?: { id: number }[];
  collection?: number | null;
  min_quantity?: number;
  min_order_amount?: number | string | null;
  is_active: boolean;
}

let cachedRules: DeliveryRule[] | null = null;
let rulesPromise: Promise<DeliveryRule[]> | null = null;

async function getCachedRules(): Promise<DeliveryRule[]> {
  if (cachedRules) return cachedRules;
  if (rulesPromise) return rulesPromise;

  rulesPromise = (async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/store/delivery-rules/`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const rules = (Array.isArray(data) ? data : data.results || []).filter(
          (r: any) => r.is_active,
        );
        cachedRules = rules;
        return rules;
      }
    } catch (e) {
      console.error("Failed to fetch delivery rules for badge:", e);
    }
    return [];
  })();

  return rulesPromise;
}

interface ProductDeliveryOfferBadgeProps {
  productId: number;
  collectionId?: number | null;
  soldCount?: number;
  className?: string;
  badgeOnly?: boolean;
}

export default function ProductDeliveryOfferBadge({
  productId,
  collectionId,
  soldCount,
  className = "",
  badgeOnly = false,
}: ProductDeliveryOfferBadgeProps) {
  const { t, formatCurrency, locale } = useLanguage();
  const [matchedRule, setMatchedRule] = useState<DeliveryRule | null>(null);

  useEffect(() => {
    let isMounted = true;
    getCachedRules().then((rules) => {
      if (!isMounted || !rules || rules.length === 0) return;

      for (const rule of rules) {
        let isMatch = false;
        if (rule.target_type === "product") {
          if (rule.products && Array.isArray(rule.products)) {
            isMatch = rule.products.map(Number).includes(Number(productId));
          } else if (rule.products_details && Array.isArray(rule.products_details)) {
            isMatch = rule.products_details.some((p) => Number(p.id) === Number(productId));
          }
        } else if (rule.target_type === "collection" && collectionId) {
          isMatch = Number(rule.collection) === Number(collectionId);
        }

        if (isMatch) {
          setMatchedRule(rule);
          break;
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [productId, collectionId]);

  const getBadgeText = () => {
    if (!matchedRule) return null;

    const qty = Number(matchedRule.min_quantity || 1);
    const minAmount = Number(matchedRule.min_order_amount || 0);
    const isFree = matchedRule.rule_type === "free";

    if (minAmount > 0) {
      const formattedAmount = formatCurrency(minAmount);
      if (locale === "bn") {
        return `${formattedAmount} ${t("delivery.spend")} ${isFree ? t("delivery.toGetFree") : t("delivery.toGetReduced")}`;
      }
      return `${t("delivery.spend")} ${formattedAmount} ${isFree ? t("delivery.toGetFree") : t("delivery.toGetReduced")}`;
    } else if (qty > 1) {
      const qtyStr = locale === "bn" ? qty.toLocaleString("bn-BD") : qty;
      if (locale === "bn") {
        return `${qtyStr}${t("delivery.items")} ${t("delivery.buy")} ${isFree ? t("delivery.toGetFree") : t("delivery.toGetReduced")}`;
      }
      return `${t("delivery.buy")} ${qtyStr}+ ${t("delivery.items")} ${isFree ? t("delivery.toGetFree") : t("delivery.toGetReduced")}`;
    } else {
      return isFree ? t("delivery.freeOffer") : t("delivery.reducedOffer");
    }
  };

  const badgeText = getBadgeText();

  if (badgeOnly) {
    if (!matchedRule) return null;

    const qty = Number(matchedRule.min_quantity || 1);
    const minAmount = Number(matchedRule.min_order_amount || 0);
    const isFree = matchedRule.rule_type === "free";

    // Compact, punchy, high-conversion copy
    let shortOffer = "";
    if (minAmount > 0) {
      const formattedAmount = formatCurrency(minAmount);
      shortOffer = isFree
        ? (locale === "bn" ? `৳${Number(minAmount).toLocaleString("bn-BD")} এ ফ্রি ডেলিভারি` : `FREE DELIVERY OVER ${formattedAmount}`)
        : (locale === "bn" ? `৳${Number(minAmount).toLocaleString("bn-BD")} এ বিশেষ ছাড়` : `SPECIAL DELIVERY OVER ${formattedAmount}`);
    } else if (qty > 1) {
      const qtyStr = locale === "bn" ? qty.toLocaleString("bn-BD") : qty;
      shortOffer = isFree
        ? (locale === "bn" ? `${qtyStr}+ পণ্যে ফ্রি ডেলিভারি` : `BUY ${qtyStr}+ GET FREE DELIVERY`)
        : (locale === "bn" ? `${qtyStr}+ পণ্যে কম ডেলিভারি চার্জ` : `BUY ${qtyStr}+ GET REDUCED DELIVERY`);
    } else {
      shortOffer = isFree
        ? (locale === "bn" ? "ফ্রি ডেলিভারি অফার" : "FREE DELIVERY OFFER")
        : (locale === "bn" ? "ডেলিভারি ছাড় অফার" : "DELIVERY DISCOUNT OFFER");
    }

    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl bg-gradient-to-r from-accent/90 via-primary/95 to-accent/90 text-button-fg border-2 border-white/40 shadow-[0_4px_14px_rgba(0,0,0,0.35)] hover:scale-105 transition-transform duration-300 pointer-events-auto ${className}`}
      >
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/25 shrink-0">
          <img
            src="/icons/truck.png"
            alt="Delivery"
            className="w-2.5 h-2.5 object-contain brightness-0 invert"
          />
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap drop-shadow-xs">
          {shortOffer}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${soldCount !== undefined && badgeText ? "justify-between" : soldCount !== undefined ? "justify-start" : "justify-end"} ${className}`}>
      {soldCount !== undefined && (
        <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider shrink-0">
          {locale === "bn" ? `${soldCount.toLocaleString("bn-BD")} ${t("delivery.sold")}` : `${soldCount} Sold`}
        </span>
      )}
      {badgeText && (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[9px] font-black uppercase tracking-wider border border-accent/25">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
          <span>{badgeText}</span>
        </div>
      )}
    </div>
  );
}
