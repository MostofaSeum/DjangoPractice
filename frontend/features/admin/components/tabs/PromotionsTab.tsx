"use client";

import { useState } from "react";
import { Product } from "../../types";
import ProductImage from "@/components/ui/ProductImage";

interface PromotionsTabProps {
  promoProductsCatalog: Product[];
  promoSelectedProductIds: number[];
  setPromoSelectedProductIds: React.Dispatch<React.SetStateAction<number[]>>;
  promoSearchInput: string;
  setPromoSearchInput: (input: string) => void;
  isPromoDropdownOpen: boolean;
  setIsPromoDropdownOpen: (open: boolean) => void;
  promoDiscountPercent: string;
  setPromoDiscountPercent: (percent: string) => void;
  promoApplying: boolean;
  handleApplyPromotion: (e: React.FormEvent) => Promise<void>;
  handleRemovePromotion: (type: "all" | "product", productId?: number) => Promise<void>;
  selectedPromoProducts: Product[];
}

export default function PromotionsTab({
  promoProductsCatalog,
  promoSelectedProductIds,
  setPromoSelectedProductIds,
  promoSearchInput,
  setPromoSearchInput,
  isPromoDropdownOpen,
  setIsPromoDropdownOpen,
  promoDiscountPercent,
  setPromoDiscountPercent,
  promoApplying,
  handleApplyPromotion,
  handleRemovePromotion,
  selectedPromoProducts,
}: PromotionsTabProps) {
  const [promoSearch, setPromoSearch] = useState("");
  const [activePromoSearch, setActivePromoSearch] = useState("");
  const [promoPage, setPromoPage] = useState(1);

  const onSaleProducts = promoProductsCatalog.filter(
    (p) => Number(p.discount_percent || 0) > 0
  );
  const filteredOnSaleProducts = onSaleProducts.filter(
    (p) =>
      !activePromoSearch ||
      p.title.toLowerCase().includes(activePromoSearch.toLowerCase()) ||
      String(p.id).includes(activePromoSearch)
  );
  const promoItemsPerPage = 8;
  const totalPromoPages = Math.ceil(
    filteredOnSaleProducts.length / promoItemsPerPage
  );
  const paginatedOnSaleProducts = filteredOnSaleProducts.slice(
    (promoPage - 1) * promoItemsPerPage,
    promoPage * promoItemsPerPage
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
      {/* Create & Apply Promotion Form */}
      <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm h-fit lg:sticky lg:top-24 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-foreground/10">
          <h2 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            Apply New Promotion
          </h2>
        </div>

        <form onSubmit={handleApplyPromotion} className="space-y-5">
          {/* Multi-Product Live Search & Selector */}
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                Select Products ({promoProductsCatalog.length} available)
              </label>
              {promoSelectedProductIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPromoSelectedProductIds([]);
                    setPromoSearchInput("");
                  }}
                  className="text-[9px] font-bold text-red-500 hover:underline uppercase"
                >
                  Clear All ({promoSelectedProductIds.length})
                </button>
              )}
            </div>

            {/* Selected Products Chips */}
            {selectedPromoProducts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 max-h-36 overflow-y-auto">
                {selectedPromoProducts.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-foreground border border-foreground/15 text-[11px] font-bold shadow-2xs"
                  >
                    <span className="truncate max-w-[130px]">
                      #{p.id} {p.title}
                    </span>
                    <span className="text-accent text-[10px] font-mono">
                      ৳{Number(p.unit_price).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPromoSelectedProductIds((prev) =>
                          prev.filter((id) => id !== p.id)
                        )
                      }
                      className="text-foreground/50 hover:text-red-500 font-black ml-0.5 text-xs"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={promoSearchInput}
                onFocus={() => setIsPromoDropdownOpen(true)}
                onChange={(e) => {
                  setPromoSearchInput(e.target.value);
                  setIsPromoDropdownOpen(true);
                }}
                placeholder="Search product to add to selection..."
                className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent placeholder:font-normal shadow-inner"
              />
              {promoSelectedProductIds.length > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-accent/20 text-accent font-black text-[10px] uppercase">
                  {promoSelectedProductIds.length} Selected
                </span>
              )}
            </div>

            {/* Floating Suggestions List */}
            {isPromoDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsPromoDropdownOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-secondary border border-foreground/15 rounded-2xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-foreground/10 p-1.5 backdrop-blur-md">
                  {(() => {
                    const query = promoSearchInput.toLowerCase().trim();
                    const matches = promoProductsCatalog.filter(
                      (prod) =>
                        !query ||
                        prod.title.toLowerCase().includes(query) ||
                        String(prod.id).includes(query)
                    );

                    if (matches.length === 0) {
                      return (
                        <div className="p-4 text-center text-xs font-bold opacity-50">
                          No products found matching &ldquo;{promoSearchInput}
                          &rdquo;
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="p-2 flex justify-between items-center text-[10px] font-bold text-foreground/60">
                          <span>{matches.length} matching products</span>
                          <button
                            type="button"
                            onClick={() => {
                              const matchIds = matches.map((m) => m.id);
                              setPromoSelectedProductIds((prev) =>
                                Array.from(new Set([...prev, ...matchIds]))
                              );
                            }}
                            className="text-accent hover:underline uppercase"
                          >
                            + Select All ({matches.length})
                          </button>
                        </div>
                        {matches.map((prod) => {
                          const isSelected = promoSelectedProductIds.includes(
                            prod.id
                          );
                          const isOnSale =
                            Number(prod.discount_percent || 0) > 0;
                          return (
                            <div
                              key={prod.id}
                              onClick={() => {
                                setPromoSelectedProductIds((prev) =>
                                  prev.includes(prod.id)
                                    ? prev.filter((id) => id !== prod.id)
                                    : [...prev, prod.id]
                                );
                              }}
                              className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-all ${
                                isSelected
                                  ? "bg-accent/20 border border-accent/40"
                                  : "hover:bg-primary/5 dark:hover:bg-primary/30"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded accent-accent shrink-0 cursor-pointer pointer-events-none"
                                />
                                <div className="relative w-9 h-9 rounded-lg bg-background border border-foreground/10 flex items-center justify-center overflow-hidden shrink-0">
                                  <ProductImage
                                    title={prod.title}
                                    images={prod.images}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-foreground truncate">
                                    #{prod.id} {prod.title}
                                  </p>
                                  <p className="text-[10px] text-foreground/60 font-semibold">
                                    Original: ৳
                                    {Number(prod.unit_price).toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              {isOnSale ? (
                                <span className="px-2 py-0.5 rounded bg-accent/15 text-accent font-black text-[9px] uppercase shrink-0">
                                  -
                                  {Math.round(
                                    Number(prod.discount_percent || 0)
                                  )}
                                  %
                                </span>
                              ) : (
                                <span
                                  className={`text-[10px] font-bold shrink-0 ${
                                    isSelected
                                      ? "text-accent"
                                      : "text-foreground/40"
                                  }`}
                                >
                                  {isSelected ? "Selected" : "+ Add"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>

          {/* Input for Discount % */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
              Discount Percentage (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="1"
                max="100"
                value={promoDiscountPercent}
                onChange={(e) => setPromoDiscountPercent(e.target.value)}
                placeholder="e.g. 20"
                className="w-full bg-background border border-foreground/15 rounded-xl px-4 pr-20 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                required
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none px-2 py-1 rounded-lg bg-accent/20 text-accent font-extrabold text-[10px] uppercase tracking-wider">
                % OFF
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={promoApplying || promoSelectedProductIds.length === 0}
            className="w-full py-4 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md disabled:opacity-50"
          >
            {promoApplying
              ? "Applying Promotion..."
              : promoSelectedProductIds.length > 0
                ? `Apply ${promoDiscountPercent}% Discount (${promoSelectedProductIds.length} Products)`
                : "Select Products to Apply Discount"}
          </button>
        </form>
      </div>

      {/* Right Column: Currently On-Sale Products with Search & Pagination */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                Products Currently On Sale
              </h2>
              {onSaleProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemovePromotion("all")}
                  className="px-3 py-1 bg-red-500/15 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-xs"
                >
                  Remove All Discounts
                </button>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setActivePromoSearch(promoSearch);
                setPromoPage(1);
              }}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <input
                type="text"
                value={promoSearch}
                onChange={(e) => setPromoSearch(e.target.value)}
                placeholder="Search on-sale products..."
                className="px-3.5 py-1.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full sm:w-48 focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                Search
              </button>
              {activePromoSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setPromoSearch("");
                    setActivePromoSearch("");
                    setPromoPage(1);
                  }}
                  className="text-[10px] font-bold text-red-500 hover:underline uppercase"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {filteredOnSaleProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paginatedOnSaleProducts.map((prod) => {
                  const original = Number(prod.unit_price);
                  const pct = Number(prod.discount_percent);
                  const discounted =
                    prod.discounted_price !== undefined
                      ? Number(prod.discounted_price)
                      : original * (1 - pct / 100);

                  return (
                    <div
                      key={prod.id}
                      className="p-4 rounded-2xl bg-background border border-foreground/10 flex items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-xl bg-secondary flex items-center justify-center overflow-hidden border border-foreground/10 shrink-0">
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-accent text-button-fg font-black text-[8px] uppercase">
                            -{Math.round(pct)}%
                          </span>
                          <ProductImage
                            title={prod.title}
                            images={prod.images}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-foreground line-clamp-1">
                            {prod.title}
                          </h4>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-accent font-extrabold text-xs">
                              ৳{discounted.toFixed(2)}
                            </span>
                            <span className="line-through text-[10px] opacity-50 font-bold">
                              ৳{original.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemovePromotion("product", prod.id)
                        }
                        className="px-3 py-2 bg-accent/15 text-accent hover:bg-accent hover:text-button-fg rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPromoPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-foreground/10 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() =>
                      setPromoPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={promoPage === 1}
                    className="px-5 py-2.5 border border-foreground/15 bg-primary/5 dark:bg-primary/30 text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-button-bg hover:text-button-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                    Page {promoPage} of {totalPromoPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPromoPage((prev) =>
                        Math.min(prev + 1, totalPromoPages)
                      )
                    }
                    disabled={promoPage >= totalPromoPages}
                    className="px-5 py-2.5 border border-foreground/15 bg-primary/5 dark:bg-primary/30 text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-button-bg hover:text-button-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-xs font-bold uppercase tracking-wider opacity-50">
              {activePromoSearch
                ? `No on-sale products found matching "${activePromoSearch}".`
                : "No products currently have active promotions. Use the form on the left to add discounts!"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
