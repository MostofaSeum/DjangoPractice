"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProductSuggestion {
  id: number;
  title: string;
  unit_price: number;
  discount_percent?: number;
  discounted_price?: number;
  short_description?: string;
  images?: { id?: number; image: string }[];
}

interface ProductSearchBarProps {
  initialSearch?: string;
  minPrice?: string;
  maxPrice?: string;
  ordering?: string;
}

export default function ProductSearchBar({
  initialSearch = "",
  minPrice,
  maxPrice,
  ordering,
}: ProductSearchBarProps) {
  const router = useRouter();
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
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/store/products/?search=${encodeURIComponent(trimmed)}&page_size=6`,
          { cache: "no-store" }
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
        }
      } catch (err) {
        console.error("Search suggestion fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

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

  // Keyboard navigation & Submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsOpen(false);

    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (ordering) params.set("ordering", ordering);

    router.push(`/products?${params.toString()}`);
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
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const selected = suggestions[selectedIndex];
        setIsOpen(false);
        router.push(`/products/${selected.id}`);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Helper to render product image
  const renderProductImage = (item: ProductSuggestion) => {
    if (item.images && item.images.length > 0 && item.images[0].image) {
      let src = item.images[0].image;
      if (!src.startsWith("http://") && !src.startsWith("https://")) {
        src = `${API_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
      }
      return (
        <img
          src={src}
          alt={item.title}
          className="w-10 h-10 object-cover rounded-xl border border-foreground/10 bg-primary/5 flex-shrink-0"
        />
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-foreground/10 flex-shrink-0">
        <svg
          className="w-5 h-5 opacity-40"
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
    const regex = new RegExp(`(${match.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      part.toLowerCase() === match.toLowerCase() ? (
        <span key={index} className="text-accent font-extrabold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mb-8 z-30">
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        {/* Hidden inputs to preserve existing filters */}
        {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
        {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
        {ordering && <input type="hidden" name="ordering" value={ordering} />}

        <div className="relative flex-1">
          <input
            type="text"
            name="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              if (query.trim().length >= 1 && suggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search products by title or description..."
            autoComplete="off"
            className="w-full px-5 py-3 pr-10 border border-foreground/15 rounded-2xl bg-secondary text-sm text-foreground placeholder:text-foreground/50 outline-none focus:border-accent transition-colors shadow-sm"
          />

          {/* Clear button */}
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-button-bg text-button-fg rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Search
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && query.trim().length >= 1 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-secondary border border-foreground/15 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {suggestions.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider opacity-60 flex justify-between border-b border-foreground/10 mb-1">
                <span>Product Suggestions</span>
                <span>{totalCount} found</span>
              </div>

              <div className="max-h-[380px] overflow-y-auto divide-y divide-foreground/5">
                {suggestions.map((item, idx) => {
                  const discountPercent = Number(item.discount_percent || 0);
                  const effectivePrice =
                    item.discounted_price !== undefined
                      ? item.discounted_price
                      : discountPercent > 0
                      ? item.unit_price * (1 - discountPercent / 100)
                      : item.unit_price;

                  const isSelected = selectedIndex === idx;

                  return (
                    <Link
                      key={item.id}
                      href={`/products/${item.id}`}
                      onClick={() => setIsOpen(false)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-3.5 px-4 py-3 hover:bg-primary/10 transition-colors ${
                        isSelected ? "bg-primary/15" : ""
                      }`}
                    >
                      {renderProductImage(item)}

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
                          ${Number(effectivePrice).toFixed(2)}
                        </div>
                        {discountPercent > 0 && (
                          <div className="text-[10px] line-through opacity-50">
                            ${Number(item.unit_price).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* View all results button */}
              <div className="p-2 border-t border-foreground/10 bg-primary/5">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="w-full py-2 px-4 rounded-xl bg-button-bg text-button-fg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  View all {totalCount} result{totalCount !== 1 ? "s" : ""} for &quot;{query.trim()}&quot;
                </button>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="py-8 px-4 text-center">
                <p className="text-sm opacity-70 font-semibold mb-1">
                  No products found matching &quot;{query.trim()}&quot;
                </p>
                <p className="text-xs opacity-50">
                  Try checking your spelling or using different keywords
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
