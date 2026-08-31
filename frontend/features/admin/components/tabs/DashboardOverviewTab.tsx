"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Order, Product, CustomerItem, CouponItem, Collection, AdminTab } from "../../types";
import { useLanguage } from "@/store/LanguageContext";

interface DashboardOverviewTabProps {
  orders?: Order[];
  products?: Product[];
  customers?: CustomerItem[];
  coupons?: CouponItem[];
  collections?: Collection[];
  onNavigateTab: (tab: AdminTab) => void;
  onNavigateOrder?: (order: Order) => void;
}

export default function DashboardOverviewTab({
  orders = [],
  products = [],
  customers = [],
  coupons = [],
  collections = [],
  onNavigateTab,
  onNavigateOrder,
}: DashboardOverviewTabProps) {
  const { locale, formatCurrency } = useLanguage();
  const isBn = locale === "bn";

  // 1. Calculate Core Financial & Inventory Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let completedRevenue = 0;
    let pendingOrdersCount = 0;
    let completedOrdersCount = 0;
    let failedOrdersCount = 0;

    orders.forEach((o) => {
      const itemsTotal = (o.items || []).reduce((acc, it) => {
        const p = Number(it.unit_price) || 0;
        const q = Number(it.quantity) || 0;
        return acc + p * q;
      }, 0);
      const delivery = Number(o.delivery_charge) || 0;
      const orderTotal = itemsTotal + delivery;

      totalRevenue += orderTotal;
      if (o.payment_status === "C") {
        completedRevenue += orderTotal;
        completedOrdersCount++;
      } else if (o.payment_status === "P") {
        pendingOrdersCount++;
      } else if (o.payment_status === "F") {
        failedOrdersCount++;
      }
    });

    const lowStockProducts = products.filter(
      (p) => (Number(p.inventory) || 0) > 0 && (Number(p.inventory) || 0) <= 5,
    );
    const outOfStockProducts = products.filter(
      (p) => (Number(p.inventory) || 0) <= 0,
    );

    return {
      totalRevenue,
      completedRevenue,
      totalOrders: orders.length,
      pendingOrdersCount,
      completedOrdersCount,
      failedOrdersCount,
      totalProducts: products.length,
      totalCustomers: customers.length,
      totalCollections: collections.length,
      activeCoupons: coupons.filter((c) => c.is_active).length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockProducts,
    };
  }, [orders, products, customers, coupons, collections]);

  // 2. 7-Day Revenue & Orders Sparkline / Area Chart
  const salesChartData = useMemo(() => {
    const days: { label: string; dateStr: string; revenue: number; orders: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = isBn
        ? ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"][d.getDay()]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];

      days.push({
        label: `${dayName} (${d.getDate()})`,
        dateStr,
        revenue: 0,
        orders: 0,
      });
    }

    orders.forEach((o) => {
      if (!o.placed_at) return;
      const orderDate = o.placed_at.split("T")[0];
      const target = days.find((day) => day.dateStr === orderDate);
      if (target) {
        const itemsTotal = (o.items || []).reduce((acc, it) => {
          const p = Number(it.unit_price) || 0;
          const q = Number(it.quantity) || 0;
          return acc + p * q;
        }, 0);
        const delivery = Number(o.delivery_charge) || 0;
        target.revenue += itemsTotal + delivery;
        target.orders += 1;
      }
    });

    return days;
  }, [orders, isBn]);

  // 3. Top 5 Best Selling Products
  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (Number(b.units_sold) || 0) - (Number(a.units_sold) || 0))
      .slice(0, 5);
  }, [products]);

  // 4. Recent 5 Orders
  const recentOrders = useMemo(() => {
    return [...orders].slice(0, 5);
  }, [orders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "C":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-visible/15 text-visible border border-visible/30">
            {isBn ? "সম্পন্ন" : "Complete"}
          </span>
        );
      case "P":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/20 text-accent border border-accent/40 animate-pulse">
            {isBn ? "পেন্ডিং" : "Pending"}
          </span>
        );
      case "F":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-hidden/15 text-hidden border border-hidden/30">
            {isBn ? "ব্যর্থ" : "Failed"}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-foreground/10 text-foreground/70 border border-foreground/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* 🌟 Welcome Banner with Quick Shortcuts */}
      <div className="relative overflow-hidden bg-primary rounded-3xl p-6 sm:p-8 text-button-fg border border-foreground/10 shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-visible animate-ping" />
              <span className="text-[11px] font-black uppercase tracking-widest text-accent">
                {isBn ? "লাইভ স্টোর সামারি" : "Live Store Overview"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              {isBn ? "স্বাগতম, অ্যাডমিন ড্যাশবোর্ড" : "Welcome to VibeMart HQ"}
            </h1>
            <p className="text-xs sm:text-sm opacity-80 mt-1 max-w-xl font-medium">
              {isBn
                ? "এখানে আপনার ই-কমার্সের সকল মূল পরিসংখ্যান, পেন্ডিং অর্ডার ও বিক্রির রিয়েলটাইম গ্রাফ এক নজরে দেখতে পারবেন।"
                : "Real-time key metrics, pending orders, sales momentum, and inventory health in one unified command center."}
            </p>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigateTab("orders")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-button-fg text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <span>{isBn ? "অর্ডার দেখুন" : "View Orders"}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-primary text-button-fg text-[10px] font-black">
                {metrics.pendingOrdersCount}
              </span>
            </button>
            <button
              onClick={() => onNavigateTab("analytics")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/15 hover:bg-secondary/25 text-button-fg text-xs font-bold uppercase tracking-wider border border-foreground/15 transition-all cursor-pointer"
            >
              <span>{isBn ? "পুরো রিপোর্ট" : "Full Analytics"}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Decorative ambient backdrop */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 📊 KPI Metric Cards (Clickable to jump to specific tabs) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Sales / Revenue */}
        <div
          onClick={() => onNavigateTab("analytics")}
          className="group p-5 sm:p-6 rounded-2xl bg-secondary border border-foreground/10 hover:border-accent/50 shadow-sm transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider opacity-70">
              {isBn ? "মোট রাজস্ব (বিক্রি)" : "Total Revenue"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-foreground group-hover:text-accent transition-colors">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <div className="flex items-center justify-between text-[11px] opacity-60 mt-1 font-medium">
              <span>{isBn ? "পরিশোধিত:" : "Paid:"} {formatCurrency(metrics.completedRevenue)}</span>
              <span className="text-accent font-bold group-hover:underline">➔</span>
            </div>
          </div>
        </div>

        {/* Total & Pending Orders */}
        <div
          onClick={() => onNavigateTab("orders")}
          className="group p-5 sm:p-6 rounded-2xl bg-secondary border border-foreground/10 hover:border-accent/50 shadow-sm transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider opacity-70">
              {isBn ? "মোট অর্ডার" : "Total Orders"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-foreground group-hover:text-accent transition-colors flex items-baseline gap-2">
              <span>{metrics.totalOrders}</span>
              {metrics.pendingOrdersCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold">
                  {metrics.pendingOrdersCount} {isBn ? "পেন্ডিং" : "Pending"}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] opacity-60 mt-1 font-medium">
              <span>{metrics.completedOrdersCount} {isBn ? "সম্পন্ন অর্ডার" : "Completed"}</span>
              <span className="text-accent font-bold group-hover:underline">➔</span>
            </div>
          </div>
        </div>

        {/* Active Products & Stock Status */}
        <div
          onClick={() => onNavigateTab("products")}
          className="group p-5 sm:p-6 rounded-2xl bg-secondary border border-foreground/10 hover:border-accent/50 shadow-sm transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider opacity-70">
              {isBn ? "পণ্য ও স্টক" : "Active Products"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-foreground group-hover:text-accent transition-colors flex items-baseline gap-2">
              <span>{metrics.totalProducts}</span>
              {metrics.lowStockCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-hidden/15 text-hidden font-bold">
                  {metrics.lowStockCount} {isBn ? "লো স্টক" : "Low Stock"}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] opacity-60 mt-1 font-medium">
              <span>{metrics.totalCollections} {isBn ? "কালেকশন / ক্যাটাগরি" : "Collections"}</span>
              <span className="text-accent font-bold group-hover:underline">➔</span>
            </div>
          </div>
        </div>

        {/* Registered Customers */}
        <div
          onClick={() => onNavigateTab("customers")}
          className="group p-5 sm:p-6 rounded-2xl bg-secondary border border-foreground/10 hover:border-accent/50 shadow-sm transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider opacity-70">
              {isBn ? "গ্রাহক সংখ্যা" : "Registered Customers"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-foreground group-hover:text-accent transition-colors">
              {metrics.totalCustomers}
            </div>
            <div className="flex items-center justify-between text-[11px] opacity-60 mt-1 font-medium">
              <span>{metrics.activeCoupons} {isBn ? "সক্রিয় কুপন কোড" : "Active Coupons"}</span>
              <span className="text-accent font-bold group-hover:underline">➔</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📈 Middle Row: 7-Day Sales Trend & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* 7-Day Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
                  {isBn ? "গত ৭ দিনের বিক্রির গতিপ্রকৃতি" : "Last 7 Days Revenue Trend"}
                </h2>
              </div>
              <p className="text-xs opacity-70 mt-0.5">
                {isBn
                  ? "দৈনিক মোট অর্ডারের রাজস্ব ও ট্রেন্ড"
                  : "Daily sales revenue and order volume overview"}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("analytics")}
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isBn ? "বিস্তারিত অ্যানালিটিক্স" : "Detailed Analytics"}</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={salesChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dashboardSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis
                  dataKey="label"
                  stroke="currentColor"
                  opacity={0.6}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="currentColor"
                  opacity={0.6}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `৳${v}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-primary text-button-fg p-3 rounded-xl border border-foreground/10 shadow-xl text-xs space-y-1 font-bold">
                          <p className="opacity-70 text-[10px] uppercase">{data.label}</p>
                          <p className="text-accent text-sm">{formatCurrency(data.revenue)}</p>
                          <p className="opacity-80 font-normal">
                            {data.orders} {isBn ? "টি অর্ডার" : "Orders"}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--accent)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#dashboardSalesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Products Leaderboard */}
        <div className="bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                  {isBn ? "সেরা বিক্রিত পণ্য" : "Top Selling Products"}
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab("products")}
                className="text-xs font-bold text-accent hover:underline cursor-pointer"
              >
                {isBn ? "সকল পণ্য" : "All Products"}
              </button>
            </div>

            <div className="divide-y divide-foreground/10">
              {topProducts.length === 0 ? (
                <div className="py-8 text-center text-xs opacity-60">
                  {isBn ? "কোনো পণ্য পাওয়া যায়নি" : "No products available"}
                </div>
              ) : (
                topProducts.map((prod, idx) => (
                  <div
                    key={prod.id}
                    onClick={() => onNavigateTab("products")}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-foreground/5 px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-black w-4 text-center opacity-50">
                        #{idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-foreground/10 overflow-hidden shrink-0 relative">
                        {prod.images && prod.images[0] ? (
                          <img
                            src={prod.images[0].image}
                            alt={prod.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] opacity-40">
                            IMG
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          {prod.title}
                        </h4>
                        <span className="text-[10px] text-accent font-extrabold">
                          {formatCurrency(prod.discounted_price || prod.unit_price)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-foreground">
                        {prod.units_sold || 0}
                      </span>
                      <span className="block text-[9px] opacity-60 uppercase font-bold">
                        {isBn ? "বিক্রি" : "Sold"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("analytics")}
            className="w-full mt-4 py-2.5 rounded-xl border border-foreground/15 text-xs font-bold uppercase tracking-wider hover:bg-foreground/5 transition-all text-center cursor-pointer"
          >
            {isBn ? "পণ্য পারফরম্যান্স অ্যানালিটিক্স" : "Product Sales Insights"}
          </button>
        </div>
      </div>

      {/* 📦 Bottom Row: Recent Orders & Stock Alert Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Recent Orders Table (Clickable to jump into Orders Tab) */}
        <div className="lg:col-span-2 bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-visible" />
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
                  {isBn ? "সাম্প্রতিক অর্ডারসমূহ" : "Recent Orders"}
                </h2>
              </div>
              <p className="text-xs opacity-70 mt-0.5">
                {isBn
                  ? "সর্বশেষ প্লেস করা অর্ডারের তাৎক্ষণিক তালিকা"
                  : "Quick glance at newly placed customer orders"}
              </p>
            </div>

            <button
              onClick={() => onNavigateTab("orders")}
              className="px-3.5 py-1.5 rounded-xl bg-button-bg text-button-fg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-xs cursor-pointer"
            >
              {isBn ? "সকল অর্ডার দেখুন" : "View All Orders"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-foreground/10 text-[10px] font-black uppercase tracking-wider opacity-60">
                  <th className="pb-3 px-2">{isBn ? "অর্ডার আইডি" : "Order ID"}</th>
                  <th className="pb-3 px-2">{isBn ? "গ্রাহক / ফোন" : "Customer / Phone"}</th>
                  <th className="pb-3 px-2">{isBn ? "মূল্য" : "Total"}</th>
                  <th className="pb-3 px-2">{isBn ? "স্ট্যাটাস" : "Status"}</th>
                  <th className="pb-3 px-2 text-right">{isBn ? "অ্যাকশন" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10 font-medium">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center opacity-60">
                      {isBn ? "কোনো অর্ডার পাওয়া যায়নি" : "No recent orders found"}
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => {
                    const total =
                      (ord.items || []).reduce(
                        (a, it) => a + (Number(it.unit_price) || 0) * (Number(it.quantity) || 0),
                        0,
                      ) + (Number(ord.delivery_charge) || 0);

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => {
                          if (onNavigateOrder) onNavigateOrder(ord);
                          else onNavigateTab("orders");
                        }}
                        className="hover:bg-foreground/5 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-2 font-black text-foreground group-hover:text-accent">
                          #{ord.id}
                        </td>
                        <td className="py-3.5 px-2">
                          <div className="font-bold text-foreground truncate max-w-[150px]">
                            {ord.customer_name || ord.phone || "Guest"}
                          </div>
                          {ord.phone && ord.customer_name && (
                            <span className="text-[10px] opacity-60">{ord.phone}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-2 font-bold text-accent">
                          {formatCurrency(total)}
                        </td>
                        <td className="py-3.5 px-2">
                          {getStatusBadge(ord.payment_status)}
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <span className="text-xs font-bold text-accent group-hover:underline">
                            {isBn ? "বিস্তারিত" : "Manage"} ➔
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock & Low-Inventory Alert Widget */}
        <div className="bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-hidden" />
                <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                  {isBn ? "স্টক অ্যালার্ট" : "Stock Alert Watch"}
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab("products")}
                className="text-xs font-bold text-accent hover:underline cursor-pointer"
              >
                {isBn ? "স্টক ম্যানেজ" : "Manage"}
              </button>
            </div>

            <p className="text-xs opacity-70 mb-4">
              {isBn
                ? "যেসব পণ্যের স্টক শেষ বা ৫ টির কম রয়েছে"
                : "Products with 5 or fewer items remaining"}
            </p>

            <div className="space-y-3">
              {metrics.lowStockProducts.length === 0 && metrics.outOfStockCount === 0 ? (
                <div className="p-6 rounded-2xl bg-visible/10 border border-visible/20 text-center space-y-1">
                  <span className="text-lg">✅</span>
                  <h4 className="text-xs font-black uppercase text-visible">
                    {isBn ? "সকল পণ্যের স্বাস্থ্যকর স্টক রয়েছে" : "Stock Levels Healthy"}
                  </h4>
                  <p className="text-[10px] opacity-70">
                    {isBn ? "কোনো পণ্যে সংকট নেই" : "No critical low-stock items"}
                  </p>
                </div>
              ) : (
                <>
                  {metrics.lowStockProducts.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onNavigateTab("products")}
                      className="p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          {p.title}
                        </h4>
                        <span className="text-[10px] opacity-60">ID: #{p.id}</span>
                      </div>
                      <div className="shrink-0 px-2.5 py-1 rounded-xl bg-hidden/15 text-hidden text-xs font-black">
                        {p.inventory} {isBn ? "টি বাকি" : "left"}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("products")}
            className="w-full mt-4 py-2.5 rounded-xl bg-button-bg text-button-fg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all text-center cursor-pointer shadow-xs"
          >
            {isBn ? "স্টক আপডেট করুন" : "Refill Inventory"}
          </button>
        </div>
      </div>
    </div>
  );
}
