"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/config/siteConfig";

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
  className?: string;
}

export default function ProductDeliveryOfferBadge({
  productId,
  collectionId,
}: ProductDeliveryOfferBadgeProps) {
  const [badgeText, setBadgeText] = useState<string | null>(null);

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
          const qty = Number(rule.min_quantity || 1);
          const isFree = rule.rule_type === "free";
          if (qty > 1) {
            setBadgeText(
              isFree
                ? `Buy ${qty} items to get free delivery`
                : `Buy ${qty} items for ৳${rule.inside_dhaka_charge} delivery`,
            );
          } else {
            setBadgeText(
              isFree
                ? "Free Delivery Offer"
                : `Delivery from ৳${rule.inside_dhaka_charge}`,
            );
          }
          break;
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [productId, collectionId]);

  if (!badgeText) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[9px] font-black uppercase tracking-wider border border-accent/25">
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      <span>{badgeText}</span>
    </div>
  );
}
