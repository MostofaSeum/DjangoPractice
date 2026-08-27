"use client";

import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import AddToCartButton from "./AddToCartButton";
import ProductDeliveryOfferBadge from "@/components/ProductDeliveryOfferBadge";
import { Product } from "@/types";
import { useWishlist } from "@/hooks/useWishlist";
import { useLanguage } from "@/store/LanguageContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { t, formatCurrency, locale } = useLanguage();
  const isSaved = isInWishlist(product.id);

  const discountPercent = Number(product.discount_percent || 0);
  const isExpired = product.discount_valid_until && new Date() > new Date(product.discount_valid_until);
  const hasDiscount = discountPercent > 0 && !isExpired && (product.is_discount_active !== false);
  const effectivePrice =
    product.discounted_price !== undefined
      ? product.discounted_price
      : hasDiscount
        ? product.unit_price * (1 - discountPercent / 100)
        : product.unit_price;

  return (
    <div className="bg-secondary text-foreground rounded-xl p-3.5 shadow-sm border border-foreground/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between relative">
      <div>
        <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 bg-secondary border border-foreground/10 group-hover:scale-[1.01] transition-transform duration-300">
          {hasDiscount && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-accent text-button-fg font-extrabold text-[9px] uppercase tracking-wider shadow-md z-10 flex items-center gap-1">
              <img
                src="/discount.png"
                alt="Discount"
                className="w-3.5 h-3.5 object-contain brightness-0 invert"
              />
              -{locale === "bn" ? Math.round(discountPercent).toLocaleString("bn-BD") : Math.round(discountPercent)}% {locale === "bn" ? "ছাড়" : "OFF"}
            </span>
          )}
          <ProductImage title={product.title} images={product.images} />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md border transition-all duration-200 shadow-sm z-10 cursor-pointer ${
              isSaved
                ? "bg-red-500/20 border-red-500/40 scale-105"
                : "bg-black/30 border-white/20 hover:bg-black/50"
            }`}
            title={isSaved ? (locale === "bn" ? "উইশলিস্ট থেকে সরান" : "Remove from Wishlist") : (locale === "bn" ? "উইশলিস্টে যোগ করুন" : "Add to Wishlist")}
          >
            <img
              src={isSaved ? "/favorite.png" : "/love.png"}
              alt="Wishlist"
              className={`w-3.5 h-3.5 object-contain transition-transform duration-200 ${
                isSaved ? "scale-105" : "opacity-80"
              }`}
            />
          </button>
        </div>
        <div className="flex justify-between items-start gap-1 mb-0.5">
          <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-accent transition-colors">
            {product.title}
          </h3>
          {Number(product.average_rating || 0) > 0 && (
            <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[11px] shrink-0 mt-0.5">
              <span>★</span>
              <span>{locale === "bn" ? Number(product.average_rating).toLocaleString("bn-BD", { minimumFractionDigits: 1 }) : Number(product.average_rating).toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-[11px] opacity-70 mb-2 line-clamp-1 leading-normal">
          {product.description || (locale === "bn" ? "কোনো বিবরণ নেই।" : "No description available.")}
        </p>
        <div className="mb-2">
          <ProductDeliveryOfferBadge
            productId={product.id}
            collectionId={
              typeof (product as any).collection === "object" &&
              (product as any).collection !== null
                ? (product as any).collection.id
                : (product as any).collection || (product as any).collection_id
            }
            soldCount={Number(product.units_sold || 0)}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3 pt-2.5 border-t border-foreground/10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-accent font-extrabold text-sm sm:text-base">
              {formatCurrency(effectivePrice)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] line-through opacity-50 font-bold">
                {formatCurrency(product.unit_price)}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Link
            href={`/products/${product.id}`}
            className="py-1.5 px-2 border border-current text-foreground rounded-lg font-bold text-[9px] uppercase tracking-wider hover:bg-button-bg hover:text-button-fg transition-colors flex items-center justify-center text-center cursor-pointer"
          >
            {t("wishlist.viewDetails") || (locale === "bn" ? "বিস্তারিত দেখুন" : "View Details")}
          </Link>
          <AddToCartButton
            productId={product.id}
            productTitle={product.title}
            inventory={product.inventory}
            className="py-1.5 px-2 bg-button-bg text-button-fg rounded-lg font-bold text-[9px] uppercase tracking-wider hover:opacity-90 transition-colors flex items-center justify-center gap-1 text-center cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
