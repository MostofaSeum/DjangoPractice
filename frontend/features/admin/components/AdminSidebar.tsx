"use client";

import { useMemo } from "react";
import Image from "next/image";
import { AdminTab, ProductSubTab } from "../types";

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  productSubTab: ProductSubTab;
  handleProductSubTabSwitch: (subTab: ProductSubTab) => void;
  isProductsDropdownOpen: boolean;
  setIsProductsDropdownOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  productsCount: number;
  collectionsCount: number;
  ordersCount: number;
  customersCount: number;
  promosCount: number;
  couponsCount: number;
  deliveryRulesCount: number;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  productSubTab,
  handleProductSubTabSwitch,
  isProductsDropdownOpen,
  setIsProductsDropdownOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  productsCount,
  collectionsCount,
  ordersCount,
  customersCount,
  promosCount,
  couponsCount,
  deliveryRulesCount,
}: AdminSidebarProps) {
  const tabs = useMemo(
    () => [
      {
        id: "products" as AdminTab,
        label: "Products",
        count: productsCount,
        icon: "/admin/products.png",
      },
      {
        id: "collections" as AdminTab,
        label: "Collections",
        count: collectionsCount,
        icon: "/admin/collections.png",
      },
      {
        id: "orders" as AdminTab,
        label: "Orders",
        count: ordersCount,
        icon: "/admin/orders.png",
      },
      {
        id: "customers" as AdminTab,
        label: "Customers",
        count: customersCount,
        icon: "/admin/customers.png",
      },
      {
        id: "promotions" as AdminTab,
        label: "Promotions",
        count: promosCount,
        icon: "/admin/sales.png",
      },
      {
        id: "coupons" as AdminTab,
        label: "Coupons",
        count: couponsCount,
        icon: "/admin/coupons.png",
      },
      {
        id: "payments" as AdminTab,
        label: "Payment Methods",
        icon: "/admin/payment_settings.png",
      },
      {
        id: "delivery" as AdminTab,
        label: "Manage Delivery",
        count: deliveryRulesCount > 0 ? deliveryRulesCount : undefined,
        icon: "/admin/manage_delivery.png",
      },
      {
        id: "analytics" as AdminTab,
        label: "Analytics",
        icon: "/admin/analytics.png",
      },
    ],
    [
      productsCount,
      collectionsCount,
      ordersCount,
      customersCount,
      promosCount,
      couponsCount,
      deliveryRulesCount,
    ]
  );

  // Calculate active tab index for moving pill indicator
  const activeIndex = useMemo(() => {
    const idx = tabs.findIndex((t) => t.id === activeTab);
    return idx >= 0 ? idx : 0;
  }, [tabs, activeTab]);

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
        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
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
      <nav className="p-3 space-y-1.5 sticky top-24 relative">
        {/* Animated Floating Indicator Border that glides between tabs */}
        <div
          className="absolute left-3 right-3 h-[48px] rounded-2xl border border-white/25 dark:border-white/20 bg-white/10 dark:bg-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.12)] ring-1 ring-white/10 pointer-events-none transition-all duration-300 ease-out z-0"
          style={{
            transform: `translateY(${activeIndex * (48 + 6)}px)`,
          }}
        />

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isProductsTab = tab.id === "products";

          return (
            <div key={tab.id} className="flex flex-col relative z-10">
              <button
                onClick={() => {
                  if (isProductsTab) {
                    if (activeTab === "products") {
                      setIsProductsDropdownOpen((prev) => !prev);
                    } else {
                      setActiveTab("products");
                      setIsProductsDropdownOpen(true);
                    }
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`w-full h-[48px] flex items-center justify-between px-3.5 rounded-2xl text-xs uppercase tracking-wider transition-colors duration-200 cursor-pointer group select-none ${
                  isActive
                    ? "text-white dark:text-foreground font-black"
                    : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground font-bold hover:bg-white/5"
                }`}
                title={isSidebarCollapsed ? tab.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
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
                          ? "brightness-0 dark:brightness-0 dark:invert"
                          : "brightness-0 invert dark:brightness-0 dark:opacity-60 group-hover:dark:opacity-100"
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
                    {typeof tab.count !== "undefined" && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all duration-200 ${
                          isActive
                            ? "bg-accent text-white dark:text-primary shadow-xs border border-accent/30 scale-105"
                            : "bg-white/10 text-background/80 dark:text-foreground/80"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                    {isProductsTab && (
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 opacity-70 ${
                          isProductsDropdownOpen ? "rotate-180" : ""
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
                      <span className="truncate">All Products</span>
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
                      <span className="truncate">Add New Product</span>
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
                      <span className="truncate">Edit Product</span>
                    </button>

                    {/* 4. Reviews */}
                    <button
                      onClick={() => handleProductSubTabSwitch("reviews")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive && productSubTab === "reviews"
                          ? "bg-accent text-white shadow-xs font-black"
                          : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">Reviews</span>
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
