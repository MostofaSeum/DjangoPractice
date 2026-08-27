"use client";

import Link from "next/image";
import NextLink from "next/link";
import Image from "next/image";
import CollectionDeliveryBanner from "@/components/CollectionDeliveryBanner";
import { useLanguage } from "@/store/LanguageContext";

interface Collection {
  id: number;
  title: string;
  featured_product: string | null;
  product_count: number;
  image?: string | null;
}

interface CollectionsClientProps {
  collections: Collection[];
  apiBaseUrl: string;
}

export default function CollectionsClient({
  collections,
  apiBaseUrl,
}: CollectionsClientProps) {
  const { t, locale } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-24 transition-colors duration-300">
      {/* Breadcrumbs */}
      <div className="bg-primary text-background dark:text-foreground border-b border-white/5 py-4 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs flex items-center space-x-2.5 font-bold uppercase tracking-wider">
          <NextLink href="/" className="hover:underline">
            {t("products.breadcrumbHome")}
          </NextLink>
          <span className="opacity-50">/</span>
          <span className="opacity-80">{t("categories.breadcrumbCategories")}</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-16">
        <h1 className="text-4xl font-black mb-10 uppercase tracking-tighter text-foreground">
          {t("categories.pageTitle")}
        </h1>

        {collections.length === 0 ? (
          <div className="text-center py-16 opacity-60 font-bold">
            {t("categories.noCollections")}
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => {
              const imageUrl = collection.image
                ? collection.image.startsWith("http")
                  ? collection.image
                  : `${apiBaseUrl}${collection.image.startsWith("/") ? "" : "/"}${collection.image}`
                : null;

              const productCountText =
                locale === "bn"
                  ? t("categories.productsCount").replace(
                      "{count}",
                      collection.product_count.toLocaleString("bn-BD")
                    )
                  : `${collection.product_count} Products`;

              return (
                <NextLink
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border border-foreground/10 min-h-[340px] flex flex-col justify-between p-7 transition-all duration-500 hover:-translate-y-1.5 bg-secondary"
                >
                  {/* Background Image with Gradient Overlay */}
                  {imageUrl ? (
                    <>
                      <Image
                        src={imageUrl}
                        alt={collection.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-10 transition-opacity duration-500 group-hover:from-black/95 group-hover:via-black/50" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary to-primary/20 dark:from-primary/40 dark:via-secondary dark:to-primary/60" />
                  )}

                  {/* Top Row: Delivery Offer Badge or Product Count */}
                  <div className="relative z-20 flex justify-between items-start gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md border ${
                        imageUrl
                          ? "bg-primary/80 text-button-fg border-button-fg/20"
                          : "bg-primary/10 text-foreground/80 border-foreground/10"
                      }`}
                    >
                      {productCountText}
                    </span>
                  </div>

                  {/* Bottom Row: Title, Delivery Banner & Call to Action */}
                  <div className="relative z-20 space-y-3">
                    <CollectionDeliveryBanner
                      collectionId={collection.id}
                      variant="badge"
                      darkOverlay={Boolean(imageUrl)}
                      className="backdrop-blur-md shadow-md"
                    />

                    <div>
                      <h2
                        className={`text-2xl md:text-3xl font-black uppercase tracking-tight transition-transform duration-300 group-hover:translate-x-1 ${
                          imageUrl ? "text-button-fg drop-shadow-md" : "text-foreground"
                        }`}
                      >
                        {collection.title}
                      </h2>
                    </div>

                    <div className="pt-2">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider ${
                          imageUrl
                            ? "text-button-fg/90 group-hover:text-button-fg"
                            : "text-foreground/80 group-hover:text-foreground"
                        }`}
                      >
                        {t("categories.exploreCollection")}
                      </span>
                    </div>
                  </div>
                </NextLink>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
