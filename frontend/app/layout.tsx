import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { CartProvider } from "@/store/CartContext";
import { AuthProvider } from "@/store/AuthContext";
import { WishlistProvider } from "@/store/WishlistContext";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VibeMart - Premium Cosmetics & Beauty Store",
    template: "%s | VibeMart",
  },
  description: "Luxury cosmetics, skincare essentials, lipsticks, and premium beauty products.",
  keywords: ["e-commerce", "cosmetics", "beauty", "makeup", "skincare", "lipstick", "storefront"],
  authors: [{ name: "VibeMart" }],
  creator: "VibeMart",
  publisher: "VibeMart",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "VibeMart - Premium Cosmetics & Beauty Store",
    description: "Luxury cosmetics, skincare essentials, lipsticks, and premium beauty products.",
    siteName: "VibeMart",
    images: [
      {
        url: "/HomePage/shopping-cart.png",
        width: 800,
        height: 600,
        alt: "VibeMart Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeMart - Premium Cosmetics & Beauty Store",
    description: "Luxury cosmetics, skincare essentials, lipsticks, and premium beauty products.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { ThemeProvider } from "@/store/ThemeContext";
import { LanguageProvider } from "@/store/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <Header />
                  <div className="flex-1">{children}</div>
                  <Footer />
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
