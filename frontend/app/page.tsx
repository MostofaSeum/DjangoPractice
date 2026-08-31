export const dynamic = "force-dynamic";

import { getApiBaseUrl } from "@/config/siteConfig";
import HomeClient from "@/components/HomeClient";

import { Product, Collection } from "@/types/product";

export default async function Home() {
  const apiBaseUrl = getApiBaseUrl();
  let trendingProducts: Product[] = [];
  let featuredCollections: Collection[] = [];

  try {
    const [prodRes, colRes] = await Promise.all([
      fetch(`${apiBaseUrl}/store/products/?is_trending=true&page_size=8`, {
        cache: "no-store",
      }),
      fetch(`${apiBaseUrl}/store/collections/`, {
        cache: "no-store",
      }),
    ]);

    if (prodRes.ok) {
      const data = await prodRes.json();
      const products: Product[] = Array.isArray(data)
        ? data
        : data.results || [];
      trendingProducts = products.filter((p: any) => p.is_trending).slice(0, 8);
    }

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
    console.error("Failed to fetch home page data:", err);
  }

  return (
    <HomeClient
      trendingProducts={trendingProducts}
      featuredCollections={featuredCollections}
      apiBaseUrl={apiBaseUrl}
    />
  );
}

