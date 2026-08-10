import Link from 'next/link';
import Image from 'next/image';
import ProductImage from '@/components/ui/ProductImage';
import AddToCartButton from '@/features/products/components/AddToCartButton';

interface Product {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  inventory: number;
  unit_price: string;
  price_with_tax: number;
  images?: Array<{ id?: number; image: string }>;
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

import { getApiBaseUrl } from "@/config/siteConfig";

export default async function CollectionDetailPage({ params }: PageProps) {
  const { id } = await params;

  const apiBaseUrl = getApiBaseUrl();
  const res = await fetch(`${apiBaseUrl}/store/collections/${id}/`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-6 font-bold uppercase tracking-widest">Collection not found.</p>
        <Link href="/collections" className="inline-block text-[10px] font-bold tracking-widest uppercase border-b-2 border-current pb-1 hover:opacity-70 transition-opacity">
           Back to Collections
        </Link>
      </div>
    );
  }

  const collection: Collection = await res.json();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-24 transition-colors duration-300">

      {/* Breadcrumbs */} 
      <div className="bg-primary text-background dark:text-foreground border-b border-white/5 py-4 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs flex items-center space-x-2.5 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="opacity-50">/</span>
          <Link href="/collections" className="hover:underline">Collections</Link>
          <span className="opacity-50">/</span>
          <span className="opacity-80">{collection.title}</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-16">
        <div className="bg-secondary text-foreground rounded-3xl p-8 md:p-12 shadow-sm border border-foreground/10 mb-16 relative overflow-hidden transition-colors duration-300">
          <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest block mb-2">Collection Detail</span>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">{collection.title}</h1>
        </div>

        <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Products in this Collection</h2>
        {collection.products && collection.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {collection.products.map((product) => (
              <div key={product.id} className="bg-secondary text-foreground rounded-2xl p-5 shadow-sm border border-foreground/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="aspect-square bg-secondary rounded-xl mb-6 flex items-center justify-center overflow-hidden relative border border-foreground/10 group-hover:scale-[1.02] transition-transform duration-300">
                    <ProductImage title={product.title} images={product.images} />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1 group-hover:text-accent transition-colors">{product.title}</h3>
                  <p className="opacity-70 text-xs line-clamp-2 mb-4 leading-relaxed">{product.description || 'No description available'}</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-accent font-extrabold text-lg">${Number(product.unit_price).toFixed(2)}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Qty: {product.inventory}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link 
                      href={`/products/${product.id}`}
                      className="py-2.5 px-2 border border-current text-foreground rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-button-bg hover:text-button-fg transition-colors flex items-center justify-center text-center"
                    >
                      View Details
                    </Link>
                    <AddToCartButton
                      productId={product.id}
                      productTitle={product.title}
                      inventory={product.inventory}
                      className="py-2.5 px-2 bg-button-bg text-button-fg rounded-xl font-bold text-[10px] uppercase tracking-wider hover:opacity-90 transition-colors flex items-center justify-center gap-1 text-center"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="opacity-60 font-bold uppercase tracking-wider text-sm">No products found in this collection.</p>
        )}
      </main>
    </div>
  );
}
