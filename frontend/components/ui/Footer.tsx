import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#2a2624] text-[#e6e0d4]/50 py-16 px-8 md:px-12 mt-auto">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
        <Link href="/" className="text-3xl font-black tracking-tighter text-[#e6e0d4] uppercase">
          VibeMart
        </Link>
        <div className="flex flex-wrap justify-center gap-8 text-xs font-bold uppercase tracking-widest">
          <Link href="/products" className="hover:text-[#e6e0d4] transition-colors">
            Shop
          </Link>
          <Link href="/collections" className="hover:text-[#e6e0d4] transition-colors">
            Collections
          </Link>
          <a href="#" className="hover:text-[#e6e0d4] transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-[#e6e0d4] transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-[#e6e0d4] transition-colors">
            Shipping Info
          </a>
        </div>
        <div className="text-[10px] font-bold tracking-widest uppercase text-center md:text-left">
          &copy; 2026 VIBEMART.
          <br /> WORLDWIDE.
        </div>
      </div>
    </footer>
  );
}
