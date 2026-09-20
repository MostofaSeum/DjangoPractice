// frontend/services/googleAnalytics.ts

/**
 * Google Analytics 4 (GA4) Event Helper
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Initialize Google Analytics 4
export const initGoogleAnalytics = (gaId: string) => {
  if (typeof window === "undefined" || !gaId) return;

  // Initialize dataLayer and gtag stub if not present
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer?.push(arguments);
    };
  }

  // Load gtag.js script if not present
  const scriptId = "google-analytics-gtag";
  if (!document.getElementById(scriptId)) {
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  }

  window.gtag("js", new Date());
  window.gtag("config", gaId, {
    page_path: window.location.pathname,
  });

  if (process.env.NODE_ENV === "development") {
    console.log(`[GoogleAnalytics] Initialized with ID: ${gaId}`);
  }
};

// Track GA4 PageView
export const trackGAPageView = (url: string) => {
  if (typeof window === "undefined" || !window.gtag) return;

  if (process.env.NODE_ENV === "development") {
    console.log(`[GoogleAnalytics] PageView: ${url}`);
  }

  window.gtag("event", "page_view", {
    page_location: url,
    page_path: window.location.pathname,
    page_title: document.title,
  });
};

// Track Standard GA4 E-commerce & Custom Events
// Standard events: view_item, add_to_cart, remove_from_cart, view_cart, begin_checkout, purchase, search
export const trackGAEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV === "development") {
    console.log(`[GoogleAnalytics] Event: ${eventName}`, params);
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  } else if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...params });
  }
};
