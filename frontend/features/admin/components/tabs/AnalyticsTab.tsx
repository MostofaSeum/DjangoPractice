import { useState, useMemo } from "react";
import { Order, Product, CustomerItem, CouponItem } from "../../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type TimeRange = "24h" | "7d" | "15d" | "30d";

interface AnalyticsTabProps {
  orders?: Order[];
  products?: Product[];
  customers?: CustomerItem[];
  coupons?: CouponItem[];
  analyticsSubTab?: AnalyticsSubTab;
  onSubTabChange?: (subTab: AnalyticsSubTab) => void;
}

export default function AnalyticsTab({
  orders = [],
  products = [],
  customers = [],
  coupons = [],
  analyticsSubTab = "sales",
  onSubTabChange,
}: AnalyticsTabProps) {
  const [internalSubTab, setInternalSubTab] = useState<AnalyticsSubTab>("sales");
  const activeSubTab = onSubTabChange ? analyticsSubTab : internalSubTab;
  const setActiveSubTab = (sub: AnalyticsSubTab) => {
    if (onSubTabChange) onSubTabChange(sub);
    else setInternalSubTab(sub);
  };
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [couponSearch, setCouponSearch] = useState<string>("");

  // Helper to compute order total
  const getOrderTotal = (order: Order): number => {
    const itemsTotal = (order.items || []).reduce((acc, it) => {
      const price = Number(it.unit_price) || 0;
      const qty = Number(it.quantity) || 0;
      return acc + price * qty;
    }, 0);
    const delivery = Number(order.delivery_charge) || 0;
    return itemsTotal + delivery;
  };

  // Filter and aggregate sales based on selected time range
  const { chartData, totalSales, totalOrdersCount, avgOrderValue, completedSales } =
    useMemo(() => {
      const now = new Date();

      if (timeRange === "24h") {
        const numSlots = 8;
        const slotDurationMs = (24 / numSlots) * 60 * 60 * 1000;
        const startTimestamp = now.getTime() - 24 * 60 * 60 * 1000;

        const buckets: {
          slotStart: number;
          slotEnd: number;
          label: string;
          sales: number;
          orders: number;
        }[] = [];

        for (let i = 0; i < numSlots; i++) {
          const s = startTimestamp + i * slotDurationMs;
          const e = s + slotDurationMs;
          const dateObj = new Date(e);
          const hourStr = dateObj.getHours().toString().padStart(2, "0") + ":00";
          buckets.push({
            slotStart: s,
            slotEnd: e,
            label: hourStr,
            sales: 0,
            orders: 0,
          });
        }

        let salesSum = 0;
        let countSum = 0;
        let compSales = 0;

        orders.forEach((o) => {
          if (!o.placed_at) return;
          const orderTime = new Date(o.placed_at).getTime();
          if (isNaN(orderTime)) return;

          if (orderTime >= startTimestamp && orderTime <= now.getTime() + 60000) {
            const tot = getOrderTotal(o);
            salesSum += tot;
            countSum += 1;
            if (o.payment_status === "C") compSales += tot;

            // Find matching bucket
            for (let b of buckets) {
              if (orderTime >= b.slotStart && orderTime <= b.slotEnd) {
                b.sales += tot;
                b.orders += 1;
                break;
              }
            }
          }
        });

        return {
          chartData: buckets.map((b) => ({
            label: b.label,
            sales: b.sales,
            orders: b.orders,
          })),
          totalSales: salesSum,
          totalOrdersCount: countSum,
          avgOrderValue: countSum > 0 ? salesSum / countSum : 0,
          completedSales: compSales,
        };
      }

      // For 7d, 15d, 30d -> Daily Buckets
      const daysCount = timeRange === "7d" ? 7 : timeRange === "15d" ? 15 : 30;
      const dayBuckets: {
        dateStr: string;
        label: string;
        startOfDay: number;
        endOfDay: number;
        sales: number;
        orders: number;
      }[] = [];

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const endD = new Date(d);
        endD.setHours(23, 59, 59, 999);

        const dateStr = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        dayBuckets.push({
          dateStr,
          label,
          startOfDay: d.getTime(),
          endOfDay: endD.getTime(),
          sales: 0,
          orders: 0,
        });
      }

      const cutoffTime = dayBuckets[0].startOfDay;
      let salesSum = 0;
      let countSum = 0;
      let compSales = 0;

      orders.forEach((o) => {
        if (!o.placed_at) return;
        const orderTime = new Date(o.placed_at).getTime();
        if (isNaN(orderTime)) return;

        if (orderTime >= cutoffTime) {
          const tot = getOrderTotal(o);
          salesSum += tot;
          countSum += 1;
          if (o.payment_status === "C") compSales += tot;

          for (let b of dayBuckets) {
            if (orderTime >= b.startOfDay && orderTime <= b.endOfDay) {
              b.sales += tot;
              b.orders += 1;
              break;
            }
          }
        }
      });

      return {
        chartData: dayBuckets.map((b) => ({
          label: b.label,
          sales: b.sales,
          orders: b.orders,
        })),
        totalSales: salesSum,
        totalOrdersCount: countSum,
        avgOrderValue: countSum > 0 ? salesSum / countSum : 0,
        completedSales: compSales,
      };
    }, [orders, timeRange]);

  // Coupon Performance Analytics Calculation
  const couponStats = useMemo(() => {
    // Map existing coupon codes or codes present in orders
    const couponMap: Record<
      string,
      {
        code: string;
        usageCount: number;
        totalRevenue: number;
        totalDiscounts: number;
        discountPercent: number;
        isActive: boolean;
        targetType: string;
      }
    > = {};

    // 1. Initialize with all registered coupons
    coupons.forEach((c) => {
      const normalizedCode = (c.code || "").toUpperCase().trim();
      if (!normalizedCode) return;
      couponMap[normalizedCode] = {
        code: normalizedCode,
        usageCount: 0,
        totalRevenue: 0,
        totalDiscounts: 0,
        discountPercent: Number(c.discount_percent || 0),
        isActive: Boolean(c.is_active),
        targetType: c.target_type || "product",
      };
    });

    // 2. Aggregate from orders
    orders.forEach((order) => {
      const code = (order.coupon_code || "").toUpperCase().trim();
      if (!code) return;

      if (!couponMap[code]) {
        // Handle orders with legacy or removed coupon codes
        couponMap[code] = {
          code: code,
          usageCount: 0,
          totalRevenue: 0,
          totalDiscounts: 0,
          discountPercent: 0,
          isActive: false,
          targetType: "general",
        };
      }

      const orderTot = getOrderTotal(order);
      couponMap[code].usageCount += 1;
      couponMap[code].totalRevenue += orderTot;

      // Estimate total discount granted based on percentage if recorded
      const discPct = couponMap[code].discountPercent;
      if (discPct > 0 && discPct < 100) {
        // Items revenue before discount ~ (itemsTotal) / (1 - discPct/100)
        const itemsTotal = (order.items || []).reduce((acc, it) => {
          return acc + (Number(it.unit_price) || 0) * (Number(it.quantity) || 0);
        }, 0);
        const estimatedDiscount = (itemsTotal / (1 - discPct / 100)) * (discPct / 100);
        couponMap[code].totalDiscounts += Math.round(estimatedDiscount);
      }
    });

    const statsList = Object.values(couponMap);

    // Summary totals
    const totalCouponUses = statsList.reduce((acc, cur) => acc + cur.usageCount, 0);
    const totalCouponRevenue = statsList.reduce((acc, cur) => acc + cur.totalRevenue, 0);
    const totalDiscountsGranted = statsList.reduce((acc, cur) => acc + cur.totalDiscounts, 0);
    const activeCouponsCount = coupons.filter((c) => c.is_active).length;

    // Filtered list for search
    const filteredList = statsList
      .filter((c) => c.code.toLowerCase().includes(couponSearch.toLowerCase().trim()))
      .sort((a, b) => b.usageCount - a.usageCount || b.totalRevenue - a.totalRevenue);

    // Prepare chart data (top 8 coupons by usage or revenue)
    const chartData = [...statsList]
      .sort((a, b) => b.usageCount - a.usageCount || b.totalRevenue - a.totalRevenue)
      .slice(0, 8)
      .map((item) => ({
        code: item.code,
        uses: item.usageCount,
        revenue: Math.round(item.totalRevenue),
        discounts: Math.round(item.totalDiscounts),
      }));

    return {
      statsList: filteredList,
      chartData,
      totalCouponUses,
      totalCouponRevenue,
      totalDiscountsGranted,
      activeCouponsCount,
    };
  }, [coupons, orders, couponSearch]);

  return (
    <div className="space-y-8">

      {/* 1. SALES & REVENUE ANALYTICS SUBSECTION */}
      {activeSubTab === "sales" && (
        <div className="bg-secondary text-foreground p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-foreground/10">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </span>
                <h2 className="text-base font-black uppercase tracking-widest text-foreground">
                  Sales & Revenue Analytics
                </h2>
              </div>
              <p className="text-xs opacity-60 mt-1">
                Real-time sales breakdown and performance metrics for VibeMart.
              </p>
            </div>

            {/* Time Range Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-primary/5 rounded-2xl border border-foreground/10 self-stretch sm:self-auto justify-between sm:justify-start">
              {(
                [
                  { id: "24h", label: "Last 24h" },
                  { id: "7d", label: "Last 7 Days" },
                  { id: "15d", label: "Last 15 Days" },
                  { id: "30d", label: "Last 30 Days" },
                ] as const
              ).map((tab) => {
                const isActive = timeRange === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTimeRange(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-button-bg text-button-fg shadow-md scale-[1.02]"
                        : "opacity-60 hover:opacity-100 hover:bg-foreground/5"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* 1. Total Sales */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Total Revenue ({timeRange.toUpperCase()})
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  ৳{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-bold text-accent flex items-center gap-1">
                <span>● Complete: ৳{completedSales.toFixed(2)}</span>
              </div>
            </div>

            {/* 2. Total Orders */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Orders Placed
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {totalOrdersCount}
                </span>
                <span className="text-xs font-bold opacity-60">orders</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                In selected time period
              </div>
            </div>

            {/* 3. Average Order Value */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Average Order Value
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  ৳{avgOrderValue.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                Revenue per transaction
              </div>
            </div>

            {/* 4. Active Catalog */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Active Catalog
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {products.length}
                </span>
                <span className="text-xs font-bold opacity-60">products</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                Across all collections
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="mt-8 pt-6 border-t border-foreground/10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Sales Revenue Trend (৳ BDT)
                </h3>
                <p className="text-[11px] opacity-50 mt-0.5">
                  Timeline visualization for {timeRange === "24h" ? "last 24 hours" : `last ${timeRange.replace("d", "")} days`}
                </p>
              </div>

              {/* Area / Bar Chart Switcher */}
              <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl border border-foreground/10">
                <button
                  onClick={() => setChartType("area")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                    chartType === "area"
                      ? "bg-button-bg text-button-fg"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  Area
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                    chartType === "bar"
                      ? "bg-button-bg text-button-fg"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  Bar
                </button>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--foreground)"
                      opacity={0.1}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="var(--foreground)"
                      opacity={0.6}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                    />
                    <YAxis
                      stroke="var(--foreground)"
                      opacity={0.6}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tickFormatter={(val) => `৳${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--secondary)",
                        borderRadius: "16px",
                        border: "1px solid rgba(var(--foreground), 0.15)",
                        color: "var(--foreground)",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "10px 14px",
                      }}
                      itemStyle={{ color: "var(--foreground)" }}
                      labelStyle={{ color: "var(--foreground)", opacity: 0.7 }}
                      formatter={(value: any) => [`৳${Number(value).toFixed(2)}`, "Sales Revenue"]}
                      labelFormatter={(label) => `Timeline: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="var(--accent)"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                      activeDot={{ r: 6, fill: "var(--accent)", stroke: "var(--secondary)", strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--foreground)"
                      opacity={0.1}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="var(--foreground)"
                      opacity={0.6}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                    />
                    <YAxis
                      stroke="var(--foreground)"
                      opacity={0.6}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tickFormatter={(val) => `৳${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--secondary)",
                        borderRadius: "16px",
                        border: "1px solid rgba(var(--foreground), 0.15)",
                        color: "var(--foreground)",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "10px 14px",
                      }}
                      itemStyle={{ color: "var(--foreground)" }}
                      labelStyle={{ color: "var(--foreground)", opacity: 0.7 }}
                      formatter={(value: any) => [`৳${Number(value).toFixed(2)}`, "Sales Revenue"]}
                      labelFormatter={(label) => `Timeline: ${label}`}
                    />
                    <Bar
                      dataKey="sales"
                      fill="var(--accent)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={45}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROMO & COUPON PERFORMANCE SUBSECTION */}
      {activeSubTab === "coupons" && (
        <div className="bg-secondary text-foreground p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-foreground/10">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </span>
                <h2 className="text-base font-black uppercase tracking-widest text-foreground">
                  Promo & Coupon Performance
                </h2>
              </div>
              <p className="text-xs opacity-60 mt-1">
                Track coupon redemptions, total discounts granted, and resulting cart revenues.
              </p>
            </div>

            {/* Quick Search */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                placeholder="Search coupon code..."
                className="w-full px-4 py-2 bg-background border border-foreground/15 rounded-xl text-xs font-bold text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>
          </div>

          {/* Coupon KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Active Coupons */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Active Campaigns
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {couponStats.activeCouponsCount}
                </span>
                <span className="text-xs font-bold opacity-60">coupons live</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {coupons.length} total coupons created
              </div>
            </div>

            {/* Card 2: Times Applied */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Total Redemptions
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {couponStats.totalCouponUses}
                </span>
                <span className="text-xs font-bold opacity-60">times used</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold text-accent">
                ● Applied across customer checkouts
              </div>
            </div>

            {/* Card 3: Total Discounts Granted */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Discounts Granted
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-accent">
                  ৳{couponStats.totalDiscountsGranted.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                Saved by customers
              </div>
            </div>

            {/* Card 4: Revenue Generated */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Coupon Driven Revenue
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  ৳{couponStats.totalCouponRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                From discounted orders
              </div>
            </div>
          </div>

          {/* Coupon Charts & Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            {/* Revenue & Usage Bar Chart (8 cols) */}
            <div className="lg:col-span-7 bg-foreground/5 border border-foreground/10 rounded-2xl p-5 flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Top Coupon Performance
                </h3>
                <p className="text-[11px] opacity-50 mt-0.5">
                  Comparison of order redemptions vs. revenue generated (৳ BDT)
                </p>
              </div>

              {couponStats.chartData.length > 0 ? (
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={couponStats.chartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--foreground)"
                        opacity={0.1}
                      />
                      <XAxis
                        dataKey="code"
                        stroke="var(--foreground)"
                        opacity={0.7}
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="var(--foreground)"
                        opacity={0.6}
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        tickFormatter={(val) => `৳${val}`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="var(--foreground)"
                        opacity={0.6}
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--secondary)",
                          borderRadius: "16px",
                          border: "1px solid rgba(var(--foreground), 0.15)",
                          color: "var(--foreground)",
                          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "10px 14px",
                        }}
                        itemStyle={{ color: "var(--foreground)" }}
                        labelStyle={{ color: "var(--foreground)", fontWeight: 800 }}
                        formatter={(value: any, name: any) => [
                          name === "Revenue (৳)" ? `৳${Number(value).toLocaleString()}` : `${value} orders`,
                          name,
                        ]}
                        labelFormatter={(label) => `Coupon: ${label}`}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px", fontWeight: 700, paddingTop: "10px" }}
                      />
                      <Bar
                        yAxisId="left"
                        name="Revenue (৳)"
                        dataKey="revenue"
                        fill="var(--accent)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                      />
                      <Bar
                        yAxisId="right"
                        name="Redemptions"
                        dataKey="uses"
                        fill="var(--foreground)"
                        fillOpacity={0.65}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center opacity-50 text-xs font-bold text-center">
                  <span className="text-3xl mb-2">🏷️</span>
                  No coupon usage data recorded yet.
                </div>
              )}
            </div>

            {/* Coupon Breakdown Table (5 cols) */}
            <div className="lg:col-span-5 bg-foreground/5 border border-foreground/10 rounded-2xl p-5 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Campaign Directory
                </h3>
                <span className="text-[10px] font-bold opacity-60">
                  {couponStats.statsList.length} total
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-72 space-y-2 pr-1 custom-scrollbar">
                {couponStats.statsList.length > 0 ? (
                  couponStats.statsList.map((c) => (
                    <div
                      key={c.code}
                      className="p-3 bg-background/60 hover:bg-background rounded-xl border border-foreground/10 transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-accent bg-accent/10 px-2 py-0.5 rounded-md text-[11px]">
                            {c.code}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              c.isActive
                                ? "bg-accent/15 text-accent font-black"
                                : "bg-foreground/10 opacity-60 text-foreground"
                            }`}
                          >
                            {c.isActive ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <div className="text-[10px] opacity-60 mt-1">
                          {c.discountPercent > 0 ? `${c.discountPercent}% Discount` : "Special Promo"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold text-foreground">
                          {c.usageCount} {c.usageCount === 1 ? "order" : "orders"}
                        </div>
                        <div className="text-[10px] font-bold text-accent">
                          ৳{c.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center opacity-50 text-xs font-bold">
                    No matching coupons found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
