import { MetadataRoute } from "next";
import { getApiBaseUrl } from "@/config/siteConfig";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const apiBase = getApiBaseUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/gift-cards`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  let productEntries: MetadataRoute.Sitemap = [];
  let collectionEntries: MetadataRoute.Sitemap = [];

  try {
    const [prodRes, colRes] = await Promise.all([
      fetch(`${apiBase}/store/products/?page_size=100`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${apiBase}/store/collections/`, {
        next: { revalidate: 3600 },
      }),
    ]);

    if (prodRes.ok) {
      const prodData = await prodRes.json();
      const products = Array.isArray(prodData) ? prodData : prodData.results || [];
      productEntries = products.map((p: any) => ({
        url: `${siteUrl}/products/${p.id}`,
        lastModified: p.last_update ? new Date(p.last_update) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }

    if (colRes.ok) {
      const colData = await colRes.json();
      const collections = Array.isArray(colData) ? colData : colData.results || [];
      collectionEntries = collections.map((c: any) => ({
        url: `${siteUrl}/collections/${c.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error("Failed to generate dynamic sitemap entries:", err);
  }

  return [...staticRoutes, ...productEntries, ...collectionEntries];
}
