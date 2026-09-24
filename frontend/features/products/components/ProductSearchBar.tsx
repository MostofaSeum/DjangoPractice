"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/store/LanguageContext";

import { ProductVariant } from "@/types";

export interface ProductSuggestion {
  id: number;
  title: string;
  unit_price: number;
  discount_percent?: number;
  discount_valid_until?: string | null;
  is_discount_active?: boolean;
  discounted_price?: number;
  inventory?: number;
  short_description?: string;
  description?: string;
  slug?: string;
  collection?: number;
  is_trending?: boolean;
  images?: { id?: number; image: string }[];
  variants?: ProductVariant[];
}

interface ProductSearchBarProps {
  initialSearch?: string;
  minPrice?: string;
  maxPrice?: string;
  ordering?: string;
  mode?: "customer" | "admin";
  variant?: "default" | "navbar";
  idPrefix?: string;
  placeholder?: string;
  rotatingWordsEn?: string;
  rotatingWordsBn?: string;
  onSelectProduct?: (product: ProductSuggestion) => void;
  onSearchSubmit?: (query: string) => void;
  onAfterNavigate?: () => void;
  onClear?: () => void;
  className?: string;
}

export default function ProductSearchBar({
  initialSearch = "",
  minPrice,
  maxPrice,
  ordering,
  mode = "customer",
  variant = "default",
  idPrefix,
  placeholder,
  rotatingWordsEn,
  rotatingWordsBn,
  onSelectProduct,
  onSearchSubmit,
  onAfterNavigate,
  onClear,
  className = "",
}: ProductSearchBarProps) {
  const router = useRouter();
  const { t, formatCurrency, locale } = useLanguage();
  const isBn = locale === "bn";
  const [query, setQuery] = useState(initialSearch);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");

  // Default animated search words for placeholder typing effect
  const defaultWordsEn = useMemo(
    () => [
      "Skincare Essentials",
      "Lipstick & Lip Gloss",
      "Moisturizing Creams",
      "Organic Hair Care",
      "Serum & Sunscreen",
    ],
    []
  );
  const defaultWordsBn = useMemo(
    () => [
      "স্কিনকেয়ার প্রোডাক্ট",
      "লিপস্টিক ও মেকআপ",
      "ময়েশ্চারাইজিং ক্রিম",
      "অর্গানিক হেয়ার অয়েল",
      "সিরাম ও সানস্ক্রিন",
    ],
    []
  );

  // Parse comma-separated words from admin settings or fall back to defaults
  const wordsEn = useMemo(() => {
    if (!rotatingWordsEn) return defaultWordsEn;
    const parsed = rotatingWordsEn
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : defaultWordsEn;
  }, [rotatingWordsEn, defaultWordsEn]);

  const wordsBn = useMemo(() => {
    if (!rotatingWordsBn) return defaultWordsBn;
    const parsed = rotatingWordsBn
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : defaultWordsBn;
  }, [rotatingWordsBn, defaultWordsBn]);

  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");

  // Typewriter animation effect - ONLY active on navbar search bar
  useEffect(() => {
    // Only run animated placeholder for navbar variant and when no custom placeholder is passed
    if (variant !== "navbar" || placeholder) return;

    const words = isBn ? wordsBn : wordsEn;
    if (!words || words.length === 0) return;

    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timer: NodeJS.Timeout;
    let isMounted = true;

    const prefix = isBn ? "খুঁজুন " : "Search ";
    // Initial display
    setAnimatedPlaceholder(`${prefix}"..."`);

    const tick = () => {
      if (!isMounted) return;
      const currentWord = words[wordIndex % words.length];

      if (isDeleting) {
        charIndex--;
      } else {
        charIndex++;
      }

      setAnimatedPlaceholder(`${prefix}"${currentWord.substring(0, charIndex)}"`);

      let delay = isDeleting ? 35 : 75;

      if (!isDeleting && charIndex === currentWord.length) {
        // Pause at end of full word before backspacing
        delay = 1800;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        // Finished backspacing this word, switch immediately to next word
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        delay = 400;
      }

      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isBn, placeholder, variant, wordsEn, wordsBn]);

  // Sync external search value changes if provided
  useEffect(() => {
    setQuery(initialSearch);
  }, [initialSearch]);

  // Fetch suggestions when query changes (min 1 character)
  useEffect(() => {
    const trimmed = query.trim();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (trimmed.length < 1) {
      setSuggestions([]);
      setTotalCount(0);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/store/products/?search=${encodeURIComponent(trimmed)}&page_size=6`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const data = await res.json();
          const items: ProductSuggestion[] = Array.isArray(data)
            ? data
            : data.results || [];
          setSuggestions(items);
          setTotalCount(data.count || items.length);
          setIsOpen(true);
        } else {
          setSuggestions([]);
          setTotalCount(0);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Error fetching product search suggestions:", err);
        setSuggestions([]);
        setTotalCount(0);
        setIsOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, API_BASE]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Submit search query
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsOpen(false);

    if (onSearchSubmit) {
      onSearchSubmit(query.trim());
      return;
    }

    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );
    if (query.trim()) {
      params.set("search", query.trim());
    } else {
      params.delete("search");
    }
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (ordering) params.set("ordering", ordering);
    params.delete("page");

    router.push(`/products?${params.toString()}`);
    if (onAfterNavigate) {
      onAfterNavigate();
    }
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    if (onClear) {
      onClear();
    } else if (onSearchSubmit) {
      onSearchSubmit("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSubmit();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const selected = suggestions[selectedIndex];
        setIsOpen(false);
        if (mode === "admin" && onSelectProduct) {
          onSelectProduct(selected);
        } else {
          router.push(`/products/${selected.id}`);
          if (onAfterNavigate) {
            onAfterNavigate();
          }
        }
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Helper to render product image
  const renderProductImage = (
    item: ProductSuggestion,
    size: "sm" | "md" = "md",
  ) => {
    const sizeClass =
      size === "sm" ? "w-8 h-8 rounded-lg" : "w-10 h-10 rounded-xl";
    if (item.images && item.images.length > 0 && item.images[0].image) {
      let src = item.images[0].image;
      if (!src.startsWith("http://") && !src.startsWith("https://")) {
        src = `${API_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
      }
      return (
        <img
          src={src}
          alt={item.title}
          className={`${sizeClass} object-cover border border-foreground/10 bg-primary/5 flex-shrink-0`}
        />
      );
    }
    return (
      <div
        className={`${sizeClass} bg-primary/10 flex items-center justify-center border border-foreground/10 flex-shrink-0`}
      >
        <svg
          className={
            size === "sm" ? "w-4 h-4 opacity-40" : "w-5 h-5 opacity-40"
          }
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  };

  // Highlight matched text in title
  const highlightMatch = (text: string, match: string) => {
    if (!match.trim()) return text;
    const regex = new RegExp(
      `(${match.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);
    return parts.map((part, index) =>
      part.toLowerCase() === match.toLowerCase() ? (
        <span key={index} className="text-accent font-extrabold">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const isAdmin = mode === "admin";
  const isNavbar = variant === "navbar";
  const baseId = idPrefix || (isNavbar ? "navbar" : isAdmin ? "admin" : "catalog");

  return (
    <div
      ref={containerRef}
      className={`relative ${
        isAdmin
          ? "w-full sm:w-auto"
          : isNavbar
            ? "w-full z-50"
            : "w-full max-w-3xl mb-8 z-30"
      } ${className}`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSubmit(e);
        }}
        className={`flex items-center gap-1.5 sm:gap-2 w-full ${isAdmin ? "sm:w-auto" : ""}`}
      >
        {!isAdmin && minPrice && (
          <input type="hidden" name="minPrice" value={minPrice} />
        )}
        {!isAdmin && maxPrice && (
          <input type="hidden" name="maxPrice" value={maxPrice} />
        )}
        {!isAdmin && ordering && (
          <input type="hidden" name="ordering" value={ordering} />
        )}

        <div className={`relative ${isAdmin ? "w-full sm:w-60" : "flex-1 min-w-0"}`}>
          <input
            id={`${baseId}-search-input`}
            type="text"
            name="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              if (query.trim().length >= 1) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              placeholder ||
              (variant === "navbar"
                ? animatedPlaceholder || (isBn ? 'খুঁজুন "..."' : 'Search "..."')
                : isAdmin
                  ? isBn
                    ? "পণ্য দিয়ে খুঁজুন..."
                    : "Search product..."
                  : isNavbar
                    ? isBn
                      ? "পণ্য খুঁজুন..."
                      : "Search products..."
                    : t("products.searchPlaceholder"))
            }
            autoComplete="off"
            className={
              isAdmin
                ? "px-3.5 py-1.5 pr-8 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full focus:ring-2 focus:ring-accent"
                : isNavbar
                  ? "w-full px-3.5 py-1.5 sm:py-2 pr-8 border border-foreground/15 rounded-xl bg-background/80 focus:bg-secondary text-xs sm:text-sm text-foreground placeholder:text-foreground/50 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-xs"
                  : "w-full px-5 py-3 pr-10 border border-foreground/15 rounded-2xl bg-secondary text-sm text-foreground placeholder:text-foreground/50 outline-none focus:border-accent transition-colors shadow-sm"
            }
          />

          {query.length > 0 && (
            <button
              id={`${baseId}-search-clear-btn`}
              type="button"
              onClick={handleClear}
              className={`absolute ${
                isAdmin ? "right-2" : isNavbar ? "right-2" : "right-3.5"
              } top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-0.5 transition-colors cursor-pointer`}
              aria-label="Clear search"
            >
              <svg
                className={isAdmin || isNavbar ? "w-3.5 h-3.5" : "w-4 h-4"}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {loading && (
            <div
              className={`absolute ${
                isAdmin ? "right-7" : isNavbar ? "right-7" : "right-10"
              } top-1/2 -translate-y-1/2`}
            >
              <div
                className={`${
                  isAdmin || isNavbar ? "w-3 h-3" : "w-4 h-4"
                } border-2 border-accent border-t-transparent rounded-full animate-spin`}
              ></div>
            </div>
          )}
        </div>

        <button
          id={`${baseId}-search-submit-btn`}
          type="submit"
          className={
            isAdmin
              ? "px-4 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              : isNavbar
                ? "px-3 sm:px-4 py-1.5 sm:py-2 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                : "px-6 py-3 bg-button-bg text-button-fg rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
          }
        >
          {!isAdmin && (
            <svg
              className={isNavbar ? "w-3.5 h-3.5" : "w-4 h-4"}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
          {isAdmin ? (
            isBn ? "অনুসন্ধান" : "Search"
          ) : isNavbar ? (
            <span className="hidden xl:inline">{t("products.search")}</span>
          ) : (
            t("products.search")
          )}
        </button>

        {isAdmin && initialSearch && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] font-bold text-red-500 hover:underline uppercase whitespace-nowrap cursor-pointer"
          >
            {isBn ? "সাফ করুন" : "Clear"}
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && query.trim().length >= 1 && (
        <div
          id={`${baseId}-search-suggestions-dropdown`}
          className={`absolute left-0 right-0 ${
            isAdmin ? "sm:right-auto sm:w-80" : isNavbar ? "min-w-[280px] sm:min-w-[340px]" : ""
          } top-full mt-2 bg-secondary border border-foreground/15 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-1 duration-150`}
        >
          {suggestions.length > 0 ? (
            <div className="py-1.5">
              <div className="px-3.5 py-1.5 text-[9px] font-black uppercase tracking-wider opacity-60 flex justify-between border-b border-foreground/10 mb-1">
                <span>{isBn ? "পণ্য পরামর্শ" : "Product Suggestions"}</span>
                <span>
                  {isBn
                    ? `${totalCount.toLocaleString("bn-BD")} টি পাওয়া গেছে`
                    : `${totalCount} found`}
                </span>
              </div>

              <div className="max-h-[340px] overflow-y-auto divide-y divide-foreground/5">
                {suggestions.map((item, idx) => {
                  const activeVariant = item.variants?.find((v) => v.is_active !== false);
                  const basePrice = activeVariant?.price_override
                    ? Number(activeVariant.price_override)
                    : Number(item.unit_price || 0);

                  const discountPercent = Number(item.discount_percent || 0);
                  const isExpired = item.discount_valid_until && new Date() > new Date(item.discount_valid_until);
                  const isDiscountActive = item.is_discount_active !== false && !isExpired;

                  let effectivePrice = basePrice;
                  if (activeVariant?.discounted_price !== undefined) {
                    effectivePrice = Number(activeVariant.discounted_price);
                  } else if (item.discounted_price !== undefined && !activeVariant?.price_override) {
                    effectivePrice = Number(item.discounted_price);
                  } else if (discountPercent > 0 && isDiscountActive) {
                    effectivePrice = basePrice * (1 - discountPercent / 100);
                  }

                  const hasDiscount = isDiscountActive && basePrice > effectivePrice;

                  const isSelected = selectedIndex === idx;

                  if (isAdmin) {
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setIsOpen(false);
                          if (onSelectProduct) onSelectProduct(item);
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-primary/10 transition-colors ${
                          isSelected ? "bg-primary/15" : ""
                        }`}
                      >
                        {renderProductImage(item, "sm")}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">
                            {highlightMatch(item.title, query.trim())}
                          </div>
                          <div className="text-[10px] opacity-60 flex items-center gap-2">
                            <span>#{item.id}</span>
                            <span>
                              {isBn
                                ? `স্টকঃ ${(item.inventory ?? 0).toLocaleString("bn-BD")}`
                                : `Stock: ${item.inventory ?? 0}`}
                            </span>
                            <span className="text-accent font-bold">
                              {formatCurrency(Number(effectivePrice))}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      href={`/products/${item.id}`}
                      onClick={() => {
                        setIsOpen(false);
                        if (onAfterNavigate) {
                          onAfterNavigate();
                        }
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-3.5 px-4 py-3 hover:bg-primary/10 transition-colors ${
                        isSelected ? "bg-primary/15" : ""
                      }`}
                    >
                      {renderProductImage(item, "md")}

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">
                          {highlightMatch(item.title, query.trim())}
                        </div>
                        {item.short_description && (
                          <div className="text-[11px] opacity-70 truncate mt-0.5">
                            {item.short_description}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-black text-accent">
                          {formatCurrency(Number(effectivePrice))}
                        </div>
                        {hasDiscount && (
                          <div className="text-[10px] line-through opacity-50">
                            {formatCurrency(Number(basePrice))}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* View all results button */}
              <div className="p-1.5 border-t border-foreground/10 bg-primary/5">
                <button
                  type="button"
                  onClick={() => {
                    handleSubmit();
                    if (onAfterNavigate) {
                      onAfterNavigate();
                    }
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-button-bg text-button-fg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAdmin
                    ? isBn
                      ? `"${query.trim()}" এর জন্য ফিল্টার করুন`
                      : `Filter table for "${query.trim()}"`
                    : isBn
                      ? `"${query.trim()}" এর সকল ${totalCount.toLocaleString("bn-BD")} টি পণ্য দেখুন`
                      : `View all ${totalCount} results for "${query.trim()}"`}
                </button>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="py-7 px-4 text-center flex flex-col items-center justify-center bg-secondary text-foreground">
                <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center mb-2.5 text-foreground/40">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-foreground mb-1">
                  {isBn
                    ? `"${query.trim()}" দিয়ে কোনো পণ্য পাওয়া যায়নি`
                    : `No products found matching "${query.trim()}"`}
                </p>
                <p className="text-[11px] text-foreground/60 max-w-[260px] leading-relaxed">
                  {isBn
                    ? "বানান সঠিক কিনা যাচাই করুন অথবা অন্য কোনো শব্দ দিয়ে চেষ্টা করুন"
                    : "Try checking your spelling or search with different keywords"}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
