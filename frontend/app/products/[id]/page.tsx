import Link from "next/link";
import Image from "next/image";
import ProductInteractive from "./ProductInteractive";
import ProductGallery from "./ProductGallery";
import ProductTabs from "@/features/products/components/ProductTabs";
import AddToCartButton from "@/features/products/components/AddToCartButton";
import ProductImage from "@/components/ui/ProductImage";
import ProductRatingHeader from "./ProductRatingHeader";

interface Product {
  id: number;
  title: string;
  unit_price: number;
  discount_percent?: number;
  discounted_price?: number;
  inventory: number;
  short_description?: string;
  description: string;
  collection: number | { id: number; title: string };
  images?: { id: number; image: string }[];
  units_sold?: number;
}

interface CollectionDetail {
  id: number;
  title: string;
  products: Product[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const CartIcon = () => (
  <Image
    src="/shopping-cart-white-icon.webp"
    width={23}
    height={23}
    alt="Cart"
  />
);

import { getApiBaseUrl } from "@/config/siteConfig";

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  const apiBaseUrl = getApiBaseUrl();

  // Fetch product detail
  const res = await fetch(`${apiBaseUrl}/store/products/${id}/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-6 font-bold uppercase tracking-widest">
          Product not found.
        </p>
        <Link
          href="/products"
          className="inline-block text-[10px] font-bold tracking-widest uppercase border-b-2 border-current pb-1 hover:opacity-70 transition-opacity"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const product: Product = await res.json();

  // Determine collection ID
  const collectionId =
    typeof product.collection === "object" && product.collection !== null
      ? product.collection.id
      : product.collection;

  // Fetch collection detail to get related products and collection name
  let collectionData: CollectionDetail | null = null;
  if (collectionId) {
    try {
      const collectionRes = await fetch(
        `${apiBaseUrl}/store/collections/${collectionId}/`,
        { cache: "no-store" },
      );
      if (collectionRes.ok) {
        collectionData = await collectionRes.json();
      }
    } catch (err) {
      console.error("Error fetching collection data:", err);
    }
  }

  const collectionTitle = collectionData?.title || "Undefined";
  const relatedProducts = (collectionData?.products || [])
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-24 transition-colors duration-300">
      {/* Breadcrumbs */}
      <div className="bg-primary text-background dark:text-foreground border-b border-white/5 py-4 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs flex items-center space-x-2.5 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="opacity-50">/</span>
          <Link href="/products" className="hover:underline">
            Shop
          </Link>
          <span className="opacity-50">/</span>
          <span>
            <Link
              href={`/collections/${collectionId}`}
              className="hover:underline transition-colors"
            >
              {collectionTitle}
            </Link>
          </span>
          <span className="opacity-50">/</span>
          <span className="opacity-80 font-bold truncate max-w-[200px] sm:max-w-none">
            {product.title}
          </span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 py-12">
        {/* Product Area Grid (Compact Showcase Box) */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 bg-secondary text-foreground rounded-2xl p-5 md:p-6 shadow-sm border border-foreground/10 transition-colors duration-300 items-start">
          {/* Left Column: Product Images (Interactive Gallery) */}
          <ProductGallery title={product.title} images={product.images} />

          {/* Right Column: Product Info */}
          <div className="flex flex-col justify-start">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tighter leading-tight uppercase mb-1">
              {product.title}
            </h1>

            {/* Dynamic Customer Rating & Review Count Header */}
            <ProductRatingHeader productId={product.id} />

            {/* Interactive Pricing, Variant Selection, Stock, and Cart Area */}
            <ProductInteractive
              productId={product.id}
              productTitle={product.title}
              basePrice={Number(product.unit_price)}
              discountPercent={Number(product.discount_percent || 0)}
              inventory={product.inventory}
              variants={(product as any).variants || []}
              shortDescription={product.short_description || "Short Description"}
              collectionId={collectionId}
            />

            <hr className="border-foreground/10 my-2" />

            {/* Additional details */}
            <div className="space-y-2 mt-3 pt-1 text-xs uppercase tracking-wider text-foreground">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground/80">
                  Categories:
                </span>
                {collectionId ? (
                  <Link
                    href={`/collections/${collectionId}`}
                    className="font-black text-foreground hover:text-accent cursor-pointer transition-colors"
                  >
                    {collectionTitle}
                  </Link>
                ) : (
                  <span className="font-black text-foreground">{collectionTitle}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground/80">
                  Items Sold:
                </span>
                <span className="text-accent font-black text-sm">
                  {product.units_sold || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Description and Reviews Tabs */}
        <div id="product-tabs">
          <ProductTabs
            productId={product.id}
            description={product.description}
          />
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-black uppercase tracking-tighter">
                Related products
              </h2>
              <div className="w-12 h-1 bg-accent mx-auto mt-3 rounded"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-secondary text-foreground rounded-2xl p-5 shadow-sm border border-foreground/10 hover:shadow-xl transition-shadow duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square bg-primary/5 dark:bg-primary/40 rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
                      <ProductImage title={item.title} images={item.images} />
                    </div>
                    <h3 className="font-bold text-sm text-foreground mb-1 line-clamp-1 group-hover:text-accent transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <div className="mt-4">
                    <p className="text-accent font-extrabold text-sm mb-4">
                      ৳{Number(item.unit_price).toFixed(2)}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/products/${item.id}`}
                        className="py-2.5 px-2 border border-current text-foreground rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-button-bg hover:text-button-fg transition-colors flex items-center justify-center text-center"
                      >
                        View Details
                      </Link>
                      <AddToCartButton
                        productId={item.id}
                        productTitle={item.title}
                        inventory={item.inventory ?? 999}
                        className="py-2.5 px-2 bg-button-bg text-button-fg rounded-xl font-bold text-[10px] uppercase tracking-wider hover:opacity-90 transition-colors flex items-center justify-center gap-1 text-center"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
