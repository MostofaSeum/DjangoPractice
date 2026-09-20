"use client";

import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageToggle from "@/components/ui/LanguageToggle";
import { AdminTab } from "../types";
import AdminNotificationBell from "./AdminNotificationBell";
import { useLanguage } from "@/store/LanguageContext";

interface AdminHeaderProps {
  onLogout: () => void;
  activeTab?: AdminTab;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  apiBase?: string;
  token?: string | null;
  onNavigateToOrder?: (orderId: string) => void;
  onNavigateToReturn?: (orderId: string) => void;
  onNavigateToTab?: (tab: AdminTab) => void;
  onToggleMobileMenu?: () => void;
}

export default function AdminHeader({
  onLogout,
  activeTab,
  onRefresh,
  isRefreshing = false,
  apiBase = "",
  token = null,
  onNavigateToOrder,
  onNavigateToReturn,
  onNavigateToTab,
  onToggleMobileMenu,
}: AdminHeaderProps) {
  const { t } = useLanguage();

  const getTabDisplayName = (tab?: AdminTab) => {
    switch (tab) {
      case "dashboard":
        return t("admin.tabs.dashboard");
      case "products":
        return t("admin.tabs.products");
      case "collections":
        return t("admin.tabs.collections");
      case "orders":
        return t("admin.tabs.orders");
      case "customers":
        return t("admin.tabs.customers");
      case "promotions":
        return t("admin.tabs.promotions");
      case "coupons":
        return t("admin.tabs.coupons");
      case "payments":
        return t("admin.tabs.payments");
      case "delivery":
        return t("admin.tabs.delivery");
      case "analytics":
        return t("admin.tabs.analytics");
      case "settings":
        return t("admin.tabs.settings");
      default:
        return t("admin.tabs.current");
    }
  };

  return (
    <header className="bg-primary text-background dark:text-foreground h-[65px] px-2.5 sm:px-4 md:px-10 border-b border-white/10 shadow-sm transition-colors duration-300 sticky top-0 z-40 flex items-center">
      <div className="flex justify-between items-center gap-1.5 sm:gap-4 w-full min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Menu Toggle (Hidden on desktop md:) */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="md:hidden p-1.5 sm:p-2 -ml-1 sm:-ml-1.5 rounded-xl text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="bg-accent text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-widest rounded-md hidden xs:inline-block shrink-0">
                {t("admin.header.staffPortal")}
              </span>
              <h1 className="text-xs sm:text-base md:text-xl font-black uppercase tracking-tight truncate max-w-[85px] min-[360px]:max-w-[110px] min-[400px]:max-w-[160px] sm:max-w-none">
                {t("admin.header.dashboard")}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 min-[360px]:gap-1.5 sm:gap-3 shrink-0">
          {/* Active Tab Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title={`${t("admin.header.refresh")} ${getTabDisplayName(activeTab)}`}
              className={`flex items-center justify-center gap-2 p-1.5 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border border-white/15 bg-white/10 text-white dark:text-foreground hover:bg-white/20 active:scale-95 cursor-pointer shrink-0 ${
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
                {isRefreshing ? t("admin.header.refreshing") : `${t("admin.header.refresh")} ${getTabDisplayName(activeTab)}`}
              </span>
            </button>
          )}

          {/* Real-time Order Notification Bell */}
          {token && apiBase && (
            <AdminNotificationBell
              apiBase={apiBase}
              token={token}
              onNavigateToOrder={onNavigateToOrder}
              onNavigateToReturn={onNavigateToReturn}
              onNavigateToTab={onNavigateToTab}
            />
          )}

          <div className="shrink-0">
            <LanguageToggle />
          </div>
          <div className="shrink-0">
            <ThemeToggle />
          </div>
          <button
            onClick={onLogout}
            title={t("admin.header.logout")}
            aria-label={t("admin.header.logout")}
            className="flex items-center justify-center gap-1.5 p-1.5 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border border-red-300/30 bg-red-500/20 text-white hover:bg-red-500/35 hover:border-red-300/50 active:scale-95 cursor-pointer shrink-0 shadow-xs"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">
              {t("admin.header.logout")}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

