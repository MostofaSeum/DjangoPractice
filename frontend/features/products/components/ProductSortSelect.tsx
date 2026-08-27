"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/store/LanguageContext";

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
  const { t } = useLanguage();

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
        {t("products.sortOrdering")}
      </label>
      <select
        id="product-sort"
        value={currentOrdering || ""}
        onChange={(e) => handleSortChange(e.target.value)}
        className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-secondary text-sm text-foreground outline-none focus:border-accent transition-colors w-full cursor-pointer shadow-sm"
      >
        <option value="" className="bg-secondary text-foreground">
          {t("products.sort.default")}
        </option>
        <option value="unit_price" className="bg-secondary text-foreground">
          {t("products.sort.priceLowHigh")}
        </option>
        <option value="-unit_price" className="bg-secondary text-foreground">
          {t("products.sort.priceHighLow")}
        </option>
        <option value="id" className="bg-secondary text-foreground">
          {t("products.sort.oldFirst")}
        </option>
        <option value="-id" className="bg-secondary text-foreground">
          {t("products.sort.newFirst")}
        </option>
        <option value="-popularity" className="bg-secondary text-foreground">
          {t("products.sort.mostPopular")}
        </option>
        <option value="popularity" className="bg-secondary text-foreground">
          {t("products.sort.lessPopular")}
        </option>
      </select>
    </div>
  );
}
