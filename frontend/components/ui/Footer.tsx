import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-primary text-background dark:text-foreground py-16 px-8 md:px-12 mt-auto border-t border-white/10 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
        <Link href="/" className="text-3xl font-black tracking-tighter uppercase text-background dark:text-foreground">
          VibeMart
        </Link>
        <div className="flex flex-wrap justify-center gap-8 text-xs font-bold uppercase tracking-widest text-background dark:text-foreground">
          <Link href="/products" className="text-background dark:text-foreground hover:underline transition-all">
            Shop
          </Link>
          <Link href="/collections" className="text-background dark:text-foreground hover:underline transition-all">
            Collections
          </Link>
          <Link href="/gift-cards" className="text-background dark:text-foreground hover:underline transition-all">
            Gift Cards
          </Link>
          <a href="#" className="text-background/90 dark:text-foreground/90 hover:text-background dark:hover:text-foreground hover:underline transition-all">
            Privacy Policy
          </a>
          <a href="#" className="text-background/90 dark:text-foreground/90 hover:text-background dark:hover:text-foreground hover:underline transition-all">
            Terms of Service
          </a>
          <a href="#" className="text-background/90 dark:text-foreground/90 hover:text-background dark:hover:text-foreground hover:underline transition-all">
            Shipping Info
          </a>
        </div>
        <div className="text-[10px] font-extrabold tracking-widest uppercase text-center md:text-left text-background/90 dark:text-foreground/90">
          &copy; 2026 VIBEMART.
          <br /> WORLDWIDE.
        </div>
      </div>
    </footer>
  );
}
