import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Shopping Bag | VibeMart",
  description: "Review and manage your selected beauty, makeup, and skincare items in your VibeMart shopping bag.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
