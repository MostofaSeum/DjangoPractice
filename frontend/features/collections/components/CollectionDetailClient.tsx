"use client";

import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import AddToCartButton from "@/features/products/components/AddToCartButton";
import ProductDeliveryOfferBadge from "@/components/ProductDeliveryOfferBadge";
import CollectionDeliveryBanner from "@/components/CollectionDeliveryBanner";
import { useLanguage } from "@/store/LanguageContext";

interface Product {
  id: number;
  title: string;
  short_description?: string | null;
  description: string | null;
  slug: string;
  inventory: number;
  unit_price: string | number;
  discount_percent?: number;
  discounted_price?: number;
  price_with_tax: number;
  images?: Array<{ id?: number; image: string }>;
  units_sold?: number;
  average_rating?: number;
  review_count?: number;
}

interface Collection {
  id: number;
  title: string;
  featured_product: string | number | null;
  products: Product[];
}

interface CollectionDetailClientProps {
  collection: Collection;
}

export default function CollectionDetailClient({
  collection,
}: CollectionDetailClientProps) {
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
          <Link href="/collections" className="hover:underline">
            {t("categories.breadcrumbCategories")}
          </Link>
          <span className="opacity-50">/</span>
          <span className="opacity-80">{collection.title}</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-16">
        <div className="bg-secondary text-foreground rounded-3xl p-8 md:p-12 shadow-sm border border-foreground/10 mb-16 relative overflow-hidden transition-colors duration-300">
          <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest block mb-2">
            {t("categories.collectionDetail")}
          </span>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
            {collection.title}
          </h1>
          <CollectionDeliveryBanner collectionId={collection.id} variant="banner" />
        </div>

        <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">
          {t("categories.productsInCollection")}
        </h2>
        {collection.products && collection.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {collection.products.map((product) => {
              const discountPercent = Number(product.discount_percent || 0);
              const hasDiscount = discountPercent > 0;
              const unitPriceNum = Number(product.unit_price);
              const effectivePrice =
                product.discounted_price !== undefined
                  ? product.discounted_price
                  : hasDiscount
                    ? unitPriceNum * (1 - discountPercent / 100)
                    : unitPriceNum;

              return (
                <div
                  key={product.id}
                  className="bg-secondary text-foreground rounded-2xl p-5 shadow-sm border border-foreground/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square bg-secondary rounded-xl mb-6 flex items-center justify-center overflow-hidden relative border border-foreground/10 group-hover:scale-[1.02] transition-transform duration-300">
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
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                        {product.title}
                      </h3>
                      {Number(product.average_rating || 0) > 0 && (
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0 mt-1">
                          <span>★</span>
                          <span>
                            {locale === "bn"
                              ? Number(product.average_rating).toLocaleString("bn-BD")
                              : Number(product.average_rating).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="opacity-70 text-xs line-clamp-2 mb-3 leading-relaxed">
                      {product.short_description ||
                        product.description ||
                        (locale === "bn" ? "কোনো বিবরণ উপলব্ধ নেই" : "No description available")}
                    </p>
                    <div className="mb-3">
                      <ProductDeliveryOfferBadge
                        productId={product.id}
                        collectionId={Number(collection.id)}
                        soldCount={Number(product.units_sold || 0)}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-accent font-extrabold text-lg">
                          {formatCurrency(effectivePrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs line-through opacity-50 font-bold">
                            {formatCurrency(unitPriceNum)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/products/${product.id}`}
                        className="py-2.5 px-2 border border-current text-foreground rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-button-bg hover:text-button-fg transition-colors flex items-center justify-center text-center"
                      >
                        {t("productDetail.viewDetails")}
                      </Link>
                      <AddToCartButton
                        productId={product.id}
                        productTitle={product.title}
                        inventory={product.inventory}
                        variants={product.variants}
                        className="py-2.5 px-2 bg-button-bg text-button-fg rounded-xl font-bold text-[10px] uppercase tracking-wider hover:opacity-90 transition-colors flex items-center justify-center gap-1 text-center"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="opacity-60 font-bold uppercase tracking-wider text-sm">
            {t("categories.noProductsInCollection")}
          </p>
        )}
      </main>
    </div>
  );
}
