export const dynamic = "force-dynamic";
import Image from "next/image";
import Link from "next/link";
import AnimatedWord from "@/components/ui/AnimatedWord";
import JoinTheClub from "@/components/ui/JoinTheClub";
import AddToCartButton from "@/features/products/components/AddToCartButton";
import ProductImage from "@/components/ui/ProductImage";
import { getApiBaseUrl } from "@/config/siteConfig";

interface Product {
  id: number;
  title: string;
  unit_price: number;
  discount_percent?: number;
  discounted_price?: number;
  inventory: number;
  description?: string;
  images?: { id?: number; image: string }[];
}

const TruckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
    <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
    <circle cx="7" cy="18" r="2" />
    <path d="M15 18H9" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);
const ShieldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const DiamondIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3h12l4 6-10 13L2 9Z" />
    <path d="M11 3 8 9l4 13" />
    <path d="M12 22 16 9l-3-6" />
  </svg>
);

interface Collection {
  id: number;
  title: string;
  image?: string | null;
}

export default async function Home() {
  const apiBaseUrl = getApiBaseUrl();
  let trendingProducts: Product[] = [];
  let featuredCollections: Collection[] = [];

  try {
    const res = await fetch(`${apiBaseUrl}/store/products/`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const products: Product[] = Array.isArray(data)
        ? data
        : data.results || [];
      trendingProducts = products.filter((p: any) => p.is_trending).slice(0, 4);
    }
  } catch (err) {
    console.error("Failed to fetch trending products:", err);
  }

  try {
    const colRes = await fetch(`${apiBaseUrl}/store/collections/`, {
      cache: "no-store",
    });
    if (colRes.ok) {
      const colData = await colRes.json();
      const collections: Collection[] = Array.isArray(colData)
        ? colData
        : colData.results || [];
      featuredCollections = collections.filter((c: any) => c.is_featured).slice(0, 3);
    }
  } catch (err) {
    console.error("Failed to fetch collections:", err);
  }

  const getCollectionImageUrl = (col: Collection) => {
    if (col.image) {
      if (col.image.startsWith("http://") || col.image.startsWith("https://")) {
        return col.image;
      }
      return `${apiBaseUrl}${col.image.startsWith("/") ? "" : "/"}${col.image}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-24 bg-background text-foreground font-sans transition-colors duration-300">
      {/* Top Banner Image*/}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 pt-6">
        <Link href="/gift-cards" className="block w-full rounded-[2rem] overflow-hidden shadow-lg border border-foreground/10 group flex justify-center bg-secondary cursor-pointer">
          <Image
            src="/Banners/Banner.png"
            alt="Special Promotion Banner"
            width={1400}
            height={500}
            priority
            unoptimized
            className="w-full h-auto object-contain rounded-[2rem] group-hover:scale-[1.01] transition-transform duration-500"
          />
        </Link>
      </div>

      {/* Bento Box Hero Section */}
      <section className="relative w-full pt-8 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4 md:gap-6 w-full h-full">
          {/* Main Large Bento Item (Text & Main CTA) */}
          <div className="md:col-span-2 md:row-span-2 bg-secondary rounded-[2rem] p-8 md:p-12 flex flex-col justify-center relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500 border border-foreground/10 min-h-[360px] md:min-h-0 text-foreground">
            <div className="absolute top-10 right-10 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="120"
                height="120"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3h12l4 6-10 13L2 9Z" />
                <path d="M11 3 8 9l4 13" />
                <path d="M12 22 16 9l-3-6" />
              </svg>
            </div>
            <span className="bg-accent/20 text-foreground text-[10px] font-bold px-3 py-1 mb-8 inline-block uppercase tracking-widest rounded-md self-start">
              New Collection
            </span>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tighter mb-6 uppercase z-10">
              Elevate <br /> Your <AnimatedWord />
            </h1>
            <p className="text-base font-semibold opacity-90 max-w-sm mb-10 text-foreground leading-relaxed z-10">
              Experience the intersection of high-end streetwear and premium
              digital aesthetics.
            </p>
            <div className="flex gap-4 z-10">
              <Link
                href="/collections"
                className="bg-button-bg text-button-fg px-6 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2 duration-300"
              >
                Explore Collection
              </Link>
            </div>
          </div>

          {/* Top Right Bento Item (Discover the Vibe) */}
          <div className="md:col-span-2 md:row-span-1 bg-primary rounded-[2rem] p-8 md:p-10 relative overflow-hidden flex flex-col justify-center group shadow-xl hover:shadow-2xl transition-all duration-500 min-h-[220px] md:min-h-0">
            <Image
              src="/HomePage/Fashion.jpg"
              alt="Discover"
              fill
              className="object-cover opacity-15 mix-blend-overlay group-hover:opacity-30 group-hover:scale-105 transition-all duration-700"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none"></div>
            <h2 className="text-3xl md:text-4xl font-black mb-3 uppercase tracking-tight relative z-10 text-background dark:text-foreground">
              Discover the Vibe
            </h2>
            <p className="text-sm font-semibold opacity-95 mb-8 leading-relaxed relative z-10 max-w-md text-background dark:text-foreground">
              Collect exclusive pieces and immerse yourself in the next wave of
              streetwear.
            </p>
            <div className="flex gap-4 relative z-10">
              <Link
                href="/products"
                className="bg-background text-primary dark:bg-accent dark:text-foreground px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all hover:-translate-y-0.5 duration-300 inline-flex justify-center items-center shadow-lg"
              >
                View Exclusives
              </Link>
            </div>
          </div>

          {/* Middle Right Item 1 (Beauty) */}
          <Link
            href="/collections/3"
            className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm border border-foreground/10 flex items-center justify-center group hover:shadow-xl transition-all duration-500 min-h-[220px] md:min-h-0"
          >
            <Image
              src="/HomePage/Beauty.webp"
              alt="Beauty"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
              <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                BEAUTY
              </span>
            </div>
          </Link>

          {/* Middle Right Item 2 (24/7 Global Drops) */}
          <div className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm border border-foreground/10 flex items-center justify-center group hover:shadow-xl transition-all duration-500 min-h-[220px] md:min-h-0">
            <Image
              src="/HomePage/24-7.jpg"
              alt="24/7 Global Drops"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-black/5 dark:bg-black/25 pointer-events-none transition-colors duration-500"></div>
          </div>

          {/* Bottom Row Item 1 (Fast Delivery) */}
          <div className="md:col-span-1 md:row-span-1 bg-accent/20 rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-500 flex items-end min-h-[220px] md:min-h-0">
            <Image
              src="/HomePage/Delivery.jpg"
              alt="Fast Delivery"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
            <div className="group-hover:-translate-y-1 transition-transform duration-500 relative z-10">
              <div className="text-xl font-black uppercase tracking-tight mb-1 drop-shadow-md">
                Fast Delivery
              </div>
            </div>
          </div>

          {/* Bottom Row Item 2 (Cleaning) */}
          <Link
            href="/collections/4"
            className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm border border-foreground/10 flex items-center justify-center group hover:shadow-xl transition-all duration-500 min-h-[220px] md:min-h-0"
          >
            <Image
              src="/HomePage/Cleaning.webp"
              alt="Cleaning"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
              <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                CLEANING
              </span>
            </div>
          </Link>

          {/* Bottom Row Item 3 (Pets) */}
          <Link
            href="/collections/6"
            className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm border border-foreground/10 flex items-center justify-center group hover:shadow-xl transition-all duration-500 min-h-[220px] md:min-h-0"
          >
            <Image
              src="/HomePage/Pet.jpg"
              alt="Pets"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
              <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                PETS
              </span>
            </div>
          </Link>

          {/* Bottom Row Item 4 (Stationary) */}
          <Link
            href="/collections/5"
            className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm border border-foreground/10 flex items-center justify-center group hover:shadow-xl transition-all duration-500 min-h-[220px] md:min-h-0"
          >
            <Image
              src="/HomePage/Stationary.jpg"
              alt="Stationary"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
              <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                STATIONARY
              </span>
            </div>
          </Link>
        </div>
      </section>

      <main className="pb-24">
        {/* Featured Categories */}
        <section className="max-w-[1400px] mx-auto px-8 md:px-12 mt-32">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              Featured Categories
            </h2>
            <Link
              href="/collections"
              className="px-4 py-2 bg-primary/5 text-foreground border border-foreground/15 hover:bg-primary hover:text-secondary rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm inline-flex items-center gap-1"
            >
              View All
            </Link>
          </div>

          <div className={`grid grid-cols-1 ${featuredCollections.length > 0 ? "lg:grid-cols-3 h-auto lg:h-[600px]" : "grid-cols-1 h-auto"} gap-6`}>
            {featuredCollections.length > 0 ? (
              <>
                {/* 1st Collection: Large Card (Col Span 2) */}
                {featuredCollections[0] && (() => {
                  const imgUrl = getCollectionImageUrl(featuredCollections[0]);
                  return (
                    <Link
                      href={`/collections/${featuredCollections[0].id}`}
                      className="lg:col-span-2 relative rounded-3xl overflow-hidden group cursor-pointer shadow-lg min-h-[400px] bg-secondary flex items-end p-10 border border-foreground/10"
                    >
                      {imgUrl ? (
                        <>
                          <Image
                            src={imgUrl}
                            alt={featuredCollections[0].title}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-primary/10 dark:bg-primary/40 flex items-center justify-center text-foreground/40 font-black text-2xl uppercase tracking-widest p-6 text-center">
                          {featuredCollections[0].title}
                        </div>
                      )}
                      <div className="relative z-20 text-foreground transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                        <span className="bg-accent/20 text-foreground text-xs font-bold px-3 py-1 mb-4 inline-block uppercase tracking-widest rounded-md shadow-md">
                          FEATURED
                        </span>
                        <h3 className={`text-4xl md:text-5xl font-black uppercase tracking-tight drop-shadow-md ${imgUrl ? 'text-white' : 'text-foreground'}`}>
                          {featuredCollections[0].title}
                        </h3>
                      </div>
                    </Link>
                  );
                })()}

                {/* 2nd & 3rd Collections: Small Stacked Cards */}
                {featuredCollections.length > 1 && (
                  <div className="flex flex-col gap-6">
                    {featuredCollections.slice(1, 3).map((col) => {
                      const imgUrl = getCollectionImageUrl(col);
                      return (
                        <Link
                          key={col.id}
                          href={`/collections/${col.id}`}
                          className="flex-1 relative rounded-3xl overflow-hidden group cursor-pointer shadow-lg min-h-[250px] bg-secondary flex items-end p-8 border border-foreground/10"
                        >
                          {imgUrl ? (
                            <>
                              <Image
                                src={imgUrl}
                                alt={col.title}
                                fill
                                unoptimized
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90" />
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-primary/10 dark:bg-primary/40 flex items-center justify-center text-foreground/40 font-black text-xl uppercase tracking-widest p-4 text-center">
                              {col.title}
                            </div>
                          )}
                          <div className="relative z-20 text-foreground transform transition-transform duration-500 group-hover:translate-y-[-3px]">
                            <h3 className={`text-2xl font-bold uppercase tracking-tight drop-shadow-md ${imgUrl ? 'text-white' : 'text-foreground'}`}>
                              {col.title}
                            </h3>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-full py-12 text-center text-sm font-bold uppercase tracking-wider opacity-60">
                No collections available.
              </div>
            )}
          </div>
        </section>

        {/* Trending Now */}
        <section className="max-w-[1400px] mx-auto px-8 md:px-12 mt-32">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              Trending Now
            </h2>
            <Link
              href="/products"
              className="px-4 py-2 bg-primary/5 text-foreground border border-foreground/15 hover:bg-primary hover:text-secondary rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm inline-flex items-center gap-1"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProducts.length > 0 ? (
              trendingProducts.map((product) => {
                const discountPercent = Number(product.discount_percent || 0);
                const hasDiscount = discountPercent > 0;
                const effectivePrice = product.discounted_price !== undefined 
                  ? product.discounted_price 
                  : (hasDiscount ? product.unit_price * (1 - discountPercent / 100) : product.unit_price);

                return (
                  <div
                    key={product.id}
                    className="bg-secondary rounded-2xl p-5 shadow-sm border border-foreground/10 hover:shadow-xl transition-shadow duration-300 group cursor-pointer flex flex-col justify-between"
                  >
                    <Link href={`/products/${product.id}`} className="block">
                      <div className="aspect-square bg-primary/5 dark:bg-primary/40 rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                        {hasDiscount && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600 text-white font-extrabold text-[9px] uppercase tracking-wider shadow-md z-10 flex items-center gap-1">
                            <img src="/discount.png" alt="Discount" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
                            -{Math.round(discountPercent)}% OFF
                          </span>
                        )}
                        <ProductImage
                          title={product.title}
                          images={product.images}
                        />
                      </div>
                      <h4 className="font-bold text-lg text-foreground mb-1 line-clamp-1 group-hover:text-accent transition-colors">
                        {product.title}
                      </h4>
                    </Link>

                    <div>
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-accent font-bold text-lg">
                          ${Number(effectivePrice).toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs line-through opacity-50 font-bold">
                            ${Number(product.unit_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <AddToCartButton
                        productId={product.id}
                        productTitle={product.title}
                        inventory={product.inventory}
                        className="w-full py-3 bg-button-bg text-button-fg rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-sm font-bold uppercase tracking-wider opacity-60">
                No trending products available.
              </div>
            )}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="bg-secondary text-foreground border border-foreground/10 mt-24 mb-16 py-20 px-8 md:px-12 rounded-[3rem] mx-4 md:mx-12 lg:mx-20 shadow-2xl transition-colors duration-300">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-3xl font-black text-center mb-16 uppercase tracking-tighter">
              Why VibeMart?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-accent/20 text-foreground rounded-2xl flex items-center justify-center mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-300 shadow-md">
                  <TruckIcon />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-widest">
                  Fast Shipping
                </h3>
                <p className="opacity-70 leading-relaxed text-sm font-medium">
                  Global expedited delivery ensures you get your gear before the
                  hype dies.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-accent/20 text-foreground rounded-2xl flex items-center justify-center mb-8 transform -rotate-3 hover:rotate-0 transition-transform duration-300 shadow-md">
                  <DiamondIcon />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-widest">
                  Elite Quality
                </h3>
                <p className="opacity-70 leading-relaxed text-sm font-medium">
                  Uncompromising materials and construction. We only sell what
                  we wear.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-accent/20 text-foreground rounded-2xl flex items-center justify-center mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-300 shadow-md">
                  <ShieldIcon />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-widest">
                  Secure Checkout
                </h3>
                <p className="opacity-70 leading-relaxed text-sm font-medium">
                  Encrypted, lightning-fast transactions to secure your limited
                  drops.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Join the Club Section */}
      <JoinTheClub />
    </div>
  );
}
