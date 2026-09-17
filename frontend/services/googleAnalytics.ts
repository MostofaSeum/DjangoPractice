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
