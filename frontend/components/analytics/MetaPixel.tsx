"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/siteConfig";
import { initMetaPixel, trackPageView } from "@/services/metaPixel";

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

interface MetaPixelProps {
  initialPixelId?: string;
}

export default function MetaPixel({ initialPixelId = "" }: MetaPixelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pixelId, setPixelId] = useState<string>(initialPixelId);
  const isFirstRender = useRef(true);

  // 1. Initialize immediately if initialPixelId is provided, or fetch dynamically
  useEffect(() => {
    if (initialPixelId) {
      setPixelId(initialPixelId);
      initMetaPixel(initialPixelId);
      return;
    }

    let isMounted = true;
    const fetchPixelSettings = async () => {
      const envPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
      let activeId = envPixel || "";

      try {
        const res = await fetch(`${API_BASE}/store/site-settings/`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.meta_pixel_id) {
            activeId = String(data.meta_pixel_id).trim();
          }
        }
      } catch (err) {
        console.error("Failed to load Meta Pixel settings:", err);
      }

      if (isMounted && activeId) {
        setPixelId(activeId);
        initMetaPixel(activeId);
      }
    };

    fetchPixelSettings();
    return () => {
      isMounted = false;
    };
  }, [initialPixelId]);

  // 2. Track PageView on SPA route changes (skip initial render since initMetaPixel already fires PageView)
  useEffect(() => {
    if (!pixelId) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    trackPageView();
  }, [pathname, searchParams, pixelId]);

  return null;
}
