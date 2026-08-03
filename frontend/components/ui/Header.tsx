"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import CartButton from "@/features/cart/components/CartButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { clearCart } = useCart();

  useEffect(() => {
    if (user?.is_staff && !pathname.includes("/admin")) {
      router.push("/admin");
    }
  }, [user, pathname, router]);

  const handleLogout = async () => {
    logout();
    await clearCart();
  };

  const navLinks = [
    { name: "HOME", href: "/" },
    { name: "SHOP", href: "/products" },
    { name: "COLLECTIONS", href: "/collections" },
  ];

  if (user?.is_staff) {
    return null;
  }

  return (
    <header className="w-full z-50 py-5 px-8 md:px-12 bg-primary text-background sticky top-0 shadow-md border-b border-white/5 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter uppercase text-background hover:opacity-90 transition-opacity">
          VIBEMART
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-widest">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-all py-1 ${
                  isActive
                    ? "text-background border-b-2 border-background font-black"
                    : "text-background/90 hover:text-background font-extrabold"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Icons (Theme, Cart, Auth) */}
        <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest">
          <ThemeToggle />
          <CartButton />

          {/* Auth Button Logic */}
          {user ? (
            <div className="flex items-center gap-3 ml-2">
              <Link
                href="/profile"
                className="text-background font-bold hover:underline transition-all text-[10px]"
              >
                Hi, {user.first_name || user.username}
              </Link>

              {user.is_staff ? (
                <Link
                  href="/admin"
                  className="bg-accent text-white px-3 py-1.5 rounded-lg border border-white/20 hover:bg-accent/80 transition-all font-black text-[10px] tracking-wider"
                >
                  Admin
                </Link>
              ) : null}

              <button
                onClick={handleLogout}
                className="text-background hover:bg-white/25 transition-all bg-white/15 px-4 py-2 rounded-full border border-white/30 font-bold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href={pathname && pathname !== "/" ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login"}
              className="text-background hover:bg-white/25 transition-all bg-white/15 px-4 py-2 rounded-full border border-white/30 font-bold"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
