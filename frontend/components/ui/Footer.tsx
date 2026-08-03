import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-primary text-[var(--background)] dark:text-[var(--foreground)] opacity-90 py-16 px-8 md:px-12 mt-auto border-t border-white/5 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
        <Link href="/" className="text-3xl font-black tracking-tighter text-[var(--background)] dark:text-[var(--foreground)] uppercase">
          VibeMart
        </Link>
        <div className="flex flex-wrap justify-center gap-8 text-xs font-bold uppercase tracking-widest">
          <Link href="/products" className="hover:opacity-70 transition-opacity">
            Shop
          </Link>
          <Link href="/collections" className="hover:opacity-70 transition-opacity">
            Collections
          </Link>
          <a href="#" className="hover:opacity-70 transition-opacity">
            Privacy Policy
          </a>
          <a href="#" className="hover:opacity-70 transition-opacity">
            Terms of Service
          </a>
          <a href="#" className="hover:opacity-70 transition-opacity">
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
