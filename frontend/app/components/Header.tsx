import Link from "next/link";
import CartButton from "./CartButton";

export default function Header() {
  return (
    <header className="w-full z-50 py-8 px-8 md:px-12 flex justify-center items-center bg-[#e6e0d4]/90 backdrop-blur-md sticky top-0 border-b border-[#3a3532]/5">
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
          <CartButton />
          <button className="border-2 border-[#3a3532] text-[#3a3532] px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#3a3532] hover:text-[#e6e0d4] transition-colors rounded-xl">
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
}
