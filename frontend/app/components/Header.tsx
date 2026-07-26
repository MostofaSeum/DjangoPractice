"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CartButton from "./CartButton";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { clearCart } = useCart();

  const handleLogout = async () => {
    logout();
    await clearCart();
  };

  const navLinks = [
    { name: "HOME", href: "/" },
    { name: "SHOP", href: "/products" },
    { name: "COLLECTIONS", href: "/collections" },
  ];

  // Hide header for Admin/Staff users
  if (user?.is_staff) {
    return null;
  }

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

          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest">
            {user ? (
              <div className="flex items-center gap-3">
                {user.is_staff && (
                  <Link
                    href="/admin"
                    className="bg-[#8b7a66] text-white px-3 py-1.5 rounded-lg border border-white/20 hover:bg-[#a39079] transition-all font-black text-[10px] tracking-wider"
                  >
                    ADMIN
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="text-[#e6e0d4]/80 hover:text-white hover:underline transition-all text-[10px]"
                >
                  HI, {user.first_name || user.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-[#e6e0d4] hover:text-white transition-all bg-white/10 px-4 py-2 rounded-full border border-white/20 hover:bg-white/20"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-[#e6e0d4] hover:text-white transition-all bg-white/10 px-4 py-2 rounded-full border border-white/20 hover:bg-white/20"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
