export const dynamic = "force-dynamic";

import { getApiBaseUrl } from "@/config/siteConfig";
import HomeClient from "@/components/HomeClient";

interface Product {
  id: number;
  title: string;
  unit_price: number;
  discount_percent?: number;
  discounted_price?: number;
  inventory: number;
  description?: string;
  images?: { id?: number; image: string }[];
  units_sold?: number;
  average_rating?: number;
  review_count?: number;
  collection?: any;
  collection_id?: any;
}

interface Collection {
  id: number;
  title: string;
  image?: string | null;
}

export default async function Home() {
  const apiBaseUrl = getApiBaseUrl();
  let trendingProducts: Product[] = [];
  let featuredCollections: Collection[] = [];

  try {
    const res = await fetch(
      `${apiBaseUrl}/store/products/?is_trending=true&page_size=8`,
      {
        cache: "no-store",
      },
    );
    if (res.ok) {
      const data = await res.json();
      const products: Product[] = Array.isArray(data)
        ? data
        : data.results || [];
      trendingProducts = products.filter((p: any) => p.is_trending).slice(0, 8);
    }
  } catch (err) {
    console.error("Failed to fetch trending products:", err);
  }

  try {
    const colRes = await fetch(`${apiBaseUrl}/store/collections/`, {
      cache: "no-store",
    });
    if (colRes.ok) {
      const colData = await colRes.json();
      const collections: Collection[] = Array.isArray(colData)
        ? colData
        : colData.results || [];
      featuredCollections = collections
        .filter((c: any) => c.is_featured)
        .slice(0, 3);
    }
  } catch (err) {
    console.error("Failed to fetch collections:", err);
  }

  return (
    <HomeClient
      trendingProducts={trendingProducts}
      featuredCollections={featuredCollections}
      apiBaseUrl={apiBaseUrl}
    />
  );
}

