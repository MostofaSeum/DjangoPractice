import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login to VibeMart - Access Your Beauty Account",
  description: "Log in to your VibeMart account to track orders, manage your wishlist, view VibeCoin loyalty rewards, and enjoy faster checkout.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
