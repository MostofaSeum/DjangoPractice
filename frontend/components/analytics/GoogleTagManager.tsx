"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/siteConfig";

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

interface GoogleTagManagerProps {
  initialGtmId?: string;
}

export default function GoogleTagManager({ initialGtmId = "" }: GoogleTagManagerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [gtmId, setGtmId] = useState<string>(initialGtmId);
  const isFirstRender = useRef(true);

  // 1. Initialize GTM from prop, env, or backend site-settings
  useEffect(() => {
    let isMounted = true;

    const loadGtm = (id: string) => {
      if (typeof window === "undefined" || !id) return;
      window.dataLayer = window.dataLayer || [];

      // Check if GTM script is already injected
      const scriptId = "google-tag-manager-script";
      if (!document.getElementById(scriptId)) {
        // Push gtm.start event
        window.dataLayer.push({
          "gtm.start": new Date().getTime(),
          event: "gtm.js",
        });

        const script = document.createElement("script");
        script.id = scriptId;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
        const firstScript = document.getElementsByTagName("script")[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
        } else {
          document.head.appendChild(script);
        }

        if (process.env.NODE_ENV === "development") {
          console.log(`[GoogleTagManager] Initialized with ID: ${id}`);
        }
      }
    };

    if (initialGtmId) {
      setGtmId(initialGtmId);
      loadGtm(initialGtmId);
      return;
    }

    const envGtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
    if (envGtmId) {
      setGtmId(envGtmId);
      loadGtm(envGtmId);
      return;
    }

    const fetchGtmSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/store/site-settings/`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.google_tag_manager_id) {
            const activeId = String(data.google_tag_manager_id).trim();
            setGtmId(activeId);
            loadGtm(activeId);
          }
        }
      } catch (err) {
        console.error("Failed to load GTM settings:", err);
      }
    };

    fetchGtmSettings();
    return () => {
      isMounted = false;
    };
  }, [initialGtmId]);

  // 2. Track virtual page_view on client-side route transitions (SPA navigation)
  useEffect(() => {
    if (!gtmId) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "page_view",
        page_path: pathname,
        page_search: searchParams?.toString() || "",
        page_url: window.location.href,
        page_title: typeof document !== "undefined" ? document.title : "",
      });

      if (process.env.NODE_ENV === "development") {
        console.log(`[GoogleTagManager] Route Change: ${pathname}`);
      }
    }
  }, [pathname, searchParams, gtmId]);

  return null;
}
