"use client";

import ThemeToggle from "@/components/ui/ThemeToggle";
import { AdminTab } from "../types";

interface AdminHeaderProps {
  onLogout: () => void;
  activeTab?: AdminTab;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function AdminHeader({
  onLogout,
  activeTab,
  onRefresh,
  isRefreshing = false,
}: AdminHeaderProps) {
  const getTabDisplayName = (tab?: AdminTab) => {
    switch (tab) {
      case "products":
        return "Products";
      case "collections":
        return "Collections";
      case "orders":
        return "Orders";
      case "customers":
        return "Customers";
      case "promotions":
        return "Promotions";
      case "coupons":
        return "Coupons";
      case "payments":
        return "Payment Methods";
      case "delivery":
        return "Delivery Settings";
      case "analytics":
        return "Analytics";
      default:
        return "Current Tab";
    }
  };

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
          {/* Active Tab Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title={`Refresh ${getTabDisplayName(activeTab)}`}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border border-white/15 bg-white/10 text-white dark:text-foreground hover:bg-white/20 active:scale-95 cursor-pointer ${
                isRefreshing ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-700 ${
                  isRefreshing ? "animate-spin text-accent" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">
                {isRefreshing ? "Refreshing..." : `Refresh ${getTabDisplayName(activeTab)}`}
              </span>
            </button>
          )}

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

