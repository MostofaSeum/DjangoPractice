import Link from "next/link";
import Image from "next/image";
import ProductImage from "@/components/ui/ProductImage";
import AddToCartButton from "@/features/products/components/AddToCartButton";

interface Product {
  id: number;
  title: string;
  unit_price: number;
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

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
  const res = await fetch(
    `${apiBaseUrl}/store/products/?${queryParams.toString()}`,
    {
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-8 text-center font-bold">
        Failed to load products.
      </div>
    );
  }

  const data = await res.json();
  const products: Product[] = Array.isArray(data) ? data : data.results || [];
  const totalProducts = data.count || 0 ;
  const totalPages = Math.ceil(totalProducts / 9);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased pb-24 transition-colors duration-300">

      {/* Breadcrumbs */}
      <div className="bg-[var(--banner-bg)] text-[var(--banner-text)] border-b border-[#3a3532]/10 py-4 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs flex items-center space-x-2 font-bold uppercase tracking-wider opacity-90">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          <span>Shop</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-16">
        <h1 className="text-4xl font-black mb-10 uppercase tracking-tighter text-[var(--foreground)]">
          Product Catalog
        </h1>
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Left Sidebar: Filters & Sorting */}
          <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6">
            {/* Filter by Price Card */}
            <aside className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] shadow-sm text-[var(--foreground)] transition-colors duration-300">
              <h2 className="text-xs font-black uppercase tracking-widest mb-6 pb-2 border-b border-[var(--card-border)]">
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
                    className="px-4 py-2.5 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-sm text-[var(--foreground)] placeholder:opacity-40 outline-none focus:border-[var(--brand-accent)] transition-colors w-full"
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
                    className="px-4 py-2.5 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-sm text-[var(--foreground)] placeholder:opacity-40 outline-none focus:border-[var(--brand-accent)] transition-colors w-full"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors"
                  >
                    Apply Price
                  </button>
                </div>
              </form>
            </aside>

            {/* Sort by Price*/}
            <section className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] shadow-sm text-[var(--foreground)] transition-colors duration-300">
              <h2 className="text-xs font-black uppercase tracking-widest mb-6 pb-2 border-b border-[var(--card-border)]">
                Sort Ordering
              </h2>
              <form
                method="GET"
                action="/products"
                className="flex flex-col gap-5"
              >
                {/* Keep active price filters and search parameters */}
                {minPrice && (
                  <input type="hidden" name="minPrice" value={minPrice} />
                )}
                {maxPrice && (
                  <input type="hidden" name="maxPrice" value={maxPrice} />
                )}
                {search && <input type="hidden" name="search" value={search} />}

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="sort"
                    className="text-[10px] font-bold uppercase tracking-wider opacity-70"
                  >
                    Sort Ordering
                  </label>
                  <select
                    id="sort"
                    name="ordering"
                    defaultValue={ordering || ""}
                    className="px-4 py-2.5 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-accent)] transition-colors w-full cursor-pointer"
                  >
                    <option value="">Default</option>
                    <option value="unit_price">Price: Low to High</option>
                    <option value="-unit_price">Price: High to Low</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors pt-2"
                >
                  Apply Ordering
                </button>
              </form>
            </section>

            {/* Clear All Filters Button */}
            {(minPrice || maxPrice || ordering || search) && (
              <Link
                href="/products"
                className="w-full py-3 border border-current text-[var(--foreground)] bg-[var(--card-bg)] rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-all flex items-center justify-center shadow-sm"
              >
                Clear All Filters
              </Link>
            )}
          </div>

          {/* Right Panel*/}
          <div className="flex-1 w-full">
            {/* Search Bar Form */}
            <form
              method="GET"
              action="/products"
              className="flex gap-2 mb-8 w-full max-w-3xl"
            >
              {/* Preserve other active parameters */}
              {minPrice && (
                <input type="hidden" name="minPrice" value={minPrice} />
              )}
              {maxPrice && (
                <input type="hidden" name="maxPrice" value={maxPrice} />
              )}
              {ordering && (
                <input type="hidden" name="ordering" value={ordering} />
              )}

              <input
                type="text"
                name="search"
                defaultValue={search || ""}
                placeholder="Search products by title or description..."
                className="flex-1 px-5 py-3 border border-[var(--input-border)] rounded-2xl bg-[var(--input-bg)] text-sm text-[var(--foreground)] placeholder:opacity-40 outline-none focus:border-[var(--brand-accent)] transition-colors shadow-sm"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors"
              >
                Search
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-[var(--card-bg)] text-[var(--foreground)] rounded-2xl p-5 shadow-sm border border-[var(--card-border)] hover:shadow-xl transition-shadow duration-300 group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-square bg-[var(--input-bg)] rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                        <ProductImage title={product.title} images={product.images} />
                      </div>
                      <h2 className="font-bold text-lg text-[var(--foreground)] mb-1 line-clamp-1 group-hover:text-[var(--brand-accent)] transition-colors">
                        {product.title}
                      </h2>
                      <p className="opacity-70 text-xs line-clamp-2 mb-4 leading-relaxed">
                        {product.description || "No description available"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--brand-accent)] font-bold text-lg mb-4">
                        ${Number(product.unit_price).toFixed(2)}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="py-2.5 px-2 border border-current text-[var(--foreground)] rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-[var(--button-bg)] hover:text-[var(--button-text)] transition-colors flex items-center justify-center text-center"
                        >
                          View Details
                        </Link>
                        <AddToCartButton
                          productId={product.id}
                          productTitle={product.title}
                          inventory={product.inventory ?? 999}
                          className="py-2.5 px-2 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-bold text-[10px] uppercase tracking-wider hover:opacity-90 transition-colors flex items-center justify-center gap-1 text-center"
                        />
                      </div>
                    </div>
                  </div>
                ))
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
                    className="px-5 py-2.5 border border-current text-[var(--foreground)] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[var(--card-bg)] transition-colors"
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
                    className="px-5 py-2.5 border border-current text-[var(--foreground)] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[var(--card-bg)] transition-colors"
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
