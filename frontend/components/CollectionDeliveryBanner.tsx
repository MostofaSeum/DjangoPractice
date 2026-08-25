"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/config/siteConfig";

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
  const [offerText, setOfferText] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getCachedRules().then((rules) => {
      if (!isMounted || !rules || rules.length === 0) return;

      const matchedRule = rules.find(
        (r) =>
          r.target_type === "collection" &&
          Number(r.collection) === Number(collectionId)
      );

      if (matchedRule) {
        const qty = Number(matchedRule.min_quantity || 1);
        const minAmount = Number(matchedRule.min_order_amount || 0);
        const free = matchedRule.rule_type === "free";

        if (minAmount > 0) {
          setOfferText(
            free
              ? `Spend ৳${minAmount.toLocaleString()} from this category to get FREE Delivery!`
              : `Spend ৳${minAmount.toLocaleString()} from this category to get a reduced delivery charge!`
          );
        } else if (qty > 1) {
          setOfferText(
            free
              ? `Buy ${qty}+ items from this category to get FREE Delivery!`
              : `Buy ${qty}+ items from this category to get a reduced delivery charge!`
          );
        } else {
          setOfferText(
            free
              ? "Special Offer: FREE Delivery on all items in this category!"
              : `Special Offer: Reduced delivery charge on this category!`
          );
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [collectionId]);

  if (!offerText) return null;

  if (variant === "banner") {
    return (
      <div
        className={`flex items-center gap-3 p-4 rounded-2xl bg-accent/15 border border-accent/30 text-foreground font-black text-xs uppercase tracking-wider ${className}`}
      >
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
        </span>
        <span className="text-accent font-extrabold">{offerText}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
        darkOverlay
          ? "bg-primary/80 text-button-fg border border-button-fg/20"
          : "bg-accent/15 text-accent border border-accent/25"
      } text-[10px] font-black uppercase tracking-wider shadow-md ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      <span>{offerText}</span>
    </div>
  );
}
