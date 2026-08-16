"use client";

import { useState, useEffect, useRef } from "react";

export interface CustomerSuggestion {
  id: number;
  phone: string;
  birth_date: string | null;
  membership: string;
  user_id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  customer_name?: string;
}

interface CustomerSearchBarProps {
  initialSearch?: string;
  placeholder?: string;
  token?: string | null;
  onSelectCustomer?: (customer: CustomerSuggestion) => void;
  onSearchSubmit?: (query: string) => void;
  onClear?: () => void;
  className?: string;
}

export default function CustomerSearchBar({
  initialSearch = "",
  placeholder = "Search customer...",
  token,
  onSelectCustomer,
  onSearchSubmit,
  onClear,
  className = "",
}: CustomerSearchBarProps) {
  const [query, setQuery] = useState(initialSearch);
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");

  useEffect(() => {
    setQuery(initialSearch);
  }, [initialSearch]);

  // Fetch suggestions when query changes (min 1 character)
  useEffect(() => {
    const trimmed = query.trim();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (trimmed.length < 1 || !token) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/store/customers/?search=${encodeURIComponent(trimmed)}`,
          {
            headers: { Authorization: `JWT ${token}` },
            cache: "no-store",
          }
        );
        if (res.ok) {
          const data = await res.json();
          const items: CustomerSuggestion[] = Array.isArray(data)
            ? data
            : data.results || [];
          setSuggestions(items);
          setIsOpen(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Customer search suggestion fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, token, API_BASE]);

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(query.trim());
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
        if (onSelectCustomer) {
          onSelectCustomer(selected);
        } else {
          handleSubmit();
        }
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Helper to format name
  const getCustomerDisplayName = (c: CustomerSuggestion) => {
    if (c.first_name || c.last_name) {
      return `${c.first_name || ""} ${c.last_name || ""}`.trim();
    }
    return c.customer_name || `Customer #${c.id}`;
  };

  // Highlight matched text
  const highlightMatch = (text: string, match: string) => {
    if (!match.trim() || !text) return text;
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
    <div ref={containerRef} className={`relative w-full sm:w-auto ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-60">
          <input
            type="text"
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
            placeholder={placeholder}
            autoComplete="off"
            className="px-3.5 py-1.5 pr-8 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full focus:ring-2 focus:ring-accent"
          />

          {/* Clear button */}
          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-0.5 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="absolute right-7 top-1/2 -translate-y-1/2">
              <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="px-4 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          Search
        </button>

        {initialSearch && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] font-bold text-red-500 hover:underline uppercase whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && query.trim().length >= 1 && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-84 top-full mt-2 bg-secondary border border-foreground/15 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {suggestions.length > 0 ? (
            <div className="py-1.5">
              <div className="px-3.5 py-1.5 text-[9px] font-black uppercase tracking-wider opacity-60 flex justify-between border-b border-foreground/10 mb-1">
                <span>Customers</span>
                <span>{suggestions.length} found</span>
              </div>

              <div className="max-h-[300px] overflow-y-auto divide-y divide-foreground/5">
                {suggestions.map((c, idx) => {
                  const isSelected = selectedIndex === idx;
                  const displayName = getCustomerDisplayName(c);
                  const initials = displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setIsOpen(false);
                        if (onSelectCustomer) onSelectCustomer(c);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-primary/10 transition-colors ${
                        isSelected ? "bg-primary/15" : ""
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/15 text-accent font-black text-xs flex items-center justify-center flex-shrink-0 border border-accent/20">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">
                          {highlightMatch(displayName, query.trim())}
                        </div>
                        {c.email && (
                          <div className="text-[10px] opacity-60 truncate">
                            {highlightMatch(c.email, query.trim())}
                          </div>
                        )}
                        {c.phone && (
                          <div className="text-[10px] opacity-50">
                            {highlightMatch(c.phone, query.trim())}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-primary/10 text-foreground">
                          {c.membership === "G"
                            ? "Gold"
                            : c.membership === "S"
                            ? "Silver"
                            : "Bronze"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View all results button */}
              <div className="p-1.5 border-t border-foreground/10 bg-primary/5">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="w-full py-1.5 px-3 rounded-lg bg-button-bg text-button-fg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity text-center cursor-pointer"
                >
                  Filter table for &quot;{query.trim()}&quot;
                </button>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="py-5 px-3 text-center text-xs opacity-60">
                No customers found matching &quot;{query.trim()}&quot;
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
