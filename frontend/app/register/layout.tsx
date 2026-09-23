import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a VibeMart Account - Join VibeMart Beauty",
  description: "Sign up for a free VibeMart account today. Earn VibeCoins on every order, save your favorite cosmetics, and get exclusive member-only beauty deals.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
