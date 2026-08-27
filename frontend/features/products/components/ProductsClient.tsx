"use client";

import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import AddToCartButton from "@/features/products/components/AddToCartButton";
import ProductSearchBar from "@/features/products/components/ProductSearchBar";
import ProductSortSelect from "@/features/products/components/ProductSortSelect";
import ProductDeliveryOfferBadge from "@/components/ProductDeliveryOfferBadge";
import { useLanguage } from "@/store/LanguageContext";

interface Product {
  id: number;
  title: string;
  unit_price: number;
  discount_percent?: number;
  discounted_price?: number;
  short_description?: string;
  description: string;
  inventory?: number;
  images?: { id: number; image: string }[];
  units_sold?: number;
  average_rating?: number;
  review_count?: number;
  collection?: any;
  collection_id?: any;
}

interface ProductsClientProps {
  products: Product[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  minPrice?: string;
  maxPrice?: string;
  ordering?: string;
  search?: string;
}

export default function ProductsClient({
  products,
  totalProducts,
  totalPages,
  currentPage,
  minPrice,
  maxPrice,
  ordering,
  search,
}: ProductsClientProps) {
  const { t, formatCurrency, locale } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-24 transition-colors duration-300">
      {/* Breadcrumbs */}
      <div className="bg-primary text-background dark:text-foreground border-b border-white/5 py-4 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs flex items-center space-x-2.5 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:underline">
            {t("products.breadcrumbHome")}
          </Link>
          <span className="opacity-50">/</span>
          <span className="opacity-80">{t("products.breadcrumbShop")}</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-16">
        <h1 className="text-4xl font-black mb-10 uppercase tracking-tighter text-foreground">
          {t("products.title")}
        </h1>
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Left Sidebar: Filters & Sorting */}
          <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6">
            {/* Filter by Price Card */}
            <aside className="bg-secondary p-6 rounded-2xl border border-foreground/10 shadow-sm text-foreground transition-colors duration-300">
              <h2 className="text-xs font-black uppercase tracking-widest mb-6 pb-2 border-b border-foreground/10">
                {t("products.filterByPrice")}
              </h2>
              <form
                method="GET"
                action="/products"
                className="flex flex-col gap-5"
              >
                {/* Keep active sorting and search parameters */}
                {ordering && (
                  <input type="hidden" name="ordering" value={ordering} />
                )}
                {search && <input type="hidden" name="search" value={search} />}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {t("products.minPrice")}
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    defaultValue={minPrice || ""}
                    placeholder={t("products.minPlaceholder")}
                    className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-secondary text-sm text-foreground placeholder:text-foreground/50 outline-none focus:border-accent transition-colors w-full shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {t("products.maxPrice")}
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    defaultValue={maxPrice || ""}
                    placeholder={t("products.maxPlaceholder")}
                    className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-secondary text-sm text-foreground placeholder:text-foreground/50 outline-none focus:border-accent transition-colors w-full shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors cursor-pointer"
                  >
                    {t("products.applyPrice")}
                  </button>
                </div>
              </form>
            </aside>

            {/* Sort Ordering */}
            <section className="bg-secondary p-6 rounded-2xl border border-foreground/10 shadow-sm text-foreground transition-colors duration-300">
              <ProductSortSelect
                currentOrdering={ordering}
                minPrice={minPrice}
                maxPrice={maxPrice}
                search={search}
              />
            </section>

            {/* Clear All Filters Button */}
            {(minPrice || maxPrice || ordering || search) && (
              <Link
                href="/products"
                className="w-full py-3 border border-current text-foreground bg-secondary rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-all flex items-center justify-center shadow-sm"
              >
                {t("products.clearAllFilters")}
              </Link>
            )}
          </div>

