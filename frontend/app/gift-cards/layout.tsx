import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VibeMart Gift Cards - Digital Beauty Vouchers & Instant Store Credit",
  description: "Give the gift of luxury beauty with VibeMart Gift Cards. Instant digital delivery, redeemable across all cosmetics, lipsticks, and skincare collections.",
  keywords: ["vibemart gift card", "beauty gift cards", "cosmetics vouchers", "makeup gift cards", "vibemart voucher"],
  alternates: {
    canonical: "/gift-cards",
  },
  openGraph: {
    title: "VibeMart Gift Cards - Digital Beauty Vouchers & Instant Store Credit",
    description: "Give the gift of luxury beauty with VibeMart Gift Cards. Instant digital delivery, redeemable across all cosmetics, lipsticks, and skincare collections.",
    url: "/gift-cards",
    type: "website",
    images: [
      {
        url: "/brand-icon.png",
        width: 1024,
        height: 1024,
        alt: "VibeMart Gift Cards",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "VibeMart Gift Cards - Digital Beauty Vouchers",
    description: "Give the gift of luxury beauty with VibeMart Gift Cards.",
    images: ["/brand-icon.png"],
  },
};

export default function GiftCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
