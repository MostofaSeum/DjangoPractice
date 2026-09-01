"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/store/LanguageContext";
import { siteConfig } from "@/config/siteConfig";

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

export default function Footer() {
  const { t } = useLanguage();

  const [siteData, setSiteData] = useState({
    site_title: "VibeMart",
    tagline: "",
    brand_description: "",
    support_phone: "",
    support_email: "",
    store_address: "",
    working_hours: "",
    facebook_url: "",
    instagram_url: "",
    youtube_url: "",
    whatsapp_number: "",
    footer_copyright: "© 2026 VIBEMART. ALL RIGHTS RESERVED.",
    logo: null as string | null,
  });

  const [paymentMethods, setPaymentMethods] = useState({
    bkash_active: true,
    nagad_active: true,
    cod_active: true,
    vibecoin_active: true,
  });

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const [siteRes, paymentRes] = await Promise.all([
          fetch(`${API_BASE}/store/site-settings/`, { cache: "no-store" }),
          fetch(`${API_BASE}/store/payment-settings/`, { cache: "no-store" }),
        ]);

        if (siteRes.ok) {
          const data = await siteRes.json();
          setSiteData({
            site_title: data.site_title !== undefined && data.site_title !== null ? data.site_title : "VibeMart",
            tagline: data.tagline || "",
            brand_description: data.brand_description || "",
            support_phone: data.support_phone || "",
            support_email: data.support_email || "",
            store_address: data.store_address || "",
            working_hours: data.working_hours || "",
            facebook_url: data.facebook_url || "",
            instagram_url: data.instagram_url || "",
            youtube_url: data.youtube_url || "",
            whatsapp_number: data.whatsapp_number || "",
            footer_copyright: data.footer_copyright || "© 2026 VIBEMART. ALL RIGHTS RESERVED.",
            logo: data.logo || null,
          });
        }

        if (paymentRes.ok) {
          const pData = await paymentRes.json();
          setPaymentMethods({
            bkash_active: pData.bkash_active !== false,
            nagad_active: pData.nagad_active !== false,
            cod_active: pData.cod_active !== false,
            vibecoin_active: pData.vibecoin_active !== false,
          });
        }
      } catch (err) {
        console.error("Failed to load footer settings:", err);
      }
    };

    fetchSiteSettings();
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const whatsappHref = siteData.whatsapp_number.startsWith("http")
    ? siteData.whatsapp_number
    : `https://wa.me/${siteData.whatsapp_number.replace(/[^0-9]/g, "")}`;

  const hasContactInfo =
    Boolean(siteData.support_phone) ||
    Boolean(siteData.store_address) ||
    Boolean(siteData.support_email) ||
    Boolean(siteData.working_hours);

  const hasSocialLinks =
    Boolean(siteData.facebook_url) ||
    Boolean(siteData.instagram_url) ||
    Boolean(siteData.youtube_url) ||
    Boolean(siteData.whatsapp_number);

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
            {siteData.support_phone && (
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
                  href={`tel:${siteData.support_phone.replace(/[^0-9+]/g, "")}`}
                  className="font-bold hover:text-accent transition-colors tracking-wider"
                >
                  {siteData.support_phone}
                </a>
              </div>
            )}

            {/* Address */}
            {siteData.store_address && (
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
                  {siteData.store_address}
                </p>
              </div>
            )}

            {/* Email */}
            {siteData.support_email && (
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
                  href={`mailto:${siteData.support_email}`}
                  className="opacity-80 hover:text-accent hover:opacity-100 transition-colors font-medium"
                >
                  {siteData.support_email}
                </a>
              </div>
            )}

            {/* Working Hours */}
            {siteData.working_hours && (
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
                <p className="opacity-80 font-medium">{siteData.working_hours}</p>
              </div>
            )}

            {/* Payment & Courier Partner Badges */}
            {(paymentMethods.bkash_active ||
              paymentMethods.nagad_active ||
              paymentMethods.vibecoin_active ||
              paymentMethods.cod_active) && (
              <div className="pt-3 flex items-center gap-2.5 flex-wrap">
                {/* bKash */}
                {paymentMethods.bkash_active && (
                  <div className="h-7 px-2.5 py-1 rounded-md bg-white flex items-center justify-center shadow-xs border border-white/20">
                    <img
                      src="/Footer/bKash.png"
                      alt="bKash"
                      className="h-full max-h-5 object-contain"
                    />
                  </div>
                )}

                {/* Nagad */}
                {paymentMethods.nagad_active && (
                  <div className="h-7 px-2.5 py-1 rounded-md bg-white flex items-center justify-center shadow-xs border border-white/20">
                    <img
                      src="/Footer/nagad.webp"
                      alt="Nagad"
                      className="h-full max-h-5 object-contain"
                    />
                  </div>
                )}

                {/* VibeCoin */}
                {paymentMethods.vibecoin_active && (
                  <div className="h-7 px-2.5 py-1 rounded-md bg-white flex items-center justify-center shadow-xs border border-white/20">
                    <img
                      src="/Footer/VibeCoin.png"
                      alt="VibeCoin"
                      className="h-full max-h-5 object-contain"
                    />
                  </div>
                )}

                {/* COD */}
                {paymentMethods.cod_active && (
                  <div className="h-7 px-2.5 py-1 rounded-md bg-white flex items-center justify-center shadow-xs border border-white/20">
                    <img
                      src="/Footer/COD.webp"
                      alt="Cash on Delivery"
                      className="h-full max-h-5 object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Middle Column: Brand Logo, Title & Tagline + Social Icons */}
          <div className="md:col-span-4 text-center flex flex-col items-center justify-center space-y-4">
            <Link href="/" className="inline-flex flex-col items-center group">
              {/* 1. Logo on top */}
              {siteData.logo && (
                <img
                  src={siteData.logo}
                  alt={siteData.site_title}
                  className="h-10 md:h-12 max-w-[180px] object-contain mx-auto mb-2 group-hover:scale-105 transition-transform"
                />
              )}

              {/* 2. Title in middle */}
              {siteData.site_title && (
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-button-fg group-hover:text-accent transition-colors block uppercase">
                  {siteData.site_title}
                </span>
              )}

              {/* 3. Tagline on bottom */}
              {siteData.tagline && (
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <span className="h-[1px] w-5 bg-accent" />
                  <span className="text-[10px] font-bold tracking-[0.25em] text-accent uppercase">
                    {siteData.tagline}
                  </span>
                  <span className="h-[1px] w-5 bg-accent" />
                </div>
              )}
            </Link>

            {/* Social Icons Row */}
            {hasSocialLinks && (
              <div className="flex items-center justify-center gap-5 text-button-fg">
                {/* Facebook */}
                {siteData.facebook_url && (
                  <a
                    href={siteData.facebook_url}
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
                )}

                {/* Instagram */}
                {siteData.instagram_url && (
                  <a
                    href={siteData.instagram_url}
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
                )}

                {/* YouTube */}
                {siteData.youtube_url && (
                  <a
                    href={siteData.youtube_url}
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
                )}

                {/* WhatsApp */}
                {siteData.whatsapp_number && (
                  <a
                    href={whatsappHref}
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
                )}
              </div>
            )}
          </div>

          {/* Right Column: Brand Philosophy Description */}
          <div className="md:col-span-4 text-center md:text-right space-y-4 text-xs">
            {siteData.brand_description && (
              <p className="opacity-80 leading-relaxed font-medium">
                {siteData.brand_description}
              </p>
            )}
          </div>
        </div>

        {/* 🌟 Floating Scroll To Top Button */}
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
            {siteData.footer_copyright}
          </div>
        </div>
      </div>
    </footer>
  );
}
