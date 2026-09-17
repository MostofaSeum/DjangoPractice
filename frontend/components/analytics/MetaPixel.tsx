"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/siteConfig";
import { initMetaPixel, trackPageView } from "@/services/metaPixel";

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pixelId, setPixelId] = useState<string>("");
  const isFirstRender = useRef(true);

  // 1. Fetch pixel ID from dynamic Site Settings (or env variable fallback) and initialize
  useEffect(() => {
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
  }, []);

  // 2. Track PageView on SPA route changes (skip initial render since initMetaPixel already fires PageView)
  useEffect(() => {
    if (!pixelId) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    trackPageView();
  }, [pathname, searchParams, pixelId]);

  if (!pixelId) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
