import Link from "next/link";
import { getApiBaseUrl } from "@/config/siteConfig";
import CollectionDetailClient from "@/features/collections/components/CollectionDetailClient";

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const apiBaseUrl = getApiBaseUrl();

  let collection: Collection | null = null;

  try {
    const res = await fetch(
      `${apiBaseUrl}/store/collections/${id}/?include_products=true`,
      { next: { revalidate: 30 } }
    );

    if (res.ok) {
      collection = await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch collection detail:", err);
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-6 font-bold uppercase tracking-widest">
          Collection not found.
        </p>
        <Link
          href="/collections"
          className="inline-block text-[10px] font-bold tracking-widest uppercase border-b-2 border-current pb-1 hover:opacity-70 transition-opacity"
        >
          Back to Categories
        </Link>
      </div>
    );
  }

  return <CollectionDetailClient collection={collection} />;
}
