"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import CartButton from "@/features/cart/components/CartButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import Swal from "sweetalert2";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { clearCart } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.is_staff && !pathname.includes("/admin")) {
      router.push("/admin");
    }
  }, [user, pathname, router]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    logout();
    await clearCart();
    Swal.fire({
      position: "top-end",
      icon: "success",
      title: "Signed out successfully",
      showConfirmButton: false,
      timer: 1800,
      toast: true,
    });
    router.push("/");
  };

  const navLinks = [
    { name: "HOME", href: "/" },
    { name: "SHOP", href: "/products" },
    { name: "COLLECTIONS", href: "/collections" },
    { name: "GIFT CARDS", href: "/gift-cards" },
  ];

  if (user?.is_staff) {
    return null;
  }

  const userName = user?.first_name || user?.username || "Account";

  return (
    <header className="w-full z-50 py-5 px-8 md:px-12 bg-primary text-logo sticky top-0 shadow-md border-b border-white/5 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="text-xl md:text-2xl font-black tracking-tighter uppercase hover:opacity-90 transition-opacity"
        >
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
                    ? "border-b-2 border-current font-black"
                    : "opacity-90 hover:opacity-100 font-extrabold"
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

          {/* Auth Dropdown Logic */}
          {user ? (
            <div className="relative ml-2" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="hover:bg-white/25 transition-all bg-white/15 px-4 py-2 rounded-full border border-white/30 font-bold flex items-center gap-2 text-logo shadow-sm"
              >
                <span>Hi, {userName}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-primary text-logo border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-md animate-fadeIn py-2">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/15 transition-colors font-bold text-[11px] uppercase tracking-wider"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </Link>

                  <Link
                    href="/wishlist"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/15 transition-colors font-bold text-[11px] uppercase tracking-wider"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-red-400"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                    My Wishlist
                  </Link>

                  {user.is_staff && (
                    <Link
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/15 transition-colors font-bold text-[11px] uppercase tracking-wider text-accent"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      Admin Dashboard
                    </Link>
                  )}

                  <div className="my-1.5 border-t border-white/15" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/20 text-red-300 transition-colors font-bold text-[11px] uppercase tracking-wider"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={
                pathname && pathname !== "/"
                  ? `/login?redirect=${encodeURIComponent(pathname)}`
                  : "/login"
              }
              className="hover:bg-white/25 transition-all bg-white/15 px-4 py-2 rounded-full border border-white/30 font-bold"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
