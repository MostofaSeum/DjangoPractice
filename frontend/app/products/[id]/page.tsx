import Link from "next/link";
import Image from "next/image";
import ProductInteractive from "./ProductInteractive";
import ProductGallery from "./ProductGallery";

interface Product {
  id: number;
  title: string;
  unit_price: number;
  inventory: number;
  description: string;
  collection: number | { id: number; title: string };
  images?: { id: number; image: string }[];
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

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

  // Fetch product detail
  const res = await fetch(`${apiBaseUrl}/store/products/${id}/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-6 font-bold uppercase tracking-widest">
          Product not found.
        </p>
        <Link
          href="/products"
          className="inline-block text-[10px] font-bold tracking-widest uppercase border-b-2 border-current pb-1 hover:opacity-70 transition-opacity"
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
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-24 transition-colors duration-300">

      {/* Breadcrumbs */}
      <div className="bg-primary text-background dark:text-foreground border-b border-foreground/10 py-4 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs flex items-center space-x-2 font-bold uppercase tracking-wider opacity-90">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:underline">
            Shop
          </Link>
          <span>/</span>
          <span>
            <Link
              href={`/collections/${collectionId}`}
              className="py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:underline transition-colors"
            >
              {collectionTitle}
            </Link>
          </span>
          <span>/</span>
          <span className="text-accent font-bold truncate max-w-[200px] sm:max-w-none">
            {product.title}
          </span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 py-12">
        {/* Product Area Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 bg-secondary text-foreground rounded-3xl p-8 md:p-12 shadow-sm border border-foreground/10 transition-colors duration-300">
          {/* Left Column: Product Images (Interactive Gallery) */}
          <ProductGallery title={product.title} images={product.images} />

          {/* Right Column: Product Info */}
          <div className="flex flex-col justify-start">
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter leading-tight uppercase">
              {product.title}
            </h1>

            {/* Reviews Placeholder */}
            <div className="flex items-center space-x-1 mt-3 mb-6">
              <span className="text-[10px] opacity-60 font-bold uppercase tracking-wider">
                (0 Customer Reviews)
              </span>
            </div>

            {/* Price */}
            <p className="text-3xl font-black text-accent mb-8">
              ${Number(product.unit_price).toFixed(2)}
            </p>

            {/* Short Description */}
            <p className="opacity-80 leading-relaxed text-sm mb-8 font-medium">
              {product.description ||
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
            </p>

            <hr className="border-foreground/10 my-4" />

            {/* Quantity Selector & Add to Cart Client Area */}
            <ProductInteractive
              productId={product.id}
              productTitle={product.title}
              inventory={product.inventory}
            />

            <hr className="border-foreground/10 my-4" />

            {/* Additional details */}
            <div className="space-y-3 mt-4 text-[10px] font-bold tracking-widest uppercase opacity-70">
              <div>
                <span className="opacity-60 font-semibold mr-2">
                  Categories:
                </span>
                {collectionId ? (
                  <Link
                    href={`/collections/${collectionId}`}
                    className="hover:text-accent cursor-pointer transition-colors"
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
        <div className="mt-20 border-t border-foreground/10 pt-12">
          <div className="flex space-x-8 border-b border-foreground/10 pb-4 mb-8">
            <button className="text-xs font-black uppercase tracking-widest border-b-2 border-current pb-4 -mb-[18px]">
              Description
            </button>
          </div>
          <div className="text-sm opacity-80 leading-loose max-w-4xl font-medium">
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
              <h2 className="text-2xl font-black uppercase tracking-tighter">
                Related products
              </h2>
              <div className="w-12 h-1 bg-accent mx-auto mt-3 rounded"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-secondary text-foreground rounded-2xl p-5 shadow-sm border border-foreground/10 hover:shadow-xl transition-shadow duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square bg-primary/5 dark:bg-primary/40 rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                      <div className="w-full h-full bg-primary/5 dark:bg-primary/40 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                        <span className="opacity-40 font-black text-lg uppercase tracking-widest">
                          {item.title.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm mb-1 line-clamp-1">
                      {item.title}
                    </h3>
                  </div>
                  <div className="mt-4">
                    <p className="text-accent font-bold text-sm mb-4">
                      ${Number(item.unit_price).toFixed(2)}
                    </p>
                    <Link
                      href={`/products/${item.id}`}
                      className="w-full py-2 border border-current rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-primary hover:text-secondary transition-colors flex items-center justify-center gap-2"
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
