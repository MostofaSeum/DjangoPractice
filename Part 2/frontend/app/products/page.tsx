import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: number;
  title: string;
  unit_price: number;
  description: string;
}

export default async function ProductsPage() {
  const res = await fetch('http://127.0.0.1:8000/store/products/', {
    cache: 'no-store',
  });

  if (!res.ok) {
    return <div className="p-8 text-red-500">Failed to load products.</div>;
  }

  const products: Product[] = await res.json();

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
          <Link href="/products" className="hover:text-zinc-800">Shop</Link>
        </div>
      </div>
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Product Catalog</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <div key={product.id} className="border p-4 rounded-lg shadow hover:shadow-md transition flex justify-between items-center space-x-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{product.title}</h2>
              <p className="text-gray-600 mb-4">${product.unit_price}</p>
              <Link 
                href={`/products/${product.id}`}
                className="text-blue-500 hover:underline font-medium"
              >
                View Details
              </Link>
            </div>
            <div className="w-20 h-20 flex-shrink-0 bg-zinc-50 border border-zinc-200 rounded flex items-center justify-center p-2 text-center text-[10px] text-zinc-400 font-medium leading-tight">
              Image of {product.title}
            </div>
          </div>
        ))}
      </div>
    </main>
          </div>
  );
}
