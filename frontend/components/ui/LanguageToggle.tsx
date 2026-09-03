"use client";

import { useLanguage } from "@/store/LanguageContext";
import { useEffect, useState } from "react";

export default function LanguageToggle() {
  const { locale, toggleLocale } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-16 h-8 rounded-full border border-white/20 bg-white/10" />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleLocale();
      }}
      aria-label="Toggle Language"
      title={locale === "en" ? "বাংলা ভাষায় দেখুন" : "Switch to English"}
      className="p-0.5 sm:p-1 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-logo transition-all flex items-center gap-0.5 cursor-pointer select-none text-[9px] sm:text-[10px] font-black uppercase tracking-wider active:scale-95 shadow-sm"
    >
      <span
        className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition-all duration-200 ${
          locale === "en"
            ? "bg-accent text-button-fg shadow-sm font-black"
            : "text-logo opacity-50 hover:opacity-80"
        }`}
      >
        EN
      </span>
      <span
        className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition-all duration-200 ${
          locale === "bn"
            ? "bg-accent text-button-fg shadow-sm font-black"
            : "text-logo opacity-50 hover:opacity-80"
        }`}
      >
        বাং
      </span>
    </button>
  );
}

