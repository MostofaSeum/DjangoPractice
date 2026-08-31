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
            <div className="flex items-center justify-center gap-5 text-button-fg">
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-6 h-6 relative shrink-0 hover:scale-110 transition-all opacity-80 hover:opacity-100 cursor-pointer"
                aria-label="Facebook"
              >
                <img
                  src="/Footer/social-media.png"
                  alt="Facebook"
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-6 h-6 relative shrink-0 hover:scale-110 transition-all opacity-80 hover:opacity-100 cursor-pointer"
                aria-label="Instagram"
              >
                <img
                  src="/Footer/instagram.png"
                  alt="Instagram"
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-6 h-6 relative shrink-0 hover:scale-110 transition-all opacity-80 hover:opacity-100 cursor-pointer"
                aria-label="YouTube"
              >
                <img
                  src="/Footer/youtube.png"
                  alt="YouTube"
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </a>

              {/* WhatsApp */}
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noreferrer"
                className="w-6 h-6 relative shrink-0 hover:scale-110 transition-all opacity-80 hover:opacity-100 cursor-pointer"
                aria-label="WhatsApp"
              >
                <img
                  src="/Footer/whatsapp.png"
                  alt="WhatsApp"
                  className="w-full h-full object-contain brightness-0 invert"
                />
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
