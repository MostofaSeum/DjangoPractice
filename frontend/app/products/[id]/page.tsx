import Link from "next/link";
import Image from "next/image";
import ProductInteractive from "./ProductInteractive";

interface Product {
  id: number;
  title: string;
  unit_price: number;
  description: string;
  collection: number | { id: number; title: string };
}

interface CollectionDetail {
  id: number;
  title: string;
  products: Product[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const CartIcon = () => (
  <Image
    src="/shopping-cart-white-icon.webp"
    width={23}
    height={23}
    alt="Cart"
  />
);

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // Fetch product detail
  const res = await fetch(`${apiBaseUrl}/store/products/${id}/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-6 font-bold uppercase tracking-widest">
          Product not found.
        </p>
        <Link
          href="/products"
          className="inline-block text-[10px] font-bold tracking-widest uppercase border-b-2 border-[#3a3532] pb-1 hover:opacity-70 transition-opacity"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const product: Product = await res.json();

  // Determine collection ID
  const collectionId =
    typeof product.collection === "object" && product.collection !== null
      ? product.collection.id
      : product.collection;

  // Fetch collection detail to get related products and collection name
  let collectionData: CollectionDetail | null = null;
  if (collectionId) {
    try {
      const collectionRes = await fetch(
        `${apiBaseUrl}/store/collections/${collectionId}/`,
        { cache: "no-store" },
      );
      if (collectionRes.ok) {
        collectionData = await collectionRes.json();
      }
    } catch (err) {
      console.error("Error fetching collection data:", err);
    }
  }

  const collectionTitle = collectionData?.title || "Undefined";
  const relatedProducts = (collectionData?.products || [])
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

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
          <Link href="/products" className="hover:text-white transition-colors">
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
          <Link href="/products" className="hover:text-[#3a3532]">
            Shop
          </Link>
          <span>/</span>
          <span>
            <Link
              href={`/collections/${collectionId}`}
              className="w-full py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:text-[#3a3532] transition-colors flex items-center justify-center gap-2"
            >
              {collectionTitle}
            </Link>
          </span>
          <span>/</span>
          <span className="text-[#8b7a66] font-bold truncate max-w-[200px] sm:max-w-none">
            {product.title}
          </span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 py-12">
        {/* Product Area Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[#3a3532]/5">
          {/* Left Column: Product Images (Placeholder Mode) */}
          <div className="space-y-4">
            <div className="aspect-[4/5] w-full rounded-2xl border-2 border-dashed border-[#3a3532]/10 bg-[#f4f1eb] flex flex-col items-center justify-center p-6 text-center shadow-inner relative overflow-hidden">
              <Image
                src="/"
                alt={`Image of ${product.title} showing the product features`}
                fill
                className="opacity-0 object-cover"
              />
              <div className="w-16 h-16 rounded-full bg-[#3a3532]/5 flex items-center justify-center text-[#3a3532]/30 mb-4 z-10">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M4 16l4.586-4.586a2 2 0 0 0 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-bold text-[#3a3532] mb-1 z-10 uppercase tracking-tight">
                Image Placeholder
              </p>
              <p className="text-xs text-[#3a3532]/60 max-w-xs z-10 leading-relaxed font-semibold">
                Alt Text: Image of{" "}
                <span className="text-[#3a3532]">{product.title}</span>.
              </p>
            </div>

            {/* Thumbnail Placeholders */}
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square w-full rounded-xl bg-[#f4f1eb] flex items-center justify-center p-2 text-center text-[10px] text-[#3a3532]/30 font-bold relative overflow-hidden"
                >
                  <Image
                    src="/"
                    alt={`${product.title} detail ${i}`}
                    fill
                    className="opacity-0 object-cover"
                  />
                  <span className="z-10 uppercase tracking-widest text-[9px]">
                    Detail {i}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Product Info */}
          <div className="flex flex-col justify-start">
            <h1 className="text-3xl sm:text-4xl font-black text-[#3a3532] tracking-tighter leading-tight uppercase">
              {product.title}
            </h1>

            {/* Reviews Placeholder */}
            <div className="flex items-center space-x-1 mt-3 mb-6">
              <span className="text-[10px] text-[#3a3532]/45 font-bold uppercase tracking-wider">
                (0 Customer Reviews)
              </span>
            </div>

            {/* Price */}
            <p className="text-3xl font-black text-[#8b7a66] mb-8">
              ${Number(product.unit_price).toFixed(2)}
            </p>

            {/* Short Description */}
            <p className="text-[#3a3532]/70 leading-relaxed text-sm mb-8 font-medium">
              {product.description ||
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
            </p>

            <hr className="border-[#3a3532]/10 my-4" />

            {/* Quantity Selector & Add to Cart Client Area */}
            <ProductInteractive productId={product.id} productTitle={product.title} />

            <hr className="border-[#3a3532]/10 my-4" />

            {/* Additional details */}
            <div className="space-y-3 mt-4 text-[10px] font-bold tracking-widest uppercase text-[#3a3532]/65">
              <div>
                <span className="text-[#3a3532]/45 font-semibold mr-2">
                  Categories:
                </span>
                {collectionId ? (
                  <Link
                    href={`/collections/${collectionId}`}
                    className="hover:text-[#8b7a66] cursor-pointer transition-colors"
                  >
                    {collectionTitle}
                  </Link>
                ) : (
                  <span>{collectionTitle}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab section: Only description */}
        <div className="mt-20 border-t border-[#3a3532]/10 pt-12">
          <div className="flex space-x-8 border-b border-[#3a3532]/5 pb-4 mb-8">
            <button className="text-xs font-black uppercase tracking-widest text-[#3a3532] border-b-2 border-[#3a3532] pb-4 -mb-[18px]">
              Description
            </button>
          </div>
          <div className="text-sm text-[#3a3532]/70 leading-loose max-w-4xl font-medium">
            <p>
              {product.description ||
                "No description available for this product."}
            </p>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-[#3a3532]">
                Related products
              </h2>
              <div className="w-12 h-1 bg-[#8b7a66] mx-auto mt-3 rounded"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square bg-[#f4f1eb] rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                      <div className="w-full h-full bg-[#e6e0d4]/50 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                        <span className="text-[#3a3532]/20 font-black text-lg uppercase tracking-widest">
                          {item.title.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-[#3a3532] mb-1 line-clamp-1">
                      {item.title}
                    </h3>
                  </div>
                  <div className="mt-4">
                    <p className="text-[#8b7a66] font-bold text-sm mb-4">
                      ${Number(item.unit_price).toFixed(2)}
                    </p>
                    <Link
                      href={`/products/${item.id}`}
                      className="w-full py-2 border-2 border-[#3a3532] rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#3a3532] hover:text-[#e6e0d4] transition-colors flex items-center justify-center gap-2"
                    >
                       Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
