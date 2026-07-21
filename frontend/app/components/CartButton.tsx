"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";

export default function CartButton() {
  const { itemCount } = useCart();

  return (
    <Link href="/cart" className="relative text-[#3a3532] hover:opacity-70 transition-opacity hover:scale-110 duration-300">
      <Image src="/HomePage/shopping-cart.png" width={23} height={23} alt="Cart" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-[#8b7a66] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
