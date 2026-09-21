import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { CartProvider } from "@/store/CartContext";
import { AuthProvider } from "@/store/AuthContext";
import { WishlistProvider } from "@/store/WishlistContext";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import FloatingChatWidget from "@/components/ui/FloatingChatWidget";
import MetaPixel from "@/components/analytics/MetaPixel";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import GoogleTagManager from "@/components/analytics/GoogleTagManager";
import { Suspense } from "react";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

import { ThemeProvider } from "@/store/ThemeContext";
import { LanguageProvider } from "@/store/LanguageContext";
import { getApiBaseUrl } from "@/config/siteConfig";
import { generateThemeCssVariables, DEFAULT_THEME_PALETTE_ID } from "@/config/themePalettes";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiBaseUrl = getApiBaseUrl();
  let pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
  let gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
  let gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "";
  let themePalette = DEFAULT_THEME_PALETTE_ID;
  try {
    const res = await fetch(`${apiBaseUrl}/store/site-settings/`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.theme_palette) {
        themePalette = String(data.theme_palette).trim();
      }
      if (data.meta_pixel_id) {
        pixelId = String(data.meta_pixel_id).trim();
      }
      if (data.google_analytics_id) {
        gaId = String(data.google_analytics_id).trim();
      }
      if (data.google_tag_manager_id) {
        gtmId = String(data.google_tag_manager_id).trim();
      }
    }
  } catch {
    // Non-critical fallback
  }

  const dynamicThemeCss = generateThemeCssVariables(themePalette);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {pixelId ? (
          <>
            <script
              id="meta-pixel-script"
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        ) : null}
        {gaId ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <script
              id="google-analytics-init"
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
        ) : null}
        <style
          id="vibemart-theme-vars"
          dangerouslySetInnerHTML={{ __html: dynamicThemeCss }}
        />
      </head>
      <body className="min-h-full flex flex-col overflow-x-clip transition-colors duration-300">
        {gtmId ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}
        <Suspense fallback={null}>
          <GoogleTagManager initialGtmId={gtmId} />
        </Suspense>
        <Suspense fallback={null}>
          <MetaPixel initialPixelId={pixelId} />
        </Suspense>
        <Suspense fallback={null}>
          <GoogleAnalytics initialGaId={gaId} />
        </Suspense>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <Header />
                  <div className="flex-1">{children}</div>
                  <Footer />
                  <FloatingChatWidget />
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
