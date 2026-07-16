import Link from "next/link";
import Image from "next/image";

interface Product {
  id: number;
  title: string;
  unit_price: number;
  description: string;
}

const CartIcon = () => (
  <Image
    src="/shopping-cart-white-icon.webp"
    width={23}
    height={23}
    alt="Cart"
  />
);

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    ordering?: string;
    search?: string;
  }>;
}) {
  const { minPrice, maxPrice, ordering, search } = await searchParams;

  const queryParams = new URLSearchParams();
  if (minPrice) queryParams.append("unit_price__gt", minPrice);
  if (maxPrice) queryParams.append("unit_price__lt", maxPrice);
  if (ordering) queryParams.append("ordering", ordering);
  if (search) queryParams.append("search", search);

  const res = await fetch(
    `http://127.0.0.1:8000/store/products/?${queryParams.toString()}`,
    {
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] p-8 text-center font-bold">
        Failed to load products.
      </div>
    );
  }

  const data = await res.json();
  const products: Product[] = Array.isArray(data) ? data : data.results || [];

  return (
    <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] font-sans antialiased pb-24 selection:bg-[#3a3532] selection:text-[#e6e0d4]">
      {/* Header Navigation */}
      <header className="bg-[#3a3532] text-[#e6e0d4] py-6 px-8 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <Link
          href="/"
          className="text-xl md:text-2xl font-black tracking-tighter uppercase text-[#e6e0d4] hover:opacity-85 transition-opacity"
        >
          VibeMart
        </Link>
        <nav className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-widest text-[#e6e0d4]/80">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link
            href="/products"
            className="text-white border-b border-white pb-0.5"
          >
            Shop
          </Link>
          <Link
            href="/collections"
            className="hover:text-white transition-colors"
          >
            Collections
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <button className="text-[#e6e0d4] hover:text-white transition-colors">
            <CartIcon />
          </button>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="bg-[#3a3532]/5 border-b border-[#3a3532]/10 py-4">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs text-[#3a3532]/60 flex items-center space-x-2 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:text-[#3a3532]">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#3a3532]">Shop</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-16">
        <h1 className="text-4xl font-black mb-10 uppercase tracking-tighter">
          Product Catalog
        </h1>
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Left Sidebar: Filters & Sorting */}
          <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6">
            {/* Filter by Price Card */}
            <aside className="bg-white p-6 rounded-2xl border border-[#3a3532]/5 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#3a3532] mb-6 pb-2 border-b border-[#3a3532]/10">
                Filter by Price
              </h2>
              <form
                method="GET"
                action="/products"
                className="flex flex-col gap-5"
              >
                {/* Keep active sorting and search parameters */}
                {ordering && <input type="hidden" name="ordering" value={ordering} />}
                {search && <input type="hidden" name="search" value={search} />}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/60">
                    Min Price ($)
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    defaultValue={minPrice || ""}
                    placeholder="e.g. 10"
                    className="px-4 py-2.5 border border-[#3a3532]/10 rounded-xl bg-[#f4f1eb] text-sm text-[#3a3532] placeholder-[#3a3532]/30 outline-none focus:border-[#3a3532]/30 transition-colors w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/60">
                    Max Price ($)
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    defaultValue={maxPrice || ""}
                    placeholder="e.g. 100"
                    className="px-4 py-2.5 border border-[#3a3532]/10 rounded-xl bg-[#f4f1eb] text-sm text-[#3a3532] placeholder-[#3a3532]/30 outline-none focus:border-[#3a3532]/30 transition-colors w-full"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#3a3532] text-[#e6e0d4] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#252220] transition-colors"
                  >
                    Apply Price
                  </button>
                </div>
              </form>
            </aside>

            {/* Sort by Price*/}
            <section className="bg-white p-6 rounded-2xl border border-[#3a3532]/5 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#3a3532] mb-6 pb-2 border-b border-[#3a3532]/10">
                Sort Ordering
              </h2>
              <form
                method="GET"
                action="/products"
                className="flex flex-col gap-5"
              >
                {/* Keep active price filters and search parameters */}
                {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
                {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
                {search && <input type="hidden" name="search" value={search} />}

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="sort"
                    className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/60"
                  >
                    Sort Ordering
                  </label>
                  <select
                    id="sort"
                    name="ordering"
                    defaultValue={ordering || ""}
                    className="px-4 py-2.5 border border-[#3a3532]/10 rounded-xl bg-[#f4f1eb] text-sm text-[#3a3532] outline-none focus:border-[#3a3532]/30 transition-colors w-full cursor-pointer"
                  >
                    <option value="">Default</option>
                    <option value="unit_price">Price: Low to High</option>
                    <option value="-unit_price">Price: High to Low</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#3a3532] text-[#e6e0d4] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#252220] transition-colors pt-2"
                >
                  Apply Ordering
                </button>
              </form>
            </section>

            {/* Clear All Filters Button */}
            {(minPrice || maxPrice || ordering || search) && (
              <Link
                href="/products"
                className="w-full py-3 border-2 border-[#3a3532] text-[#3a3532] bg-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#f4f1eb] transition-all flex items-center justify-center shadow-sm"
              >
                Clear All Filters
              </Link>
            )}
          </div>

          {/* Right Panel*/}
          <div className="flex-1 w-full">
            {/* Search Bar Form */}
            <form method="GET" action="/products" className="flex gap-2 mb-8 w-full max-w-3xl">
              {/* Preserve other active parameters */}
              {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
              {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
              {ordering && <input type="hidden" name="ordering" value={ordering} />}
              
              <input 
                type="text" 
                name="search" 
                defaultValue={search || ""} 
                placeholder="Search products by title or description..." 
                className="flex-1 px-5 py-3 border border-[#3a3532]/10 rounded-2xl bg-white text-sm text-[#3a3532] placeholder-[#3a3532]/30 outline-none focus:border-[#3a3532]/30 transition-colors shadow-sm"
              />
              <button 
                type="submit" 
                className="px-6 py-3 bg-[#3a3532] text-[#e6e0d4] rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#252220] transition-colors"
              >
                Search
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-square bg-[#f4f1eb] rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                        <div className="w-full h-full bg-[#e6e0d4]/50 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                          <span className="text-[#3a3532]/20 font-black text-lg uppercase tracking-widest">
                            {product.title.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                      <h2 className="font-bold text-lg text-[#3a3532] mb-1 line-clamp-1">
                        {product.title}
                      </h2>
                      <p className="text-[#3a3532]/60 text-xs line-clamp-2 mb-4 leading-relaxed">
                        {product.description || "No description available"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#8b7a66] font-bold text-lg mb-6">
                        ${Number(product.unit_price).toFixed(2)}
                      </p>
                      <Link
                        href={`/products/${product.id}`}
                        className="w-full py-3 border-2 border-[#3a3532] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#3a3532] hover:text-[#e6e0d4] transition-colors flex items-center justify-center gap-2"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-sm font-bold uppercase tracking-wider text-[#3a3532]/60">
                  No products found matching the criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
