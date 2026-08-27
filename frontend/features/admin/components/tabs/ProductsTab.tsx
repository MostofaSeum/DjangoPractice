"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import { Collection, Product, ProductSubTab } from "../../types";
import ProductSearchBar from "@/features/products/components/ProductSearchBar";
import ProductImage from "@/components/ui/ProductImage";
import ImageUploadModal from "@/components/ui/ImageUploadModal";
import ProductVariantsManager from "@/features/products/components/ProductVariantsManager";
import ReviewsSubTab from "./ReviewsSubTab";
import StockHealthTab from "./StockHealthTab";
import SheetsSyncTab from "./SheetsSyncTab";
import { useLanguage } from "@/store/LanguageContext";

interface ProductsTabProps {
  productSubTab: ProductSubTab;
  mounted: boolean;
  products: Product[];
  collections: Collection[];
  totalProductsCount: number;
  prodPage: number;
  setProdPage: React.Dispatch<React.SetStateAction<number>>;
  activeProductQuery: string;
  setActiveProductQuery: (q: string) => void;
  editingProductId: number | null;
  productForm: {
    title: string;
    slug: string;
    unit_price: string;
    inventory: string;
    collection: string;
    short_description: string;
    description: string;
    is_visible?: boolean;
  };
  setProductForm: React.Dispatch<
    React.SetStateAction<{
      title: string;
      slug: string;
      unit_price: string;
      inventory: string;
      collection: string;
      short_description: string;
      description: string;
      is_visible?: boolean;
    }>
  >;
  handleSaveProduct: (e: React.FormEvent) => Promise<void>;
  handleDeleteProduct: (id: number) => Promise<void>;
  handleToggleProductTrending: (prod: Product) => Promise<void>;
  handleToggleProductVisibility?: (prod: Product) => Promise<void>;
  handleSelectProduct: (prod: Product) => void;
  handleCancelEdit: () => void;
  editProductSearch: string;
  setEditProductSearch: (search: string) => void;
  promoProductsCatalog: Product[];
  newProductPhotos: File[];
  setNewProductPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  newProductPhotoPreviews: string[];
  setNewProductPhotoPreviews: React.Dispatch<React.SetStateAction<string[]>>;
  newProductFileInputRef: React.RefObject<HTMLInputElement | null>;
  newProductVariants: Array<{
    id?: string;
    name: string;
    color_name: string;
    color_code: string;
    size: string;
    price_override: string;
    inventory: string;
    is_active: boolean;
  }>;
  setNewProductVariants: React.Dispatch<
    React.SetStateAction<
      Array<{
        id?: string;
        name: string;
        color_name: string;
        color_code: string;
        size: string;
        price_override: string;
        inventory: string;
        is_active: boolean;
      }>
    >
  >;
  isNewVariantModalOpen: boolean;
  setIsNewVariantModalOpen: (open: boolean) => void;
  editingNewVariantIndex: number | null;
  setEditingNewVariantIndex: (idx: number | null) => void;
  newVariantForm: {
    name: string;
    color_name: string;
    color_code: string;
    size: string;
    price_override: string;
    inventory: string;
    is_active: boolean;
  };
  setNewVariantForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      color_name: string;
      color_code: string;
      size: string;
      price_override: string;
      inventory: string;
      is_active: boolean;
    }>
  >;
  fetchAdminData: () => Promise<void>;
  setHasUnsavedPhotos: (unsaved: boolean) => void;
  token: string | null;
  adminDataVersion: number;
}

