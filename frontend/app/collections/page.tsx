import type { Metadata } from "next";
import { getApiBaseUrl } from "@/config/siteConfig";
import CollectionsClient from "@/features/collections/components/CollectionsClient";

export const metadata: Metadata = {
  title: "VibeMart Collections - Curated Beauty, Makeup & Skincare Sets",
  description: "Explore curated beauty, skincare, lipstick, and cosmetics collections from VibeMart. Find premium curated beauty routines and exclusive product bundles.",
  keywords: ["vibemart collections", "vibemart beauty sets", "skincare routines", "curated cosmetics", "makeup bundles", "beauty catalog"],
  alternates: {
    canonical: "/collections",
  },
  openGraph: {
    title: "VibeMart Collections - Curated Beauty, Makeup & Skincare Sets",
    description: "Explore curated beauty, skincare, lipstick, and cosmetics collections from VibeMart. Find premium curated beauty routines and exclusive product bundles.",
    url: "/collections",
    type: "website",
    images: [
      {
        url: "/brand-icon.png",
        width: 1024,
        height: 1024,
        alt: "VibeMart Collections",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "VibeMart Collections - Curated Beauty, Makeup & Skincare Sets",
    description: "Explore curated beauty, skincare, lipstick, and cosmetics collections from VibeMart.",
    images: ["/brand-icon.png"],
  },
};

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
