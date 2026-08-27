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
      className="px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-logo transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none text-[11px] font-black uppercase tracking-wider active:scale-95 shadow-sm"
    >
      <span className={locale === "en" ? "text-accent font-black drop-shadow-sm" : "opacity-60"}>
        EN
      </span>
      <span className="opacity-30 text-[9px] font-normal">|</span>
      <span className={locale === "bn" ? "text-accent font-black drop-shadow-sm" : "opacity-60"}>
        বাং
      </span>
    </button>
  );
}

