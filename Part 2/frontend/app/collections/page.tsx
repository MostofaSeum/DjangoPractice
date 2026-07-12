import Link from 'next/link';

interface Collection {
  id: number;
  title: string;
  featured_product: string | null;
  product_count: number;
}

export default async function CollectionssPage() {
  const res = await fetch('http://127.0.0.1:8000/store/collections/', {
    cache: 'no-store',
  });

  if (!res.ok) {
    return <div className="p-8 text-red-500">Failed to load collections.</div>;
  }

  const collections: Collection[] = await res.json();

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Product Catalog</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {collections.map((collection) => (
          <div key={collection.id} className="border p-4 rounded-lg shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold">{collection.title}</h2>
            <p className="text-gray-600 mb-4">{collection.product_count}</p>
            <Link 
              href={`/collections/${collection.id}`}
              className="text-blue-500 hover:underline font-medium"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
