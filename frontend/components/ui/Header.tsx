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
    <header className="w-full z-50 py-5 px-8 md:px-12 bg-primary text-[var(--background)] dark:text-[var(--foreground)] sticky top-0 shadow-md border-b border-white/5 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter uppercase text-[var(--background)] dark:text-[var(--foreground)] hover:opacity-90 transition-opacity">
          VibeMart
        </Link>

        {/* Right Section*/}
        <div className="flex items-center gap-6 md:gap-10">
          <nav className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-widest">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/" || pathname === "/en" || pathname === "/bn"
                  : pathname.includes(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-all py-1 ${
                    isActive
                      ? "text-white border-b-2 border-white font-extrabold"
                      : "text-[var(--background)]/70 dark:text-[var(--foreground)]/70 hover:text-white font-bold"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <CartButton />
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest">
            {user ? (
              <div className="flex items-center gap-3">
                {user.is_staff && (
                  <Link
                    href="/admin"
                    className="bg-accent text-white px-3 py-1.5 rounded-lg border border-white/20 hover:bg-accent/80 transition-all font-black text-[10px] tracking-wider"
                  >
                    ADMIN
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="text-[var(--background)]/80 dark:text-[var(--foreground)]/80 hover:text-white hover:underline transition-all text-[10px]"
                >
                  HI, {user.first_name || user.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-[var(--background)] dark:text-[var(--foreground)] hover:text-white transition-all bg-white/10 px-4 py-2 rounded-full border border-white/20 hover:bg-white/20"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-[var(--background)] dark:text-[var(--foreground)] hover:text-white transition-all bg-white/10 px-4 py-2 rounded-full border border-white/20 hover:bg-white/20"
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
