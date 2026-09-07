"use client";

import { useState, useEffect, useRef } from "react";
import { Order } from "@/features/admin/types";
import { useLanguage } from "@/store/LanguageContext";

interface OrderSearchBarProps {
  orders?: Order[];
  token?: string | null;
  initialSearch?: string;
  placeholder?: string;
  onSelectOrder?: (order: Order) => void;
  onSearchSubmit?: (query: string) => void;
  onClear?: () => void;
  className?: string;
}

export default function OrderSearchBar({
  orders = [],
  token,
  initialSearch = "",
  placeholder,
  onSelectOrder,
  onSearchSubmit,
  onClear,
  className = "",
}: OrderSearchBarProps) {
  const { formatCurrency, locale } = useLanguage();
  const isBn = locale === "bn";

  const [query, setQuery] = useState(initialSearch);
  const [suggestions, setSuggestions] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");

  // Sync external search value changes if provided
  useEffect(() => {
    setQuery(initialSearch);
  }, [initialSearch]);

  // Local helper to filter orders list when available
  const searchLocalOrders = (term: string): Order[] => {
    const q = term.toLowerCase().trim();
    if (!q) return [];
    return orders
      .filter((o) => {
        const idStr = String(o.id);
        const customerName = (o.customer_name || "").toLowerCase();
        const customerId = String(o.customer || "");
        const phone = (o.phone || "").toLowerCase();
        const address = (o.shipping_address || "").toLowerCase();
        const trackingCode = (o.tracking_code || "").toLowerCase();
        const courier = (o.courier_partner_details?.name || "").toLowerCase();
        const returnMatch = o.return_requests?.some(
          (r) =>
            r.items?.some((it) => it.product_title.toLowerCase().includes(q)) ||
            r.reason.toLowerCase().includes(q) ||
            r.reason_display.toLowerCase().includes(q)
        );

        return (
          idStr.includes(q) ||
          customerName.includes(q) ||
          customerId.includes(q) ||
          phone.includes(q) ||
          address.includes(q) ||
          trackingCode.includes(q) ||
          courier.includes(q) ||
          Boolean(returnMatch)
        );
      })
      .slice(0, 7);
  };

  // Fetch suggestions when query changes (min 1 character)
  useEffect(() => {
    const trimmed = query.trim();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (trimmed.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    // Immediately show matching local orders if present
    const immediateLocal = searchLocalOrders(trimmed);
    if (immediateLocal.length > 0) {
      setSuggestions(immediateLocal);
      setIsOpen(true);
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const storedToken =
          token ||
          (typeof window !== "undefined"
            ? localStorage.getItem("auth_token") || localStorage.getItem("token")
            : null);
        if (storedToken) {
          headers["Authorization"] = `JWT ${storedToken}`;
        }

        const res = await fetch(
          `${API_BASE}/store/orders/?search=${encodeURIComponent(trimmed)}`,
          { headers, cache: "no-store" }
        );

        if (res.ok) {
          const data = await res.json();
          const items: Order[] = Array.isArray(data)
            ? data
            : data.results || [];
          setSuggestions(items.slice(0, 8));
          setIsOpen(true);
        } else {
          // Fallback to local filtering
          setSuggestions(searchLocalOrders(trimmed));
          setIsOpen(true);
        }
      } catch {
        // Fallback to local orders
        setSuggestions(searchLocalOrders(trimmed));
        setIsOpen(true);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, API_BASE, token, orders]);

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

  // Submit search query to filter table
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
        if (onSelectOrder) {
          onSelectOrder(selected);
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

  // Calculate order total
  const computeOrderTotal = (order: Order) => {
    const itemsTotal = order.items
      ? order.items.reduce(
          (sum, it) => sum + Number(it.unit_price) * it.quantity,
          0
        )
      : 0;
    const delivery = Number(order.delivery_charge) || 0;
    return itemsTotal + delivery;
  };

  // Highlight matched text in string
  const highlightMatch = (text: string, match: string) => {
    if (!match.trim() || !text) return text;
    const regex = new RegExp(
      `(${match.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);
    return parts.map((part, index) =>
      part.toLowerCase() === match.toLowerCase() ? (
        <span key={index} className="text-accent font-extrabold underline decoration-accent/50">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Payment status badge helper
  const getPaymentStatusBadge = (status: string, isCancelled: boolean) => {
    if (isCancelled) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-hidden/15 text-hidden border border-hidden/30">
          {isBn ? "বাতিল" : "Cancelled"}
        </span>
      );
    }
    if (status === "C") {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-visible/15 text-visible border border-visible/30">
          {isBn ? "সফল (C)" : "Complete (C)"}
        </span>
      );
    }
    if (status === "F") {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-hidden/15 text-hidden border border-hidden/30">
          {isBn ? "ব্যর্থ (F)" : "Failed (F)"}
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-accent/15 text-accent border border-accent/30">
        {isBn ? "পেন্ডিং (P)" : "Pending (P)"}
      </span>
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
            placeholder={
              placeholder ||
              (isBn ? "অর্ডার অনুসন্ধান করুন..." : "Search orders...")
            }
            autoComplete="off"
            className="px-3.5 py-1.5 pr-8 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full focus:ring-2 focus:ring-accent"
          />

          {/* Clear button inside input */}
          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-0.5 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <svg
                className="w-3.5 h-3.5"
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

          {/* Loading indicator */}
          {loading && (
            <div className="absolute right-7 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="px-4 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          {isBn ? "খুঁজুন" : "Search"}
        </button>

        {initialSearch && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] font-bold text-red-500 hover:underline uppercase whitespace-nowrap cursor-pointer"
          >
            {isBn ? "মুছুন" : "Clear"}
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && query.trim().length >= 1 && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-96 top-full mt-2 bg-secondary border border-foreground/15 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {suggestions.length > 0 ? (
            <div className="py-1.5">
              <div className="px-3.5 py-1.5 text-[9px] font-black uppercase tracking-wider opacity-60 flex justify-between items-center border-b border-foreground/10 mb-1">
                <span>{isBn ? "অর্ডার পরামর্শ" : "Order Suggestions"}</span>
                <span>
                  {isBn
                    ? `${suggestions.length.toLocaleString("bn-BD")} টি পাওয়া গেছে`
                    : `${suggestions.length} found`}
                </span>
              </div>

              <div className="max-h-[340px] overflow-y-auto divide-y divide-foreground/5">
                {suggestions.map((order, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isCancelled = order.tracking_status === "cancelled";
                  const total = computeOrderTotal(order);
                  const itemCount = order.items
                    ? order.items.reduce((s, i) => s + i.quantity, 0)
                    : 0;

                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        setIsOpen(false);
                        if (onSelectOrder) {
                          onSelectOrder(order);
                        } else {
                          handleSubmit();
                        }
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-primary/10 transition-colors ${
                        isSelected ? "bg-primary/15" : ""
                      }`}
                    >
                      {/* Left Badge: Order ID */}
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-foreground/10 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] uppercase font-black opacity-50 leading-none">
                          ORD
                        </span>
                        <span className="text-xs font-black text-foreground leading-tight">
                          #{order.id}
                        </span>
                      </div>

                      {/* Middle Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="text-xs font-bold text-foreground truncate">
                            {highlightMatch(
                              order.customer_name ||
                                (isBn
                                  ? `গ্রাহক #${order.customer}`
                                  : `Customer #${order.customer}`),
                              query.trim()
                            )}
                          </div>
                          <span className="text-xs font-black text-accent shrink-0">
                            {formatCurrency(total)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[10px] opacity-70 truncate">
                          {order.phone && (
                            <span className="truncate">
                              {highlightMatch(order.phone, query.trim())}
                            </span>
                          )}
                          {order.phone && <span>•</span>}
                          <span>
                            {isBn
                              ? `${itemCount.toLocaleString("bn-BD")} টি আইটেম`
                              : `${itemCount} item(s)`}
                          </span>
                        </div>

                        {order.tracking_code && (
                          <div className="text-[9px] opacity-60 truncate mt-0.5 font-mono">
                            TRK: {highlightMatch(order.tracking_code, query.trim())}
                          </div>
                        )}
                      </div>

                      {/* Right Status */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {getPaymentStatusBadge(order.payment_status, isCancelled)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View/Filter table button */}
              <div className="p-1.5 border-t border-foreground/10 bg-primary/5">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="w-full py-1.5 px-3 rounded-lg bg-button-bg text-button-fg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity text-center cursor-pointer"
                >
                  {isBn
                    ? `টেবিলে "${query.trim()}" ফিল্টার করুন`
                    : `Filter table for "${query.trim()}"`}
                </button>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="py-5 px-3 text-center text-xs opacity-60">
                {isBn
                  ? `"${query.trim()}" দিয়ে কোনো অর্ডার পাওয়া যায়নি`
                  : `No orders found matching "${query.trim()}"`}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
