import Link from 'next/link';

interface Product {
  id: number;
  title: string;
  unit_price: number;
  description: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  const res = await fetch(`http://127.0.0.1:8000/store/products/${id}/`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <p className="text-red-500 mb-4 font-semibold">Product not found.</p>
        <Link href="/products" className="text-blue-500 hover:underline">
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  const product: Product = await res.json();

  return (
    <main className="max-w-2xl mx-auto p-8">
      <Link href="/products" className="text-blue-500 hover:underline mb-6 block">
        ← Back to Catalog
      </Link>
      <div className="border p-6 rounded-xl shadow-lg bg-white dark:bg-zinc-900">
        <span className="text-xs text-gray-400 font-mono">ID: {product.id}</span>
        <h1 className="text-4xl font-extrabold my-2">{product.title}</h1>
        <p className="text-2xl text-green-600 font-bold mb-4">${product.unit_price}</p>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {product.description || "No description provided for this product."}
        </p>
      </div>
    </main>
  );
}
