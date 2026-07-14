import Link from 'next/link';
import Image from 'next/image';

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
    <div className="min-h-screen bg-white text-zinc-800 font-sans antialiased pb-16">
      {/* Header Navigation */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-widest text-zinc-900">
            PEDONA
          </Link>
          <nav className="hidden md:flex space-x-8 text-xs font-semibold tracking-wider text-zinc-600 uppercase">
            <Link href="/" className="hover:text-red-500 transition-colors">Home</Link>
            <Link href="/products" className="text-red-500 transition-colors">Shop</Link>
            <Link href="#" className="hover:text-red-500 transition-colors">Contact Us</Link>
          </nav>
          <div className="w-6 h-6"></div> {/* Spacer to balance */}
        </div>
      </header>

      {/* Breadcrumbs */} 
      <div className="bg-zinc-50 border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-zinc-500 flex items-center space-x-2">
          <Link href="/" className="hover:text-zinc-800">Home</Link>
          <span>/</span>
          <Link href="/collections" className="hover:text-zinc-800">Collections</Link>
          <span>/</span>
          <span className="text-zinc-800 font-semibold">{collection.title}</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-8">
        <div className="border p-6 rounded-xl shadow bg-white mb-8">
          <span className="text-xs text-gray-400 font-mono">ID: {collection.id}</span>
          <h1 className="text-4xl font-extrabold my-2 text-zinc-900">{collection.title}</h1>
          {collection.featured_product && (
            <p className="text-sm text-gray-500">Featured Product ID: {collection.featured_product}</p>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-4">Products in this Collection</h2>
        {collection.products && collection.products.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {collection.products.map((product) => (
              <div key={product.id} className="border p-4 rounded-lg shadow-sm bg-white hover:shadow-md transition flex justify-between items-center space-x-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{product.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 my-2">{product.description || 'No description available'}</p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="font-bold text-green-600">${product.unit_price}</span>
                    <span className="text-xs text-gray-400">Inventory: {product.inventory}</span>
                  </div>
                  <div className="mt-2">
                    <Link 
                      href={`/products/${product.id}`}
                      className="text-blue-500 hover:underline font-medium text-xs"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
                <div className="w-20 h-20 flex-shrink-0 bg-zinc-50 border border-zinc-200 rounded relative flex items-center justify-center p-2 text-center text-[10px] text-zinc-400 font-medium leading-tight overflow-hidden">
                  <Image 
                    src="/"
                    alt={`Image of ${product.title}`}
                    fill
                    className="opacity-0 object-cover"
                  />
                  <span>Image of {product.title}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No products found in this collection.</p>
        )}
      </main>
    </div>
  );
}
