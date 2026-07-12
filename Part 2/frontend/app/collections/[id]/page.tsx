import Link from 'next/link';

interface Product {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  inventory: number;
  unit_price: string;
  price_with_tax: number;
}

interface Collection {
  id: number;
  title: string;
  featured_product: string | number | null;
  products: Product[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { id } = await params;

  const res = await fetch(`http://127.0.0.1:8000/store/collections/${id}/`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <p className="text-red-500 mb-4 font-semibold">Collection not found.</p>
        <Link href="/collections" className="text-blue-500 hover:underline">
           Back to Catalog
        </Link>
      </div>
    );
  }

  const collection: Collection = await res.json();

  return (
    <main className="max-w-4xl mx-auto p-8">
      <Link href="/collections" className="text-blue-500 hover:underline mb-6 block">
        Back to Catalog
      </Link>
      <div className="border p-6 rounded-xl shadow-lg bg-white dark:bg-zinc-900 mb-8">
        <span className="text-xs text-gray-400 font-mono">ID: {collection.id}</span>
        <h1 className="text-4xl font-extrabold my-2">{collection.title}</h1>
        {collection.featured_product && (
          <p className="text-sm text-gray-500">Featured Product ID: {collection.featured_product}</p>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-4">Products in this Collection</h2>
      {collection.products && collection.products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {collection.products.map((product) => (
            <div key={product.id} className="border p-4 rounded-lg shadow-sm bg-white dark:bg-zinc-900 hover:shadow-md transition">
              <h3 className="text-lg font-semibold">{product.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 my-2">{product.description || 'No description available'}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-green-600">${product.unit_price}</span>
                <span className="text-xs text-gray-400">Inventory: {product.inventory}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No products found in this collection.</p>
      )}
    </main>
  );
}
