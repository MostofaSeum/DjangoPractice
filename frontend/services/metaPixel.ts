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

// Initialize Meta Pixel
export const initMetaPixel = (pixelId: string) => {
  if (typeof window === "undefined" || !pixelId) return;

  if (typeof window.fbq === "function" && (window.fbq as any).loaded) {
    return;
  }

  // Standard Meta Pixel snippet
  const fbq: any = function (...args: any[]) {
    fbq.callMethod ? fbq.callMethod.apply(fbq, args) : fbq.queue.push(args);
  };
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;

  // Insert fbevents.js script
  const scriptId = "meta-pixel-fbevents";
  if (!document.getElementById(scriptId)) {
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  }

  window.fbq?.("init", pixelId);
  window.fbq?.("track", "PageView");

  if (process.env.NODE_ENV === "development") {
    console.log(`[MetaPixel] Initialized with ID: ${pixelId}`);
  }
};

// Track standard PageView
export const trackPageView = () => {
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV === "development") {
    console.log("[MetaPixel] Track: PageView");
  }

  if (typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  } else if (window._fbq && Array.isArray((window._fbq as any).queue)) {
    (window._fbq as any).push(["track", "PageView"]);
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
