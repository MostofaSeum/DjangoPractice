"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "@/dictionaries/en.json";
import bn from "@/dictionaries/bn.json";
import { siteConfig } from "@/config/siteConfig";

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

export type Locale = "en" | "bn";

const dictionaries: Record<Locale, any> = {
  en,
  bn,
};

// Fallback exchange rates against BDT (1 BDT = X Target Currency)
const DEFAULT_RATES_FROM_BDT: Record<string, number> = {
  BDT: 1,
  USD: 0.0082, // ~1 USD = 122 BDT
  EUR: 0.0076, // ~1 EUR = 131 BDT
  GBP: 0.0065, // ~1 GBP = 153 BDT
  INR: 0.70,   // ~1 INR = 1.43 BDT
  SAR: 0.031,  // ~1 SAR = 32.5 BDT
  AED: 0.030,  // ~1 AED = 33.2 BDT
  CAD: 0.011,  // ~1 CAD = 90.5 BDT
};

// Currency Symbols and placement
const CURRENCY_CONFIG: Record<string, { symbol: string; prefix: boolean }> = {
  BDT: { symbol: "৳", prefix: true },
  USD: { symbol: "$", prefix: true },
  EUR: { symbol: "€", prefix: true },
  GBP: { symbol: "£", prefix: true },
  INR: { symbol: "₹", prefix: true },
  SAR: { symbol: "﷼", prefix: false },
  AED: { symbol: "د.إ", prefix: false },
  CAD: { symbol: "CA$", prefix: true },
};

interface LanguageContextType {
  locale: Locale;
  currency: string;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: string) => void;
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
  const [currency, setCurrencyState] = useState<string>("BDT");
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES_FROM_BDT);
  const [mounted, setMounted] = useState(false);

  // Fetch Live Site Settings (Active Currency) + Live Forex Rates
  useEffect(() => {
    const fetchCurrencyAndRates = async () => {
      try {
        // 1. Fetch Active Currency from Site Setting
        const settingRes = await fetch(`${API_BASE}/store/site-settings/`, {
          cache: "no-store",
        }).catch(() => null);

        let activeCurr = "BDT";
        if (settingRes && settingRes.ok) {
          const data = await settingRes.json();
          if (data.currency_code) {
            activeCurr = data.currency_code;
            setCurrencyState(data.currency_code);
          }
        }

        // 2. Fetch Live Forex Rates from Open Exchange API
        const rateRes = await fetch("https://open.er-api.com/v6/latest/BDT").catch(() => null);
        if (rateRes && rateRes.ok) {
          const rateData = await rateRes.json();
          if (rateData && rateData.rates) {
            setRates((prev) => ({
              ...prev,
              ...rateData.rates,
            }));
          }
        }
      } catch (err) {
        console.error("Forex rate fetch error:", err);
      }
    };

    fetchCurrencyAndRates();
  }, []);

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

    if (typeof window !== "undefined") {
      let targetPath = pathname;
      if (newLocale === "bn") {
        if (!pathname.startsWith("/bn")) {
          targetPath = pathname === "/" ? "/bn" : `/bn${pathname}`;
        }
      } else {
        if (pathname.startsWith("/bn")) {
          targetPath = pathname.replace(/^\/bn/, "") || "/";
        }
      }
      if (targetPath !== pathname) {
        window.history.pushState(null, "", targetPath);
      }
    }
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
  };

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "bn" : "en";
    setLocale(nextLocale);
  };

  // Helper to resolve nested dictionary keys
  const t = (path: string): string => {
    const keys = path.split(".");
    let current: any = dictionaries[locale] || dictionaries.en;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
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

  // Dynamic Multi-Currency Converter & Formatter
  const formatCurrency = (amount: number | string): string => {
    const baseAmountInBDT = Number(amount) || 0;
    const rate = rates[currency] || DEFAULT_RATES_FROM_BDT[currency] || 1;
    const convertedAmount = currency === "BDT" ? baseAmountInBDT : baseAmountInBDT * rate;

    const config = CURRENCY_CONFIG[currency] || { symbol: currency, prefix: true };

    if (locale === "bn") {
      const bnFormatted = convertedAmount.toLocaleString("bn-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return config.prefix ? `${config.symbol}${bnFormatted}` : `${bnFormatted} ${config.symbol}`;
    }

    const enFormatted = convertedAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return config.prefix ? `${config.symbol}${enFormatted}` : `${enFormatted} ${config.symbol}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        currency,
        setLocale,
        setCurrency,
        toggleLocale,
        t,
        formatCurrency,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      locale: "en" as Locale,
      currency: "BDT",
      setLocale: () => {},
      setCurrency: () => {},
      toggleLocale: () => {},
      t: (path: string) => path,
      formatCurrency: (amount: number | string) => `৳${(Number(amount) || 0).toFixed(2)}`,
    };
  }
  return context;
}
