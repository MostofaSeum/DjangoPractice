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

const CartIcon = () => (
  <Image src="/shopping-cart-white-icon.webp" width={23} height={23} alt="Cart" />
);

export default async function CollectionDetailPage({ params }: PageProps) {
  const { id } = await params;

  const res = await fetch(`http://127.0.0.1:8000/store/collections/${id}/`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-6 font-bold uppercase tracking-widest">Collection not found.</p>
        <Link href="/collections" className="inline-block text-[10px] font-bold tracking-widest uppercase border-b-2 border-[#3a3532] pb-1 hover:opacity-70 transition-opacity">
           Back to Collections
        </Link>
      </div>
    );
  }

  const collection: Collection = await res.json();

  return (
    <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] font-sans antialiased pb-24 selection:bg-[#3a3532] selection:text-[#e6e0d4]">
      {/* Header Navigation */}
      <header className="bg-[#3a3532] text-[#e6e0d4] py-6 px-8 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter uppercase text-[#e6e0d4] hover:opacity-85 transition-opacity">
          VibeMart
        </Link>
        <nav className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-widest text-[#e6e0d4]/80">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/products" className="hover:text-white transition-colors">Shop</Link>
          <Link href="/collections" className="text-white border-b border-white pb-0.5">Collections</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button className="text-[#e6e0d4] hover:text-white transition-colors"><CartIcon /></button>
        </div>
      </header>

      {/* Breadcrumbs */} 
      <div className="bg-[#3a3532]/5 border-b border-[#3a3532]/10 py-4">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 text-xs text-[#3a3532]/60 flex items-center space-x-2 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:text-[#3a3532]">Home</Link>
          <span>/</span>
          <Link href="/collections" className="hover:text-[#3a3532]">Collections</Link>
          <span>/</span>
          <span className="text-[#3a3532]">{collection.title}</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-16">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[#3a3532]/5 mb-16 relative overflow-hidden">
          <span className="text-[10px] text-[#3a3532]/45 font-bold uppercase tracking-widest block mb-2">Collection Detail</span>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#3a3532]">{collection.title}</h1>
        </div>

        <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Products in this Collection</h2>
        {collection.products && collection.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {collection.products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer flex flex-col justify-between">
                <div>
                  <div className="aspect-square bg-[#f4f1eb] rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                    <div className="w-full h-full bg-[#e6e0d4]/50 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                      <span className="text-[#3a3532]/20 font-black text-lg uppercase tracking-widest">
                        {product.title.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-[#3a3532] mb-1 line-clamp-1">{product.title}</h3>
                  <p className="text-[#3a3532]/60 text-xs line-clamp-2 mb-4 leading-relaxed">{product.description || 'No description available'}</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[#8b7a66] font-bold text-lg">${Number(product.unit_price).toFixed(2)}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/45">Qty: {product.inventory}</span>
                  </div>
                  <Link 
                    href={`/products/${product.id}`}
                    className="w-full py-3 border-2 border-[#3a3532] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#3a3532] hover:text-[#e6e0d4] transition-colors flex items-center justify-center gap-2"
                  >
                    <CartIcon /> View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#3a3532]/60 font-bold uppercase tracking-wider text-sm">No products found in this collection.</p>
        )}
      </main>
    </div>
  );
}
