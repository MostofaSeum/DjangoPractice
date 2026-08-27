"use client";

import { useState } from "react";
import { Collection, DeliveryRuleItem, Product } from "../../types";
import ProductImage from "@/components/ui/ProductImage";
import { useLanguage } from "@/store/LanguageContext";

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

  deliveryRulesList: DeliveryRuleItem[];
  editingDeliveryRuleId: number | null;
  deliveryRuleTitle: string;
  setDeliveryRuleTitle: (title: string) => void;
  deliveryRuleTargetType: "product" | "collection" | "order_total";
  setDeliveryRuleTargetType: (type: "product" | "collection" | "order_total") => void;
  deliveryRuleType: "free" | "reduced";
  setDeliveryRuleType: (type: "free" | "reduced") => void;
  deliveryRuleInsideCharge: string;
  setDeliveryRuleInsideCharge: (charge: string) => void;
  deliveryRuleOutsideCharge: string;
  setDeliveryRuleOutsideCharge: (charge: string) => void;
  deliveryRuleSelectedProductIds: number[];
  setDeliveryRuleSelectedProductIds: React.Dispatch<React.SetStateAction<number[]>>;
  deliveryRuleCollectionId: number | "";
  setDeliveryRuleCollectionId: (id: number | "") => void;
  deliveryRuleMinQuantity: string;
  setDeliveryRuleMinQuantity: (qty: string) => void;
  deliveryRuleMinOrderAmount: string;
  setDeliveryRuleMinOrderAmount: (amt: string) => void;
  deliveryRuleIsActive: boolean;
  setDeliveryRuleIsActive: (active: boolean) => void;
  deliveryRuleSearchInput: string;
  setDeliveryRuleSearchInput: (input: string) => void;
  isDeliveryRuleDropdownOpen: boolean;
  setIsDeliveryRuleDropdownOpen: (open: boolean) => void;
  deliveryRuleCreating: boolean;
  deliveryRuleFilterSearch: string;
  setDeliveryRuleFilterSearch: (search: string) => void;
  selectedDeliveryRuleProducts: Product[];
  collections: Collection[];
  handleSaveDeliveryRule: (e: React.FormEvent) => Promise<void>;
  handleCancelEditDeliveryRule: () => void;
  handleStartEditDeliveryRule: (rule: DeliveryRuleItem) => void;
  handleToggleDeliveryRule: (rule: DeliveryRuleItem) => Promise<void>;
  handleDeleteDeliveryRule: (ruleId: number, title: string) => Promise<void>;
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
  deliveryRulesList,
  editingDeliveryRuleId,
  deliveryRuleTitle,
  setDeliveryRuleTitle,
  deliveryRuleTargetType,
  setDeliveryRuleTargetType,
  deliveryRuleType,
  setDeliveryRuleType,
  deliveryRuleInsideCharge,
  setDeliveryRuleInsideCharge,
  deliveryRuleOutsideCharge,
  setDeliveryRuleOutsideCharge,
  deliveryRuleSelectedProductIds,
  setDeliveryRuleSelectedProductIds,
  deliveryRuleCollectionId,
  setDeliveryRuleCollectionId,
  deliveryRuleMinQuantity,
  setDeliveryRuleMinQuantity,
  deliveryRuleMinOrderAmount,
  setDeliveryRuleMinOrderAmount,
  deliveryRuleIsActive,
  setDeliveryRuleIsActive,
  deliveryRuleSearchInput,
  setDeliveryRuleSearchInput,
  isDeliveryRuleDropdownOpen,
  setIsDeliveryRuleDropdownOpen,
  deliveryRuleCreating,
  deliveryRuleFilterSearch,
  setDeliveryRuleFilterSearch,
  selectedDeliveryRuleProducts,
  collections,
  handleSaveDeliveryRule,
  handleCancelEditDeliveryRule,
  handleStartEditDeliveryRule,
  handleToggleDeliveryRule,
  handleDeleteDeliveryRule,
}: PromotionsTabProps) {
  const { locale, formatCurrency } = useLanguage();
  const isBn = locale === "bn";

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
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm h-fit lg:sticky lg:top-24 transition-colors duration-300">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-foreground/10">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              {isBn ? "নতুন প্রমোশন ও ছাড় প্রয়োগ করুন" : "Apply New Promotion"}
            </h2>
          </div>

          <form onSubmit={handleApplyPromotion} className="space-y-5">
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                  {isBn
                    ? `পণ্য নির্বাচন করুন (মোট ${promoProductsCatalog.length.toLocaleString("bn-BD")} টি রয়েছে)`
                    : `Select Products (${promoProductsCatalog.length} available)`}
                </label>
                {promoSelectedProductIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPromoSelectedProductIds([]);
                      setPromoSearchInput("");
                    }}
                    className="text-[9px] font-bold text-red-500 hover:underline uppercase cursor-pointer"
                  >
                    {isBn ? `সব মুছুন (${promoSelectedProductIds.length.toLocaleString("bn-BD")})` : `Clear All (${promoSelectedProductIds.length})`}
                  </button>
                )}
              </div>

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
                        className="text-foreground/50 hover:text-red-500 font-black ml-0.5 text-xs cursor-pointer"
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
                  placeholder={isBn ? "প্রমোশনে যুক্ত করতে পণ্য খুঁজুন..." : "Search product to add to selection..."}
                  className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent placeholder:font-normal shadow-inner"
                />
                {promoSelectedProductIds.length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-accent/20 text-accent font-black text-[10px] uppercase">
                    {isBn ? `${promoSelectedProductIds.length.toLocaleString("bn-BD")} টি নির্বাচিত` : `${promoSelectedProductIds.length} Selected`}
                  </span>
                )}
              </div>

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
                            {isBn ? `"${promoSearchInput}" এর সাথে কোনো পণ্য মিলেনি` : `No products found matching "${promoSearchInput}"`}
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="p-2 flex justify-between items-center text-[10px] font-bold text-foreground/60">
                            <span>{isBn ? `${matches.length.toLocaleString("bn-BD")} টি পণ্য পাওয়া গেছে` : `${matches.length} matching products`}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const matchIds = matches.map((m) => m.id);
                                setPromoSelectedProductIds((prev) =>
                                  Array.from(new Set([...prev, ...matchIds]))
                                );
                              }}
                              className="text-accent hover:underline uppercase cursor-pointer"
                            >
                              {isBn ? `+ সবগুলো নির্বাচন (${matches.length.toLocaleString("bn-BD")})` : `+ Select All (${matches.length})`}
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
                                      {isBn ? "মূল দামঃ ৳" : "Original: ৳"}
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
                                    {isSelected ? (isBn ? "নির্বাচিত" : "Selected") : (isBn ? "+ যোগ করুন" : "+ Add")}
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

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                {isBn ? "ছাড়ের শতকরা হার (%)" : "Discount Percentage (%)"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="100"
                  value={promoDiscountPercent}
                  onChange={(e) => setPromoDiscountPercent(e.target.value)}
                  placeholder={isBn ? "যেমনঃ ২০" : "e.g. 20"}
                  className="w-full bg-background border border-foreground/15 rounded-xl px-4 pr-20 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                  required
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none px-2 py-1 rounded-lg bg-accent/20 text-accent font-extrabold text-[10px] uppercase tracking-wider">
                  {isBn ? "% ছাড়" : "% OFF"}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={promoApplying || promoSelectedProductIds.length === 0}
              className="w-full py-4 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {promoApplying
                ? (isBn ? "ছাড় যুক্ত হচ্ছে..." : "Applying Promotion...")
                : promoSelectedProductIds.length > 0
                  ? (isBn ? `${promoDiscountPercent}% ছাড় প্রয়োগ করুন (${promoSelectedProductIds.length.toLocaleString("bn-BD")} টি পণ্যে)` : `Apply ${promoDiscountPercent}% Discount (${promoSelectedProductIds.length} Products)`)
                  : (isBn ? "ছাড় প্রয়োগ করতে পণ্য নির্বাচন করুন" : "Select Products to Apply Discount")}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                  {isBn ? "বর্তমানে ছাড়ে বিক্রিত পণ্যসমূহ" : "Products Currently On Sale"}
                </h2>
                {onSaleProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePromotion("all")}
                    className="px-3 py-1 bg-red-500/15 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                  >
                    {isBn ? "সকল ছাড় বাতিল করুন" : "Remove All Discounts"}
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
                  placeholder={isBn ? "অফারযুক্ত পণ্য খুঁজুন..." : "Search on-sale products..."}
                  className="px-3.5 py-1.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full sm:w-48 focus:ring-2 focus:ring-accent"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  {isBn ? "খুঁজুন" : "Search"}
                </button>
                {activePromoSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setPromoSearch("");
                      setActivePromoSearch("");
                      setPromoPage(1);
                    }}
                    className="text-[10px] font-bold text-red-500 hover:underline uppercase cursor-pointer"
                  >
                    {isBn ? "মুছুন" : "Clear"}
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
                          className="px-3 py-2 bg-accent/15 text-accent hover:bg-accent hover:text-button-fg rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer"
                        >
                          {isBn ? "ছাড় সরান" : "Remove"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {totalPromoPages > 1 && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-foreground/10 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() =>
                        setPromoPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={promoPage === 1}
                      className="px-5 py-2.5 border border-foreground/15 bg-primary/5 dark:bg-primary/30 text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-button-bg hover:text-button-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isBn ? "পূর্ববর্তী" : "Previous"}
                    </button>

                    <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                      {isBn ? `পৃষ্ঠা ${promoPage.toLocaleString("bn-BD")} / ${totalPromoPages.toLocaleString("bn-BD")}` : `Page ${promoPage} of ${totalPromoPages}`}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setPromoPage((prev) =>
                          Math.min(prev + 1, totalPromoPages)
                        )
                      }
                      disabled={promoPage >= totalPromoPages}
                      className="px-5 py-2.5 border border-foreground/15 bg-primary/5 dark:bg-primary/30 text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-button-bg hover:text-button-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isBn ? "পরবর্তী" : "Next"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-xs font-bold uppercase tracking-wider opacity-50">
                {activePromoSearch
                  ? (isBn ? `"${activePromoSearch}" এর সাথে কোনো অফারযুক্ত পণ্য পাওয়া যায়নি।` : `No on-sale products found matching "${activePromoSearch}".`)
                  : (isBn ? "বর্তমানে কোনো পণ্যে সক্রিয় প্রমোশন নেই। নতুন ছাড় যোগ করতে বামপাশের ফর্মটি ব্যবহার করুন!" : "No products currently have active promotions. Use the form on the left to add discounts!")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 pb-4 border-b border-foreground/10">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <span>{isBn ? "ফ্রি ও বিশেষ ডেলিভারি অফার" : "Free & Delivery Offers"}</span>
              <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[10px] font-bold">
                {isBn ? `${deliveryRulesList.length.toLocaleString("bn-BD")} টি রুল` : `${deliveryRulesList.length} Rules`}
              </span>
            </h3>
            <p className="text-xs opacity-60 font-medium mt-0.5">
              {isBn
                ? "নির্দিষ্ট পণ্য বা সম্পূর্ণ কালেকশনের জন্য ফ্রি ডেলিভারি (৳০) বা বিশেষ হ্রাসকৃত ডেলিভারি চার্জ নির্ধারণ করুন।"
                : "Set Free Delivery (৳0) or Reduced Shipping fees for specific products or entire collections."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-primary/5 dark:bg-primary/20 border border-foreground/10 p-6 rounded-3xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-foreground/10">
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                {editingDeliveryRuleId
                  ? (isBn ? "ডেলিভারি অফার সম্পাদনা" : "Edit Delivery Rule")
                  : (isBn ? "নতুন ডেলিভারি অফার তৈরি" : "Create Delivery Rule")}
              </h4>
              {editingDeliveryRuleId && (
                <button
                  type="button"
                  onClick={handleCancelEditDeliveryRule}
                  className="text-[10px] font-bold text-accent hover:underline uppercase cursor-pointer"
                >
                  {isBn ? "সম্পাদনা বাতিল" : "Cancel Edit"}
                </button>
              )}
            </div>

            <form onSubmit={handleSaveDeliveryRule} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 opacity-70">
                  {isBn ? "অফারের শিরোনাম *" : "Rule Title *"}
                </label>
                <input
                  type="text"
                  value={deliveryRuleTitle}
                  onChange={(e) => setDeliveryRuleTitle(e.target.value)}
                  placeholder={isBn ? "যেমনঃ উইন্টার জ্যাকেটে ফ্রি ডেলিভারি" : "e.g. Free Delivery on Winter Jacket"}
                  required
                  className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                  {isBn ? "অফার প্রযোজ্য হবে *" : "Apply Offer To *"}
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-primary/5 dark:bg-primary/20 rounded-xl border border-foreground/10">
                  <button
                    type="button"
                    onClick={() => setDeliveryRuleTargetType("order_total")}
                    className={`py-2 px-1 text-center rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      deliveryRuleTargetType === "order_total"
                        ? "bg-secondary text-foreground shadow-sm"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {isBn ? "অর্ডার মোট" : "Order Total"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryRuleTargetType("product")}
                    className={`py-2 px-1 text-center rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      deliveryRuleTargetType === "product"
                        ? "bg-secondary text-foreground shadow-sm"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {isBn ? "পণ্যসমূহ" : "Products"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryRuleTargetType("collection")}
                    className={`py-2 px-1 text-center rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      deliveryRuleTargetType === "collection"
                        ? "bg-secondary text-foreground shadow-sm"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {isBn ? "কালেকশন" : "Collection"}
                  </button>
                </div>
              </div>

              {deliveryRuleTargetType === "order_total" && (
                <div className="p-4 rounded-2xl bg-secondary/80 border border-foreground/10 space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                    {isBn ? "সর্বনিম্ন অর্ডারের পরিমাণ (৳) *" : "Minimum Order Amount (৳) *"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-sm text-foreground/50">
                      ৳
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      required
                      value={deliveryRuleMinOrderAmount}
                      onChange={(e) =>
                        setDeliveryRuleMinOrderAmount(e.target.value)
                      }
                      placeholder={isBn ? "যেমনঃ ১০০০" : "e.g. 1000"}
                      className="w-full pl-8 pr-4 py-2.5 bg-background border border-foreground/15 rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <p className="text-[10px] opacity-60">
                    {isBn
                      ? "গ্রাহকের চেকআউটের মোট পণ্যের মূল্য এই পরিমাণ বা তার বেশি হলে অফারটি প্রযোজ্য হবে।"
                      : "Applies automatically when customer checkout item subtotal reaches this amount or more."}
                  </p>
                </div>
              )}

              {deliveryRuleTargetType === "product" && (
                <div className="relative">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                      {isBn ? "পণ্য নির্বাচন করুন" : "Select Products"}
                    </label>
                    {deliveryRuleSelectedProductIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryRuleSelectedProductIds([]);
                          setDeliveryRuleSearchInput("");
                        }}
                        className="text-[9px] font-bold text-red-500 hover:underline uppercase cursor-pointer"
                      >
                        {isBn ? `সব মুছুন (${deliveryRuleSelectedProductIds.length.toLocaleString("bn-BD")})` : `Clear All (${deliveryRuleSelectedProductIds.length})`}
                      </button>
                    )}
                  </div>

                  {selectedDeliveryRuleProducts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 rounded-xl bg-secondary border border-foreground/10 max-h-32 overflow-y-auto">
                      {selectedDeliveryRuleProducts.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-background text-foreground border border-foreground/15 text-[10px] font-bold"
                        >
                          <span className="truncate max-w-[120px]">
                            #{p.id} {p.title}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDeliveryRuleSelectedProductIds((prev) =>
                                prev.filter((id) => id !== p.id)
                              )
                            }
                            className="text-foreground/50 hover:text-red-500 font-black ml-0.5 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    value={deliveryRuleSearchInput}
                    onFocus={() => setIsDeliveryRuleDropdownOpen(true)}
                    onChange={(e) => {
                      setDeliveryRuleSearchInput(e.target.value);
                      setIsDeliveryRuleDropdownOpen(true);
                    }}
                    placeholder={isBn ? "ডেলিভারি অফারের জন্য পণ্য খুঁজুন..." : "Search products for delivery offer..."}
                    className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                  />

                  {isDeliveryRuleDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsDeliveryRuleDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-secondary border border-foreground/15 rounded-2xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-foreground/10 p-1.5 backdrop-blur-md">
                        {(() => {
                          const query = deliveryRuleSearchInput
                            .toLowerCase()
                            .trim();
                          const matches = promoProductsCatalog.filter(
                            (prod) =>
                              !query ||
                              prod.title.toLowerCase().includes(query) ||
                              String(prod.id).includes(query)
                          );

                          if (matches.length === 0) {
                            return (
                              <div className="p-3 text-center text-xs font-bold opacity-50">
                                {isBn ? `"${deliveryRuleSearchInput}" এর সাথে কোনো পণ্য মিলেনি` : `No products found matching "${deliveryRuleSearchInput}"`}
                              </div>
                            );
                          }

                          return (
                            <>
                              <div className="p-2 flex justify-between items-center text-[10px] font-bold text-foreground/60">
                                <span>{isBn ? `${matches.length.toLocaleString("bn-BD")} টি পণ্য পাওয়া গেছে` : `${matches.length} matching products`}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const matchIds = matches.map((m) => m.id);
                                    setDeliveryRuleSelectedProductIds(
                                      (prev) =>
                                        Array.from(
                                          new Set([...prev, ...matchIds])
                                        )
                                    );
                                  }}
                                  className="text-accent hover:underline uppercase cursor-pointer"
                                >
                                  {isBn ? `+ সবগুলো নির্বাচন (${matches.length.toLocaleString("bn-BD")})` : `+ Select All (${matches.length})`}
                                </button>
                              </div>
                              {matches.map((prod) => {
                                const isSelected =
                                  deliveryRuleSelectedProductIds.includes(
                                    prod.id
                                  );
                                return (
                                  <div
                                    key={prod.id}
                                    onClick={() => {
                                      setDeliveryRuleSelectedProductIds(
                                        (prev) =>
                                          prev.includes(prod.id)
                                            ? prev.filter(
                                                (id) => id !== prod.id
                                              )
                                            : [...prev, prod.id]
                                      );
                                    }}
                                    className={`p-2 rounded-xl cursor-pointer flex items-center justify-between gap-2.5 transition-all ${
                                      isSelected
                                        ? "bg-accent/20 border border-accent/40"
                                        : "hover:bg-primary/5 dark:hover:bg-primary/30"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="w-3.5 h-3.5 rounded accent-accent shrink-0 cursor-pointer pointer-events-none"
                                      />
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate">
                                          #{prod.id} {prod.title}
                                        </p>
                                      </div>
                                    </div>
                                    <span
                                      className={`text-[10px] font-bold shrink-0 ${
                                        isSelected
                                          ? "text-accent"
                                          : "text-foreground/40"
                                      }`}
                                    >
                                      {isSelected ? (isBn ? "নির্বাচিত" : "Selected") : (isBn ? "+ যোগ করুন" : "+ Add")}
                                    </span>
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
              )}

              {deliveryRuleTargetType === "collection" && (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 opacity-70">
                    {isBn ? "কালেকশন নির্বাচন করুন *" : "Select Collection *"}
                  </label>
                  <select
                    value={deliveryRuleCollectionId}
                    onChange={(e) =>
                      setDeliveryRuleCollectionId(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    required
                    className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                  >
                    <option value="">{isBn ? "-- কালেকশন বাছুন --" : "-- Choose Collection --"}</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        #{col.id} {col.title} ({isBn ? `${(col.product_count || 0).toLocaleString("bn-BD")} টি পণ্য` : `${col.product_count || 0} products`})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                  {isBn ? "অফারের ধরন *" : "Offer Type *"}
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-primary/5 dark:bg-primary/20 rounded-xl border border-foreground/10">
                  <button
                    type="button"
                    onClick={() => setDeliveryRuleType("free")}
                    className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      deliveryRuleType === "free"
                        ? "bg-secondary text-foreground shadow-sm"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {isBn ? "ফ্রি ডেলিভারি" : "Free Delivery"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryRuleType("reduced")}
                    className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      deliveryRuleType === "reduced"
                        ? "bg-secondary text-foreground shadow-sm"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {isBn ? "বিশেষ হ্রাসকৃত চার্জ" : "Custom Charge"}
                  </button>
                </div>
              </div>

              {deliveryRuleType === "reduced" && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/80 rounded-2xl border border-foreground/10">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider mb-1 opacity-70">
                      {isBn ? "ঢাকার ভিতরে (৳) *" : "Inside Dhaka (৳) *"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-foreground/50">
                        ৳
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        required
                        value={deliveryRuleInsideCharge}
                        onChange={(e) =>
                          setDeliveryRuleInsideCharge(e.target.value)
                        }
                        placeholder={isBn ? "যেমনঃ ৩০" : "e.g. 30"}
                        className="w-full pl-7 pr-3 py-2 bg-background border border-foreground/15 rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider mb-1 opacity-70">
                      {isBn ? "ঢাকার বাইরে (৳) *" : "Outside Dhaka (৳) *"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-foreground/50">
                        ৳
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        required
                        value={deliveryRuleOutsideCharge}
                        onChange={(e) =>
                          setDeliveryRuleOutsideCharge(e.target.value)
                        }
                        placeholder={isBn ? "যেমনঃ ৬০" : "e.g. 60"}
                        className="w-full pl-7 pr-3 py-2 bg-background border border-foreground/15 rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {deliveryRuleTargetType !== "order_total" && (
                <div className="space-y-4 p-4 rounded-2xl bg-secondary/80 border border-foreground/10">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 opacity-70">
                      {isBn ? "শর্ত নির্ধারণ *" : "Offer Trigger Condition *"}
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-primary/5 dark:bg-primary/20 rounded-xl border border-foreground/10">
                      <button
                        type="button"
                        onClick={() => setDeliveryRuleMinOrderAmount("")}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          !deliveryRuleMinOrderAmount || Number(deliveryRuleMinOrderAmount) === 0
                            ? "bg-secondary text-foreground shadow-sm"
                            : "text-foreground/60 hover:text-foreground"
                        }`}
                      >
                        {isBn ? "পণ্যের সংখ্যা অনুযায়ী" : "By Quantity"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!deliveryRuleMinOrderAmount || Number(deliveryRuleMinOrderAmount) === 0) {
                            setDeliveryRuleMinOrderAmount("1000");
                          }
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          deliveryRuleMinOrderAmount && Number(deliveryRuleMinOrderAmount) > 0
                            ? "bg-secondary text-foreground shadow-sm"
                            : "text-foreground/60 hover:text-foreground"
                        }`}
                      >
                        {isBn ? "সর্বনিম্ন কেনাকাটা (৳)" : "By Minimum Spend (৳)"}
                      </button>
                    </div>
                  </div>

                  {deliveryRuleMinOrderAmount && Number(deliveryRuleMinOrderAmount) > 0 ? (
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 opacity-70">
                        {isBn ? "প্রযোজ্য পণ্যে সর্বনিম্ন খরচ (৳) *" : "Minimum Spend on Eligible Items (৳) *"}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-sm text-foreground/50">
                          ৳
                        </span>
                        <input
                          type="number"
                          min={1}
                          step="any"
                          required
                          value={deliveryRuleMinOrderAmount}
                          onChange={(e) =>
                            setDeliveryRuleMinOrderAmount(e.target.value)
                          }
                          placeholder={isBn ? "যেমনঃ ১০০০" : "e.g. 1000"}
                          className="w-full pl-8 pr-4 py-2 bg-background border border-foreground/15 rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                      <p className="text-[10px] opacity-60 mt-1">
                        {isBn
                          ? `গ্রাহক নির্বাচিত পণ্যগুলো থেকে কমপক্ষে ৳${Number(deliveryRuleMinOrderAmount || 0).toLocaleString()} টাকার কেনাকাটা করলে এই অফার পাবেন।`
                          : `Customer gets offer when they buy at least ৳${Number(deliveryRuleMinOrderAmount || 0).toLocaleString()} worth of these items.`}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 opacity-70">
                        {isBn ? "সর্বনিম্ন পণ্যের সংখ্যা *" : "Minimum Quantity Required *"}
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={deliveryRuleMinQuantity}
                        onChange={(e) =>
                          setDeliveryRuleMinQuantity(e.target.value)
                        }
                        placeholder={isBn ? "যেমনঃ ৩" : "e.g. 3"}
                        className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-2 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                      />
                      <p className="text-[10px] opacity-60 mt-1">
                        {isBn
                          ? "১ দিলে সবসময় প্রযোজ্য হবে, অথবা যেমন ৩ দিলে '৩টি পণ্য কিনলে অফার' শর্ত কার্যকর হবে।"
                          : "Set to 1 for unconditional offer, or e.g. 3 to require \"Buy 3 items to get offer\"."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary border border-foreground/10">
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {isBn ? "অফার সক্রিয় আছে" : "Rule Active"}
                  </p>
                  <p className="text-[10px] opacity-60">
                    {deliveryRuleIsActive
                      ? (isBn ? "চেকআউটে অফারটি কার্যকর রয়েছে" : "Offer is active for checkout")
                      : (isBn ? "অফারটি নিষ্ক্রিয় রয়েছে" : "Rule is disabled")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDeliveryRuleIsActive(!deliveryRuleIsActive)
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    deliveryRuleIsActive
                      ? "bg-accent"
                      : "bg-foreground/20"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      deliveryRuleIsActive
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <button
                type="submit"
                disabled={
                  deliveryRuleCreating ||
                  !deliveryRuleTitle.trim() ||
                  (deliveryRuleTargetType === "product" &&
                    deliveryRuleSelectedProductIds.length === 0) ||
                  (deliveryRuleTargetType === "collection" &&
                    !deliveryRuleCollectionId) ||
                  (deliveryRuleTargetType === "order_total" &&
                    (!deliveryRuleMinOrderAmount || isNaN(Number(deliveryRuleMinOrderAmount))))
                }
                className="w-full py-3 bg-button-bg text-button-fg rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {editingDeliveryRuleId
                  ? deliveryRuleCreating
                    ? (isBn ? "অফার আপডেট হচ্ছে..." : "Updating Rule...")
                    : (isBn ? "ডেলিভারি অফার আপডেট করুন" : "Update Delivery Rule")
                  : deliveryRuleCreating
                    ? (isBn ? "অফার তৈরি হচ্ছে..." : "Creating Rule...")
                    : (isBn ? "নতুন ডেলিভারি অফার সংরক্ষণ করুন" : "Create Delivery Rule")}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-foreground/10">
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                {isBn
                  ? `বিদ্যমান ডেলিভারি অফারসমূহ (${deliveryRulesList.length.toLocaleString("bn-BD")})`
                  : `Existing Delivery Offers (${deliveryRulesList.length})`}
              </h4>
              <input
                type="text"
                value={deliveryRuleFilterSearch}
                onChange={(e) =>
                  setDeliveryRuleFilterSearch(e.target.value)
                }
                placeholder={isBn ? "অফার খুঁজুন..." : "Search rules..."}
                className="px-3.5 py-1.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full sm:w-48 focus:ring-2 focus:ring-accent"
              />
            </div>

            {(() => {
              const filtered = deliveryRulesList.filter((r) => {
                const q = deliveryRuleFilterSearch.toLowerCase().trim();
                if (!q) return true;
                return (
                  r.title.toLowerCase().includes(q) ||
                  (r.collection_title &&
                    r.collection_title.toLowerCase().includes(q))
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 text-center rounded-3xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 text-xs opacity-50 font-bold">
                    {deliveryRuleFilterSearch
                      ? (isBn ? `"${deliveryRuleFilterSearch}" এর সাথে কোনো ডেলিভারি অফার মিলেনি।` : `No delivery rules found matching "${deliveryRuleFilterSearch}".`)
                      : (isBn ? "এখনও কোনো কাস্টম ডেলিভারি অফার তৈরি হয়নি। বামপাশের ফর্ম থেকে তৈরি করুন।" : "No custom delivery rules configured yet. Create a free or reduced delivery rule above.")}
                  </div>
                );
              }

              return (
                <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                  {filtered.map((rule) => {
                    const isFree = rule.rule_type === "free";
                    const isBeingEdited = editingDeliveryRuleId === rule.id;

                    return (
                      <div
                        key={rule.id}
                        onClick={() => handleStartEditDeliveryRule(rule)}
                        className={`p-5 rounded-2xl border-2 flex flex-col justify-between gap-4 shadow-xs relative overflow-hidden group cursor-pointer transition-all ${
                          isBeingEdited
                            ? "border-accent shadow-md bg-accent/5"
                            : rule.is_active
                              ? "bg-secondary border-foreground/10 hover:border-accent/40"
                              : "bg-secondary/40 border-foreground/10 opacity-60 hover:opacity-90 hover:border-accent/40"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-sm uppercase px-3 py-1 rounded-lg bg-accent/15 text-accent border border-accent/30 tracking-wider">
                                  {isFree ? (isBn ? "ফ্রি ডেলিভারি" : "FREE DELIVERY") : (isBn ? "বিশেষ চার্জ" : "CUSTOM CHARGE")}
                                </span>
                                {rule.target_type !== "order_total" && Number(rule.min_quantity || 1) > 1 && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-accent/20 text-accent border border-accent/30">
                                    {isBn ? `ন্যূনতম ${rule.min_quantity} টি` : `Min ${rule.min_quantity} Qty`}
                                  </span>
                                )}
                                {rule.target_type === "order_total" && Number(rule.min_order_amount || 0) > 0 && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-accent/20 text-accent border border-accent/30">
                                    {isBn ? `অর্ডার ≥ ৳${Number(rule.min_order_amount).toLocaleString()}` : `Order ≥ ৳${Number(rule.min_order_amount).toLocaleString()}`}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleDeliveryRule(rule);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                                    rule.is_active
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                                      : "bg-foreground/15 text-foreground/60 hover:bg-foreground/25"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      rule.is_active
                                        ? "bg-emerald-500"
                                        : "bg-foreground/50"
                                    }`}
                                  />
                                  {rule.is_active ? (isBn ? "সক্রিয়" : "Active") : (isBn ? "নিষ্ক্রিয়" : "Disabled")}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-secondary/80 border border-foreground/5 text-xs space-y-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">
                              {isBn ? "প্রযোজ্য ক্ষেত্র: " : "SCOPE: "}
                              {rule.target_type === "product"
                                ? (isBn ? "নির্দিষ্ট পণ্যসমূহ" : "SPECIFIC PRODUCTS")
                                : rule.target_type === "collection"
                                ? (isBn ? "কালেকশন / ক্যাটাগরি" : "COLLECTION")
                                : (isBn ? "মোট অর্ডারের পরিমাণ" : "ORDER TOTAL THRESHOLD")}
                            </p>
                            {rule.target_type === "order_total" ? (
                              <p className="font-bold text-foreground">
                                {isBn ? `ন্যূনতম ৳${Number(rule.min_order_amount || 0).toLocaleString()} টাকার সকল অর্ডারে প্রযোজ্য` : `Applies to all orders with Subtotal ≥ ৳${Number(rule.min_order_amount || 0).toLocaleString()}`}
                              </p>
                            ) : rule.target_type === "product" ? (
                              <div>
                                <p className="font-bold text-foreground">
                                  {isBn
                                    ? `${(rule.product_count || (rule.products_details ? rule.products_details.length : 0)).toLocaleString("bn-BD")} টি পণ্য নির্বাচিত`
                                    : `${rule.product_count || (rule.products_details ? rule.products_details.length : 0)} Product(s) Selected`}
                                </p>
                                {rule.products_details &&
                                  rule.products_details.length > 0 && (
                                    <p className="text-[11px] opacity-70 font-normal truncate mt-0.5">
                                      {rule.products_details
                                        .map((p) => p.title)
                                        .join(", ")}
                                    </p>
                                  )}
                              </div>
                            ) : (
                              <p className="font-bold text-foreground">
                                {isBn ? "কালেকশন: " : "Collection: "}
                                {rule.collection_title ||
                                  `#${rule.collection}`}
                              </p>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-[10px] opacity-70 font-semibold pt-1">
                            <span>
                              {isBn ? "অফারঃ " : "Rule: "}
                              <strong className="text-foreground">
                                {rule.title}
                              </strong>
                            </span>
                            {!isFree && (
                              <span>
                                {isBn ? "ঢাকার ভিতরেঃ " : "Inside: "}
                                <strong className="text-accent">
                                  ৳{rule.inside_dhaka_charge}
                                </strong>{" "}
                                | {isBn ? "ঢাকার বাইরেঃ " : "Outside: "}
                                <strong className="text-accent">
                                  ৳{rule.outside_dhaka_charge}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-foreground/10 flex justify-end items-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDeliveryRule(rule.id, rule.title);
                            }}
                            className="text-[10px] font-extrabold text-red-500 hover:underline uppercase tracking-wider cursor-pointer"
                          >
                            {isBn ? "মুছুন" : "Delete"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
