import type { Metadata } from "next";
import Link from "next/link";
import { getApiBaseUrl } from "@/config/siteConfig";
import CollectionDetailClient from "@/features/collections/components/CollectionDetailClient";

import { Product } from "@/types/product";

interface Collection {
  id: number;
  title: string;
  featured_product: string | number | null;
  image?: string | null;
  products: Product[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const apiBaseUrl = getApiBaseUrl();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "https://vibemart-flax.vercel.app";

  try {
    const res = await fetch(`${apiBaseUrl}/store/collections/${id}/`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const collection: Collection = await res.json();
      const title = `${collection.title} Collection | VibeMart`;
      const description = `Shop the ${collection.title} beauty collection on VibeMart. Explore premium skincare, cosmetics, and makeup hand-picked for perfection.`;
      const image = collection.image || `${siteUrl}/brand-icon.png`;

      return {
        title,
        description,
        keywords: [collection.title.toLowerCase(), `${collection.title.toLowerCase()} collection`, "vibemart cosmetics", "beauty sets"],
        alternates: {
          canonical: `${siteUrl}/collections/${collection.id}`,
        },
        openGraph: {
          title,
          description,
          url: `${siteUrl}/collections/${collection.id}`,
          siteName: "VibeMart",
          images: [
            {
              url: image,
              width: 800,
              height: 800,
              alt: collection.title,
            },
          ],
          type: "website",
        },
        twitter: {
          card: "summary",
          title,
          description,
          images: [image],
        },
      };
    }
  } catch (err) {
    console.error("Failed to generate collection metadata:", err);
  }

  return {
    title: "Collection Details | VibeMart",
    description: "Explore curated beauty and cosmetics collections on VibeMart.",
  };
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

  return <CollectionDetailClient collection={collection} apiBaseUrl={apiBaseUrl} />;
}
