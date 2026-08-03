"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";

export default function CartButton() {
  const { itemCount } = useCart();

  return (
    <Link href="/cart" className="relative text-[var(--background)] dark:text-[var(--foreground)] hover:opacity-80 transition-opacity hover:scale-105 duration-300">
      <Image src="/shopping-cart-white-icon.webp" width={22} height={22} alt="Cart" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2.5 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-md">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
