import Link from "next/link";
import Image from "next/image";

interface Collection {
  id: number;
  title: string;
  featured_product: string | null;
  product_count: number;
}

const CartIcon = () => (
  <Image src="/shopping-cart-white-icon.webp" width={23} height={23} alt="Cart" />
);

export default async function CollectionsPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const res = await fetch(`${apiBaseUrl}/store/collections/`, {
    cache: "no-store",
  });
 
  if (!res.ok) {
    return (
      <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] p-8 text-center font-bold">
        Failed to load collections.
      </div>
    );
  }

  const collections: Collection[] = await res.json();

  return (
    <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] font-sans antialiased pb-24 selection:bg-[#3a3532] selection:text-[#e6e0d4]">

      {/* Breadcrumbs */}
      <div className="bg-[#3a3532]/5 border-b border-[#3a3532]/10 py-4">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs text-[#3a3532]/60 flex items-center space-x-2 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:text-[#3a3532]">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#3a3532]">Collections</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-16">
        <h1 className="text-4xl font-black mb-10 uppercase tracking-tighter">
          Product Collections
        </h1>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-[#3a3532]/5 hover:shadow-xl transition-all duration-300 flex justify-between items-center space-x-4 group cursor-pointer"
            >
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1 uppercase tracking-tight group-hover:text-[#8b7a66] transition-colors">
                  {collection.title}
                </h2>
                <p className="text-[#3a3532]/60 text-xs font-bold uppercase tracking-wider mb-6">
                  {collection.product_count} products
                </p>
                <Link
                  href={`/collections/${collection.id}`}
                  className="inline-block text-[10px] font-bold tracking-widest uppercase border-b-2 border-[#3a3532] pb-1 hover:opacity-70 transition-opacity"
                >
                  View Collection
                </Link>
              </div>
              <div className="w-24 h-24 flex-shrink-0 bg-[#f4f1eb] rounded-xl relative flex items-center justify-center p-2 text-center text-[10px] text-[#3a3532]/30 font-bold uppercase tracking-wider overflow-hidden">
                <Image
                  src="/"
                  alt={`Image of ${collection.title}`}
                  fill
                  className="opacity-0 object-cover"
                />
                <span>{collection.title}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
