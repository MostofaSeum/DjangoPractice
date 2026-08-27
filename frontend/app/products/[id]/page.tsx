import Link from "next/link";
import ProductDetailClient from "./ProductDetailClient";
import { getApiBaseUrl } from "@/config/siteConfig";

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

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  const apiBaseUrl = getApiBaseUrl();

  // Fetch product detail dynamically (no stale cached response)
  const res = await fetch(`${apiBaseUrl}/store/products/${id}/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="min-h-[70vh] bg-background text-foreground flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-secondary p-8 sm:p-10 rounded-3xl border border-foreground/10 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-2 font-black">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
            Product Unavailable
          </h2>
          <p className="text-xs text-foreground/70 leading-relaxed font-medium">
            This product is no longer available or may have been removed from the catalog.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xs cursor-pointer"
            >
              <span>Explore All Products</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const product: Product = await res.json();

  // Determine collection ID and collection title
  const collectionId =
    typeof product.collection === "object" && product.collection !== null
      ? product.collection.id
      : product.collection;

  let collectionTitle = "Shop";
  let relatedProducts: Product[] = [];

  if (collectionId) {
    try {
      const [colRes, relatedRes] = await Promise.all([
        fetch(`${apiBaseUrl}/store/collections/${collectionId}/`, {
          next: { revalidate: 30 },
        }),
        fetch(
          `${apiBaseUrl}/store/products/?collection_id=${collectionId}&page_size=5`,
          { next: { revalidate: 30 } },
        ),
      ]);

      if (colRes.ok) {
        const colData = await colRes.json();
        collectionTitle = colData?.title || "Shop";
      }

      if (relatedRes.ok) {
        const relatedData = await relatedRes.json();
        const list: Product[] = Array.isArray(relatedData)
          ? relatedData
          : relatedData.results || [];
        relatedProducts = list
          .filter((p) => p.id !== product.id)
          .slice(0, 4);
      }
    } catch (err) {
      console.error("Error fetching related products/collection data:", err);
    }
  }

  return (
    <ProductDetailClient
      product={product}
      collectionId={collectionId ? Number(collectionId) : null}
      collectionTitle={collectionTitle}
      relatedProducts={relatedProducts}
    />
  );
}
