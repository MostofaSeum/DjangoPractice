import Link from 'next/link';

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
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Product Catalog</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <div key={product.id} className="border p-4 rounded-lg shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold">{product.title}</h2>
            <p className="text-gray-600 mb-4">${product.unit_price}</p>
            <Link 
              href={`/products/${product.id}`}
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
