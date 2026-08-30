"use client";

import { useState } from "react";
import { Collection, CouponItem, Product } from "../../types";
import ProductImage from "@/components/ui/ProductImage";
import { useLanguage } from "@/store/LanguageContext";

interface CouponsTabProps {
  couponsList: CouponItem[];
  editingCouponId: number | null;
  couponCode: string;
  setCouponCode: (code: string) => void;
  couponDiscountPercent: string;
  setCouponDiscountPercent: (percent: string) => void;
  couponValidTo: string;
  setCouponValidTo: (date: string) => void;
  couponIsActive: boolean;
  setCouponIsActive: (active: boolean) => void;
  couponTargetType: "product" | "collection";
  setCouponTargetType: (type: "product" | "collection") => void;
  couponSelectedProductIds: number[];
  setCouponSelectedProductIds: React.Dispatch<React.SetStateAction<number[]>>;
  couponCollectionId: number | "";
  setCouponCollectionId: (id: number | "") => void;
  couponSearchInput: string;
  setCouponSearchInput: (input: string) => void;
  isCouponDropdownOpen: boolean;
  setIsCouponDropdownOpen: (open: boolean) => void;
  couponCreating: boolean;
  handleSaveCoupon: (e: React.FormEvent) => Promise<void>;
  handleEditCoupon: (coupon: CouponItem) => void;
  handleCancelEditCoupon: () => void;
  handleToggleCouponActive: (coupon: CouponItem, e: React.MouseEvent) => Promise<void>;
  handleDeleteCoupon: (couponId: number, code: string) => Promise<void>;
  selectedCouponProducts: Product[];
  promoProductsCatalog: Product[];
  collections: Collection[];
}

