"use client";

import Image from "next/image";
import { useLanguage } from "@/store/LanguageContext";
import {
  AdminTab,
  ProductSubTab,
  CollectionSubTab,
  OrderSubTab,
  AnalyticsSubTab,
  DeliverySubTab,
  SettingsSubTab,
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
  orderSubTab: OrderSubTab;
  handleOrderSubTabSwitch: (subTab: OrderSubTab) => void;
  isOrdersDropdownOpen: boolean;
  setIsOrdersDropdownOpen: (
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
  settingsSubTab: SettingsSubTab;
  handleSettingsSubTabSwitch: (subTab: SettingsSubTab) => void;
  isSettingsDropdownOpen: boolean;
  setIsSettingsDropdownOpen: (
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
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  onLogout?: () => void;
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
  orderSubTab,
  handleOrderSubTabSwitch,
  isOrdersDropdownOpen,
  setIsOrdersDropdownOpen,
  deliverySubTab,
  handleDeliverySubTabSwitch,
  isDeliveryDropdownOpen,
  setIsDeliveryDropdownOpen,
  analyticsSubTab,
  handleAnalyticsSubTabSwitch,
  isAnalyticsDropdownOpen,
  setIsAnalyticsDropdownOpen,
  settingsSubTab,
  handleSettingsSubTabSwitch,
  isSettingsDropdownOpen,
  setIsSettingsDropdownOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  productsCount,
  collectionsCount,
  ordersCount,
  customersCount,
  promosCount,
  couponsCount,
  courierCount = 0,
  isMobileOpen = false,
  setIsMobileOpen,
  onLogout,
}: AdminSidebarProps) {
  const { locale, t } = useLanguage();
  const isBn = locale === "bn";

  const handleTabClick = (tabId: AdminTab) => {
    setActiveTab(tabId);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const handleSubTabClick = (callback: () => void) => {
    callback();
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const tabs = [
    {
      id: "dashboard" as AdminTab,
      label: isBn ? "ওভারভিউ ড্যাশবোর্ড" : "Dashboard",
      icon: "/Admin/dashboard.png",
    },
    {
      id: "products" as AdminTab,
      label: t("admin.sidebar.products"),
      count: productsCount,
      icon: "/Admin/products.png",
    },
    {
      id: "collections" as AdminTab,
      label: t("admin.sidebar.collections"),
      count: collectionsCount,
      icon: "/Admin/collections.png",
    },
    {
      id: "orders" as AdminTab,
      label: t("admin.sidebar.orders"),
      count: ordersCount,
      icon: "/Admin/orders.png",
    },
    {
      id: "customers" as AdminTab,
      label: t("admin.sidebar.customers"),
      count: customersCount,
      icon: "/Admin/customers.png",
    },
    {
      id: "promotions" as AdminTab,
      label: t("admin.sidebar.promotions"),
      count: promosCount,
      icon: "/Admin/sales.png",
    },
    {
      id: "coupons" as AdminTab,
      label: t("admin.sidebar.coupons"),
      count: couponsCount,
      icon: "/Admin/coupons.png",
    },
    {
      id: "payments" as AdminTab,
      label: t("admin.sidebar.payments"),
      icon: "/Admin/payment_settings.png",
    },
    {
      id: "delivery" as AdminTab,
      label: t("admin.sidebar.delivery"),
      count: courierCount > 0 ? courierCount : undefined,
      icon: "/Admin/manage_delivery.png",
    },
    {
      id: "analytics" as AdminTab,
      label: t("admin.sidebar.analytics"),
      icon: "/Admin/analytics.png",
    },
    {
      id: "settings" as AdminTab,
      label: isBn ? "স্টোর সেটিংস" : "Settings",
      icon: "/Admin/settings.png",
    },
  ];

  const renderNavLinks = (isMobileView: boolean = false) => (
    <nav className="p-3 pb-36 space-y-1.5 overflow-y-auto flex-1 min-h-0 custom-scrollbar overscroll-contain">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isProductsTab = tab.id === "products";
        const isCollectionsTab = tab.id === "collections";
        const isOrdersTab = tab.id === "orders";
        const isDeliveryTab = tab.id === "delivery";
        const isAnalyticsTab = tab.id === "analytics";
        const isSettingsTab = tab.id === "settings";

        const onTabClick = () => {
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
          } else if (isOrdersTab) {
            if (activeTab === "orders") {
              setIsOrdersDropdownOpen((prev) => !prev);
            } else {
              setActiveTab("orders");
              setIsOrdersDropdownOpen(true);
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
          } else if (isSettingsTab) {
            if (activeTab === "settings") {
              setIsSettingsDropdownOpen((prev) => !prev);
            } else {
              setActiveTab("settings");
              setIsSettingsDropdownOpen(true);
            }
          } else {
            setActiveTab(tab.id);
            if (isMobileView && setIsMobileOpen) {
              setIsMobileOpen(false);
            }
          }
        };

        const onSubItemClick = (switchFn: () => void) => {
          switchFn();
          if (isMobileView && setIsMobileOpen) {
            setIsMobileOpen(false);
          }
        };

        return (
          <div key={tab.id} className="flex flex-col">
            <button
              onClick={onTabClick}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer group relative ${
                isActive
                  ? "bg-white/10 dark:bg-white/10 text-white dark:text-foreground font-black border border-white/25 dark:border-white/20 shadow-[0_2px_12px_rgba(0,0,0,0.1)] ring-1 ring-white/10"
                  : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5 border border-transparent font-bold"
              }`}
              title={(!isMobileView && isSidebarCollapsed) ? tab.label : undefined}
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
                    className="object-contain brightness-0 invert"
                  />
                </div>
                {(!isSidebarCollapsed || isMobileView) && (
                  <span className="truncate tracking-wider text-xs font-extrabold">{tab.label}</span>
                )}
              </div>

              {(!isSidebarCollapsed || isMobileView) && (
                <div className="flex items-center gap-1.5">
                  {(isProductsTab ||
                    isCollectionsTab ||
                    isOrdersTab ||
                    isDeliveryTab ||
                    isAnalyticsTab ||
                    isSettingsTab) && (
                    <svg
                      className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                        (isProductsTab && isProductsDropdownOpen) ||
                        (isCollectionsTab && isCollectionsDropdownOpen) ||
                        (isOrdersTab && isOrdersDropdownOpen) ||
                        (isDeliveryTab && isDeliveryDropdownOpen) ||
                        (isAnalyticsTab && isAnalyticsDropdownOpen) ||
                        (isSettingsTab && isSettingsDropdownOpen)
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

            {/* Products Subsections */}
            {isProductsTab &&
              isProductsDropdownOpen &&
              (!isSidebarCollapsed || isMobileView) && (
                <div className="pl-6 pr-1 py-1 mt-1 space-y-1 border-l-2 border-white/10 ml-5 transition-all">
                  <button
                    onClick={() => onSubItemClick(() => handleProductSubTabSwitch("all"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && productSubTab === "all"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "সকল পণ্য" : "All Products"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleProductSubTabSwitch("add"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && productSubTab === "add"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "নতুন পণ্য যোগ" : "Add New Product"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleProductSubTabSwitch("stock-health"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && productSubTab === "stock-health"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "স্টক এলার্ট" : "Stock Health Alerts"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleProductSubTabSwitch("reviews"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && productSubTab === "reviews"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "রিভিউ ম্যানেজমেন্ট" : "Customer Reviews"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleProductSubTabSwitch("sheets-sync"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && productSubTab === "sheets-sync"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "গুগল শিট সিঙ্ক" : "Sheets & CSV Sync"}</span>
                  </button>
                </div>
              )}

            {/* Collections Subsections */}
            {isCollectionsTab &&
              isCollectionsDropdownOpen &&
              (!isSidebarCollapsed || isMobileView) && (
                <div className="pl-6 pr-1 py-1 mt-1 space-y-1 border-l-2 border-white/10 ml-5 transition-all">
                  <button
                    onClick={() => onSubItemClick(() => handleCollectionSubTabSwitch("all"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && collectionSubTab === "all"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "সকল কালেকশন" : "All Collections"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleCollectionSubTabSwitch("add"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && collectionSubTab === "add"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "নতুন ক্যাটাগরি যোগ" : "Add New Category"}</span>
                  </button>
                </div>
              )}

            {/* Orders Subsections */}
            {isOrdersTab &&
              isOrdersDropdownOpen &&
              (!isSidebarCollapsed || isMobileView) && (
                <div className="pl-6 pr-1 py-1 mt-1 space-y-1 border-l-2 border-white/10 ml-5 transition-all">
                  <button
                    onClick={() => onSubItemClick(() => handleOrderSubTabSwitch("all"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && orderSubTab === "all"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "সকল অর্ডার" : "All Orders"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleOrderSubTabSwitch("returns"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && orderSubTab === "returns"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "রিটার্ন ও রিফান্ড" : "Returns & Claims"}</span>
                  </button>
                </div>
              )}

            {/* Delivery Logistics Subsections */}
            {isDeliveryTab &&
              isDeliveryDropdownOpen &&
              (!isSidebarCollapsed || isMobileView) && (
                <div className="pl-6 pr-1 py-1 mt-1 space-y-1 border-l-2 border-white/10 ml-5 transition-all">
                  <button
                    onClick={() => onSubItemClick(() => handleDeliverySubTabSwitch("rates"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && deliverySubTab === "rates"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "চার্জ ও সময়সীমা" : "Rates & Timeframes"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleDeliverySubTabSwitch("couriers"))}
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
              (!isSidebarCollapsed || isMobileView) && (
                <div className="pl-6 pr-1 py-1 mt-1 space-y-1 border-l-2 border-white/10 ml-5 transition-all">
                  <button
                    onClick={() => onSubItemClick(() => handleAnalyticsSubTabSwitch("sales"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && analyticsSubTab === "sales"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "বিক্রয় ও আয়" : "Sales & Revenue"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleAnalyticsSubTabSwitch("coupons"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && analyticsSubTab === "coupons"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "কুপন পারফরম্যান্স" : "Coupon Tracking"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleAnalyticsSubTabSwitch("payments"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && analyticsSubTab === "payments"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "পেমেন্ট পরিসংখ্যান" : "Payment Methods"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleAnalyticsSubTabSwitch("top-products"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && analyticsSubTab === "top-products"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "সর্বাধিক বিক্রিত পণ্য" : "Top Products & Shades"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleAnalyticsSubTabSwitch("delivery-orders"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && analyticsSubTab === "delivery-orders"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "কুরিয়ার ও ডেলিভারি রিপোর্ট" : "Orders & Delivery Services"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleAnalyticsSubTabSwitch("traffic"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && analyticsSubTab === "traffic"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "গুগল অ্যানালিটিক্স (GA4)" : "Google Analytics (GA4)"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleAnalyticsSubTabSwitch("meta-pixel"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && analyticsSubTab === "meta-pixel"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "মেটা পিক্সেল ও কনভার্সন" : "Meta Pixel & Conversions"}</span>
                  </button>
                </div>
              )}

            {/* Settings Subsections */}
            {isSettingsTab &&
              isSettingsDropdownOpen &&
              (!isSidebarCollapsed || isMobileView) && (
                <div className="pl-6 pr-1 py-1 mt-1 space-y-1 border-l-2 border-white/10 ml-5 transition-all">
                  <button
                    onClick={() => onSubItemClick(() => handleSettingsSubTabSwitch("homepage"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && settingsSubTab === "homepage"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "হোমপেজ ও ব্যানার" : "Homepage & Banners"}</span>
                  </button>
                  <button
                    onClick={() => onSubItemClick(() => handleSettingsSubTabSwitch("general"))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive && settingsSubTab === "general"
                        ? "bg-accent text-white shadow-xs font-black"
                        : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{isBn ? "সাধারণ সেটিংস" : "General Settings"}</span>
                  </button>
                </div>
              )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 1. DESKTOP SIDEBAR: Preserved 100% identically with md:flex */}
      <aside
        className={`hidden md:flex bg-primary text-background dark:text-foreground border-r border-white/10 shrink-0 transition-all duration-300 sticky top-[65px] h-[calc(100vh-65px)] flex-col z-30 ${
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

        {renderNavLinks(false)}
      </aside>

      {/* 2. MOBILE SLIDE-OVER DRAWER: Only visible on screens < md */}
      <div className="md:hidden">
        {/* Backdrop Overlay */}
        <div
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${
            isMobileOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        />

        {/* Slide-out Drawer Panel */}
        <aside
          className={`fixed top-0 left-0 bottom-0 w-[280px] max-w-[85vw] bg-primary text-background dark:text-foreground z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out border-r border-white/10 ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Mobile Drawer Header with Close Button */}
          <div className="h-[65px] px-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="bg-accent text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-widest rounded-md">
                {t("admin.header.staffPortal")}
              </span>
              <h2 className="text-sm font-black uppercase tracking-tight text-white dark:text-foreground">
                {isBn ? "ন্যাভিগেশন মেনু" : "Admin Menu"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Menu"
              aria-label="Close Menu"
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
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {renderNavLinks(true)}
          </div>

          {/* Dedicated Mobile Drawer Logout Action */}
          {onLogout && (
            <div className="p-3 border-t border-white/10 shrink-0 bg-primary/40">
              <button
                type="button"
                onClick={() => {
                  if (setIsMobileOpen) setIsMobileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent/20 text-accent hover:bg-accent/30 font-bold text-xs uppercase tracking-wider border border-accent/20 transition-all cursor-pointer active:scale-98"
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
                <span>{t("admin.header.logout")}</span>
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
