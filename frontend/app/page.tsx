import Image from "next/image";
import Link from "next/link";
import AnimatedWord from "./components/AnimatedWord";

const CartIcon = () => (
  <Image src="/shopping-cart-white-icon.webp" width={23} height={23} alt="Cart" />
);

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

export default function Home() {
  return (
    <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] font-sans selection:bg-[#3a3532] selection:text-[#e6e0d4]">
      {/* Navbar overlaying hero */}
      <header className="absolute top-0 w-full z-50 py-8 px-8 md:px-12 flex justify-center items-center">
        <div className="max-w-[1400px] w-full flex justify-between items-center relative">
          <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter text-[#3a3532] uppercase z-10">
            VibeMart
          </Link>
          <nav className="hidden md:flex gap-8 text-[11px] font-bold text-[#3a3532] uppercase tracking-widest absolute left-1/2 -translate-x-1/2">
            <Link href="/products" className="hover:opacity-60 transition-opacity border-b-2 border-[#3a3532] pb-1">
              Shop
            </Link>
            <Link href="/collections" className="hover:opacity-60 transition-opacity pb-1">
              Collections
            </Link>
          </nav>
          <div className="flex justify-end items-center gap-6 z-10">
            <button className="text-[#3a3532] hover:opacity-70 transition-opacity hover:scale-110 duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            </button>
            <button className="border-2 border-[#3a3532] text-[#3a3532] px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#3a3532] hover:text-[#e6e0d4] transition-colors rounded-xl">
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Bento Box Hero Section */}
      <section className="relative w-full min-h-screen pt-32 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4 md:gap-6 w-full h-full min-h-[600px]">
          
          {/* Main Large Bento Item (Text & Main CTA) */}
          <div className="md:col-span-2 md:row-span-2 bg-white rounded-[2rem] p-8 md:p-12 flex flex-col justify-center relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500 border border-[#3a3532]/5">
            <div className="absolute top-10 right-10 text-[#3a3532]/5 group-hover:scale-125 group-hover:rotate-12 group-hover:text-[#3a3532]/10 transition-all duration-700">
               <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13"/><path d="M12 22 16 9l-3-6"/></svg>
            </div>
            <span className="bg-[#e6e0d4] text-[#3a3532] text-[10px] font-bold px-3 py-1 mb-8 inline-block uppercase tracking-widest rounded-md self-start border border-[#3a3532]/10">
              New Collection
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#3a3532] leading-[0.9] tracking-tighter mb-6 uppercase z-10">
              Elevate <br /> Your <AnimatedWord />
            </h1>
            <p className="text-base text-[#3a3532]/70 max-w-sm mb-10 font-medium leading-relaxed z-10">
              Experience the intersection of high-end streetwear and premium digital aesthetics.
            </p>
            <div className="flex gap-4 z-10">
              <Link href="/collections" className="bg-[#3a3532] text-[#e6e0d4] px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#524b47] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2 duration-300">
                Explore Collection
              </Link>
            </div>
          </div>

          {/* Top Right Bento Item (Discover the Vibe) */}
          <div className="md:col-span-2 md:row-span-1 bg-[#3a3532] rounded-[2rem] p-8 md:p-10 text-[#e6e0d4] relative overflow-hidden flex flex-col justify-center group shadow-xl hover:shadow-2xl transition-all duration-500">
             <Image src="/homepage/Fashion.jpg" alt="Discover" fill className="object-cover opacity-20 mix-blend-overlay group-hover:opacity-40 group-hover:scale-105 transition-all duration-700" unoptimized />
             <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#e6e0d4]/10 pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity duration-500"></div>
             <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-700 group-hover:scale-150"></div>
             <h2 className="text-3xl font-black mb-3 uppercase tracking-tight relative z-10">
              Discover the Vibe
             </h2>
             <p className="text-sm text-[#e6e0d4]/70 mb-8 leading-relaxed relative z-10 max-w-md">
              Collect exclusive pieces and immerse yourself in the next wave of streetwear.
             </p>
             <div className="flex gap-4 relative z-10">
               <Link href="/products" className="bg-[#8b7a66] text-[#e6e0d4] px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#a39079] transition-all hover:-translate-y-0.5 duration-300 inline-flex justify-center items-center shadow-lg">
                 View Exclusives
               </Link>
             </div>
          </div>

          {/* Middle Right Item 1 (Beauty) */}
          <div className="md:col-span-1 md:row-span-1 bg-white rounded-[2rem] relative overflow-hidden shadow-sm border border-[#3a3532]/5 flex items-center justify-center group hover:shadow-xl transition-all duration-500">
             <Image src="/homepage/Beauty.webp" alt="Beauty" fill className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
             <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">BEAUTY</span>
             </div>
          </div>

          {/* Middle Right Item 2 (24/7 Global Drops) */}
          <div className="md:col-span-1 md:row-span-1 bg-white rounded-[2rem] relative overflow-hidden shadow-sm border border-[#3a3532]/5 flex items-center justify-center group hover:shadow-xl transition-all duration-500">
             <Image src="/homepage/24-7.jpg" alt="24/7 Global Drops" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
          </div>

          {/* Bottom Row Item 1 (Fast Delivery) */}
          <div className="md:col-span-1 md:row-span-1 bg-[#8b7a66] rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden group shadow-md hover:shadow-xl transition-all duration-500 flex items-end">
             <Image src="/homepage/Delivery.jpg" alt="Fast Delivery" fill className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
             <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
             <div className="absolute top-6 right-6 opacity-20 transform group-hover:rotate-12 group-hover:scale-150 group-hover:opacity-40 transition-all duration-500 z-10">
             </div>
             <div className="group-hover:-translate-y-1 transition-transform duration-500 relative z-10">
               <div className="text-xl font-black uppercase tracking-tight mb-1 drop-shadow-md">Fast Delivery</div>
               <div className="text-[10px] font-bold uppercase tracking-widest text-white/90 group-hover:text-white transition-colors drop-shadow-sm">Worldwide Shipping</div>
             </div>
          </div>

          {/* Bottom Row Item 2 (Cleaning) */}
          <div className="md:col-span-1 md:row-span-1 bg-white rounded-[2rem] relative overflow-hidden shadow-sm border border-[#3a3532]/5 flex items-center justify-center group hover:shadow-xl transition-all duration-500">
             <Image src="/homepage/Cleaning.webp" alt="Cleaning" fill className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
             <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">CLEANING</span>
             </div>
          </div>

          {/* Bottom Row Item 3 (Pets) */}
          <div className="md:col-span-1 md:row-span-1 bg-white rounded-[2rem] relative overflow-hidden shadow-sm border border-[#3a3532]/5 flex items-center justify-center group hover:shadow-xl transition-all duration-500">
             <Image src="/homepage/Pet.jpg" alt="Pets" fill className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
             <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">PETS</span>
             </div>
          </div>

          {/* Bottom Row Item 4 (Stationary) */}
          <div className="md:col-span-1 md:row-span-1 bg-white rounded-[2rem] relative overflow-hidden shadow-sm border border-[#3a3532]/5 flex items-center justify-center group hover:shadow-xl transition-all duration-500">
             <Image src="/homepage/Stationary.jpg" alt="Stationary" fill className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
             <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">STATIONARY</span>
             </div>
          </div>

        </div>
      </section>

      <main className="pb-24">
        {/* Featured Categories (VibeMart layout) */}
        <section className="max-w-[1400px] mx-auto px-8 md:px-12 mt-32">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              Featured Categories
            </h2>
            <Link
              href="/collections"
              className="text-xs font-bold uppercase tracking-widest text-[#8b7a66] hover:text-[#3a3532] transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[600px]">
            {/* Large Card (Grocery) */}
            <Link href="/collections" className="lg:col-span-2 relative rounded-3xl overflow-hidden group cursor-pointer shadow-lg min-h-[400px]">
              <Image src="/homepage/Grocery.png" alt="Grocery" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90" />
              <div className="absolute bottom-10 left-10 z-20 text-white transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                <span className="bg-[#e6e0d4] text-[#3a3532] text-xs font-bold px-3 py-1 mb-4 inline-block uppercase tracking-widest rounded-md shadow-md">
                  POPULAR
                </span>
                <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight drop-shadow-md">
                  Grocery Essentials
                </h3>
              </div>
            </Link>

            {/* Small Stacked Cards (Toys & Magazines) */}
            <div className="flex flex-col gap-6">
              {/* Toys Card */}
              <Link href="/collections" className="flex-1 relative rounded-3xl overflow-hidden group cursor-pointer shadow-lg min-h-[250px]">
                <Image src="/homepage/Toysjpg.jpg" alt="Toys" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90" />
                <div className="absolute bottom-8 left-8 z-20 text-white transform transition-transform duration-500 group-hover:translate-y-[-3px]">
                  <h3 className="text-2xl font-bold uppercase tracking-tight drop-shadow-md">
                    Toys & Fun
                  </h3>
                </div>
              </Link>

              {/* Magazines Card */}
              <Link href="/collections" className="flex-1 relative rounded-3xl overflow-hidden group cursor-pointer shadow-lg min-h-[250px]">
                <Image src="/homepage/Magazines.jpg" alt="Magazines" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90" />
                <div className="absolute bottom-8 left-8 z-20 text-white transform transition-transform duration-500 group-hover:translate-y-[-3px]">
                  <h3 className="text-2xl font-bold uppercase tracking-tight drop-shadow-md">
                    Magazines & Reads
                  </h3>
                </div>
              </Link>
            </div>
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
              className="text-xs font-bold uppercase tracking-widest text-[#8b7a66] hover:text-[#3a3532] transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Product Card 1 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer">
              <div className="aspect-square bg-[#f4f1eb] rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                <div className="w-full h-full bg-[#e6e0d4]/50 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                  <span className="text-[#3a3532]/20 font-black text-xl uppercase tracking-widest">
                    HOODIE
                  </span>
                </div>
              </div>
              <h4 className="font-bold text-lg mb-1">Neon Void Hoodie</h4>
              <p className="text-[#8b7a66] font-bold mb-6">$129</p>
              <button className="w-full py-3 border-2 border-[#3a3532] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#3a3532] hover:text-[#e6e0d4] transition-colors flex items-center justify-center gap-2">
                <CartIcon /> Add to Cart
              </button>
            </div>

            {/* Product Card 2 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer relative">
              <span className="absolute top-8 left-8 bg-[#cc5555] text-white text-[10px] font-bold px-2 py-1 rounded-sm z-10 uppercase tracking-widest">
                Sale
              </span>
              <div className="aspect-square bg-[#f4f1eb] rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                <div className="w-full h-full bg-[#e6e0d4]/50 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                  <span className="text-[#3a3532]/20 font-black text-xl uppercase tracking-widest">
                    BAG
                  </span>
                </div>
              </div>
              <h4 className="font-bold text-lg mb-1">Stealth Messenger</h4>
              <p className="font-bold mb-6 flex items-center gap-3">
                <span className="text-[#cc5555]">$89</span>
                <span className="line-through text-[#3a3532]/40 text-sm">
                  $110
                </span>
              </p>
              <button className="w-full py-3 border-2 border-[#3a3532] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#3a3532] hover:text-[#e6e0d4] transition-colors flex items-center justify-center gap-2">
                <CartIcon /> Add to Cart
              </button>
            </div>

            {/* Product Card 3 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer">
              <div className="aspect-square bg-[#f4f1eb] rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                <div className="w-full h-full bg-[#e6e0d4]/50 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                  <span className="text-[#3a3532]/20 font-black text-xl uppercase tracking-widest">
                    SHADES
                  </span>
                </div>
              </div>
              <h4 className="font-bold text-lg mb-1">Flux Shades</h4>
              <p className="text-[#8b7a66] font-bold mb-6">$175</p>
              <button className="w-full py-3 border-2 border-[#3a3532] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#3a3532] hover:text-[#e6e0d4] transition-colors flex items-center justify-center gap-2">
                <CartIcon /> Add to Cart
              </button>
            </div>

            {/* Product Card 4 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer">
              <div className="aspect-square bg-[#f4f1eb] rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                <div className="w-full h-full bg-[#e6e0d4]/50 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                  <span className="text-[#3a3532]/20 font-black text-xl uppercase tracking-widest">
                    TEE
                  </span>
                </div>
              </div>
              <h4 className="font-bold text-lg mb-1">Echo Graphic Tee</h4>
              <p className="text-[#8b7a66] font-bold mb-6">$55</p>
              <button className="w-full py-3 border-2 border-[#3a3532] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#3a3532] hover:text-[#e6e0d4] transition-colors flex items-center justify-center gap-2">
                <CartIcon /> Add to Cart
              </button>
            </div>
          </div>
        </section>

        {/* Why Choose Us (VibeMart footer-pre-section) */}
        <section className="bg-[#3a3532] text-[#e6e0d4] mt-32 py-24 px-8 md:px-12 rounded-t-[3rem] mx-4 md:mx-12 lg:mx-20 shadow-2xl">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-3xl font-black text-center mb-16 uppercase tracking-tighter">
              Why VibeMart?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-[#e6e0d4]/5 rounded-2xl flex items-center justify-center mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-300 border border-[#e6e0d4]/10">
                  <TruckIcon />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-widest">
                  Fast Shipping
                </h3>
                <p className="text-[#e6e0d4]/60 leading-relaxed text-sm font-medium">
                  Global expedited delivery ensures you get your gear before the
                  hype dies.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-[#e6e0d4]/5 rounded-2xl flex items-center justify-center mb-8 transform -rotate-3 hover:rotate-0 transition-transform duration-300 border border-[#e6e0d4]/10">
                  <DiamondIcon />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-widest">
                  Elite Quality
                </h3>
                <p className="text-[#e6e0d4]/60 leading-relaxed text-sm font-medium">
                  Uncompromising materials and construction. We only sell what
                  we wear.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-[#e6e0d4]/5 rounded-2xl flex items-center justify-center mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-300 border border-[#e6e0d4]/10">
                  <ShieldIcon />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-widest">
                  Secure Checkout
                </h3>
                <p className="text-[#e6e0d4]/60 leading-relaxed text-sm font-medium">
                  Encrypted, lightning-fast transactions to secure your limited drops.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Join the Club Section */}
      <section className="bg-white py-24 px-8 md:px-12 mx-4 md:mx-12 lg:mx-20 rounded-[3rem] shadow-xl border border-[#3a3532]/5 mb-32 flex flex-col items-center text-center relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 opacity-5 transform group-hover:rotate-12 transition-transform duration-700 pointer-events-none group-hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13"/><path d="M12 22 16 9l-3-6"/></svg>
         </div>
         <h2 className="text-4xl md:text-5xl font-black text-[#3a3532] uppercase tracking-tighter mb-4 relative z-10">Join the Club</h2>
         <p className="text-sm md:text-base text-[#3a3532]/60 font-medium mb-10 max-w-md relative z-10">Get early access to exclusive drops, members-only events, and behind-the-scenes content.</p>
         <div className="flex gap-2 w-full max-w-md relative z-10">
           <input type="email" placeholder="ENTER YOUR EMAIL" className="flex-1 bg-[#f4f1eb] border-none rounded-2xl px-6 py-4 text-xs font-bold text-[#3a3532] placeholder:text-[#3a3532]/40 outline-none focus:ring-2 focus:ring-[#8b7a66] transition-shadow" />
           <button className="bg-[#3a3532] text-[#e6e0d4] px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#524b47] transition-all flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-0.5 duration-300">
             Subscribe
           </button>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2a2624] text-[#e6e0d4]/50 py-16 px-8 md:px-12">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-3xl font-black tracking-tighter text-[#e6e0d4] uppercase">
            VibeMart
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-[#e6e0d4] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-[#e6e0d4] transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-[#e6e0d4] transition-colors">
              Shipping Info
            </a>
            <a href="#" className="hover:text-[#e6e0d4] transition-colors">
              Returns
            </a>
            <a href="#" className="hover:text-[#e6e0d4] transition-colors">
              Contact Us
            </a>
          </div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-center md:text-left">
            &copy; 2026 VIBEMART. ELECTRIC PREMIUM
            <br /> WORLDWIDE.
          </div>
        </div>
      </footer>
    </div>
  );
}
