"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { siteConfig } from "@/config/siteConfig";
import { trackPageView } from "@/services/metaPixel";

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pixelId, setPixelId] = useState<string>("");

  // 1. Fetch pixel ID from dynamic Site Settings (fallback to env variable if present)
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
      }
    };

    fetchPixelSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Track PageView on route changes (SPA navigation)
  useEffect(() => {
    if (!pixelId) return;
    trackPageView();
  }, [pathname, searchParams, pixelId]);

  if (!pixelId) return null;

  return (
    <>
      <Script
        id="meta-pixel-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
