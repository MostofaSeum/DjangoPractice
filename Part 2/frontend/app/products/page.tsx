import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: number;
  title: string;
  unit_price: number;
  description: string;
}

const CartIcon = () => (
  <Image src="/shopping-cart-white-icon.webp" width={23} height={23} alt="Cart" />
);

export default async function ProductsPage() {
  const res = await fetch('http://127.0.0.1:8000/store/products/', {
    cache: 'no-store',
  });

  if (!res.ok) {
    return <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] p-8 text-center font-bold">Failed to load products.</div>;
  }

  const data = await res.json();
  const products: Product[] = Array.isArray(data) ? data : (data.results || []);

  return (
    <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] font-sans antialiased pb-24 selection:bg-[#3a3532] selection:text-[#e6e0d4]">
      {/* Header Navigation */}
      <header className="bg-[#3a3532] text-[#e6e0d4] py-6 px-8 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter uppercase text-[#e6e0d4] hover:opacity-85 transition-opacity">
          VibeMart
        </Link>
        <nav className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-widest text-[#e6e0d4]/80">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/products" className="text-white border-b border-white pb-0.5">Shop</Link>
          <Link href="/collections" className="hover:text-white transition-colors">Collections</Link>
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
          <span className="text-[#3a3532]">Shop</span>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-16">
        <h1 className="text-4xl font-black mb-10 uppercase tracking-tighter">Product Catalog</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer flex flex-col justify-between">
              <div>
                <div className="aspect-square bg-[#f4f1eb] rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                  <div className="w-full h-full bg-[#e6e0d4]/50 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                    <span className="text-[#3a3532]/20 font-black text-lg uppercase tracking-widest">
                      {product.title.split(' ')[0]}
                    </span>
                  </div>
                </div>
                <h2 className="font-bold text-lg text-[#3a3532] mb-1 line-clamp-1">{product.title}</h2>
                <p className="text-[#3a3532]/60 text-xs line-clamp-2 mb-4 leading-relaxed">{product.description || 'No description available'}</p>
              </div>
              <div>
                <p className="text-[#8b7a66] font-bold text-lg mb-6">${Number(product.unit_price).toFixed(2)}</p>
                <Link 
                  href={`/products/${product.id}`}
                  className="w-full py-3 border-2 border-[#3a3532] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#3a3532] hover:text-[#e6e0d4] transition-colors flex items-center justify-center gap-2"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
