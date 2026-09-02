"use client";

import Image from "next/image";
import { useLanguage } from "@/store/LanguageContext";
import {
  AdminTab,
  ProductSubTab,
  CollectionSubTab,
  AnalyticsSubTab,
  DeliverySubTab,
} from "../types";

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  productSubTab: ProductSubTab;
  handleProductSubTabSwitch: (subTab: ProductSubTab) => void;
  isProductsDropdownOpen: boolean;
  setIsProductsDropdownOpen: (
    open: boolean | ((prev: boolean) => boolean),
  ) => void;
  collectionSubTab: CollectionSubTab;
  handleCollectionSubTabSwitch: (subTab: CollectionSubTab) => void;
  isCollectionsDropdownOpen: boolean;
  setIsCollectionsDropdownOpen: (
    open: boolean | ((prev: boolean) => boolean),
  ) => void;
  deliverySubTab: DeliverySubTab;
  handleDeliverySubTabSwitch: (subTab: DeliverySubTab) => void;
  isDeliveryDropdownOpen: boolean;
  setIsDeliveryDropdownOpen: (
    open: boolean | ((prev: boolean) => boolean),
  ) => void;
  analyticsSubTab: AnalyticsSubTab;
  handleAnalyticsSubTabSwitch: (subTab: AnalyticsSubTab) => void;
  isAnalyticsDropdownOpen: boolean;
  setIsAnalyticsDropdownOpen: (
    open: boolean | ((prev: boolean) => boolean),
  ) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (
    collapsed: boolean | ((prev: boolean) => boolean),
  ) => void;
  productsCount: number;
  collectionsCount: number;
  ordersCount: number;
  customersCount: number;
  promosCount: number;
  couponsCount: number;
  courierCount?: number;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  productSubTab,
  handleProductSubTabSwitch,
  isProductsDropdownOpen,
  setIsProductsDropdownOpen,
  collectionSubTab,
  handleCollectionSubTabSwitch,
  isCollectionsDropdownOpen,
  setIsCollectionsDropdownOpen,
  deliverySubTab,
  handleDeliverySubTabSwitch,
  isDeliveryDropdownOpen,
  setIsDeliveryDropdownOpen,
  analyticsSubTab,
  handleAnalyticsSubTabSwitch,
  isAnalyticsDropdownOpen,
  setIsAnalyticsDropdownOpen,

  isSidebarCollapsed,
  setIsSidebarCollapsed,
  productsCount,
  collectionsCount,
  ordersCount,
  customersCount,
  promosCount,
  couponsCount,
  courierCount = 0,
}: AdminSidebarProps) {
  const { locale, t } = useLanguage();
  const isBn = locale === "bn";

  const tabs = [
    {
      id: "dashboard" as AdminTab,
      label: isBn ? "ওভারভিউ ড্যাশবোর্ড" : "Dashboard",
      icon: "/admin/dashboard.png",
    },
    {
      id: "products" as AdminTab,
      label: t("admin.sidebar.products"),
      count: productsCount,
      icon: "/admin/products.png",
    },
    {
      id: "collections" as AdminTab,
      label: t("admin.sidebar.collections"),
      count: collectionsCount,
      icon: "/admin/collections.png",
    },
    {
      id: "orders" as AdminTab,
      label: t("admin.sidebar.orders"),
      count: ordersCount,
      icon: "/admin/orders.png",
    },
    {
      id: "customers" as AdminTab,
      label: t("admin.sidebar.customers"),
      count: customersCount,
      icon: "/admin/customers.png",
    },
    {
      id: "promotions" as AdminTab,
      label: t("admin.sidebar.promotions"),
      count: promosCount,
      icon: "/admin/sales.png",
    },
    {
      id: "coupons" as AdminTab,
      label: t("admin.sidebar.coupons"),
      count: couponsCount,
      icon: "/admin/coupons.png",
    },
    {
      id: "payments" as AdminTab,
      label: t("admin.sidebar.payments"),
      icon: "/admin/payment_settings.png",
    },
    {
      id: "delivery" as AdminTab,
      label: t("admin.sidebar.delivery"),
      count: courierCount > 0 ? courierCount : undefined,
      icon: "/admin/manage_delivery.png",
    },
    {
      id: "analytics" as AdminTab,
      label: t("admin.sidebar.analytics"),
      icon: "/admin/analytics.png",
    },
    {
      id: "settings" as AdminTab,
      label: isBn ? "স্টোর সেটিংস" : "Settings",
      icon: "/admin/settings.png",
    },
  ];

  return (
    <aside
      className={`bg-primary text-background dark:text-foreground border-r border-white/10 shrink-0 transition-all duration-300 relative ${
        isSidebarCollapsed ? "w-20" : "w-64 md:w-72"
      }`}
    >
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setIsSidebarCollapsed((prev) => !prev)}
        className="absolute -right-3.5 top-6 z-20 w-7 h-7 rounded-full bg-accent text-white border-2 border-primary flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
        title={isSidebarCollapsed ? t("admin.sidebar.expand") : t("admin.sidebar.collapse")}
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-300 ${
            isSidebarCollapsed ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1.5 sticky top-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isProductsTab = tab.id === "products";
          const isCollectionsTab = tab.id === "collections";
          const isDeliveryTab = tab.id === "delivery";
          const isAnalyticsTab = tab.id === "analytics";

          return (
            <div key={tab.id} className="flex flex-col">
              <button
                onClick={() => {
                  if (isProductsTab) {
                    if (activeTab === "products") {
                      setIsProductsDropdownOpen((prev) => !prev);
                    } else {
                      setActiveTab("products");
                      setIsProductsDropdownOpen(true);
                    }
                  } else if (isCollectionsTab) {
                    if (activeTab === "collections") {
                      setIsCollectionsDropdownOpen((prev) => !prev);
                    } else {
                      setActiveTab("collections");
                      setIsCollectionsDropdownOpen(true);
                    }
                  } else if (isDeliveryTab) {
                    if (activeTab === "delivery") {
                      setIsDeliveryDropdownOpen((prev) => !prev);
                    } else {
                      setActiveTab("delivery");
                      setIsDeliveryDropdownOpen(true);
                    }
                  } else if (isAnalyticsTab) {
                    if (activeTab === "analytics") {
                      setIsAnalyticsDropdownOpen((prev) => !prev);
                    } else {
                      setActiveTab("analytics");
                      setIsAnalyticsDropdownOpen(true);
                    }
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer group relative ${
                  isActive
                    ? "bg-white/10 dark:bg-white/10 text-white dark:text-foreground font-black border border-white/25 dark:border-white/20 shadow-[0_2px_12px_rgba(0,0,0,0.1)] ring-1 ring-white/10"
                    : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5 border border-transparent font-bold"
                }`}
                title={isSidebarCollapsed ? tab.label : undefined}
              >
                {/* Active Left Indicator Accent Bar */}
                {isActive && (
                  <span className="absolute left-1.5 top-2.5 bottom-2.5 w-1 rounded-full bg-accent animate-in fade-in zoom-in duration-200" />
                )}

                <div
                  className={`flex items-center gap-3 min-w-0 ${isActive ? "pl-1.5" : ""} transition-all duration-200`}
                >
                  <div
                    className={`w-5 h-5 relative shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "scale-105" : "opacity-80"
                    }`}
                  >
                    <Image
                      src={tab.icon}
                      alt={tab.label}
                      fill
                      sizes="20px"
                      className={`object-contain w-full h-full transition-all duration-200 ${
                        isActive
                          ? "brightness-0 invert opacity-100"
                          : "brightness-0 invert opacity-70 group-hover:opacity-100"
                      }`}
                    />
                  </div>

                  {!isSidebarCollapsed && (
                    <span className="truncate text-left transition-opacity duration-200">
                      {tab.label}
                    </span>
                  )}
                </div>

                {!isSidebarCollapsed && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(isProductsTab || isCollectionsTab || isDeliveryTab || isAnalyticsTab) && (
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 opacity-70 ${
                          (isProductsTab && isProductsDropdownOpen) ||
                          (isCollectionsTab && isCollectionsDropdownOpen) ||
                          (isDeliveryTab && isDeliveryDropdownOpen) ||
                          (isAnalyticsTab && isAnalyticsDropdownOpen)
                            ? "rotate-180"
                            : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </div>
                )}
              </button>


              {/* Collections Subsections */}
              {isCollectionsTab &&
                isCollectionsDropdownOpen &&
                !isSidebarCollapsed && (
                  <div className="pl-6 pr-1 py-1 mt-1 space-y-1 border-l-2 border-white/10 ml-5 transition-all">
                    {/* 1. All Collections */}
                    <button
                      onClick={() => handleCollectionSubTabSwitch("all")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && collectionSubTab === "all"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "সকল কালেকশন" : "All Collections"}</span>
                    </button>

                    {/* 2. Add New Collection */}
                    <button
                      onClick={() => handleCollectionSubTabSwitch("add")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && collectionSubTab === "add"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "নতুন কালেকশন যোগ" : "Add New Collection"}</span>
                      <span className="text-xs font-black">+</span>
                    </button>

                    {/* 3. Edit Collection */}
                    <button
                      onClick={() => handleCollectionSubTabSwitch("edit")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && collectionSubTab === "edit"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "কালেকশন সম্পাদনা" : "Edit Collection"}</span>
                    </button>
                  </div>
                )}

              {/* Products Subsections */}
              {isProductsTab &&
                isProductsDropdownOpen &&
                !isSidebarCollapsed && (
                  <div className="pl-6 pr-1 py-1 mt-1 space-y-1 border-l-2 border-white/10 ml-5 transition-all">
                    {/* 1. All Products */}
                    <button
                      onClick={() => handleProductSubTabSwitch("all")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && productSubTab === "all"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "সকল পণ্য" : "All Products"}</span>
                    </button>

                    {/* 2. Add New Product */}
                    <button
                      onClick={() => handleProductSubTabSwitch("add")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && productSubTab === "add"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "নতুন পণ্য যোগ" : "Add New Product"}</span>
                      <span className="text-xs font-black">+</span>
                    </button>

                    {/* 3. Edit Product */}
                    <button
                      onClick={() => handleProductSubTabSwitch("edit")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && productSubTab === "edit"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "পণ্য সম্পাদনা" : "Edit Product"}</span>
                    </button>

                    {/* 4. Stock Health Alerts */}
                    <button
                      onClick={() => handleProductSubTabSwitch("stock-health")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && productSubTab === "stock-health"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "স্টক পর্যবেক্ষণ" : "Stock Health Alerts"}</span>
                    </button>

                    {/* 5. Reviews */}
                    <button
                      onClick={() => handleProductSubTabSwitch("reviews")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && productSubTab === "reviews"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "রিভিউ ও রেটিং" : "Reviews"}</span>
                    </button>

                    {/* 6. Google Sheets & Excel Sync */}
                    <button
                      onClick={() => handleProductSubTabSwitch("sheets-sync")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && productSubTab === "sheets-sync"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "শীটস ও এক্সেল সিঙ্ক" : "Sheets & Excel Sync"}</span>
                    </button>
                  </div>
                )}

              {/* Delivery Subsections */}
              {isDeliveryTab &&
                isDeliveryDropdownOpen &&
                !isSidebarCollapsed && (
                  <div className="pl-6 pr-1 py-1 mt-1 space-y-1 border-l-2 border-white/10 ml-5 transition-all">
                    {/* 1. Rates & Schedules */}
                    <button
                      onClick={() => handleDeliverySubTabSwitch("rates")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && deliverySubTab === "rates"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "চার্জ ও সময়সীমা" : "Rates & Timeframes"}</span>
                    </button>

                    {/* 2. Courier Partners & APIs */}
                    <button
                      onClick={() => handleDeliverySubTabSwitch("couriers")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && deliverySubTab === "couriers"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "কুরিয়ার ও এপিআই" : "Couriers & APIs"}</span>
                    </button>
                  </div>
                )}

              {/* Analytics Subsections */}
              {isAnalyticsTab &&
                isAnalyticsDropdownOpen &&
                !isSidebarCollapsed && (
                  <div className="pl-6 pr-1 py-1 mt-1 space-y-1 border-l-2 border-white/10 ml-5 transition-all">

                    {/* 1. Sales & Revenue Analytics */}
                    <button
                      onClick={() => handleAnalyticsSubTabSwitch("sales")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && analyticsSubTab === "sales"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "বিক্রয় ও আয়" : "Sales & Revenue"}</span>
                    </button>

                    {/* 2. Promo & Coupon Performance */}
                    <button
                      onClick={() => handleAnalyticsSubTabSwitch("coupons")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && analyticsSubTab === "coupons"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "প্রমোশন ও কুপন পারফর্মেন্স" : "Promo & Coupons"}</span>
                    </button>

                    {/* 3. Payment Methods Breakdown */}
                    <button
                      onClick={() => handleAnalyticsSubTabSwitch("payments")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && analyticsSubTab === "payments"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "পেমেন্ট পরিসংখ্যান" : "Payment Methods"}</span>
                    </button>

                    {/* 4. Top Selling Products & Shades */}
                    <button
                      onClick={() =>
                        handleAnalyticsSubTabSwitch("top-products")
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && analyticsSubTab === "top-products"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{isBn ? "সর্বাধিক বিক্রিত পণ্য" : "Top Products & Shades"}</span>
                    </button>
                  </div>
                )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
