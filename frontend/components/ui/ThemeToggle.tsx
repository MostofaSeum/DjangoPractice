"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-full border border-foreground/15 bg-foreground/5" />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
      }}
      aria-label="Toggle Light and Dark Mode"
      className="p-1.5 sm:p-2 rounded-full border border-foreground/15 bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all flex items-center justify-center cursor-pointer select-none"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      {theme === "light" ? (
        /* Moon Icon for Light Mode*/
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        /* Sun Icon for Dark Mode*/
        <img
          src="/icons/sun.png"
          alt="Light Mode"
          className="w-4 h-4 object-contain brightness-0 invert"
        />
      )}
    </button>
  );
}
