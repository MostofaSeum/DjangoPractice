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
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    if (process.env.NODE_ENV === "development") {
      console.log("[MetaPixel] Track: PageView");
    }
    window.fbq("track", "PageView");
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
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    if (process.env.NODE_ENV === "development") {
      console.log(`[MetaPixel] Track: ${eventName}`, data);
    }
    window.fbq("track", eventName, data);
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
