import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wishlist | VibeMart",
  description: "View and manage your saved favorite luxury cosmetics and beauty essentials on VibeMart.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
