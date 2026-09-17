"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { siteConfig } from "@/config/siteConfig";
import { trackGAPageView } from "@/services/googleAnalytics";

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

interface GoogleAnalyticsProps {
  initialGaId?: string;
}

export default function GoogleAnalytics({ initialGaId = "" }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [gaId, setGaId] = useState<string>(initialGaId);
  const isFirstRender = useRef(true);

  // Fetch GA measurement ID if not provided initially
  useEffect(() => {
    if (initialGaId) {
      setGaId(initialGaId);
      return;
    }

    let isMounted = true;
    const fetchGASettings = async () => {
      const envGaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
      let activeId = envGaId || "";

      try {
        const res = await fetch(`${API_BASE}/store/site-settings/`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.google_analytics_id) {
            activeId = String(data.google_analytics_id).trim();
          }
        }
      } catch (err) {
        console.error("Failed to load Google Analytics settings:", err);
      }

      if (isMounted && activeId) {
        setGaId(activeId);
      }
    };

    fetchGASettings();
    return () => {
      isMounted = false;
    };
  }, [initialGaId]);

  // Track page_view on client-side route transitions
  useEffect(() => {
    if (!gaId) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentUrl = window.location.href;
    trackGAPageView(currentUrl);
  }, [pathname, searchParams, gaId]);

  if (!gaId) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
