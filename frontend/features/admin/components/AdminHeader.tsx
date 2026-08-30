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
  onNavigateToTab?: (tab: AdminTab) => void;
}

export default function AdminHeader({
  onLogout,
  activeTab,
  onRefresh,
  isRefreshing = false,
  apiBase = "",
  token = null,
  onNavigateToOrder,
  onNavigateToTab,
}: AdminHeaderProps) {
  const { t } = useLanguage();

  const getTabDisplayName = (tab?: AdminTab) => {
    switch (tab) {
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
      default:
        return t("admin.tabs.current");
    }
  };

  return (
    <header className="bg-primary text-background dark:text-foreground py-4 px-6 md:px-10 border-b border-white/10 shadow-sm transition-colors duration-300 sticky top-0 z-40">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-accent text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-widest rounded-md">
                {t("admin.header.staffPortal")}
              </span>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-tight">
                {t("admin.header.dashboard")}
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
              title={`${t("admin.header.refresh")} ${getTabDisplayName(activeTab)}`}
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
              onNavigateToTab={onNavigateToTab}
            />
          )}

          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="bg-accent/20 text-accent hover:bg-accent/30 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-accent/20 transition-colors cursor-pointer"
          >
            {t("admin.header.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}