export default function ProductsTab({
  productSubTab,
  mounted,
  products,
  collections,
  totalProductsCount,
  prodPage,
  setProdPage,
  activeProductQuery,
  setActiveProductQuery,
  editingProductId,
  productForm,
  setProductForm,
  handleSaveProduct,
  handleDeleteProduct,
  handleToggleProductTrending,
  handleToggleProductVisibility,
  handleSelectProduct,
  handleCancelEdit,
  editProductSearch,
  setEditProductSearch,
  promoProductsCatalog,
  newProductPhotos,
  setNewProductPhotos,
  newProductPhotoPreviews,
  setNewProductPhotoPreviews,
  newProductFileInputRef,
  newProductVariants,
  setNewProductVariants,
  isNewVariantModalOpen,
  setIsNewVariantModalOpen,
  editingNewVariantIndex,
  setEditingNewVariantIndex,
  newVariantForm,
  setNewVariantForm,
  fetchAdminData,
  setHasUnsavedPhotos,
  token,
  adminDataVersion,
}: ProductsTabProps) {
  const { locale, formatCurrency } = useLanguage();
  const isBn = locale === "bn";

  return (
    <div className="flex flex-col gap-6">
      {/* SUBTAB 4: Stock Health Alerts */}
      {productSubTab === "stock-health" && (
        <StockHealthTab
          products={promoProductsCatalog && promoProductsCatalog.length > 0 ? promoProductsCatalog : products}
          collections={collections}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {/* SUBTAB 5: Reviews */}
      {productSubTab === "reviews" && (
        <ReviewsSubTab products={products} token={token} />
      )}

      {/* SUBTAB 6: Google Sheets & Excel Sync */}
      {productSubTab === "sheets-sync" && (
        <SheetsSyncTab
          apiBase={process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}
          token={token}
          onSyncSuccess={fetchAdminData}
        />
      )}

      {/* SUBTAB 2: Add New Product */}
      {productSubTab === "add" && (
        <div className="max-w-3xl mx-auto w-full bg-secondary text-foreground p-8 md:p-10 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-foreground/10">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                {isBn ? "নতুন পণ্য যোগ করুন" : "Add New Product"}
              </h2>
              <p className="text-xs text-foreground/60 mt-0.5">
                {isBn
                  ? "নতুন পণ্য তৈরি ও প্রকাশ করতে নিচের বিবরণগুলো পূরণ করুন।"
                  : "Fill in the details below to create and publish a new product."}
              </p>
            </div>
          </div>
          <form onSubmit={handleSaveProduct} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {isBn ? "পণ্যের নাম *" : "Product Title *"}
              </label>
              <input
                type="text"
                required
                value={productForm.title}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    title: e.target.value,
                  })
                }
                placeholder={isBn ? "যেমনঃ নিয়ন লিপস্টিক, ময়েশ্চারাইজার" : "e.g. Neon Void Hoodie"}
                className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? "একক মূল্য (৳) *" : "Unit Price (৳) *"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={productForm.unit_price}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      unit_price: e.target.value,
                    })
                  }
                  placeholder="99.99"
                  className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {isBn ? "স্টক পরিমাণ *" : "Inventory Stock *"}
                  </label>
                  {newProductVariants.length > 0 && (
                    <span className="text-[9px] font-bold text-accent">
                      {isBn
                        ? `${newProductVariants.length.toLocaleString("bn-BD")} টি ভ্যারিয়েন্টের মোট যোগফল`
                        : `Sum of ${newProductVariants.length} variants`}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  value={
                    newProductVariants.length > 0
                      ? String(
                          newProductVariants.reduce(
                            (acc, v) => acc + (parseInt(v.inventory) || 0),
                            0
                          )
                        )
                      : productForm.inventory
                  }
                  readOnly={newProductVariants.length > 0}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      inventory: e.target.value,
                    })
                  }
                  placeholder="10"
                  className={`px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all ${
                    newProductVariants.length > 0 ? "opacity-80 cursor-not-allowed" : ""
                  }`}
                  title={
                    newProductVariants.length > 0
                      ? isBn
                        ? "নিচের ভ্যারিয়েন্টগুলোর স্টক থেকে স্বয়ংক্রিয়ভাবে হিসাব করা হয়েছে"
                        : "Automatically calculated from the variants below"
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {isBn ? "কালেকশন / ক্যাটাগরি *" : "Collection *"}
              </label>
              <select
                value={
                  productForm.collection ||
                  (collections.length > 0 ? String(collections[0].id) : "")
                }
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    collection: e.target.value,
                  })
                }
                className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-accent transition-all"
              >
                {collections.map((col) => (
                  <option
                    key={col.id}
                    value={col.id}
                    className="bg-secondary text-foreground"
                  >
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const shortWords = productForm.short_description.trim()
                ? productForm.short_description.trim().split(/\s+/).length
                : 0;
              const detailWords = productForm.description.trim()
                ? productForm.description.trim().split(/\s+/).length
                : 0;
              return (
                <>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                        {isBn ? "সংক্ষিপ্ত বিবরণ" : "Short Description"} <span className="text-red-500">*</span>
                      </label>
                      <span
                        className={`text-[10px] font-bold ${
                          shortWords > 150 ? "text-red-500" : "opacity-60"
                        }`}
                      >
                        {isBn ? `${shortWords.toLocaleString("bn-BD")}/১৫০ শব্দ` : `${shortWords}/150 words`}
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={productForm.short_description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          short_description: e.target.value,
                        })
                      }
                      placeholder={isBn ? "পণ্যের মূল বৈশিষ্ট্য বা সংক্ষেপ লিখুন" : "Brief summarize your product"}
                      className={`px-4 py-2.5 border rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none transition-all ${
                        shortWords > 150
                          ? "border-red-500 ring-1 ring-red-500"
                          : "border-foreground/15 focus:ring-2 focus:ring-accent"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                        {isBn ? "বিস্তারিত বিবরণ" : "Details Description"} <span className="text-red-500">*</span>
                      </label>
                      <span
                        className={`text-[10px] font-bold ${
                          detailWords > 500 ? "text-red-500" : "opacity-60"
                        }`}
                      >
                        {isBn ? `${detailWords.toLocaleString("bn-BD")}/৫০০ শব্দ` : `${detailWords}/500 words`}
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      required
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          description: e.target.value,
                        })
                      }
                      placeholder={isBn ? "পণ্যের সম্পূর্ণ বিবরণ, উপাদান, ব্যবহারের নিয়ম ইত্যাদি..." : "Full product details, materials, sizing, specifications"}
                      className={`px-4 py-2.5 border rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none transition-all ${
                        detailWords > 500
                          ? "border-red-500 ring-1 ring-red-500"
                          : "border-foreground/15 focus:ring-2 focus:ring-accent"
                      }`}
                    />
                  </div>
                </>
              );
            })()}

            {/* Creation Mode: Add Photos & Variants directly */}
            <div className="space-y-6 pt-4 border-t border-foreground/10">
              {/* 1. Photos Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {isBn
                      ? `পণ্যের ছবি (${newProductPhotos.length.toLocaleString("bn-BD")}/৫)`
                      : `Product Photos (${newProductPhotos.length}/5)`}
                  </label>
                </div>

                <input
                  type="file"
                  ref={newProductFileInputRef}
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    const remainingSlots = 5 - newProductPhotos.length;
                    const addedFiles = Array.from(files).slice(
                      0,
                      remainingSlots
                    );
                    const addedPreviews = addedFiles.map((file) =>
                      URL.createObjectURL(file)
                    );
                    setNewProductPhotos((prev) => [...prev, ...addedFiles]);
                    setNewProductPhotoPreviews((prev) => [
                      ...prev,
                      ...addedPreviews,
                    ]);
                    if (newProductFileInputRef.current) {
                      newProductFileInputRef.current.value = "";
                    }
                  }}
                />

                {/* Main Cover Photo Preview (Hero) */}
                {newProductPhotoPreviews.length > 0 ? (
                  <div className="space-y-3">
                    <div className="relative group rounded-2xl overflow-hidden border-2 border-yellow-500/80 shadow-sm bg-secondary aspect-[4/3] w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newProductPhotoPreviews[0]}
                        alt="Main Cover Preview"
                        className="object-cover w-full h-full opacity-90"
                      />
                      <div className="absolute top-3 left-3 bg-yellow-500 text-black font-black px-2.5 py-1 rounded-lg text-[9px] uppercase shadow-sm">
                        {isBn ? "কভার (মূল ছবি)" : "Cover (Main)"}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(newProductPhotoPreviews[0]);
                          setNewProductPhotos((prev) =>
                            prev.filter((_, i) => i !== 0)
                          );
                          setNewProductPhotoPreviews((prev) =>
                            prev.filter((_, i) => i !== 0)
                          );
                        }}
                        className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      >
                        {isBn ? "বাছাই বাতিল করুন" : "Remove Selected"}
                      </button>
                    </div>

                    {/* Thumbnails for Detail Photos */}
                    {newProductPhotoPreviews.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {newProductPhotoPreviews
                          .slice(1)
                          .map((previewUrl, idx) => {
                            const actualIdx = idx + 1;
                            return (
                              <div
                                key={actualIdx}
                                className="relative group rounded-xl overflow-hidden border border-foreground/15 bg-secondary aspect-square"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={previewUrl}
                                  alt={`Detail ${actualIdx}`}
                                  className="object-cover w-full h-full"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    URL.revokeObjectURL(previewUrl);
                                    setNewProductPhotos((prev) =>
                                      prev.filter((_, i) => i !== actualIdx)
                                    );
                                    setNewProductPhotoPreviews((prev) =>
                                      prev.filter((_, i) => i !== actualIdx)
                                    );
                                  }}
                                  className="absolute inset-0 bg-black/60 text-white text-[9px] font-bold uppercase opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                >
                                  {isBn ? "মুছুন" : "Remove"}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {newProductPhotoPreviews.length < 5 && (
                      <button
                        type="button"
                        onClick={() => newProductFileInputRef.current?.click()}
                        className="w-full py-2.5 border-2 border-dashed border-foreground/20 rounded-xl text-xs font-bold uppercase tracking-wider hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>+</span>
                        <span>
                          {isBn
                            ? `আরও ছবি যোগ করুন (${(5 - newProductPhotoPreviews.length).toLocaleString("bn-BD")} টি বাকি)`
                            : `Add More Photos (${5 - newProductPhotoPreviews.length} left)`}
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => newProductFileInputRef.current?.click()}
                    className="border-2 border-dashed border-foreground/20 hover:border-accent rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-primary/5 flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-lg font-black">
                      +
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">
                        {isBn ? "ছবি নির্বাচন করতে ক্লিক করুন" : "Click to choose photos"}
                      </p>
                      <p className="text-[10px] opacity-60">
                        {isBn
                          ? "সর্বোচ্চ ৫টি ছবি আপলোড করতে পারবেন (১ম ছবিটি মূল কভার হবে)"
                          : "Upload up to 5 photos (1st will be Cover Photo)"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Variants Section */}
              <div className="space-y-3 pt-4 border-t border-foreground/10">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                      {isBn ? "পণ্য ভ্যারিয়েন্ট (ঐচ্ছিক)" : "Product Variants (Optional)"}
                    </label>
                    <p className="text-[9px] opacity-60">
                      {isBn ? "ভিন্ন ভিন্ন রঙ, শেড, সাইজ বা মূল্য যোগ করুন" : "Add different colors, sizes, or prices"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNewVariantIndex(null);
                      setNewVariantForm({
                        name: "",
                        color_name: "",
                        color_code: "",
                        size: "",
                        price_override: "",
                        inventory: "10",
                        is_active: true,
                      });
                      setIsNewVariantModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 text-[10px] font-black uppercase tracking-wider border border-accent/20 transition-colors cursor-pointer"
                  >
                    {isBn ? "+ ভ্যারিয়েন্ট যোগ করুন" : "+ Add Variant"}
                  </button>
                </div>

                {/* Variants List */}
                {newProductVariants.length > 0 ? (
                  <div className="space-y-2">
                    {newProductVariants.map((variant, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-foreground/10 bg-primary/5 dark:bg-primary/20 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          {variant.color_code && (
                            <span
                              className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                              style={{
                                backgroundColor: variant.color_code,
                              }}
                            />
                          )}
                          <div>
                            <p className="font-bold">{variant.name}</p>
                            <div className="flex items-center gap-2 text-[10px] opacity-60">
                              {variant.color_name && (
                                <span>{variant.color_name}</span>
                              )}
                              {variant.size && (
                                <span>{isBn ? `সাইজঃ ${variant.size}` : `Size: ${variant.size}`}</span>
                              )}
                              <span>{isBn ? `স্টকঃ ${(parseInt(variant.inventory) || 0).toLocaleString("bn-BD")}` : `Stock: ${variant.inventory}`}</span>
                              {variant.price_override && (
                                <span className="text-accent font-bold">
                                  {formatCurrency(Number(variant.price_override))}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNewVariantIndex(idx);
                              setNewVariantForm({
                                name: variant.name,
                                color_name: variant.color_name || "",
                                color_code: variant.color_code || "",
                                size: variant.size || "",
                                price_override: variant.price_override || "",
                                inventory: variant.inventory,
                                is_active: variant.is_active ?? true,
                              });
                              setIsNewVariantModalOpen(true);
                            }}
                            className="px-2 py-1 text-[10px] font-bold text-accent hover:underline cursor-pointer"
                          >
                            {isBn ? "সম্পাদনা" : "Edit"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNewProductVariants((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="px-2 py-1 text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                          >
                            {isBn ? "মুছুন" : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-foreground/10 bg-primary/5 dark:bg-primary/20 text-[10px] opacity-60 text-center">
                    {isBn
                      ? `এখনও কোনো ভ্যারিয়েন্ট যোগ করা হয়নি। এই পণ্যটি মূল মূল্য (${formatCurrency(parseFloat(productForm.unit_price) || 0)}) এবং সাধারণ স্টক ব্যবহার করবে।`
                      : `No variants added yet. This product will use its base price (৳${Number(parseFloat(productForm.unit_price) || 0).toFixed(2)}) and default inventory.`}
                  </div>
                )}
              </div>
            </div>

            {/* Public Visibility Setting */}
            <div className="pt-4 border-t border-foreground/10 flex items-center justify-between p-3.5 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-foreground">
                  {isBn ? "পাবলিক দৃশ্যমানতা" : "Public Visibility"}
                </label>
                <p className="text-[10px] opacity-60">
                  {productForm.is_visible !== false
                    ? (isBn
                        ? "এই পণ্যটি গ্রাহকদের কাছে শপে প্রদর্শিত হবে।"
                        : "This product will be visible to all customers in the shop.")
                    : (isBn
                        ? "এই পণ্যটি পাবলিক ও শপ থেকে লুকানো থাকবে।"
                        : "This product will be hidden from public and catalog.")}
                </p>
              </div>

                <button
                  type="button"
                  onClick={() =>
                    setProductForm((prev) => ({
                      ...prev,
                      is_visible: prev.is_visible === false ? true : false,
                    }))
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border ${
                    productForm.is_visible !== false
                      ? "bg-visible/15 text-visible border-visible/30 shadow-xs"
                      : "bg-hidden/15 text-hidden border-hidden/30 shadow-xs"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  <span>
                    {productForm.is_visible !== false
                      ? (isBn ? "দৃশ্যমান (Visible)" : "Visible")
                      : (isBn ? "লুকানো (Hidden)" : "Hidden")}
                  </span>
                </button>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-4 bg-button-bg text-button-fg rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors shadow-md cursor-pointer"
            >
              {isBn ? "পণ্য তৈরি করুন" : "Create Product"}
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 3: Edit Product */}
      {productSubTab === "edit" && (
        <div className="max-w-3xl mx-auto w-full bg-secondary text-foreground p-8 md:p-10 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-foreground/10">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                {isBn ? "পণ্য সম্পাদনা করুন" : "Edit Product"}
              </h2>
              <p className="text-xs text-foreground/60 mt-0.5">
                {isBn
                  ? "তথ্য, ছবি এবং ভ্যারিয়েন্ট পরিবর্তন করতে নিচের পণ্য নির্বাচন করুন।"
                  : "Select a product to populate its current information, images, and variants."}
              </p>
            </div>
            {editingProductId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs font-bold uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
              >
                {isBn ? "বাছাই বাতিল করুন" : "Clear Selection"}
              </button>
            )}
          </div>

          {/* Product Search Bar */}
          <div className="mb-6 p-5 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70">
                {isBn ? "সম্পাদনার জন্য পণ্য খুঁজুন" : "Search Product to Edit"}
              </label>
            </div>

            <div className="relative w-full">
              <input
                type="text"
                value={editProductSearch}
                onChange={(e) => setEditProductSearch(e.target.value)}
                placeholder={isBn ? "পণ্যের নাম, আইডি বা মূল্য দিয়ে খুঁজুন..." : "Search by product name, ID or price..."}
                className="w-full pl-10 pr-8 py-3 border border-foreground/15 rounded-xl bg-background text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all shadow-inner"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none flex items-center justify-center opacity-60 dark:opacity-80">
                <Image
                  src="/search.png"
                  alt="Search"
                  width={16}
                  height={16}
                  className="object-contain dark:invert transition-all"
                />
              </div>
              {editProductSearch && (
                <button
                  type="button"
                  onClick={() => setEditProductSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Results List */}
            {(() => {
              const query = editProductSearch.trim().toLowerCase();
              const filteredEditProducts = promoProductsCatalog.filter((p) => {
                if (!query) return false;
                return (
                  p.title.toLowerCase().includes(query) ||
                  String(p.id).includes(query) ||
                  String(p.unit_price).includes(query)
                );
              });

              if (query) {
                return (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    <div className="flex justify-between items-center px-1 pb-1 text-[10px] font-bold opacity-60">
                      <span>
                        {isBn
                          ? `${filteredEditProducts.length.toLocaleString("bn-BD")} টি পণ্য পাওয়া গেছে`
                          : `Found ${filteredEditProducts.length} matching products`}
                      </span>
                    </div>

                    {filteredEditProducts.length > 0 ? (
                      filteredEditProducts.map((prod) => {
                        const isSelected = editingProductId === prod.id;
                        return (
                          <div
                            key={prod.id}
                            onClick={() => {
                              handleSelectProduct(prod);
                              setEditProductSearch("");
                            }}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-accent/20 border-accent/40 shadow-xs"
                                : "bg-background border-foreground/10 hover:border-accent/50 hover:bg-primary/5 dark:hover:bg-primary/30"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative w-8 h-8 rounded-lg bg-secondary border border-foreground/10 flex items-center justify-center overflow-hidden shrink-0">
                                <ProductImage
                                  title={prod.title}
                                  images={prod.images}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">
                                  #{prod.id} {prod.title}
                                </p>
                                <p className="text-[10px] text-accent font-bold">
                                  {formatCurrency(Number(prod.unit_price))}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 ${
                                isSelected
                                  ? "bg-accent text-white"
                                  : "bg-primary/10 text-foreground/70 hover:bg-accent hover:text-white"
                              }`}
                            >
                              {isSelected ? (isBn ? "নির্বাচিত" : "Selected") : (isBn ? "সম্পাদনা" : "Edit")}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs opacity-50 bg-background rounded-xl border border-foreground/10">
                        {isBn
                          ? `"${editProductSearch}" দিয়ে কোনো পণ্য পাওয়া যায়নি`
                          : `No products found matching "${editProductSearch}"`}
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })()}

            {/* Currently Selected Product Indicator */}
            {editingProductId &&
              (() => {
                const selectedProd = promoProductsCatalog.find(
                  (p) => p.id === editingProductId
                );
                return (
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">
                        #{editingProductId}{" "}
                        {selectedProd?.title || productForm.title}
                      </span>
                    </div>
                  </div>
                );
              })()}
          </div>

          {editingProductId ? (
            <form onSubmit={handleSaveProduct} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? "পণ্যের নাম *" : "Product Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      title: e.target.value,
                    })
                  }
                  placeholder={isBn ? "যেমনঃ নিয়ন লিপস্টিক, ময়েশ্চারাইজার" : "e.g. Neon Void Hoodie"}
                  className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {isBn ? "একক মূল্য (৳) *" : "Unit Price (৳) *"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.unit_price}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        unit_price: e.target.value,
                      })
                    }
                    placeholder="99.99"
                    className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>

                {(() => {
                  const currentSelectedProd = promoProductsCatalog.find(
                    (p) => p.id === editingProductId
                  );
                  const hasVariants =
                    currentSelectedProd &&
                    Array.isArray((currentSelectedProd as any).variants) &&
                    (currentSelectedProd as any).variants.length > 0;

                  return (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                          {isBn ? "স্টক পরিমাণ *" : "Inventory Stock *"}
                        </label>
                        {hasVariants && (
                          <span className="text-[9px] font-bold text-accent">
                            {isBn
                              ? `প্রতি ভ্যারিয়েন্ট অনুযায়ী পরিচালিত (${(((currentSelectedProd as any).variants as any[]).length).toLocaleString("bn-BD")} টি ভ্যারিয়েন্ট)`
                              : `Managed per variant (${((currentSelectedProd as any).variants as any[]).length} variants)`}
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        required
                        value={productForm.inventory}
                        readOnly={Boolean(hasVariants)}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            inventory: e.target.value,
                          })
                        }
                        placeholder="10"
                        className={`px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all ${
                          hasVariants ? "opacity-80 cursor-not-allowed" : ""
                        }`}
                        title={
                          hasVariants
                            ? isBn
                              ? "নিচের ভ্যারিয়েন্টগুলো থেকে স্টক স্বয়ংক্রিয়ভাবে হিসাব করা হচ্ছে"
                              : "Stock is automatically calculated from variants below"
                            : undefined
                        }
                      />
                    </div>
                  );
                })()}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? "কালেকশন / ক্যাটাগরি *" : "Collection *"}
                </label>
                <select
                  value={
                    productForm.collection ||
                    (collections.length > 0 ? String(collections[0].id) : "")
                  }
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      collection: e.target.value,
                    })
                  }
                  className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-accent transition-all"
                >
                  {collections.map((col) => (
                    <option
                      key={col.id}
                      value={col.id}
                      className="bg-secondary text-foreground"
                    >
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const shortWords = productForm.short_description.trim()
                  ? productForm.short_description.trim().split(/\s+/).length
                  : 0;
                const detailWords = productForm.description.trim()
                  ? productForm.description.trim().split(/\s+/).length
                  : 0;
                return (
                  <>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                          {isBn ? "সংক্ষিপ্ত বিবরণ" : "Short Description"} <span className="text-red-500">*</span>
                        </label>
                        <span
                          className={`text-[10px] font-bold ${
                            shortWords > 150 ? "text-red-500" : "opacity-60"
                          }`}
                        >
                          {isBn ? `${shortWords.toLocaleString("bn-BD")}/১৫০ শব্দ` : `${shortWords}/150 words`}
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        required
                        value={productForm.short_description}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            short_description: e.target.value,
                          })
                        }
                        placeholder={isBn ? "পণ্যের মূল বৈশিষ্ট্য বা সংক্ষেপ লিখুন" : "Brief summarize your product"}
                        className={`px-4 py-2.5 border rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none transition-all ${
                          shortWords > 150
                            ? "border-red-500 ring-1 ring-red-500"
                            : "border-foreground/15 focus:ring-2 focus:ring-accent"
                        }`}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                          {isBn ? "বিস্তারিত বিবরণ" : "Details Description"} <span className="text-red-500">*</span>
                        </label>
                        <span
                          className={`text-[10px] font-bold ${
                            detailWords > 500 ? "text-red-500" : "opacity-60"
                          }`}
                        >
                          {isBn ? `${detailWords.toLocaleString("bn-BD")}/৫০০ শব্দ` : `${detailWords}/500 words`}
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        required
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            description: e.target.value,
                          })
                        }
                        placeholder={isBn ? "পণ্যের সম্পূর্ণ বিবরণ, উপাদান, ব্যবহারের নিয়ম ইত্যাদি..." : "Full product details, materials, sizing, specifications"}
                        className={`px-4 py-2.5 border rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none transition-all ${
                          detailWords > 500
                            ? "border-red-500 ring-1 ring-red-500"
                            : "border-foreground/15 focus:ring-2 focus:ring-accent"
                        }`}
                      />
                    </div>
                  </>
                );
              })()}

              {/* Photos & Variants Management for Existing Product */}
              <div className="mt-4 pt-4 border-t border-foreground/10 space-y-4">
                <ImageUploadModal
                  productId={editingProductId}
                  onSuccess={fetchAdminData}
                  onUnsavedChange={setHasUnsavedPhotos}
                />

                <ProductVariantsManager
                  productId={editingProductId}
                  productTitle={productForm.title}
                  basePrice={parseFloat(productForm.unit_price) || 0}
                  token={token}
                  onVariantsUpdated={fetchAdminData}
                  refreshTrigger={adminDataVersion}
                />
              </div>

              {/* Public Visibility Setting in Edit Mode */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-foreground">
                    {isBn ? "পাবলিক দৃশ্যমানতা" : "Public Visibility"}
                  </label>
                  <p className="text-[10px] opacity-60">
                    {productForm.is_visible !== false
                      ? (isBn
                          ? "এই পণ্যটি গ্রাহকদের কাছে শপে প্রদর্শিত হচ্ছে।"
                          : "This product is currently visible to customers.")
                      : (isBn
                          ? "এই পণ্যটি পাবলিক ও শপ থেকে লুকানো আছে।"
                          : "This product is currently hidden from public.")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setProductForm((prev) => ({
                      ...prev,
                      is_visible: prev.is_visible === false ? true : false,
                    }))
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border ${
                    productForm.is_visible !== false
                      ? "bg-visible/15 text-visible border-visible/30 shadow-xs"
                      : "bg-hidden/15 text-hidden border-hidden/30 shadow-xs"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  <span>
                    {productForm.is_visible !== false
                      ? (isBn ? "দৃশ্যমান (Visible)" : "Visible")
                      : (isBn ? "লুকানো (Hidden)" : "Hidden")}
                  </span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-4 bg-button-bg text-button-fg rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors shadow-md cursor-pointer"
              >
                {isBn ? "পণ্য আপডেট করুন" : "Update Product"}
              </button>
            </form>
          ) : (
            <div className="p-10 border-2 border-dashed border-foreground/15 rounded-3xl text-center flex flex-col items-center justify-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                {isBn ? "কোনো পণ্য নির্বাচিত নেই" : "No product selected"}
              </p>
              <p className="text-[11px] text-foreground/50">
                {isBn
                  ? 'উপরে পণ্যের নাম দিয়ে খুঁজুন অথবা "সকল পণ্য" তালিকা থেকে যেকোনো পণ্যে ক্লিক করুন।'
                  : "Please search for a product above or click on any product from \"All Products\"."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal for adding/editing variant during creation */}
      {mounted &&
        isNewVariantModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-secondary text-foreground rounded-3xl p-6 max-w-md w-full shadow-2xl border border-foreground/10 relative max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <div className="flex justify-between items-center pb-3 border-b border-foreground/10 mb-4">
                <h4 className="text-sm font-black uppercase tracking-tight">
                  {editingNewVariantIndex !== null
                    ? (isBn ? "পণ্য ভ্যারিয়েন্ট সম্পাদনা" : "Edit Product Variant")
                    : (isBn ? "নতুন পণ্য ভ্যারিয়েন্ট যোগ" : "Add New Product Variant")}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsNewVariantModalOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-xs font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newVariantForm.name.trim()) return;

                  if (editingNewVariantIndex !== null) {
                    setNewProductVariants((prev) =>
                      prev.map((item, idx) =>
                        idx === editingNewVariantIndex
                          ? { ...newVariantForm }
                          : item
                      )
                    );
                  } else {
                    setNewProductVariants((prev) => [
                      ...prev,
                      { ...newVariantForm },
                    ]);
                  }
                  setIsNewVariantModalOpen(false);
                }}
                className="space-y-3.5"
              >
                {/* Variant Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {isBn ? "ভ্যারিয়েন্ট নাম / টাইটেল" : "Variant Title / Name"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newVariantForm.name}
                    onChange={(e) =>
                      setNewVariantForm({
                        ...newVariantForm,
                        name: e.target.value,
                      })
                    }
                    placeholder={isBn ? "যেমনঃ ০১ ভেলভেট রোজ, ৫০ মিলি, মিডিয়াম বেইজ" : "e.g. 01 Velvet Rose, 50ml, Medium Beige"}
                    className="w-full px-3.5 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Color Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                      {isBn ? "শেড / রঙের নাম" : "Shade / Color Name"}{" "}
                      <span className="opacity-40 lowercase">({isBn ? "ঐচ্ছিক" : "optional"})</span>
                    </label>
                    <input
                      type="text"
                      value={newVariantForm.color_name}
                      onChange={(e) =>
                        setNewVariantForm({
                          ...newVariantForm,
                          color_name: e.target.value,
                        })
                      }
                      placeholder={isBn ? "যেমনঃ ভেলভেট রোজ" : "e.g. Velvet Rose (leave blank if N/A)"}
                      className="w-full px-3.5 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                        {isBn ? "কালার হেক্স কোড" : "Color Hex"}{" "}
                        <span className="opacity-40 lowercase">({isBn ? "ঐচ্ছিক" : "optional"})</span>
                      </label>
                      {newVariantForm.color_code && (
                        <button
                          type="button"
                          onClick={() =>
                            setNewVariantForm({
                              ...newVariantForm,
                              color_code: "",
                            })
                          }
                          className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer"
                        >
                          {isBn ? "মুছুন" : "Clear"}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newVariantForm.color_code || "#000000"}
                        onChange={(e) =>
                          setNewVariantForm({
                            ...newVariantForm,
                            color_code: e.target.value,
                          })
                        }
                        className="w-9 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={newVariantForm.color_code}
                        onChange={(e) =>
                          setNewVariantForm({
                            ...newVariantForm,
                            color_code: e.target.value,
                          })
                        }
                        placeholder="#000000"
                        className="w-full px-3 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Size, Price, Inventory Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                      {isBn ? "সাইজ / পরিমাণ" : "Size / Volume"}{" "}
                      <span className="opacity-40 lowercase">({isBn ? "ঐচ্ছিক" : "opt"})</span>
                    </label>
                    <input
                      type="text"
                      value={newVariantForm.size}
                      onChange={(e) =>
                        setNewVariantForm({
                          ...newVariantForm,
                          size: e.target.value,
                        })
                      }
                      placeholder={isBn ? "যেমনঃ ৫০ মিলি, L" : "e.g. 50ml, L"}
                      className="w-full px-3 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                      {isBn ? "মূল্য (৳)" : "Price (৳)"}{" "}
                      <span className="opacity-40 lowercase">({isBn ? "ঐচ্ছিক" : "opt"})</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newVariantForm.price_override}
                      onChange={(e) =>
                        setNewVariantForm({
                          ...newVariantForm,
                          price_override: e.target.value,
                        })
                      }
                      placeholder={productForm.unit_price || (isBn ? "মূল মূল্য" : "Base")}
                      className="w-full px-3 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                      {isBn ? "স্টক *" : "Stock *"}
                    </label>
                    <input
                      type="number"
                      required
                      value={newVariantForm.inventory}
                      onChange={(e) =>
                        setNewVariantForm({
                          ...newVariantForm,
                          inventory: e.target.value,
                        })
                      }
                      placeholder="10"
                      className="w-full px-3 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2 pt-3 border-t border-foreground/10">
                  <button
                    type="button"
                    onClick={() => setIsNewVariantModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    {isBn ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-button-bg text-button-fg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-md cursor-pointer"
                  >
                    {editingNewVariantIndex !== null
                      ? (isBn ? "সংরক্ষণ করুন" : "Save Changes")
                      : (isBn ? "ভ্যারিয়েন্ট যোগ করুন" : "Add Variant")}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* SUBTAB 1: All Products */}
      {productSubTab === "all" && (
        <div className="w-full bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm overflow-x-auto transition-colors duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
              {isBn ? "সকল পণ্য" : "All Products"}
            </h2>
            <ProductSearchBar
              mode="admin"
              initialSearch={activeProductQuery}
              onSelectProduct={(prod) => handleSelectProduct(prod as any)}
              onSearchSubmit={(q) => {
                setActiveProductQuery(q);
                setProdPage(1);
              }}
              onClear={() => {
                setActiveProductQuery("");
                setProdPage(1);
              }}
            />
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-foreground/10 text-[10px] font-black uppercase tracking-wider opacity-60">
                <th className="py-3 px-2">{isBn ? "আইডি" : "ID"}</th>
                <th className="py-3 px-2">{isBn ? "পণ্যের নাম" : "Title"}</th>
                <th className="py-3 px-2">{isBn ? "মূল্য" : "Price"}</th>
                <th className="py-3 px-2">{isBn ? "স্টক" : "Stock"}</th>
                <th className="py-3 px-2 text-right">{isBn ? "পদক্ষেপ" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10 text-xs font-bold">
              {products.map((prod) => (
                <tr
                  key={prod.id}
                  onClick={() => handleSelectProduct(prod)}
                  className={`cursor-pointer transition-all ${
                    prod.is_trending
                      ? editingProductId === prod.id
                        ? "bg-amber-500/25 border-l-4 border-amber-500 font-extrabold"
                        : "bg-amber-500/15 dark:bg-amber-500/25 border-l-4 border-amber-500 hover:bg-amber-500/20"
                      : editingProductId === prod.id
                        ? "bg-accent/20"
                        : "hover:bg-primary/5 dark:hover:bg-primary/30"
                  }`}
                >
                  <td className="py-2.5 px-2 opacity-50 align-middle">
                    #{isBn ? prod.id.toLocaleString("bn-BD") : prod.id}
                  </td>
                  <td className="py-2.5 px-2 font-black align-middle">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden border border-foreground/10 bg-primary/5 dark:bg-primary/30 shadow-sm">
                        <ProductImage
                          title={prod.title}
                          images={prod.images}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[180px] sm:max-w-xs">
                          {prod.title}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-accent font-extrabold align-middle">
                    {formatCurrency(Number(prod.unit_price))}
                  </td>
                  <td className="py-2.5 px-2 align-middle">
                    {isBn ? Number(prod.inventory ?? 0).toLocaleString("bn-BD") : prod.inventory}
                  </td>
                  <td
                    className="py-3.5 px-2 text-right flex justify-end items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {handleToggleProductVisibility && (
                      <button
                        onClick={() => handleToggleProductVisibility(prod)}
                        title={
                          prod.is_visible !== false
                            ? (isBn ? "পাবলিক থেকে লুকাতে ক্লিক করুন" : "Click to hide from public")
                            : (isBn ? "পাবলিকে দেখাতে ক্লিক করুন" : "Click to show to public")
                        }
                        className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                          prod.is_visible !== false
                            ? "bg-visible/15 text-visible border border-visible/30 hover:bg-visible/25"
                            : "bg-hidden/15 text-hidden border border-hidden/30 hover:bg-hidden/25 opacity-75 hover:opacity-100"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>
                          {prod.is_visible !== false
                            ? (isBn ? "দৃশ্যমান" : "Visible")
                            : (isBn ? "লুকানো" : "Hidden")}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleProductTrending(prod)}
                      className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                        prod.is_trending
                          ? "bg-amber-500 text-black border border-amber-600 shadow-amber-500/20"
                          : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                      }`}
                    >
                      {prod.is_trending
                        ? (isBn ? "ট্রেন্ডিং সক্রিয়" : " Trending")
                        : (isBn ? "+ ট্রেন্ডিং করুন" : "+ Trending")}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="px-3 py-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {isBn ? "মুছুন" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {Math.ceil(totalProductsCount / 9) > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-foreground/10 text-xs font-bold">
              <button
                onClick={() => setProdPage((prev) => Math.max(prev - 1, 1))}
                disabled={prodPage === 1}
                className="px-5 py-2.5 border border-foreground/15 bg-primary/5 dark:bg-primary/30 text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-button-bg hover:text-button-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isBn ? "পূর্ববর্তী" : "Previous"}
              </button>

              <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                {isBn
                  ? `পৃষ্ঠা ${prodPage.toLocaleString("bn-BD")} / ${Math.ceil(totalProductsCount / 9).toLocaleString("bn-BD")}`
                  : `Page ${prodPage} of ${Math.ceil(totalProductsCount / 9)}`}
              </span>

              <button
                onClick={() =>
                  setProdPage((prev) =>
                    Math.min(prev + 1, Math.ceil(totalProductsCount / 9))
                  )
                }
                disabled={prodPage >= Math.ceil(totalProductsCount / 9)}
                className="px-5 py-2.5 border border-foreground/15 bg-primary/5 dark:bg-primary/30 text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-button-bg hover:text-button-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isBn ? "পরবর্তী" : "Next"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
