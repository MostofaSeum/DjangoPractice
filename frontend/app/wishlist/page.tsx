"use client";

import Link from "next/link";
import { useWishlist } from "@/hooks/useWishlist";
import { useLanguage } from "@/store/LanguageContext";
import ProductImage from "@/components/ui/ProductImage";
import AddToCartButton from "@/features/products/components/AddToCartButton";
import { useAuth } from "@/hooks/useAuth";

export default function WishlistPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { wishlistItems, loading, removeFromWishlist } = useWishlist();
  const { t, formatCurrency, locale } = useLanguage();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8 font-bold uppercase tracking-widest text-xs transition-colors duration-300">
        {t("wishlist.loadingWishlist")}
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans py-16 transition-colors duration-300">
        <main className="max-w-[1400px] mx-auto px-8 md:px-12">
          <div className="max-w-md mx-auto bg-secondary text-foreground p-8 sm:p-12 rounded-3xl border border-foreground/10 text-center space-y-6 shadow-md">
            <div className="w-16 h-16 bg-red-500/10 rounded-full mx-auto flex items-center justify-center">
              <img src="/love.png" alt="Wishlist" className="w-8 h-8 object-contain" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
              {t("wishlist.signInToView")}
            </h2>
            <p className="text-xs text-foreground/70 font-medium">
              {t("wishlist.signInSubtitle")}
            </p>
            <div>
              <Link
                href="/login?redirect=/wishlist"
                className="inline-block px-8 py-3.5 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md cursor-pointer"
              >
                {t("wishlist.signInNow")}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans py-12 transition-colors duration-300">
      <main className="max-w-[1400px] mx-auto px-8 md:px-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-foreground/10 mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <img src="/love.png" alt="Wishlist" className="w-6 h-6 object-contain" />
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                {t("wishlist.myWishlist").replace(
                  "{count}",
                  locale === "bn"
                    ? wishlistItems.length.toLocaleString("bn-BD")
                    : wishlistItems.length.toString()
                )}
              </h1>
            </div>
            <p className="text-xs opacity-70 font-bold uppercase tracking-wider mt-1">
              {t("wishlist.savedFavorites")}
            </p>
          </div>
          <Link
            href="/products"
            className="px-5 py-2.5 bg-button-bg text-button-fg rounded-xl text-xs font-extrabold uppercase tracking-wider hover:opacity-90 transition-all shadow-sm cursor-pointer"
          >
            {t("wishlist.continueShopping")}
          </Link>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="p-12 sm:p-16 rounded-3xl bg-secondary/50 border border-foreground/10 text-center max-w-lg mx-auto my-12 space-y-4">
            <div className="w-16 h-16 bg-foreground/5 rounded-full mx-auto flex items-center justify-center">
              <img src="/love.png" alt="Empty Wishlist" className="w-8 h-8 object-contain opacity-50" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
              {t("wishlist.emptyWishlist")}
            </h3>
            <p className="text-xs text-foreground/60 font-medium">
              {t("wishlist.emptySubtitle")}
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-block px-8 py-3.5 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md cursor-pointer"
              >
                {t("wishlist.browseProducts")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistItems.map((item) => {
              const product = item.product;
              const inventoryCount =
                locale === "bn"
                  ? product.inventory.toLocaleString("bn-BD")
                  : product.inventory.toString();

              return (
                <div
                  key={item.id}
                  className="bg-secondary text-foreground rounded-2xl p-5 shadow-sm border border-foreground/10 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between relative"
                >
                  <div>
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 bg-secondary border border-foreground/10 group-hover:scale-[1.02] transition-transform duration-300">
                      <ProductImage title={product.title} images={product.images} />
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(product.id)}
                        className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors shadow-md cursor-pointer"
                        title={t("wishlist.removeFromWishlist")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>

                    <h3 className="font-bold text-base text-foreground mb-1 line-clamp-1 group-hover:text-accent transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-xs opacity-70 mb-4 line-clamp-2 leading-relaxed">
                      {product.description || t("wishlist.noDescription")}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4 pt-3 border-t border-foreground/10">
                      <span className="text-accent font-extrabold text-base">
                        {formatCurrency(product.unit_price)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                        {t("wishlist.qty").replace("{count}", inventoryCount)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/products/${product.id}`}
                        className="py-2.5 px-2 border border-current text-foreground rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-button-bg hover:text-button-fg transition-colors flex items-center justify-center text-center cursor-pointer"
                      >
                        {t("wishlist.viewDetails")}
                      </Link>
                      <AddToCartButton
                        productId={product.id}
                        productTitle={product.title}
                        inventory={product.inventory}
                        className="py-2.5 px-2 bg-button-bg text-button-fg rounded-xl font-bold text-[10px] uppercase tracking-wider hover:opacity-90 transition-colors flex items-center justify-center gap-1 text-center cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
