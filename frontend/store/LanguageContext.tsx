"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "@/dictionaries/en.json";
import bn from "@/dictionaries/bn.json";

export type Locale = "en" | "bn";

const dictionaries: Record<Locale, any> = {
  en,
  bn,
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (path: string) => string;
  formatCurrency: (amount: number | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

import { useRouter, usePathname } from "next/navigation";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  
  // Detect initial locale from URL prefix
  const urlIsBn = pathname.startsWith("/bn") || pathname === "/bn";
  const [locale, setLocaleState] = useState<Locale>(urlIsBn ? "bn" : "en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isBnInPath = pathname.startsWith("/bn") || pathname === "/bn";
    if (isBnInPath) {
      setLocaleState("bn");
      localStorage.setItem("vibemart_locale", "bn");
      document.cookie = "NEXT_LOCALE=bn; path=/; max-age=31536000; SameSite=Lax";
    } else {
      setLocaleState("en");
      localStorage.setItem("vibemart_locale", "en");
      document.cookie = "NEXT_LOCALE=en; path=/; max-age=31536000; SameSite=Lax";
    }
    setMounted(true);
  }, [pathname]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("vibemart_locale", newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Seamlessly navigate URL between /... and /bn/...
    if (newLocale === "bn") {
      if (!pathname.startsWith("/bn")) {
        const target = pathname === "/" ? "/bn" : `/bn${pathname}`;
        router.push(target);
      }
    } else {
      if (pathname.startsWith("/bn")) {
        const target = pathname.replace(/^\/bn/, "") || "/";
        router.push(target);
      }
    }
  };

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "bn" : "en";
    setLocale(nextLocale);
  };

  // Helper to resolve nested keys like "hero.newCollection"
  const t = (path: string): string => {
    const keys = path.split(".");
    let current: any = dictionaries[locale] || dictionaries.en;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        // Fallback to English dictionary
        let fallback: any = dictionaries.en;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === "object" && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        return typeof fallback === "string" ? fallback : path;
      }
    }

    return typeof current === "string" ? current : path;
  };

  // Currency & number formatting in Bengali / English
  const formatCurrency = (amount: number | string): string => {
    const num = Number(amount) || 0;
    if (locale === "bn") {
      return `৳${num.toLocaleString("bn-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `৳${num.toFixed(2)}`;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t, formatCurrency }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Safe fallback so components outside provider or during hot reload don't crash
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      toggleLocale: () => {},
      t: (path: string) => {
        const keys = path.split(".");
        let current: any = dictionaries.en;
        for (const k of keys) {
          if (current && typeof current === "object" && k in current) {
            current = current[k];
          } else {
            return path;
          }
        }
        return typeof current === "string" ? current : path;
      },
      formatCurrency: (amount: number | string) => {
        const num = Number(amount) || 0;
        return `৳${num.toFixed(2)}`;
      },
    };
  }
  return context;
}
