"use client";

import Image from "next/image";
import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import AddToCartButton from "@/features/products/components/AddToCartButton";
import ProductDeliveryOfferBadge from "@/components/ProductDeliveryOfferBadge";
import CollectionDeliveryBanner from "@/components/CollectionDeliveryBanner";
import { useLanguage } from "@/store/LanguageContext";

import { Product } from "@/types/product";

interface Collection {
  id: number;
  title: string;
  featured_product: string | number | null;
  image?: string | null;
  products: Product[];
}

interface CollectionDetailClientProps {
  collection: Collection;
  apiBaseUrl?: string;
}

export default function CollectionDetailClient({
  collection,
  apiBaseUrl = "",
}: CollectionDetailClientProps) {
  const { t, formatCurrency, locale } = useLanguage();

  const imageUrl = collection.image
    ? collection.image.startsWith("http")
      ? collection.image
      : `${apiBaseUrl.replace(/\/+$/, "")}${collection.image.startsWith("/") ? "" : "/"}${collection.image}`
    : null;

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

      {/* Full-width Collection Hero Showcase with Photo and Wave Transition */}
      <div className="relative w-full overflow-hidden bg-secondary transition-colors duration-300 min-h-[260px] sm:min-h-[300px] md:min-h-[340px] flex flex-col justify-end">
        {imageUrl ? (
          <>
            {/* Background Image */}
            <Image
              src={imageUrl}
              alt={collection.title}
              fill
              priority
              unoptimized
              className="object-cover object-center"
            />
            {/* Cinematic Vignette / Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30 z-10" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary to-primary/30 dark:from-primary/40 dark:via-secondary dark:to-primary/60" />
        )}

        {/* Hero Foreground Content */}
        <div className="relative z-20 max-w-[1400px] w-full mx-auto px-8 md:px-12 pt-10 pb-14 sm:pb-16 md:pb-18 space-y-2.5">
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block backdrop-blur-md border ${
              imageUrl
                ? "bg-black/50 text-white/95 border-white/20 shadow-sm"
                : "bg-foreground/5 text-foreground/70 border-foreground/10"
            }`}
          >
            {t("categories.collectionDetail")}
          </span>
          <h1
            className={`text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter ${
              imageUrl ? "text-white drop-shadow-md" : "text-foreground"
            }`}
          >
            {collection.title}
          </h1>
          <div className="pt-0.5 w-fit max-w-full">
            <CollectionDeliveryBanner
              collectionId={collection.id}
              variant="banner"
              darkOverlay={Boolean(imageUrl)}
            />
          </div>
        </div>

        {/* Subtle & Gentle Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg
            className="relative block w-full h-8 sm:h-10 md:h-12 text-background"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,32L48,42.7C96,53,192,75,288,80C384,85,480,75,576,64C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" />
          </svg>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-6 sm:mt-10">
        <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">
          {t("categories.productsInCollection")}
        </h2>
        {collection.products && collection.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {collection.products.map((product) => {
              const activeVariant = product.variants?.find(
                (v) => v.is_active !== false,
              );
              const basePrice = activeVariant?.price_override
                ? Number(activeVariant.price_override)
                : Number(product.unit_price || 0);

              const discountPercent = Number(product.discount_percent || 0);
              const isExpired =
                (product as any).discount_valid_until &&
                new Date() > new Date((product as any).discount_valid_until);
              const isDiscountActive =
                (product as any).is_discount_active !== false && !isExpired;

              let effectivePrice = basePrice;
              if (activeVariant?.discounted_price !== undefined) {
                effectivePrice = Number(activeVariant.discounted_price);
              } else if (product.discounted_price !== undefined) {
                effectivePrice = Number(product.discounted_price);
              } else if (discountPercent > 0 && isDiscountActive) {
                effectivePrice = basePrice * (1 - discountPercent / 100);
              }

              const hasDiscount =
                isDiscountActive && basePrice > effectivePrice;
              const computedDiscountPercent = hasDiscount
                ? discountPercent > 0
                  ? discountPercent
                  : Math.round(((basePrice - effectivePrice) / basePrice) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="bg-secondary text-foreground rounded-2xl p-5 shadow-sm border border-foreground/10 hover:shadow-xl transition-all duration-500 group flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square bg-primary/5 dark:bg-primary/40 rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                      {hasDiscount && computedDiscountPercent > 0 && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-accent text-button-fg font-extrabold text-[9px] uppercase tracking-wider shadow-md z-10 flex items-center gap-1">
                          <img
                            src="/discount.png"
                            alt="Discount"
                            className="w-3.5 h-3.5 object-contain brightness-0 invert"
                          />
                          -
                          {locale === "bn"
                            ? Math.round(
                                computedDiscountPercent,
                              ).toLocaleString("bn-BD")
                            : Math.round(computedDiscountPercent)}
                          % {t("trending.off")}
                        </span>
                      )}
                      <ProductImage
                        title={product.title}
                        images={product.images}
                      />

                      {/* Glassmorphic Delivery Offer Badge at Bottom of Image */}
                      <div className="absolute bottom-2.5 left-0 right-0 z-10 pointer-events-none flex justify-center px-2">
                        <ProductDeliveryOfferBadge
                          productId={product.id}
                          collectionId={Number(collection.id)}
                          badgeOnly
                        />
                      </div>
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
                              ? Number(product.average_rating).toLocaleString(
                                  "bn-BD",
                                )
                              : Number(product.average_rating).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="opacity-70 text-xs line-clamp-2 mb-2 leading-relaxed">
                      {product.short_description ||
                        product.description ||
                        (locale === "bn"
                          ? "কোনো বিবরণ উপলব্ধ নেই"
                          : "No description available")}
                    </p>
                    {Number(product.units_sold || 0) > 0 && (
                      <div className="mb-3">
                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">
                          {locale === "bn"
                            ? `${Number(product.units_sold).toLocaleString("bn-BD")} ${t("delivery.sold") || "বিক্রিত"}`
                            : `${product.units_sold} Sold`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-accent font-extrabold text-lg">
                          {formatCurrency(effectivePrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs line-through opacity-50 font-bold">
                            {formatCurrency(basePrice)}
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
                        inventory={product.total_inventory ?? product.inventory}
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