          {/* Right Panel*/}
          <div className="flex-1 w-full">
            {/* Search Bar with Live Suggestions Dropdown */}
            <ProductSearchBar
              initialSearch={search || ""}
              minPrice={minPrice}
              maxPrice={maxPrice}
              ordering={ordering}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.length > 0 ? (
                products.map((product) => {
                  const discountPercent = Number(product.discount_percent || 0);
                  const hasDiscount = discountPercent > 0;
                  const effectivePrice =
                    product.discounted_price !== undefined
                      ? product.discounted_price
                      : hasDiscount
                        ? product.unit_price * (1 - discountPercent / 100)
                        : product.unit_price;

                  return (
                    <div
                      key={product.id}
                      className="bg-secondary text-foreground rounded-2xl p-5 shadow-sm border border-foreground/10 hover:shadow-xl transition-shadow duration-300 group cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-square bg-primary/5 dark:bg-primary/40 rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                          {hasDiscount && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-accent text-button-fg font-extrabold text-[9px] uppercase tracking-wider shadow-md z-10 flex items-center gap-1">
                              <img
                                src="/discount.png"
                                alt="Discount"
                                className="w-3.5 h-3.5 object-contain brightness-0 invert"
                              />
                              -{Math.round(discountPercent)}% {t("trending.off")}
                            </span>
                          )}
                          <ProductImage
                            title={product.title}
                            images={product.images}
                          />
                        </div>
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h2 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                            {product.title}
                          </h2>
                          {Number(product.average_rating || 0) > 0 && (
                            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0 mt-1">
                              <span>★</span>
                              <span>
                                {Number(product.average_rating).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="opacity-70 text-xs line-clamp-2 mb-3 leading-relaxed">
                          {product.short_description ||
                            product.description ||
                            "No description available"}
                        </p>
                        <div className="mb-3">
                          <ProductDeliveryOfferBadge
                            productId={product.id}
                            collectionId={
                              typeof (product as any).collection === "object" &&
                              (product as any).collection !== null
                                ? (product as any).collection.id
                                : (product as any).collection ||
                                  (product as any).collection_id
                            }
                            soldCount={Number(product.units_sold || 0)}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="flex items-baseline gap-2">
                            <span className="text-accent font-extrabold text-lg">
                              {formatCurrency(effectivePrice)}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs line-through opacity-50 font-bold">
                                {formatCurrency(product.unit_price)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={`/products/${product.id}`}
                            className="py-2.5 px-2 border border-current text-foreground rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-button-bg hover:text-button-fg transition-colors flex items-center justify-center text-center"
                          >
                            {locale === "bn" ? "বিস্তারিত দেখুন" : "View Details"}
                          </Link>
                          <AddToCartButton
                            productId={product.id}
                            productTitle={product.title}
                            inventory={product.inventory ?? 999}
                            variants={product.variants}
                            className="py-2.5 px-2 bg-button-bg text-button-fg rounded-xl font-bold text-[10px] uppercase tracking-wider hover:opacity-90 transition-colors flex items-center justify-center gap-1 text-center"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center text-sm font-bold uppercase tracking-wider opacity-60">
                  {t("products.noProductsFound")}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-12">
                {/* Previous Button */}
                {currentPage > 1 ? (
                  <Link
                    href={{
                      pathname: "/products",
                      query: {
                        ...(minPrice && { minPrice }),
                        ...(maxPrice && { maxPrice }),
                        ...(ordering && { ordering }),
                        ...(search && { search }),
                        page: currentPage - 1,
                      },
                    }}
                    className="px-5 py-2.5 border border-current text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
                  >
                    {t("products.prev")}
                  </Link>
                ) : (
                  <span className="px-5 py-2.5 border border-current opacity-30 rounded-xl text-xs font-bold uppercase tracking-widest cursor-not-allowed">
                    {t("products.prev")}
                  </span>
                )}

                {/* Page indicator */}
                <span className="text-xs font-bold opacity-70 uppercase tracking-wider">
                  {locale === "bn"
                    ? `পৃষ্ঠা ${currentPage.toLocaleString("bn-BD")} / ${totalPages.toLocaleString("bn-BD")}`
                    : `Page ${currentPage} of ${totalPages}`}
                </span>

                {/* Next Button */}
                {currentPage < totalPages ? (
                  <Link
                    href={{
                      pathname: "/products",
                      query: {
                        ...(minPrice && { minPrice }),
                        ...(maxPrice && { maxPrice }),
                        ...(ordering && { ordering }),
                        ...(search && { search }),
                        page: currentPage + 1,
                      },
                    }}
                    className="px-5 py-2.5 border border-current text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
                  >
                    {t("products.next")}
                  </Link>
                ) : (
                  <span className="px-5 py-2.5 border border-current opacity-30 rounded-xl text-xs font-bold uppercase tracking-widest cursor-not-allowed">
                    {t("products.next")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
