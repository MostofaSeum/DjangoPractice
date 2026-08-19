"use client";

import ThemeToggle from "@/components/ui/ThemeToggle";

interface AdminHeaderProps {
  onLogout: () => void;
}

export default function AdminHeader({ onLogout }: AdminHeaderProps) {
  return (
    <header className="bg-primary text-background dark:text-foreground py-4 px-6 md:px-10 border-b border-white/10 shadow-sm transition-colors duration-300 sticky top-0 z-40">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-accent text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-widest rounded-md">
                Staff Portal
              </span>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-tight">
                Admin Dashboard
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="bg-accent/20 text-accent hover:bg-accent/30 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-accent/20 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
