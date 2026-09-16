// frontend/services/metaPixel.ts

/**
 * Meta (Facebook) Pixel Event Helper
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

// Track standard PageView
export const trackPageView = () => {
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV === "development") {
    console.log("[MetaPixel] Track: PageView");
  }

  if (typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  } else {
    // If fbq is not yet ready, queue it on _fbq or retry
    window._fbq = window._fbq || window.fbq;
    const interval = setInterval(() => {
      if (typeof window.fbq === "function") {
        clearInterval(interval);
        window.fbq("track", "PageView");
      }
    }, 200);
    setTimeout(() => clearInterval(interval), 5000);
  }
};

// Track Standard Meta Pixel Events
// Event names: ViewContent, AddToCart, AddToWishlist, InitiateCheckout, Purchase, Search, Contact
export const trackPixelEvent = (
  eventName:
    | "PageView"
    | "ViewContent"
    | "AddToCart"
    | "AddToWishlist"
    | "InitiateCheckout"
    | "Purchase"
    | "Search"
    | "Contact"
    | string,
  data: Record<string, any> = {}
) => {
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV === "development") {
    console.log(`[MetaPixel] Track: ${eventName}`, data);
  }

  if (typeof window.fbq === "function") {
    window.fbq("track", eventName, data);
  } else {
    // Queue if script is still initializing
    const interval = setInterval(() => {
      if (typeof window.fbq === "function") {
        clearInterval(interval);
        window.fbq("track", eventName, data);
      }
    }, 200);
    setTimeout(() => clearInterval(interval), 5000);
  }
};

// Track Custom Meta Pixel Events
export const trackPixelCustomEvent = (
  eventName: string,
  data: Record<string, any> = {}
) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("trackCustom", eventName, data);
  }
};
