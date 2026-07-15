import Image from "next/image";
import Link from "next/link";

// Simple SVG Icons
const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
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
      {/* Hero Section with Split Background*/}
      <section className="relative w-full h-screen min-h-[600px] flex items-center">
        {/* Background Split */}
        <div className="absolute inset-0 flex">
          <div className="w-[60%] bg-[#e6e0d4]"></div>
          <div className="w-[40%] bg-[#3a3532]"></div>
        </div>

        {/* Navbar overlaying hero */}
        <header className="absolute top-0 w-full z-50 py-8 px-8 md:px-12 flex justify-between items-center">
          {/* Left/Middle */}
          <div className="w-[60%] flex items-center justify-between pr-4 md:pr-12">
            <div className="text-xl md:text-2xl font-black tracking-tighter text-[#3a3532] uppercase">
              VibeMart
            </div>
            <nav className="hidden md:flex gap-8 text-[11px] font-bold text-[#3a3532] uppercase tracking-widest">
              <a href="#" className="hover:opacity-60 transition-opacity border-b-2 border-[#3a3532] pb-1">
                Shop
              </a>
              <a href="#" className="hover:opacity-60 transition-opacity pb-1">
                Drops
              </a>
              <a href="#" className="hover:opacity-60 transition-opacity pb-1">
                Exclusives
              </a>
            </nav>
          </div>
          {/* Right (over dark) */}
          <div className="w-[40%] flex justify-end items-center gap-6 pl-4 md:pl-12">
            <button className="text-[#e6e0d4] hover:opacity-70 transition-opacity">
              <CartIcon />
            </button>
            <button className="border border-[#e6e0d4]/30 text-[#e6e0d4] px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#e6e0d4] hover:text-[#3a3532] transition-colors rounded-sm">
              Sign In
            </button>
          </div>
        </header>

        {/* Content overlay */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-8 md:px-12 flex flex-col md:flex-row justify-between items-center h-full pt-20">
          {/* Left side text (Image 1 style) */}
          <div className="w-full md:w-[50%] mb-12 md:mb-0">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-[#3a3532] leading-[0.9] tracking-tighter mb-8 uppercase">
              Elevate <br /> Your Vibe
            </h1>
            <p className="text-lg lg:text-xl text-[#3a3532]/70 max-w-sm mb-10 font-medium leading-relaxed">
              Experience the intersection of high-end streetwear and premium digital aesthetics.
            </p>
            <div className="inline-block text-[10px] font-bold tracking-widest uppercase border-b-2 border-[#3a3532] pb-1 cursor-pointer hover:opacity-70 transition-opacity">
              Explore Collection
            </div>
          </div>

          {/* Right side floating glass card*/}
          <div className="w-full md:w-[35%] bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-2xl shadow-2xl text-[#e6e0d4] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none"></div>
            <h2 className="text-3xl font-bold mb-4 uppercase tracking-tight relative z-10">
              Discover the Vibe
            </h2>
            <p className="text-sm text-[#e6e0d4]/80 mb-8 leading-relaxed relative z-10">
              Collect exclusive pieces and immerse yourself in the next wave of streetwear. Limited drops. Infinite style.
            </p>
            <div className="flex gap-4 relative z-10">
              <button className="flex-1 bg-[#8b7a66] text-[#e6e0d4] py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#a39079] transition-colors shadow-lg">
                Shop the Drop
              </button>
              <button className="flex-1 bg-transparent border border-[#e6e0d4]/30 text-[#e6e0d4] py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#e6e0d4]/10 transition-colors">
                View Exclusives
              </button>
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
            {/* Large Card */}
            <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-[#d5ccb7] group cursor-pointer shadow-lg min-h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#3a3532]/80 via-transparent to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90" />
              <div className="absolute inset-0 flex items-center justify-center text-[#3a3532]/10 bg-[#cfc5b0] transition-transform duration-700 group-hover:scale-105">
                <span className="text-5xl font-black uppercase tracking-tighter">
                  Cybernetics
                </span>
              </div>
              <div className="absolute bottom-10 left-10 z-20 text-[#e6e0d4] transform transition-transform duration-500 group-hover:translate-y-[-10px]">
                <span className="bg-[#e6e0d4] text-[#3a3532] text-xs font-bold px-3 py-1 mb-4 inline-block uppercase tracking-widest rounded-sm">
                  NEW ARRIVAL
                </span>
                <h3 className="text-4xl font-black uppercase tracking-tight">
                  Cyber-street collection
                </h3>
              </div>
            </div>

            {/* Small Stacked Cards */}
            <div className="flex flex-col gap-6">
              <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#3a3532] group cursor-pointer shadow-lg min-h-[250px]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center opacity-30 transition-transform duration-700 group-hover:scale-105">
                  <span className="text-4xl font-black text-[#e6e0d4] uppercase tracking-tighter">
                    Kicks
                  </span>
                </div>
                <div className="absolute bottom-8 left-8 z-20 text-[#e6e0d4]">
                  <h3 className="text-2xl font-bold uppercase tracking-tight">
                    Footwear
                  </h3>
                </div>
              </div>
              <div className="flex-1 relative rounded-2xl overflow-hidden bg-white group cursor-pointer shadow-lg min-h-[250px]">
                <div className="absolute inset-0 bg-gradient-to-t from-[#3a3532]/40 to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center opacity-10 bg-[#f4f1eb] transition-transform duration-700 group-hover:scale-105">
                  <span className="text-4xl font-black text-[#3a3532] uppercase tracking-tighter">
                    Gear
                  </span>
                </div>
                <div className="absolute bottom-8 left-8 z-20 text-[#3a3532]">
                  <h3 className="text-2xl font-bold uppercase tracking-tight">
                    Tech Accessories
                  </h3>
                </div>
              </div>
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
