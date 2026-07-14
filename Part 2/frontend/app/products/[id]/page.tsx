import Link from 'next/link';
import ProductInteractive from './ProductInteractive';

interface Product {
  id: number;
  title: string;
  unit_price: number;
  description: string;
  collection: number | { id: number; title: string };
}

interface CollectionDetail {
  id: number;
  title: string;
  products: Product[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch product detail
  const res = await fetch(`http://127.0.0.1:8000/store/products/${id}/`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return (
      <div className="max-w-md mx-auto p-12 text-center">
        <p className="text-red-500 mb-6 font-semibold">Product not found.</p>
        <Link 
          href="/products" 
          className="px-6 py-2 border border-zinc-300 rounded hover:bg-zinc-50 transition-colors text-sm font-medium"
        >
          Back to Catalog
        </Link>
      </div>
    );
  }

  const product: Product = await res.json();

  // Determine collection ID
  const collectionId =
    typeof product.collection === 'object' && product.collection !== null
      ? product.collection.id
      : product.collection;

  // Fetch collection detail to get related products and collection name
  let collectionData: CollectionDetail | null = null;
  if (collectionId) {
    try {
      const collectionRes = await fetch(
        `http://127.0.0.1:8000/store/collections/${collectionId}/`,
        { cache: 'no-store' }
      );
      if (collectionRes.ok) {
        collectionData = await collectionRes.json();
      }
    } catch (err) {
      console.error('Error fetching collection data:', err);
    }
  }

  const collectionTitle = collectionData?.title || 'Undefined';
  const relatedProducts = (collectionData?.products || [])
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

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
            <Link href="#" className="hover:text-red-500 transition-colors">Blog</Link>
            <Link href="#" className="hover:text-red-500 transition-colors">Portfolio</Link>
            <Link href="#" className="hover:text-red-500 transition-colors">Pages</Link>
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
          <span>/</span>
          <span className="hover:text-zinc-800 capitalize cursor-pointer">{collectionTitle}</span>
          <span>/</span>
          <span className="text-red-500 font-medium truncate max-w-[200px] sm:max-w-none">{product.title}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Product Area Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Left Column: Product Images (Placeholder Mode) */}
          <div className="space-y-4">
            <div className="aspect-[4/5] w-full rounded border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center p-6 text-center shadow-sm">
              {/* Box illustrating where the image will be */}
              <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700 mb-1">Image Placeholder</p>
              <p className="text-xs text-zinc-400 max-w-xs">
                Alt Text: Image of <span className="font-semibold text-zinc-500">{product.title}</span> showing the product features.
              </p>
            </div>

            {/* Thumbnail Placeholders */}
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square w-full rounded border border-zinc-200 bg-zinc-50 flex items-center justify-center p-2 text-center text-[10px] text-zinc-400 font-medium">
                  Alt {i}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Product Info */}
          <div className="flex flex-col justify-start">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Ratings Placeholder (Skipping Reviews Count but keeping styling clean) */}
            <div className="flex items-center space-x-1 mt-3 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-xs text-zinc-400 pl-2 font-medium">(0 Customer Reviews)</span>
            </div>

            {/* Price */}
            <p className="text-2xl font-bold text-red-500 mb-6">
              ${Number(product.unit_price).toFixed(2)}
            </p>

            {/* Short Description */}
            <p className="text-zinc-600 leading-relaxed text-sm mb-6">
              {product.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.'}
            </p>

            <hr className="border-zinc-100 my-2" />

            {/* Quantity Selector & Add to Cart Client Area */}
            <ProductInteractive productTitle={product.title} />

            <hr className="border-zinc-100 my-2" />

            {/* Additional details (Collection, Tag, Share) */}
            <div className="space-y-2 mt-4 text-xs font-semibold tracking-wide text-zinc-600">
              <div>
                <span className="text-zinc-400 font-medium mr-2">Categories:</span>
                <span className="hover:text-red-500 cursor-pointer capitalize">{collectionTitle}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-medium mr-2">Tag:</span>
                <span className="hover:text-red-500 cursor-pointer capitalize">{collectionTitle}</span>
              </div>
            </div>
          </div>
        </div>


        {/* Tab section: Only description */}
        <div className="mt-16 border-t border-zinc-100 pt-8">
          <div className="flex space-x-8 border-b border-zinc-100 pb-4 mb-6">
            <button className="text-sm font-bold uppercase tracking-wider text-red-500 border-b-2 border-red-500 pb-4 -mb-[18px]">
              Description
            </button>
          </div>
          <div className="text-sm text-zinc-600 leading-loose max-w-4xl">
            <p className="mb-4">
              {product.description}
            </p>
          </div>
        </div>


        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold uppercase tracking-wider text-zinc-900">
                Related products
              </h2>
              <div className="w-12 h-1 bg-red-500 mx-auto mt-3 rounded"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <Link key={item.id} href={`/products/${item.id}`} className="group block">
                  <div className="aspect-[3/4] w-full rounded border border-zinc-100 bg-zinc-50 flex flex-col items-center justify-center p-4 text-center group-hover:shadow-md transition duration-200">
                    <span className="text-[10px] text-zinc-400 font-medium">Image of {item.title}</span>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-[10px] uppercase text-zinc-400 tracking-wider font-semibold">
                      {collectionTitle}
                    </p>
                    <h3 className="text-xs font-bold text-zinc-800 mt-1 group-hover:text-red-500 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-center space-x-1 my-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm font-bold text-zinc-900 mt-1">
                      ${Number(item.unit_price).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}