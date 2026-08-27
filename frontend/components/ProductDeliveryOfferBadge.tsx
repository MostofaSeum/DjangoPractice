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
}

export default function ProductDeliveryOfferBadge({
  productId,
  collectionId,
  soldCount,
  className = "",
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

  return (
    <div className={`flex items-center gap-2 ${badgeText ? "justify-between" : "justify-start"} ${className}`}>
      {badgeText ? (
        <>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[9px] font-black uppercase tracking-wider border border-accent/25">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>{badgeText}</span>
          </div>
          {soldCount !== undefined && (
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider shrink-0">
              {locale === "bn" ? `${soldCount.toLocaleString("bn-BD")} ${t("delivery.sold")}` : `${soldCount} Sold`}
            </span>
          )}
        </>
      ) : (
        soldCount !== undefined && (
          <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider shrink-0">
            {locale === "bn" ? `${soldCount.toLocaleString("bn-BD")} ${t("delivery.sold")}` : `${soldCount} Sold`}
          </span>
        )
      )}
    </div>
  );
}
