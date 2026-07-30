export const siteConfig = {
  name: "VibeMart",
  description: "Your modern multi-category ecommerce store",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  defaultLocale: "en",
  locales: ["en", "bn", "es"],
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
