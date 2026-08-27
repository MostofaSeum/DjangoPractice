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

export const metadata: Metadata = {
  title: "VibeMart - Electric Premium Storefront",
  description: "High-end streetwear and premium digital aesthetics.",
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