export default function CouponsTab({
  couponsList,
  editingCouponId,
  couponCode,
  setCouponCode,
  couponDiscountPercent,
  setCouponDiscountPercent,
  couponValidTo,
  setCouponValidTo,
  couponIsActive,
  setCouponIsActive,
  couponTargetType,
  setCouponTargetType,
  couponSelectedProductIds,
  setCouponSelectedProductIds,
  couponCollectionId,
  setCouponCollectionId,
  couponSearchInput,
  setCouponSearchInput,
  isCouponDropdownOpen,
  setIsCouponDropdownOpen,
  couponCreating,
  handleSaveCoupon,
  handleEditCoupon,
  handleCancelEditCoupon,
  handleToggleCouponActive,
  handleDeleteCoupon,
  selectedCouponProducts,
  promoProductsCatalog,
  collections,
}: CouponsTabProps) {
  const { locale, t } = useLanguage();
  const isBn = locale === "bn";

  const [couponFilterSearch, setCouponFilterSearch] = useState("");

  const filteredCoupons = couponsList.filter(
    (c) =>
      !couponFilterSearch.trim() ||
      c.code.toLowerCase().includes(couponFilterSearch.toLowerCase().trim()) ||
      (c.collection_title &&
        c.collection_title
          .toLowerCase()
          .includes(couponFilterSearch.toLowerCase().trim()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
      {/* Left Column: Create/Edit Coupon Form */}
      <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm h-fit lg:sticky lg:top-24 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-foreground/10">
          <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
            {editingCouponId
              ? `${t("admin.coupons.editTitle")} #${editingCouponId}`
              : t("admin.coupons.createTitle")}
          </h2>
          {editingCouponId && (
            <button
              type="button"
              onClick={handleCancelEditCoupon}
              className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
            >
              {t("admin.coupons.cancelEdit")}
            </button>
          )}
        </div>

        <form onSubmit={handleSaveCoupon} className="space-y-5">
          {/* Coupon Code Input */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
              {t("admin.coupons.code")}
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={couponCode}
              onChange={(e) =>
                setCouponCode(e.target.value.toUpperCase().slice(0, 20))
              }
              placeholder={t("admin.coupons.codePlaceholder")}
              className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider text-foreground outline-none focus:ring-2 focus:ring-accent shadow-inner"
            />
          </div>

          {/* Discount Percentage */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
              {t("admin.coupons.discount")}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="1"
                max="100"
                required
                value={couponDiscountPercent}
                onChange={(e) => setCouponDiscountPercent(e.target.value)}
                placeholder="e.g. 20"
                className="w-full bg-background border border-foreground/15 rounded-xl px-4 pr-20 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none px-2 py-1 rounded-lg bg-accent/20 text-accent font-extrabold text-[10px] uppercase tracking-wider">
                {isBn ? "% ছাড়" : "% OFF"}
              </div>
            </div>
          </div>

          {/* Expiry Date & Time */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
              {isBn ? "মেয়াদ শেষ হওয়ার তারিখ ও সময় *" : "Valid Until (Expiration Date & Time) *"}
            </label>
            <input
              type="datetime-local"
              required
              value={couponValidTo}
              onChange={(e) => setCouponValidTo(e.target.value)}
              className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent shadow-inner"
            />
          </div>

          {/* Status On/Off Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-foreground/15">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-foreground">
                {isBn ? "অবস্থা: " : "Status: "}
                {couponIsActive
                  ? (isBn ? "সক্রিয় (Active)" : "Active")
                  : (isBn ? "নিষ্ক্রিয় (Disabled)" : "Disabled")}
              </p>
              <p className="text-[10px] opacity-60 font-medium">
                {couponIsActive
                  ? (isBn ? "গ্রাহকরা এই কুপনটি রিডিম বা ব্যবহার করতে পারবেন।" : "Customers can redeem this coupon.")
                  : (isBn ? "কুপনটি বন্ধ আছে এবং ব্যবহার করা যাবে না।" : "Coupon is disabled and cannot be redeemed.")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCouponIsActive(!couponIsActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                couponIsActive ? "bg-accent" : "bg-foreground/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  couponIsActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Target Scope Switcher */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
              {isBn ? "কুপন প্রযোজ্য হবে *" : "Apply Coupon To *"}
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-primary/5 dark:bg-primary/20 rounded-xl border border-foreground/10">
              <button
                type="button"
                onClick={() => setCouponTargetType("product")}
                className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  couponTargetType === "product"
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {isBn ? "নির্দিষ্ট পণ্যসমূহ" : "Specific Products"}
              </button>
              <button
                type="button"
                onClick={() => setCouponTargetType("collection")}
                className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  couponTargetType === "collection"
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {isBn ? "কালেকশন / ক্যাটাগরি" : "Collection"}
              </button>
            </div>
          </div>

          {/* If Target is Products: Live Search & Multi-Selector */}
          {couponTargetType === "product" && (
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                  {isBn
                    ? `প্রযোজ্য পণ্য নির্বাচন করুন (মোট ${promoProductsCatalog.length.toLocaleString("bn-BD")} টি)`
                    : `Select Eligible Products (${promoProductsCatalog.length} available)`}
                </label>
                {couponSelectedProductIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCouponSelectedProductIds([]);
                      setCouponSearchInput("");
                    }}
                    className="text-[9px] font-bold text-red-500 hover:underline uppercase cursor-pointer"
                  >
                    {isBn ? `সব মুছুন (${couponSelectedProductIds.length.toLocaleString("bn-BD")})` : `Clear All (${couponSelectedProductIds.length})`}
                  </button>
                )}
              </div>

              {/* Selected Products Chips */}
              {selectedCouponProducts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 max-h-36 overflow-y-auto">
                  {selectedCouponProducts.map((p) => (
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
                          setCouponSelectedProductIds((prev) =>
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
                  value={couponSearchInput}
                  onFocus={() => setIsCouponDropdownOpen(true)}
                  onChange={(e) => {
                    setCouponSearchInput(e.target.value);
                    setIsCouponDropdownOpen(true);
                  }}
                  placeholder={isBn ? "কুপনে যুক্ত করতে পণ্য খুঁজুন..." : "Search product to add to coupon..."}
                  className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent placeholder:font-normal shadow-inner"
                />
                {couponSelectedProductIds.length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-accent/20 text-accent font-black text-[10px] uppercase">
                    {isBn ? `${couponSelectedProductIds.length.toLocaleString("bn-BD")} টি নির্বাচিত` : `${couponSelectedProductIds.length} Selected`}
                  </span>
                )}
              </div>

              {/* Floating Suggestions List */}
              {isCouponDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsCouponDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-secondary border border-foreground/15 rounded-2xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-foreground/10 p-1.5 backdrop-blur-md">
                    {(() => {
                      const query = couponSearchInput.toLowerCase().trim();
                      const matches = promoProductsCatalog.filter(
                        (prod) =>
                          !query ||
                          prod.title.toLowerCase().includes(query) ||
                          String(prod.id).includes(query)
                      );

                      if (matches.length === 0) {
                        return (
                          <div className="p-4 text-center text-xs font-bold opacity-50">
                            {isBn ? `"${couponSearchInput}" এর সাথে কোনো পণ্য মিলেনি` : `No products found matching "${couponSearchInput}"`}
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
                                setCouponSelectedProductIds((prev) =>
                                  Array.from(new Set([...prev, ...matchIds]))
                                );
                              }}
                              className="text-accent hover:underline uppercase cursor-pointer"
                            >
                              {isBn ? `+ সবগুলো নির্বাচন (${matches.length.toLocaleString("bn-BD")})` : `+ Select All (${matches.length})`}
                            </button>
                          </div>
                          {matches.map((prod) => {
                            const isSelected =
                              couponSelectedProductIds.includes(prod.id);
                            return (
                              <div
                                key={prod.id}
                                onClick={() => {
                                  setCouponSelectedProductIds((prev) =>
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
                                      {isBn ? "মূল্যঃ ৳" : "Price: ৳"}
                                      {Number(prod.unit_price).toFixed(2)}
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

          {/* If Target is Collection: Collection Dropdown */}
          {couponTargetType === "collection" && (
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                {isBn ? "কালেকশন নির্বাচন করুন *" : "Select Collection *"}
              </label>
              <select
                value={couponCollectionId}
                onChange={(e) =>
                  setCouponCollectionId(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                required
                className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent cursor-pointer"
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

          <button
            type="submit"
            disabled={
              couponCreating ||
              !couponCode.trim() ||
              (couponTargetType === "product" &&
                couponSelectedProductIds.length === 0) ||
              (couponTargetType === "collection" && !couponCollectionId)
            }
            className="w-full py-4 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {editingCouponId
              ? couponCreating
                ? (isBn ? "কুপন আপডেট হচ্ছে..." : "Updating Coupon...")
                : (isBn ? "কুপন আপডেট করুন" : "Update Coupon")
              : couponCreating
                ? (isBn ? "কুপন তৈরি হচ্ছে..." : "Creating Coupon...")
                : (isBn ? "নতুন কুপন সংরক্ষণ করুন" : "Create Coupon Now")}
          </button>
        </form>
      </div>

      {/* Right Column: Existing Coupons List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
              {isBn
                ? `স্টোরের কুপনসমূহ (${couponsList.length.toLocaleString("bn-BD")})`
                : `Store Coupons (${couponsList.length})`}
            </h2>
            <input
              type="text"
              value={couponFilterSearch}
              onChange={(e) => setCouponFilterSearch(e.target.value)}
              placeholder={isBn ? "কুপন কোড দিয়ে অনুসন্ধান..." : "Search coupons by code..."}
              className="px-3.5 py-1.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full sm:w-56 focus:ring-2 focus:ring-accent"
            />
          </div>

          {filteredCoupons.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold uppercase tracking-wider opacity-50">
              {couponFilterSearch
                ? (isBn ? `"${couponFilterSearch}" এর সাথে কোনো কুপন পাওয়া যায়নি।` : `No coupons found matching "${couponFilterSearch}".`)
                : (isBn ? "এখনও কোনো কুপন তৈরি করা হয়নি। নতুন কুপন যোগ করতে বামপাশের ফর্মটি পূরণ করুন!" : "No coupons created yet. Use the form on the left to create your first coupon!")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCoupons.map((coupon) => {
                const isExpired =
                  coupon.valid_to && new Date(coupon.valid_to) < new Date();
                const formattedExpiry = coupon.valid_to
                  ? new Date(coupon.valid_to).toLocaleDateString(isBn ? "bn-BD" : undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : (isBn ? "মেয়াদহীন" : "No Expiry");
                const isBeingEdited = editingCouponId === coupon.id;

                return (
                  <div
                    key={coupon.id}
                    onClick={() => handleEditCoupon(coupon)}
                    className={`p-5 rounded-2xl border-2 flex flex-col justify-between gap-4 shadow-xs relative overflow-hidden group cursor-pointer transition-all ${
                      isBeingEdited
                        ? "border-accent shadow-md bg-accent/5"
                        : coupon.is_active
                          ? "bg-background border-foreground/10 hover:border-accent/40"
                          : "bg-background/40 border-foreground/10 opacity-60 hover:opacity-90 hover:border-accent/40"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header: Code, Active Toggle, & Discount Badge */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm uppercase px-3 py-1 rounded-lg bg-accent/15 text-accent border border-accent/30 tracking-wider">
                              {coupon.code}
                            </span>
                            {/* On/Off Toggle Button */}
                            <button
                              type="button"
                              onClick={(e) =>
                                handleToggleCouponActive(coupon, e)
                              }
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                                coupon.is_active
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                                  : "bg-foreground/15 text-foreground/60 hover:bg-foreground/25"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  coupon.is_active
                                    ? "bg-emerald-500"
                                    : "bg-foreground/50"
                                }`}
                              />
                              {coupon.is_active
                                ? (isBn ? "সক্রিয়" : "Active")
                                : (isBn ? "নিষ্ক্রিয়" : "Disabled")}
                            </button>
                            {isExpired && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-500/15 text-red-500">
                                {isBn ? "মেয়াদোত্তীর্ণ" : "Expired"}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-black text-lg text-accent">
                          {isBn ? `${Number(coupon.discount_percent).toLocaleString("bn-BD")}% ছাড়` : `${Number(coupon.discount_percent)}% OFF`}
                        </span>
                      </div>

                      {/* Target Details */}
                      <div className="p-3 rounded-xl bg-secondary/80 border border-foreground/5 text-xs space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">
                          {isBn ? "প্রযোজ্য ক্ষেত্র: " : "Scope: "}
                          {coupon.target_type === "product"
                            ? (isBn ? "নির্দিষ্ট পণ্যসমূহ" : "Specific Products")
                            : (isBn ? "কালেকশন / ক্যাটাগরি" : "Collection")}
                        </p>
                        {coupon.target_type === "product" ? (
                          <p className="font-bold text-foreground truncate">
                            {isBn
                              ? `${(coupon.product_count || (coupon.products_details ? coupon.products_details.length : 0)).toLocaleString("bn-BD")} টি পণ্য নির্বাচিত`
                              : `${coupon.product_count || (coupon.products_details ? coupon.products_details.length : 0)} Product(s) Selected`}
                            {coupon.products_details &&
                              coupon.products_details.length > 0 && (
                                <span className="block text-[10px] opacity-70 font-normal truncate mt-0.5">
                                  {coupon.products_details
                                    .map((p) => p.title)
                                    .join(", ")}
                                </span>
                              )}
                          </p>
                        ) : (
                          <p className="font-bold text-foreground">
                            {isBn ? "কালেকশন: " : "Collection: "}
                            {coupon.collection_title || `#${coupon.collection}`}
                          </p>
                        )}
                      </div>

                      {/* Expiry Timestamp */}
                      <div className="flex justify-between items-center text-[10px] opacity-60 font-semibold pt-1">
                        <span>{isBn ? "মেয়াদ শেষঃ " : "Expires: "}{formattedExpiry}</span>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-2 border-t border-foreground/10 flex justify-end items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCoupon(coupon.id, coupon.code);
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
          )}
        </div>
      </div>
    </div>
  );
}
