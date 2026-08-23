import { useState, useMemo } from "react";
import { Order, Product, CustomerItem, CouponItem, AnalyticsSubTab } from "../../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
  const [chartLimit, setChartLimit] = useState<"5" | "10" | "all">("10");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

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

    // Prepare chart data (Top 5, Top 10, or All)
    const sortedStats = [...statsList].sort(
      (a, b) => b.usageCount - a.usageCount || b.totalRevenue - a.totalRevenue
    );

    const limitedStats =
      chartLimit === "5"
        ? sortedStats.slice(0, 5)
        : chartLimit === "10"
        ? sortedStats.slice(0, 10)
        : sortedStats;

    const chartData = limitedStats.map((item) => ({
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
  }, [coupons, orders, couponSearch, chartLimit]);

  // 3. PAYMENT METHODS BREAKDOWN MATHEMATICAL CALCULATIONS
  const paymentStats = useMemo(() => {
    const methods = {
      bkash: { label: "bKash", count: 0, revenue: 0, completedCount: 0 },
      nagad: { label: "Nagad", count: 0, revenue: 0, completedCount: 0 },
      cod: { label: "Cash on Delivery (COD)", count: 0, revenue: 0, completedCount: 0 },
      vibecoin: { label: "VibeCoin Wallet", count: 0, revenue: 0, completedCount: 0 },
      other: { label: "Other / Direct", count: 0, revenue: 0, completedCount: 0 },
    };

    let grandTotalRevenue = 0;
    let grandTotalOrders = 0;

    orders.forEach((order) => {
      const total = getOrderTotal(order);
      grandTotalRevenue += total;
      grandTotalOrders += 1;

      const rawMethod = (order.payment_method || "").trim().toUpperCase();
      let key: keyof typeof methods = "other";

      if (rawMethod === "B" || rawMethod === "O" || rawMethod.includes("BKASH") || rawMethod.includes("ONLINE")) {
        key = "bkash";
      } else if (rawMethod === "N" || rawMethod.includes("NAGAD")) {
        key = "nagad";
      } else if (rawMethod === "C" || rawMethod.includes("COD") || rawMethod.includes("CASH")) {
        key = "cod";
      } else if (rawMethod === "V" || rawMethod.includes("VIBE") || rawMethod.includes("COIN")) {
        key = "vibecoin";
      }

      methods[key].count += 1;
      methods[key].revenue += total;
      if (order.payment_status === "C") {
        methods[key].completedCount += 1;
      }
    });

    const methodColorMap: Record<string, string> = {
      bkash: "var(--bkash)",
      nagad: "var(--nagad)",
      cod: "#1e1e24",
      vibecoin: "#b8977e",
      other: "#6b7280",
    };

    const list = Object.entries(methods).map(([key, data]) => {
      const orderSharePct = grandTotalOrders > 0 ? (data.count / grandTotalOrders) * 100 : 0;
      const revenueSharePct = grandTotalRevenue > 0 ? (data.revenue / grandTotalRevenue) * 100 : 0;
      const avgValue = data.count > 0 ? data.revenue / data.count : 0;

      return {
        key,
        label: data.label,
        count: data.count,
        revenue: data.revenue,
        completedCount: data.completedCount,
        orderSharePct: Math.round(orderSharePct * 10) / 10,
        revenueSharePct: Math.round(revenueSharePct * 10) / 10,
        avgValue: Math.round(avgValue * 100) / 100,
        color: methodColorMap[key] || "#6b7280",
      };
    }).filter(m => m.count > 0 || m.key !== "other");

    // Donut chart distribution data
    const pieData = list.map((item) => ({
      key: item.key,
      name: item.label,
      value: Math.round(item.revenue),
      orders: item.count,
      pct: item.revenueSharePct,
      color: item.color,
    }));

    return {
      list,
      pieData,
      grandTotalRevenue,
      grandTotalOrders,
    };
  }, [orders]);

  // 4. TOP SELLING PRODUCTS & SHADE VARIANTS MATHEMATICAL CALCULATIONS
  const [productSearch, setProductSearch] = useState<string>("");
  const [productLimit, setProductLimit] = useState<"5" | "10" | "all">("10");

  const productPerformanceStats = useMemo(() => {
    const productMap: Record<
      number,
      {
        id: number;
        title: string;
        image?: string;
        unitPrice: number;
        totalUnitsSold: number;
        totalRevenue: number;
        ordersCount: number;
        shadesMap: Record<
          string,
          {
            shadeName: string;
            colorCode?: string;
            unitsSold: number;
            revenue: number;
          }
        >;
      }
    > = {};

    // Map existing products
    products.forEach((p) => {
      productMap[p.id] = {
        id: p.id,
        title: p.title,
        image: p.images?.[0]?.image || "",
        unitPrice: Number(p.unit_price) || 0,
        totalUnitsSold: 0,
        totalRevenue: 0,
        ordersCount: 0,
        shadesMap: {},
      };
    });

    // Aggregate over order items
    let overallUnitsSold = 0;
    let overallCatalogRevenue = 0;

    orders.forEach((order) => {
      (order.items || []).forEach((it) => {
        const prodId = it.product?.id;
        if (!prodId) return;

        const qty = Number(it.quantity) || 0;
        const price = Number(it.unit_price) || 0;
        const itemRevenue = qty * price;

        overallUnitsSold += qty;
        overallCatalogRevenue += itemRevenue;

        if (!productMap[prodId]) {
          productMap[prodId] = {
            id: prodId,
            title: it.product?.title || `Product #${prodId}`,
            image: it.product?.images?.[0]?.image || "",
            unitPrice: price,
            totalUnitsSold: 0,
            totalRevenue: 0,
            ordersCount: 0,
            shadesMap: {},
          };
        }

        const prodRecord = productMap[prodId];
        prodRecord.totalUnitsSold += qty;
        prodRecord.totalRevenue += itemRevenue;
        prodRecord.ordersCount += 1;

        // Shade variant attribution
        const variant = it.variant;
        const shadeName = variant?.color_name || it.variant_title || "Standard / Base";
        const colorCode = variant?.color_code || "";

        if (!prodRecord.shadesMap[shadeName]) {
          prodRecord.shadesMap[shadeName] = {
            shadeName,
            colorCode,
            unitsSold: 0,
            revenue: 0,
          };
        }

        prodRecord.shadesMap[shadeName].unitsSold += qty;
        prodRecord.shadesMap[shadeName].revenue += itemRevenue;
      });
    });

    const allProductsList = Object.values(productMap)
      .filter((p) => p.title.toLowerCase().includes(productSearch.toLowerCase().trim()))
      .sort((a, b) => b.totalRevenue - a.totalRevenue || b.totalUnitsSold - a.totalUnitsSold);

    // Global Top Shades leaderboard
    const allShadesList: {
      productTitle: string;
      shadeName: string;
      colorCode?: string;
      unitsSold: number;
      revenue: number;
    }[] = [];

    Object.values(productMap).forEach((p) => {
      Object.values(p.shadesMap).forEach((s) => {
        if (s.unitsSold > 0) {
          allShadesList.push({
            productTitle: p.title,
            shadeName: s.shadeName,
            colorCode: s.colorCode,
            unitsSold: s.unitsSold,
            revenue: s.revenue,
          });
        }
      });
    });

    allShadesList.sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue);

    // Chart Data Slice
    const limitedProducts =
      productLimit === "5"
        ? allProductsList.slice(0, 5)
        : productLimit === "10"
        ? allProductsList.slice(0, 10)
        : allProductsList;

    const chartData = limitedProducts.map((p) => ({
      name: p.title.length > 15 ? p.title.substring(0, 15) + "..." : p.title,
      fullName: p.title,
      revenue: Math.round(p.totalRevenue),
      units: p.totalUnitsSold,
    }));

    return {
      productsList: allProductsList,
      allShadesList: allShadesList.slice(0, 10),
      chartData,
      overallUnitsSold,
      overallCatalogRevenue,
      topProduct: allProductsList[0] || null,
    };
  }, [products, orders, productSearch, productLimit]);

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
            {/* Revenue & Usage Bar Chart (7 cols) */}
            <div className="lg:col-span-7 bg-foreground/5 border border-foreground/10 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Top Coupon Performance
                  </h3>
                  <p className="text-[11px] opacity-50 mt-0.5">
                    Comparison of order redemptions vs. revenue generated (৳ BDT)
                  </p>
                </div>

                {/* Filter / Limit Buttons */}
                <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl border border-foreground/10">
                  {(
                    [
                      { id: "5", label: "Top 5" },
                      { id: "10", label: "Top 10" },
                      { id: "all", label: "All" },
                    ] as const
                  ).map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setChartLimit(btn.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                        chartLimit === btn.id
                          ? "bg-button-bg text-button-fg shadow-xs"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {couponStats.chartData.length > 0 ? (
                <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                  <div
                    className="h-72"
                    style={{
                      minWidth:
                        couponStats.chartData.length > 8
                          ? `${couponStats.chartData.length * 45}px`
                          : "100%",
                    }}
                  >
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

      {/* 3. PAYMENT METHODS BREAKDOWN SUBSECTION */}
      {activeSubTab === "payments" && (
        <div className="bg-secondary text-foreground p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-foreground/10">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </span>
                <h2 className="text-base font-black uppercase tracking-widest text-foreground">
                  Payment Methods Breakdown
                </h2>
              </div>
              <p className="text-xs opacity-60 mt-1">
                Distribution of orders, transaction volumes, and revenues across COD, bKash, Nagad, and VibeCoin.
              </p>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Total Transaction Volume
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  ৳{paymentStats.grandTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold text-accent">
                ● Across all channels
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Total Processed Orders
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {paymentStats.grandTotalOrders}
                </span>
                <span className="text-xs font-bold opacity-60">orders</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                In store database
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Leading Gateway
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-accent">
                  {[...paymentStats.list].sort((a, b) => b.revenue - a.revenue)[0]?.label || "N/A"}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                By generated revenue
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Digital vs COD Share
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {Math.round(
                    paymentStats.list
                      .filter((p) => p.key !== "cod")
                      .reduce((acc, c) => acc + c.revenueSharePct, 0)
                  )}
                  %
                </span>
                <span className="text-xs font-bold opacity-60">digital share</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                bKash, Nagad & VibeCoins
              </div>
            </div>
          </div>

          {/* Donut & Table Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            {/* Donut Chart (5 cols) */}
            <div className="lg:col-span-5 bg-foreground/5 border border-foreground/10 rounded-2xl p-5 flex flex-col justify-between transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Revenue Share by Gateway
                  </h3>
                  <p className="text-[11px] opacity-50 mt-0.5">
                    Percentage distribution of sales
                  </p>
                </div>
                {selectedPaymentMethod && (
                  <button
                    onClick={() => setSelectedPaymentMethod(null)}
                    className="text-[10px] font-bold px-2 py-0.5 bg-foreground/10 hover:bg-foreground/20 rounded-md text-foreground transition-all cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {paymentStats.pieData.length > 0 ? (
                <div className="w-full h-72 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStats.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        onClick={(data) => {
                          const key = data && typeof data.key === "string" ? data.key : String(data?.key ?? "");
                          if (key) {
                            setSelectedPaymentMethod((prev) => (prev === key ? null : key));
                          }
                        }}
                        cursor="pointer"
                      >
                        {paymentStats.pieData.map((entry, index) => {
                          const isSelected = selectedPaymentMethod === entry.key;
                          const isDimmed = Boolean(selectedPaymentMethod && !isSelected);

                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke={isSelected ? "var(--foreground)" : "var(--secondary)"}
                              strokeWidth={isSelected ? 3 : 2}
                              opacity={isDimmed ? 0.25 : 1}
                              className="transition-all duration-300 cursor-pointer"
                            />
                          );
                        })}
                      </Pie>
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
                        formatter={(val: any, name: any, item: any) => [
                          `৳${Number(val).toLocaleString()} (${item.payload.pct}%)`,
                          name,
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px", fontWeight: 700, paddingTop: "10px", cursor: "pointer" }}
                        onClick={(e: any) => {
                          const matched = paymentStats.pieData.find((p) => p.name === e.value);
                          if (matched) {
                            setSelectedPaymentMethod((prev) => (prev === matched.key ? null : matched.key));
                          }
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Selected Gateway Highlight Badge */}
                  {selectedPaymentMethod && (
                    (() => {
                      const selectedItem = paymentStats.list.find((m) => m.key === selectedPaymentMethod);
                      if (!selectedItem) return null;
                      return (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center pb-8">
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                            {selectedItem.label}
                          </span>
                          <span className="text-sm font-black text-foreground">
                            {selectedItem.revenueSharePct}%
                          </span>
                        </div>
                      );
                    })()
                  )}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center opacity-50 text-xs font-bold">
                  No payment data available.
                </div>
              )}
            </div>

            {/* Gateway Breakdown Table (7 cols) */}
            <div className="lg:col-span-7 bg-foreground/5 border border-foreground/10 rounded-2xl p-5 flex flex-col justify-between">
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Gateway Performance Audit
                  </h3>
                  <p className="text-[11px] opacity-50 mt-0.5">
                    Click any row to focus on that gateway in the charts
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-foreground/10 opacity-60 text-[10px] font-black uppercase tracking-wider">
                      <th className="pb-3">Gateway</th>
                      <th className="pb-3 text-right">Orders</th>
                      <th className="pb-3 text-right">Order Share</th>
                      <th className="pb-3 text-right">Settled Count</th>
                      <th className="pb-3 text-right">Avg Ticket</th>
                      <th className="pb-3 text-right">Revenue (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/5">
                    {paymentStats.list.map((m) => {
                      const isSelected = selectedPaymentMethod === m.key;
                      return (
                        <tr
                          key={m.key}
                          onClick={() =>
                            setSelectedPaymentMethod((prev) => (prev === m.key ? null : m.key))
                          }
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "bg-foreground/15 ring-2 ring-accent/60 font-black rounded-lg scale-[1.01]"
                              : "hover:bg-foreground/5 opacity-90 hover:opacity-100"
                          }`}
                        >
                          <td className="py-3.5 px-2 font-black flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-full transition-transform ${
                                isSelected ? "scale-125 ring-2 ring-foreground/40 shadow-xs" : ""
                              }`}
                              style={{
                                backgroundColor: m.color,
                              }}
                            />
                            <span className={isSelected ? "text-accent underline font-black" : ""}>
                              {m.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right font-bold opacity-80">{m.count}</td>
                          <td className="py-3.5 px-2 text-right font-bold text-accent">{m.orderSharePct}%</td>
                          <td className="py-3.5 px-2 text-right font-semibold opacity-70">
                            {m.completedCount} / {m.count}
                          </td>
                          <td className="py-3.5 px-2 text-right font-semibold opacity-80">
                            ৳{m.avgValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-2 text-right font-black text-foreground">
                            ৳{m.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TOP SELLING PRODUCTS & SHADE VARIANTS SUBSECTION */}
      {activeSubTab === "top-products" && (
        <div className="bg-secondary text-foreground p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-foreground/10">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </span>
                <h2 className="text-base font-black uppercase tracking-widest text-foreground">
                  Top Selling Products & Shade Variants
                </h2>
              </div>
              <p className="text-xs opacity-60 mt-1">
                Deep dive into best-selling cosmetics, shade velocity, units moved, and product revenue contributions.
              </p>
            </div>

            {/* Product Quick Search */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search product..."
                className="w-full px-4 py-2 bg-background border border-foreground/15 rounded-xl text-xs font-bold text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>
          </div>

          {/* Product KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Total Units Sold
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {productPerformanceStats.overallUnitsSold}
                </span>
                <span className="text-xs font-bold opacity-60">items ordered</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                Across all orders
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                #1 Bestseller Product
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-black text-accent truncate">
                  {productPerformanceStats.topProduct?.title || "N/A"}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {productPerformanceStats.topProduct?.totalUnitsSold || 0} units sold
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Item Catalog Revenue
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  ৳{productPerformanceStats.overallCatalogRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold text-accent">
                ● Product subtotal volume
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                Distinct Shades Active
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {productPerformanceStats.allShadesList.length}
                </span>
                <span className="text-xs font-bold opacity-60">shades recorded</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                With purchase history
              </div>
            </div>
          </div>

          {/* Product Charts and Shade Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            {/* Product Performance Bar Chart (7 cols) */}
            <div className="lg:col-span-7 bg-foreground/5 border border-foreground/10 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Product Revenue Velocity
                  </h3>
                  <p className="text-[11px] opacity-50 mt-0.5">
                    Gross revenue (৳ BDT) vs. Total Units Sold per item
                  </p>
                </div>

                {/* Filter Limit Buttons */}
                <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl border border-foreground/10">
                  {(
                    [
                      { id: "5", label: "Top 5" },
                      { id: "10", label: "Top 10" },
                      { id: "all", label: "All" },
                    ] as const
                  ).map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setProductLimit(btn.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                        productLimit === btn.id
                          ? "bg-button-bg text-button-fg shadow-xs"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {productPerformanceStats.chartData.length > 0 ? (
                <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                  <div
                    className="h-72"
                    style={{
                      minWidth:
                        productPerformanceStats.chartData.length > 8
                          ? `${productPerformanceStats.chartData.length * 55}px`
                          : "100%",
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={productPerformanceStats.chartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="var(--foreground)"
                          opacity={0.1}
                        />
                        <XAxis
                          dataKey="name"
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
                            name === "Revenue (৳)" ? `৳${Number(value).toLocaleString()}` : `${value} units`,
                            name,
                          ]}
                          labelFormatter={(label, payload) => {
                            const item = payload?.[0]?.payload;
                            return item?.fullName || label;
                          }}
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
                          name="Units Sold"
                          dataKey="units"
                          fill="var(--foreground)"
                          fillOpacity={0.65}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center opacity-50 text-xs font-bold text-center">
                  <span className="text-3xl mb-2">💄</span>
                  No sales recorded for products yet.
                </div>
              )}
            </div>

            {/* Top Shades Leaderboard (5 cols) */}
            <div className="lg:col-span-5 bg-foreground/5 border border-foreground/10 rounded-2xl p-5 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Top Shade Variants
                </h3>
                <span className="text-[10px] font-bold opacity-60">
                  {productPerformanceStats.allShadesList.length} top shades
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-72 space-y-2 pr-1 custom-scrollbar">
                {productPerformanceStats.allShadesList.length > 0 ? (
                  productPerformanceStats.allShadesList.map((s, idx) => (
                    <div
                      key={`${s.productTitle}-${s.shadeName}-${idx}`}
                      className="p-3 bg-background/60 hover:bg-background rounded-xl border border-foreground/10 transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {s.colorCode ? (
                          <span
                            className="w-4 h-4 rounded-full border border-foreground/20 shrink-0 shadow-xs"
                            style={{ backgroundColor: s.colorCode }}
                            title={s.colorCode}
                          />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-accent/20 border border-accent/40 shrink-0 flex items-center justify-center text-[8px] font-black text-accent">
                            ✦
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="font-extrabold text-foreground truncate">
                            {s.shadeName}
                          </div>
                          <div className="text-[10px] opacity-60 truncate">
                            {s.productTitle}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black text-foreground">
                          {s.unitsSold} {s.unitsSold === 1 ? "unit" : "units"}
                        </div>
                        <div className="text-[10px] font-bold text-accent">
                          ৳{s.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center opacity-50 text-xs font-bold">
                    No variant sales data recorded yet.
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
