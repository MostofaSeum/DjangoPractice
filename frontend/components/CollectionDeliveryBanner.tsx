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

interface OfferDetails {
  free: boolean;
  prefix: string;
  highlight: string;
  suffix: string;
}

export default function CollectionDeliveryBanner({
  collectionId,
  variant = "badge",
  className = "",
  darkOverlay = false,
}: CollectionDeliveryBannerProps) {
  const [offer, setOffer] = useState<OfferDetails | null>(null);

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
          setOffer({
            free,
            prefix: "Spend",
            highlight: `৳${minAmount.toLocaleString()}`,
            suffix: free ? "for Free Delivery" : "for Reduced Delivery",
          });
        } else if (qty > 1) {
          setOffer({
            free,
            prefix: "Buy",
            highlight: `${qty}+ Items`,
            suffix: free ? "for Free Delivery" : "for Reduced Delivery",
          });
        } else {
          setOffer({
            free,
            prefix: "Special Offer",
            highlight: free ? "Free Delivery" : "Reduced Delivery",
            suffix: "on all items",
          });
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [collectionId]);

  if (!offer) return null;

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
          <span className="text-foreground/90 font-bold">{offer.prefix}</span>
          <span className="text-accent font-black underline decoration-accent/40">{offer.highlight}</span>
          <span className="text-foreground font-extrabold">{offer.suffix}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border shadow-md transition-all duration-300 ${
        darkOverlay
          ? "bg-primary/70 border-accent/40 text-button-fg"
          : "bg-secondary/90 border-accent/30 text-foreground"
      } ${className}`}
    >
      <span className="flex h-2 w-2 relative shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
      </span>

      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 flex-wrap">
        <span className="opacity-90">{offer.prefix}</span>
        <strong className="text-accent font-black">{offer.highlight}</strong>
        <span className="font-extrabold">{offer.suffix}</span>
      </span>
    </div>
  );
}
