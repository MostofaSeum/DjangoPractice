"use client";

import Link from "next/link";
import { useLanguage } from "@/store/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="relative bg-primary text-button-fg border-t border-foreground/15 mt-auto transition-colors duration-300 overflow-hidden">
      {/* 🌟 Top Navigation Bar with Dot Separators */}
      <div className="border-b border-foreground/10 py-4 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[11px] font-black uppercase tracking-widest text-button-fg">
          <Link
            href="/products"
            className="hover:text-accent transition-colors cursor-pointer"
          >
            {t("footer.aboutUs")}
          </Link>
          <span className="opacity-30">•</span>
          <Link
            href="/products"
            className="hover:text-accent transition-colors cursor-pointer"
          >
            {t("footer.contactUs")}
          </Link>
          <span className="opacity-30">•</span>
          <Link
            href="/profile"
            className="hover:text-accent transition-colors cursor-pointer"
          >
            {t("footer.myAccount")}
          </Link>
          <span className="opacity-30">•</span>
          <Link
            href="/profile"
            className="hover:text-accent transition-colors cursor-pointer"
          >
            {t("footer.orderTracking")}
          </Link>
          <span className="opacity-30">•</span>
          <Link
            href="/products"
            className="hover:text-accent transition-colors cursor-pointer"
          >
            {t("footer.refundPolicy")}
          </Link>
        </div>
      </div>

      {/* 🌟 Main 3-Column Body */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 items-center">
          {/* Left Column: Contact Details & Payment Badges */}
          <div className="md:col-span-4 space-y-4 text-xs">
            {/* Phone */}
            <div className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 text-accent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </span>
              <a
                href="tel:+8801700000000"
                className="font-bold hover:text-accent transition-colors tracking-wider"
              >
                {t("footer.phone")}
              </a>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 text-accent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </span>
              <p className="opacity-80 leading-relaxed font-medium">
                {t("footer.address")}
              </p>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 text-accent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <a
                href="mailto:support@vibemart.com"
                className="opacity-80 hover:text-accent hover:opacity-100 transition-colors font-medium"
              >
                {t("footer.email")}
              </a>
            </div>

            {/* Working Hours */}
            <div className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 text-accent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              <p className="opacity-80 font-medium">{t("footer.hours")}</p>
            </div>

            {/* Payment & Courier Partner Badges */}
            <div className="pt-3 flex items-center gap-2 flex-wrap">
              <div className="px-2.5 py-1 rounded bg-secondary text-foreground text-[10px] font-black uppercase tracking-widest border border-foreground/20 shadow-xs">
                SSLCOMMERZ
              </div>
              <div className="px-2.5 py-1 rounded bg-[#e2136e] text-white text-[10px] font-black uppercase tracking-widest shadow-xs">
                bKash
              </div>
              <div className="px-2.5 py-1 rounded bg-[#f15a24] text-white text-[10px] font-black uppercase tracking-widest shadow-xs">
                Nagad
              </div>
              <div className="px-2.5 py-1 rounded bg-secondary text-foreground text-[10px] font-black uppercase tracking-widest border border-foreground/20 shadow-xs flex items-center gap-1">
                <span>🤝</span>
                <span>COD</span>
              </div>
            </div>
          </div>

          {/* Middle Column: Brand Logo & Social Icons */}
          <div className="md:col-span-4 text-center flex flex-col items-center justify-center space-y-5">
            <Link href="/" className="inline-block group">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-button-fg group-hover:text-accent transition-colors block">
                VibeMart
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="h-[1px] w-6 bg-accent" />
                <span className="text-[10px] font-bold tracking-[0.25em] text-accent uppercase">
                  MAKE-UP STYLE
                </span>
                <span className="h-[1px] w-6 bg-accent" />
              </div>
            </Link>

            {/* Social Icons Row */}
            <div className="flex items-center justify-center gap-4 text-button-fg">
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:text-accent hover:scale-110 transition-all opacity-80 hover:opacity-100"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:text-accent hover:scale-110 transition-all opacity-80 hover:opacity-100"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:text-accent hover:scale-110 transition-all opacity-80 hover:opacity-100"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:text-accent hover:scale-110 transition-all opacity-80 hover:opacity-100"
                aria-label="WhatsApp"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:text-accent hover:scale-110 transition-all opacity-80 hover:opacity-100"
                aria-label="TikTok"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Column: Brand Philosophy Description & Read More */}
          <div className="md:col-span-4 text-center md:text-right space-y-4 text-xs">
            <p className="opacity-80 leading-relaxed font-medium">
              {t("footer.brandDescription")}
            </p>
            <div>
              <Link
                href="/products"
                className="inline-block text-[11px] font-black uppercase tracking-widest text-accent hover:underline"
              >
                {t("footer.readMore")}
              </Link>
            </div>
          </div>
        </div>

        {/* 🌟 Floating Scroll To Top Button (Right Aligned Floating Pill) */}
        <button
          onClick={scrollToTop}
          className="absolute right-4 md:right-8 bottom-6 w-11 h-11 rounded-full bg-accent text-button-fg flex items-center justify-center shadow-lg hover:opacity-90 hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
          title="Scroll to Top"
          aria-label="Scroll to top"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* 🌟 Bottom Sub-Footer: Privacy / Terms / FAQ / Copyright */}
      <div className="border-t border-foreground/10 py-5 px-6 md:px-12 bg-primary/80">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-button-fg">
          <div className="flex flex-wrap items-center justify-center gap-4 opacity-80">
            <Link href="/products" className="hover:text-accent transition-colors">
              {t("footer.privacyPolicy")}
            </Link>
            <span className="opacity-40">•</span>
            <Link href="/products" className="hover:text-accent transition-colors">
              {t("footer.terms")}
            </Link>
            <span className="opacity-40">•</span>
            <Link href="/products" className="hover:text-accent transition-colors">
              {t("footer.faq")}
            </Link>
          </div>

          <div className="opacity-60 text-[10px] tracking-widest text-center">
            {t("footer.copyright")}
          </div>
        </div>
      </div>
    </footer>
  );
}
