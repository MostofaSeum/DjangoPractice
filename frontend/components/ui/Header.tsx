"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import CartButton from "@/features/cart/components/CartButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageToggle from "@/components/ui/LanguageToggle";
import MarqueeTicker from "@/components/ui/MarqueeTicker";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/store/LanguageContext";
import { siteConfig } from "@/config/siteConfig";
import Swal from "sweetalert2";

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { clearCart } = useCart();
  const { t, locale } = useLanguage();
  const isBn = locale === "bn";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [brandTitleEn, setBrandTitleEn] = useState("VIBEMART");
  const [brandTitleBn, setBrandTitleBn] = useState("");
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  const brandTitle = isBn ? (brandTitleBn || brandTitleEn) : brandTitleEn;

  useEffect(() => {
    const fetchSiteBrand = async () => {
      try {
        const res = await fetch(`${API_BASE}/store/site-settings/`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setSiteSettings(data);
          if (data.site_title) setBrandTitleEn(data.site_title);
          if (data.site_title_bn) setBrandTitleBn(data.site_title_bn);
          if (data.logo) setBrandLogo(data.logo);
        }
      } catch (e) {
        console.error("Failed to load header brand settings:", e);
      }
    };
    fetchSiteBrand();
  }, []);

  useEffect(() => {
    if (user?.is_staff && !pathname.includes("/admin")) {
      router.push("/admin");
    }
  }, [user, pathname, router]);

  // Close mobile menu on pathname change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Close dropdown & mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement)?.closest("#mobile-menu-toggle-btn")
      ) {
        setMobileMenuOpen(false);
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
    { name: t("nav.home"), href: "/" },
    { name: t("nav.shop"), href: "/products" },
    { name: t("nav.categories"), href: "/collections" },
    { name: t("nav.giftCards"), href: "/gift-cards" },
  ];

  if (user?.is_staff) {
    return null;
  }

  const userName = user?.first_name || user?.username || "Account";

  return (
    <header className="w-full z-50 py-2.5 sm:py-3.5 md:py-5 px-2.5 sm:px-6 md:px-12 bg-secondary text-foreground sticky top-0 shadow-xs border-b border-foreground/10 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Brand Logo & Title */}
        <Link
          href="/"
          className="flex items-center gap-1.5 sm:gap-3 hover:opacity-90 transition-opacity group shrink min-w-0"
        >
          {brandLogo && (
            <img
              src={brandLogo}
              alt={brandTitle}
              className="h-6 sm:h-8 md:h-9 max-w-[80px] sm:max-w-[120px] object-contain group-hover:scale-105 transition-transform shrink-0"
            />
          )}
          {brandTitle && (
            <span className="text-base sm:text-xl md:text-2xl font-black tracking-tighter uppercase text-foreground truncate">
              {brandTitle}
            </span>
          )}
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
                    ? "border-b-2 border-accent text-accent font-black"
                    : "text-foreground/75 hover:text-accent font-extrabold"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Icons (Language, Theme, Cart, Auth) */}
        <div className="flex items-center gap-1 sm:gap-2.5 md:gap-5 text-[11px] font-bold uppercase tracking-widest shrink-0">
          <LanguageToggle />
          <ThemeToggle />
          <div className="px-0.5 sm:px-1">
            <CartButton />
          </div>

          {/* Auth Dropdown Logic */}
          {user ? (
            <div className="relative ml-0.5 sm:ml-2 md:ml-3" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="hover:bg-foreground/10 transition-all bg-foreground/5 px-2 py-1 sm:px-4 sm:py-2 rounded-full border border-foreground/15 font-bold flex items-center gap-1 text-foreground shadow-xs text-[10px] sm:text-[11px] max-w-[100px] sm:max-w-[170px]"
              >
                <span className="truncate">
                  {userName}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 shrink-0 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-secondary text-foreground border border-foreground/15 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-md animate-fadeIn py-2">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-foreground/5 transition-colors font-bold text-[11px] uppercase tracking-wider"
                  >
                    <img
                      src="/user.png"
                      alt="Profile"
                      className="w-4 h-4 object-contain dark:brightness-0 dark:invert"
                    />
                    {t("nav.profile")}
                  </Link>

                  <Link
                    href="/wishlist"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-foreground/5 transition-colors font-bold text-[11px] uppercase tracking-wider"
                  >
                    <img
                      src="/love.png"
                      alt="Wishlist"
                      className="w-4 h-4 object-contain"
                    />
                    {t("nav.wishlist")}
                  </Link>

                  <div className="my-1.5 border-t border-foreground/10" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/15 text-red-500 transition-colors font-bold text-[11px] uppercase tracking-wider"
                  >
                    <img
                      src="/logout.png"
                      alt="Sign Out"
                      className="w-4 h-4 object-contain"
                    />
                    {t("nav.signOut")}
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
              className="ml-0.5 sm:ml-2 md:ml-3 hover:bg-foreground/10 transition-all bg-foreground/5 px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-full border border-foreground/15 font-bold shadow-xs text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap text-foreground"
            >
              {t("nav.signIn")}
            </Link>
          )}

          {/* Mobile Burger Menu Button (Phone View Only) */}
          <button
            id="mobile-menu-toggle-btn"
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="md:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-foreground/5 hover:bg-foreground/10 active:scale-95 border border-foreground/15 text-foreground transition-all flex flex-col items-center justify-center gap-[4px] sm:gap-[5px] cursor-pointer select-none shrink-0"
          >
            {/* Morphing Hamburger / X Bars */}
            <span
              className={`block h-0.5 w-4.5 rounded-full bg-current transform transition-all duration-300 ease-in-out origin-center ${
                mobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-4.5 rounded-full bg-current transition-all duration-200 ease-in-out ${
                mobileMenuOpen ? "opacity-0 scale-x-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-0.5 w-4.5 rounded-full bg-current transform transition-all duration-300 ease-in-out origin-center ${
                mobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu (Phone View Only) */}
      <div
        ref={mobileMenuRef}
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen
            ? "max-h-80 opacity-100 mt-3 pt-3 pb-2 border-t border-foreground/10 pointer-events-auto"
            : "max-h-0 opacity-0 mt-0 pt-0 pb-0 border-t-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-1.5">
          {navLinks.map((link, idx) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  transitionDelay: mobileMenuOpen ? `${idx * 45}ms` : "0ms",
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 transform ${
                  mobileMenuOpen
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-2 opacity-0"
                } ${
                  isActive
                    ? "bg-foreground/10 text-accent font-black border-l-4 border-accent shadow-xs"
                    : "text-foreground/80 hover:text-accent hover:bg-foreground/5 active:scale-[0.99]"
                }`}
              >
                <span>{link.name}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-xs" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
