import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import AddToCartButton from "@/features/products/components/AddToCartButton";
import ProductSearchBar from "@/features/products/components/ProductSearchBar";
import ProductSortSelect from "@/features/products/components/ProductSortSelect";
import { getApiBaseUrl } from "@/config/siteConfig";

interface Product {
  id: number;
  title: string;
  unit_price: number;
  discount_percent?: number;
  discounted_price?: number;
  short_description?: string;
  description: string;
  inventory?: number;
  images?: { id: number; image: string }[];
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    ordering?: string;
    search?: string;
    page?:string 
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
  const totalProducts = data.count || 0 ;
  const totalPages = Math.ceil(totalProducts / 9);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-24 transition-colors duration-300">

      {/* Breadcrumbs */}
      <div className="bg-primary text-background dark:text-foreground border-b border-white/5 py-4 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs flex items-center space-x-2.5 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="opacity-50">/</span>
          <span className="opacity-80">Shop</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-16">
        <h1 className="text-4xl font-black mb-10 uppercase tracking-tighter text-foreground">
          Product Catalog
        </h1>
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Left Sidebar: Filters & Sorting */}
          <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6">
            {/* Filter by Price Card */}
            <aside className="bg-secondary p-6 rounded-2xl border border-foreground/10 shadow-sm text-foreground transition-colors duration-300">
              <h2 className="text-xs font-black uppercase tracking-widest mb-6 pb-2 border-b border-foreground/10">
                Filter by Price
              </h2>
              <form
                method="GET"
                action="/products"
                className="flex flex-col gap-5"
              >
                {/* Keep active sorting and search parameters */}
                {ordering && (
                  <input type="hidden" name="ordering" value={ordering} />
                )}
                {search && <input type="hidden" name="search" value={search} />}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Min Price ($)
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    defaultValue={minPrice || ""}
                    placeholder="e.g. 10"
                    className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-secondary text-sm text-foreground placeholder:text-foreground/50 outline-none focus:border-accent transition-colors w-full shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Max Price ($)
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    defaultValue={maxPrice || ""}
                    placeholder="e.g. 100"
                    className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-secondary text-sm text-foreground placeholder:text-foreground/50 outline-none focus:border-accent transition-colors w-full shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors"
                  >
                    Apply Price
                  </button>
                </div>
              </form>
            </aside>

            {/* Sort Ordering */}
            <section className="bg-secondary p-6 rounded-2xl border border-foreground/10 shadow-sm text-foreground transition-colors duration-300">
              <h2 className="text-xs font-black uppercase tracking-widest mb-6 pb-2 border-b border-foreground/10">
                Sort Ordering
              </h2>
              <ProductSortSelect
                currentOrdering={ordering}
                minPrice={minPrice}
                maxPrice={maxPrice}
                search={search}
              />
            </section>

            {/* Clear All Filters Button */}
            {(minPrice || maxPrice || ordering || search) && (
              <Link
                href="/products"
                className="w-full py-3 border border-current text-foreground bg-secondary rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-all flex items-center justify-center shadow-sm"
              >
                Clear All Filters
              </Link>
            )}
          </div>

          {/* Right Panel*/}
          <div className="flex-1 w-full">
            {/* Search Bar with Live Suggestions Dropdown */}
            <ProductSearchBar
              initialSearch={search || ""}
              minPrice={minPrice}
              maxPrice={maxPrice}
              ordering={ordering}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.length > 0 ? (
                products.map((product) => {
                  const discountPercent = Number(product.discount_percent || 0);
                  const hasDiscount = discountPercent > 0;
                  const effectivePrice = product.discounted_price !== undefined 
                    ? product.discounted_price 
                    : (hasDiscount ? product.unit_price * (1 - discountPercent / 100) : product.unit_price);

                  return (
                    <div
                      key={product.id}
                      className="bg-secondary text-foreground rounded-2xl p-5 shadow-sm border border-foreground/10 hover:shadow-xl transition-shadow duration-300 group cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-square bg-primary/5 dark:bg-primary/40 rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                          {hasDiscount && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-accent text-button-fg font-extrabold text-[9px] uppercase tracking-wider shadow-md z-10 flex items-center gap-1">
                              <img src="/discount.png" alt="Discount" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
                              -{Math.round(discountPercent)}% OFF
                            </span>
                          )}
                          <ProductImage title={product.title} images={product.images} />
                        </div>
                        <h2 className="font-bold text-lg text-foreground mb-1 line-clamp-1 group-hover:text-accent transition-colors">
                          {product.title}
                        </h2>
                        <p className="opacity-70 text-xs line-clamp-2 mb-4 leading-relaxed">
                          {product.short_description || product.description || "No description available"}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-accent font-extrabold text-lg">
                            ${Number(effectivePrice).toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs line-through opacity-50 font-bold">
                              ${Number(product.unit_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={`/products/${product.id}`}
                            className="py-2.5 px-2 border border-current text-foreground rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-button-bg hover:text-button-fg transition-colors flex items-center justify-center text-center"
                          >
                            View Details
                          </Link>
                          <AddToCartButton
                            productId={product.id}
                            productTitle={product.title}
                            inventory={product.inventory ?? 999}
                            className="py-2.5 px-2 bg-button-bg text-button-fg rounded-xl font-bold text-[10px] uppercase tracking-wider hover:opacity-90 transition-colors flex items-center justify-center gap-1 text-center"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center text-sm font-bold uppercase tracking-wider opacity-60">
                  No products found matching the criteria.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-12">
                {/* Previous Button */}
                {currentPage > 1 ? (
                  <Link
                    href={{
                      pathname: "/products",
                      query: {
                        ...(minPrice && { minPrice }),
                        ...(maxPrice && { maxPrice }),
                        ...(ordering && { ordering }),
                        ...(search && { search }),
                        page: currentPage - 1,
                      },
                    }}
                    className="px-5 py-2.5 border border-current text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="px-5 py-2.5 border border-current opacity-30 rounded-xl text-xs font-bold uppercase tracking-widest cursor-not-allowed">
                    Previous
                  </span>
                )}

                {/* Page indicator */}
                <span className="text-xs font-bold opacity-70 uppercase tracking-wider">
                  Page {currentPage} of {totalPages}
                </span>

                {/* Next Button */}
                {currentPage < totalPages ? (
                  <Link
                    href={{
                      pathname: "/products",
                      query: {
                        ...(minPrice && { minPrice }),
                        ...(maxPrice && { maxPrice }),
                        ...(ordering && { ordering }),
                        ...(search && { search }),
                        page: currentPage + 1,
                      },
                    }}
                    className="px-5 py-2.5 border border-current text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="px-5 py-2.5 border border-current opacity-30 rounded-xl text-xs font-bold uppercase tracking-widest cursor-not-allowed">
                    Next
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
