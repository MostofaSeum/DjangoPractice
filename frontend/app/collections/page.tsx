import Link from "next/link";
import Image from "next/image";

interface Collection {
  id: number;
  title: string;
  featured_product: string | null;
  product_count: number;
  image?: string | null;
}

export default async function CollectionsPage() {
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
  const res = await fetch(`${apiBaseUrl}/store/collections/`, {
    cache: "no-store",
  });
 
  if (!res.ok) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 text-center font-bold">
        Failed to load collections.
      </div>
    );
  }

  const data = await res.json();
  const collections: Collection[] = Array.isArray(data) ? data : data.results || [];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-24 transition-colors duration-300">

      {/* Breadcrumbs */}
      <div className="bg-primary text-background dark:text-foreground border-b border-foreground/10 py-4 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs flex items-center space-x-2 font-bold uppercase tracking-wider opacity-90">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          <span>Collections</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-16">
        <h1 className="text-4xl font-black mb-10 uppercase tracking-tighter text-foreground">
          Product Collections
        </h1>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => {
            const imageUrl = collection.image
              ? collection.image.startsWith("http")
                ? collection.image
                : `${apiBaseUrl}${collection.image.startsWith("/") ? "" : "/"}${collection.image}`
              : null;

            return (
              <div
                key={collection.id}
                className="bg-secondary rounded-2xl p-6 shadow-sm border border-foreground/10 hover:shadow-xl transition-all duration-300 flex justify-between items-center space-x-4 group cursor-pointer text-foreground"
              >
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1 uppercase tracking-tight group-hover:text-accent transition-colors">
                    {collection.title}
                  </h2>
                  <p className="opacity-70 text-xs font-bold uppercase tracking-wider mb-6">
                    {collection.product_count} products
                  </p>
                  <Link
                    href={`/collections/${collection.id}`}
                    className="inline-block text-[10px] font-bold tracking-widest uppercase border-b-2 border-current pb-1 hover:opacity-70 transition-opacity"
                  >
                    View Collection
                  </Link>
                </div>
                <div className="w-24 h-24 flex-shrink-0 bg-primary/5 dark:bg-primary/40 rounded-xl relative flex items-center justify-center p-2 text-center text-[10px] opacity-60 font-bold uppercase tracking-wider overflow-hidden border border-foreground/10">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={`Cover for ${collection.title}`}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span>{collection.title}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
