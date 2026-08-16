"use client";

import { useRouter } from "next/navigation";

interface ProductSortSelectProps {
  currentOrdering?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
}

export default function ProductSortSelect({
  currentOrdering = "",
  minPrice,
  maxPrice,
  search,
}: ProductSortSelectProps) {
  const router = useRouter();

  const handleSortChange = (newOrdering: string) => {
    const params = new URLSearchParams();
    if (newOrdering) params.set("ordering", newOrdering);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (search) params.set("search", search);

    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="product-sort"
        className="text-[10px] font-bold uppercase tracking-wider opacity-70"
      >
        Sort Ordering
      </label>
      <select
        id="product-sort"
        value={currentOrdering || ""}
        onChange={(e) => handleSortChange(e.target.value)}
        className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-secondary text-sm text-foreground outline-none focus:border-accent transition-colors w-full cursor-pointer shadow-sm"
      >
        <option value="" className="bg-secondary text-foreground">
          Default sorting
        </option>
        <option value="unit_price" className="bg-secondary text-foreground">
          Price: Low to High
        </option>
        <option value="-unit_price" className="bg-secondary text-foreground">
          Price: High to Low
        </option>
        <option value="id" className="bg-secondary text-foreground">
          Product: Old First
        </option>
        <option value="-id" className="bg-secondary text-foreground">
          Product: New First
        </option>
        <option value="-popularity" className="bg-secondary text-foreground">
          Popularity: Most Popular First
        </option>
        <option value="popularity" className="bg-secondary text-foreground">
          Popularity: Less Popular First
        </option>
      </select>
    </div>
  );
}
