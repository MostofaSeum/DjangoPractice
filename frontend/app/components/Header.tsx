"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CartButton from "./CartButton";

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { name: "HOME", href: "/" },
    { name: "SHOP", href: "/products" },
    { name: "COLLECTIONS", href: "/collections" },
  ];

  return (
    <header className="w-full z-50 py-5 px-8 md:px-12 bg-[#3a3532] text-[#e6e0d4] sticky top-0 shadow-md border-b border-white/5">
      <div className="max-w-[1400px] mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter uppercase text-[#e6e0d4] hover:opacity-90 transition-opacity">
          VibeMart
        </Link>

        {/* Right Section*/}
        <div className="flex items-center gap-10">
          <nav className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-widest">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-all py-1 ${
                    isActive
                      ? "text-white border-b-2 border-white font-extrabold"
                      : "text-[#e6e0d4]/70 hover:text-white font-bold"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            
          </nav>

          <CartButton />

          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest">
            <button className="text-[#e6e0d4] hover:text-white transition-all bg-white/10 px-4 py-2 rounded-full border border-white/20 hover:bg-white/20">Sign In</button>
          </div>
        </div>
      </div>
    </header>
  );
}
