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
      <div className="w-16 h-8 rounded-full border border-foreground/15 bg-primary/5 animate-pulse" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/15 bg-primary/5 hover:bg-primary/10 text-foreground text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-xs cursor-pointer select-none active:scale-95"
      title={locale === "en" ? "Switch to বাংলা" : "Switch to English"}
    >
      <span className="text-xs">🌐</span>
      <span className={locale === "en" ? "text-accent font-black" : "opacity-60"}>
        EN
      </span>
      <span className="opacity-40">/</span>
      <span className={locale === "bn" ? "text-accent font-black" : "opacity-60"}>
        বাং
      </span>
    </button>
  );
}
