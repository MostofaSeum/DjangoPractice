import type { Metadata } from "next";
import { getApiBaseUrl } from "@/config/siteConfig";
import ProductsClient from "@/features/products/components/ProductsClient";
import { Product } from "@/types/product";

export const metadata: Metadata = {
  title: "Shop All Products | VibeMart",
  description: "Browse our exclusive catalog of trendy streetwear, hoodies, apparel, and premium accessories.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Shop All Products | VibeMart",
    description: "Browse our exclusive catalog of trendy streetwear, hoodies, apparel, and premium accessories.",
    url: "/products",
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    ordering?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const { minPrice, maxPrice, ordering, search, page } = await searchParams;
  const currentPage = Number(page) || 1;

  const queryParams = new URLSearchParams();
  if (minPrice) queryParams.append("unit_price__gt", minPrice);
  if (maxPrice) queryParams.append("unit_price__lt", maxPrice);
  if (ordering) queryParams.append("ordering", ordering);
  if (search) queryParams.append("search", search);
  if (page) queryParams.append("page", page);

  const apiBaseUrl = getApiBaseUrl();
  const res = await fetch(
    `${apiBaseUrl}/store/products/?${queryParams.toString()}`,
    {
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 text-center font-bold">
        Failed to load products.
      </div>
    );
  }

  const data = await res.json();
  const products: Product[] = Array.isArray(data) ? data : data.results || [];
  const totalProducts = data.count || 0;
  const totalPages = Math.ceil(totalProducts / 9);

  return (
    <ProductsClient
      products={products}
      totalProducts={totalProducts}
      totalPages={totalPages}
      currentPage={currentPage}
      minPrice={minPrice}
      maxPrice={maxPrice}
      ordering={ordering}
      search={search}
    />
  );
}

