"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/config/siteConfig";
import { useLanguage } from "@/store/LanguageContext";

interface DeliveryRule {
  id: number;
  target_type: "product" | "collection" | "order_total";
  rule_type: "free" | "reduced";
  inside_dhaka_charge: number | string;
  outside_dhaka_charge: number | string;
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
      console.error("Failed to fetch delivery rules for collection banner:", e);
    }
    return [];
  })();

  return rulesPromise;
}

interface CollectionDeliveryBannerProps {
  collectionId: number;
  variant?: "badge" | "banner";
  className?: string;
  darkOverlay?: boolean;
}

export default function CollectionDeliveryBanner({
  collectionId,
  variant = "badge",
  className = "",
  darkOverlay = false,
}: CollectionDeliveryBannerProps) {
  const { t, formatCurrency, locale } = useLanguage();
  const [matchedRule, setMatchedRule] = useState<DeliveryRule | null>(null);

  useEffect(() => {
    let isMounted = true;
    getCachedRules().then((rules) => {
      if (!isMounted || !rules || rules.length === 0) return;

      const rule = rules.find(
        (r) =>
          r.target_type === "collection" &&
          Number(r.collection) === Number(collectionId)
      );

      if (rule) {
        setMatchedRule(rule);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [collectionId]);

  if (!matchedRule) return null;

  const qty = Number(matchedRule.min_quantity || 1);
  const minAmount = Number(matchedRule.min_order_amount || 0);
  const free = matchedRule.rule_type === "free";

  let prefix = "";
  let highlight = "";
  let suffix = "";

  if (minAmount > 0) {
    prefix = t("delivery.spend");
    highlight = formatCurrency(minAmount);
    suffix = free ? t("delivery.forFree") : t("delivery.forReduced");
  } else if (qty > 1) {
    prefix = t("delivery.buy");
    highlight = locale === "bn" ? `${qty.toLocaleString("bn-BD")}+ ${t("delivery.items")}` : `${qty}+ Items`;
    suffix = free ? t("delivery.forFree") : t("delivery.forReduced");
  } else {
    prefix = t("delivery.specialOffer");
    highlight = free ? t("delivery.freeOffer") : t("delivery.reducedOffer");
    suffix = t("delivery.onAllItems");
  }

  if (variant === "banner") {
    return (
      <div
        className={`flex items-center gap-3 p-4 rounded-2xl bg-primary/20 dark:bg-primary/40 border border-accent/40 backdrop-blur-md text-foreground font-black text-xs uppercase tracking-wider shadow-md ${className}`}
      >
        <span className="flex h-2.5 w-2.5 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-foreground/90 font-bold">{prefix}</span>
          <span className="text-accent font-black">{highlight}</span>
          <span className="text-foreground font-extrabold">{suffix}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border shadow-md transition-all duration-300 ${
        darkOverlay
          ? "bg-primary/85 border-foreground/30 text-button-fg"
          : "bg-secondary/90 border-accent/30 text-foreground"
      } ${className}`}
    >
      <span className="flex h-2 w-2 relative shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
      </span>

      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 flex-wrap">
        <span className="opacity-90">{prefix}</span>
        <strong
          className={`font-black ${
            darkOverlay ? "text-logo" : "text-accent"
          }`}
        >
          {highlight}
        </strong>
        <span className="font-extrabold">{suffix}</span>
      </span>
    </div>
  );
}
