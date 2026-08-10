export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    // Running on Next.js Server inside Docker container
    return (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://backend:8000").replace(/\/+$/, "");
  }
  // Running in User's Browser
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
}

export const siteConfig = {
  name: "VibeMart",
  description: "Your modern multi-category ecommerce store",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  defaultLocale: "en",
  locales: ["en", "bn"],
  routes: {
    home: "/",
    products: "/products",
    collections: "/collections",
    cart: "/cart",
    checkout: "/checkout",
    login: "/login",
    register: "/register",
    profile: "/profile",
    admin: "/admin",
  },
};
