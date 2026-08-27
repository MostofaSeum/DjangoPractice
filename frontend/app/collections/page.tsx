import { getApiBaseUrl } from "@/config/siteConfig";
import CollectionsClient from "@/features/collections/components/CollectionsClient";

interface Collection {
  id: number;
  title: string;
  featured_product: string | null;
  product_count: number;
  image?: string | null;
}

export default async function CollectionsPage() {
  const apiBaseUrl = getApiBaseUrl();
  let collections: Collection[] = [];

  try {
    const res = await fetch(`${apiBaseUrl}/store/collections/`, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      collections = Array.isArray(data) ? data : data.results || [];
    }
  } catch (err) {
    console.error("Failed to fetch collections:", err);
  }

  return (
    <CollectionsClient
      collections={collections}
      apiBaseUrl={apiBaseUrl}
    />
  );
}
