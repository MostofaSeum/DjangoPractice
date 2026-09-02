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
import { useLanguage } from "@/store/LanguageContext";

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
  const { locale, formatCurrency } = useLanguage();
  const isBn = locale === "bn";

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
        // Build 6 buckets of 4 hours each
        const buckets: {
          label: string;
          slotStart: number;
          slotEnd: number;
          sales: number;
          orders: number;
        }[] = [];

        const fourHoursMs = 4 * 60 * 60 * 1000;
        const startTimestamp = now.getTime() - 24 * 60 * 60 * 1000;

        for (let i = 0; i < 6; i++) {
          const slotStart = startTimestamp + i * fourHoursMs;
          const slotEnd = slotStart + fourHoursMs;
          const d = new Date(slotStart);
          const hours = d.getHours();
          const ampm = hours >= 12 ? (isBn ? "বিকাল/রাত" : "PM") : (isBn ? "সকাল" : "AM");
          const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
          const label = isBn
            ? `${formattedHour.toLocaleString("bn-BD")}:০০ ${ampm}`
            : `${formattedHour}:00 ${ampm}`;

          buckets.push({
            label,
            slotStart,
            slotEnd,
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
        const label = d.toLocaleDateString(isBn ? "bn-BD" : "en-US", {
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
      cod: "var(--button-bg)",
      vibecoin: "var(--accent)",
      other: "var(--foreground)",
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

  // 5. DELIVERY SERVICES & ORDERS LOGISTICS ANALYTICS
  const deliveryAnalytics = useMemo(() => {
    let totalDispatched = 0;
    let deliveredCount = 0;
    let ongoingCount = 0; // in_transit, out_for_delivery, packed, pending
    let returnedCount = 0;
    let totalDeliveryRevenue = 0;

    const courierMap: Record<
      string,
      {
        name: string;
        code: string;
        logo: string | null;
        totalOrders: number;
        delivered: number;
        ongoing: number;
        returned: number;
        pending: number;
        totalValue: number;
      }
    > = {};


    const PRESET_LOGOS: Record<string, string | null> = {
      steadfast: "/DeliveryPartner/steadfast.jpg",
      pathao: "/DeliveryPartner/pathaocourier.png",
      redx: "/DeliveryPartner/redx.png",
      paperfly: "/DeliveryPartner/paperfly.png",
      manual: null,
    };


    orders.forEach((o) => {
      const charge = Number(o.delivery_charge) || 0;
      totalDeliveryRevenue += charge;

      // Identify Courier Service
      let courierKey = "manual";
      let courierName = isBn ? "ম্যানুয়াল ট্র্যাকিং (ইন-হাউস)" : "Manual Tracking (In-House)";
      let providerCode = "manual";

      if (o.courier_partner_details) {
        courierKey = String(o.courier_partner_details.provider_code || o.courier_partner_details.id);
        courierName = o.courier_partner_details.name;
        providerCode = o.courier_partner_details.provider_code;
      } else if (o.courier_partner) {
        courierKey = `partner-${o.courier_partner}`;
        courierName = `Courier Partner #${o.courier_partner}`;
      }

      if (!courierMap[courierKey]) {
        courierMap[courierKey] = {
          name: courierName,
          code: providerCode,
          logo: PRESET_LOGOS[providerCode] || PRESET_LOGOS.manual,
          totalOrders: 0,
          delivered: 0,
          ongoing: 0,
          returned: 0,
          pending: 0,
          totalValue: 0,
        };
      }

      const st = o.tracking_status || "pending";
      const stat = courierMap[courierKey];
      stat.totalOrders += 1;
      stat.totalValue += getOrderTotal(o);
      totalDispatched += 1;

      if (st === "delivered") {
        stat.delivered += 1;
        deliveredCount += 1;
      } else if (st === "returned") {
        stat.returned += 1;
        returnedCount += 1;
      } else if (st === "pending") {
        stat.pending += 1;
        ongoingCount += 1;
      } else {
        // packed, in_transit, out_for_delivery
        stat.ongoing += 1;
        ongoingCount += 1;
      }
    });

    const courierList = Object.values(courierMap).map((c) => {
      const finished = c.delivered + c.returned;
      const successRate =
        finished > 0
          ? Math.round((c.delivered / finished) * 100)
          : c.delivered > 0
          ? 100
          : 0;
      return {
        ...c,
        successRate,
      };
    });

    // Sort by most used (highest totalOrders)
    courierList.sort((a, b) => b.totalOrders - a.totalOrders);

    // Chart Data for Courier Comparison (Most Used vs Success Rate)
    const courierVolumeChart = courierList.map((c) => ({
      name: c.name,
      shortName: c.name.length > 12 ? c.name.substring(0, 10) + "..." : c.name,
      orders: c.totalOrders,
      delivered: c.delivered,
      ongoing: c.ongoing + c.pending,
      returned: c.returned,
      successRate: c.successRate,
    }));

    // Chart Data for Ongoing vs Delivered vs Returned status breakdown
    const statusPieData = [
      {
        name: isBn ? "সফলভাবে ডেলিভার্ড" : "Delivered",
        value: deliveredCount,
        color: "var(--visible)",
      },
      {
        name: isBn ? "চলমান ডেলিভারি (On Going)" : "On Going / In Transit",
        value: ongoingCount,
        color: "var(--accent)",
      },
      {
        name: isBn ? "ফেরত / ব্যর্থ (Returned)" : "Returned / Failed",
        value: returnedCount,
        color: "var(--hidden)",
      },
    ].filter((d) => d.value > 0);

    const overallSuccessRate =
      deliveredCount + returnedCount > 0
        ? Math.round((deliveredCount / (deliveredCount + returnedCount)) * 100)
        : deliveredCount > 0
        ? 100
        : 0;

    return {
      totalDispatched,
      deliveredCount,
      ongoingCount,
      returnedCount,
      totalDeliveryRevenue,
      overallSuccessRate,
      mostUsedCourier: courierList[0] || null,
      courierList,
      courierVolumeChart,
      statusPieData,
    };
  }, [orders, isBn]);

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
                  {isBn ? "বিক্রয় ও আয় অ্যানালিটিক্স" : "Sales & Revenue Analytics"}
                </h2>
              </div>
              <p className="text-xs opacity-60 mt-1">
                {isBn ? "রিয়েল-টাইম বিক্রয় পরিসংখ্যান এবং আয়ের বিস্তারিত রিপোর্ট।" : "Real-time sales breakdown and performance metrics for VibeMart."}
              </p>
            </div>

            {/* Time Range Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-primary/5 rounded-2xl border border-foreground/10 self-stretch sm:self-auto justify-between sm:justify-start">
              {(
                [
                  { id: "24h", label: isBn ? "গত ২৪ ঘন্টা" : "Last 24h" },
                  { id: "7d", label: isBn ? "গত ৭ দিন" : "Last 7 Days" },
                  { id: "15d", label: isBn ? "গত ১৫ দিন" : "Last 15 Days" },
                  { id: "30d", label: isBn ? "গত ৩০ দিন" : "Last 30 Days" },
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
                {isBn ? `মোট আয় (${timeRange === "24h" ? "২৪ ঘন্টা" : timeRange.replace("d", " দিন")})` : `Total Revenue (${timeRange.toUpperCase()})`}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  ৳{totalSales.toLocaleString(isBn ? "bn-BD" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-bold text-accent flex items-center gap-1">
                <span>● {isBn ? "সফল পেমেন্টঃ ৳" : "Complete: ৳"}{completedSales.toLocaleString(isBn ? "bn-BD" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* 2. Total Orders */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "মোট অর্ডার সংখ্যা" : "Orders Placed"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {totalOrdersCount.toLocaleString(isBn ? "bn-BD" : undefined)}
                </span>
                <span className="text-xs font-bold opacity-60">{isBn ? "টি অর্ডার" : "orders"}</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {isBn ? "নির্বাচিত সময়সীমায়" : "In selected time period"}
              </div>
            </div>

            {/* 3. Average Order Value */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "গড় অর্ডার মূল্য (AOV)" : "Average Order Value"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  ৳{avgOrderValue.toLocaleString(isBn ? "bn-BD" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {isBn ? "প্রতি ট্রানজ্যাকশনে গড় আয়" : "Revenue per transaction"}
              </div>
            </div>

            {/* 4. Active Catalog */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "সক্রিয় ক্যাটালগ" : "Active Catalog"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {products.length.toLocaleString(isBn ? "bn-BD" : undefined)}
                </span>
                <span className="text-xs font-bold opacity-60">{isBn ? "টি পণ্য" : "products"}</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {isBn ? "সকল কালেকশন মিলিয়ে" : "Across all collections"}
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="mt-8 pt-6 border-t border-foreground/10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  {isBn ? "বিক্রয় আয়ের গতিধারা (৳ BDT)" : "Sales Revenue Trend (৳ BDT)"}
                </h3>
                <p className="text-[11px] opacity-50 mt-0.5">
                  {isBn
                    ? `${timeRange === "24h" ? "গত ২৪ ঘন্টার" : `গত ${timeRange.replace("d", "")} দিনের`} টাইমলাইন ভিউ`
                    : `Timeline visualization for ${timeRange === "24h" ? "last 24 hours" : `last ${timeRange.replace("d", "")} days`}`}
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
                  {isBn ? "এরিয়া চার্ট" : "Area"}
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                    chartType === "bar"
                      ? "bg-button-bg text-button-fg"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {isBn ? "বার চার্ট" : "Bar"}
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
                      formatter={(value: any) => [`৳${Number(value).toFixed(2)}`, isBn ? "বিক্রয় আয়" : "Sales Revenue"]}
                      labelFormatter={(label) => `${isBn ? "সময়ঃ" : "Timeline:"} ${label}`}
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
                      formatter={(value: any) => [`৳${Number(value).toFixed(2)}`, isBn ? "বিক্রয় আয়" : "Sales Revenue"]}
                      labelFormatter={(label) => `${isBn ? "সময়ঃ" : "Timeline:"} ${label}`}
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
                  {isBn ? "প্রমোশন ও কুপন পারফর্মেন্স" : "Promo & Coupon Performance"}
                </h2>
              </div>
              <p className="text-xs opacity-60 mt-1">
                {isBn ? "কুপন ব্যবহার, প্রদত্ত মোট ছাড় এবং এর ফলে অর্জিত বিক্রয়ের হিসাব।" : "Track coupon redemptions, total discounts granted, and resulting cart revenues."}
              </p>
            </div>

            {/* Quick Search */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                placeholder={isBn ? "কুপন কোড দিয়ে খুঁজুন..." : "Search coupon code..."}
                className="w-full px-4 py-2 bg-background border border-foreground/15 rounded-xl text-xs font-bold text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>
          </div>

          {/* Coupon KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Active Coupons */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "সক্রিয় ক্যাম্পেইন" : "Active Campaigns"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {couponStats.activeCouponsCount.toLocaleString(isBn ? "bn-BD" : undefined)}
                </span>
                <span className="text-xs font-bold opacity-60">{isBn ? "টি কুপন চালু" : "coupons live"}</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {isBn ? `মোট ${coupons.length.toLocaleString("bn-BD")} টি কুপন তৈরি হয়েছে` : `${coupons.length} total coupons created`}
              </div>
            </div>

            {/* Card 2: Times Applied */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "মোট ব্যবহার সংখ্যা" : "Total Redemptions"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {couponStats.totalCouponUses.toLocaleString(isBn ? "bn-BD" : undefined)}
                </span>
                <span className="text-xs font-bold opacity-60">{isBn ? "বার ব্যবহৃত" : "times used"}</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold text-accent">
                {isBn ? "● গ্রাহকদের চেকআউটে ব্যবহৃত" : "● Applied across customer checkouts"}
              </div>
            </div>

            {/* Card 3: Total Discounts Granted */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "প্রদত্ত মোট ছাড়" : "Discounts Granted"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-accent">
                  ৳{couponStats.totalDiscountsGranted.toLocaleString(isBn ? "bn-BD" : undefined)}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {isBn ? "গ্রাহকদের সাশ্রয়কৃত অর্থ" : "Saved by customers"}
              </div>
            </div>

            {/* Card 4: Revenue Generated */}
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "কুপন থেকে মোট আয়" : "Coupon Driven Revenue"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  ৳{couponStats.totalCouponRevenue.toLocaleString(isBn ? "bn-BD" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {isBn ? "ছাড়যুক্ত অর্ডারসমূহ থেকে" : "From discounted orders"}
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
                    {isBn ? "সেরা কুপন পারফর্মেন্স" : "Top Coupon Performance"}
                  </h3>
                  <p className="text-[11px] opacity-50 mt-0.5">
                    {isBn ? "ব্যবহারের সংখ্যা বনাম অর্জিত আয়ের তুলনা (৳ BDT)" : "Comparison of order redemptions vs. revenue generated (৳ BDT)"}
                  </p>
                </div>

                {/* Filter / Limit Buttons */}
                <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl border border-foreground/10">
                  {(
                    [
                      { id: "5", label: isBn ? "শীর্ষ ৫" : "Top 5" },
                      { id: "10", label: isBn ? "শীর্ষ ১০" : "Top 10" },
                      { id: "all", label: isBn ? "সকল" : "All" },
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
                          name === (isBn ? "বিক্রয় আয় (৳)" : "Revenue (৳)")
                            ? `৳${Number(value).toLocaleString(isBn ? "bn-BD" : undefined)}`
                            : `${value} ${isBn ? "টি অর্ডার" : "orders"}`,
                          name,
                        ]}
                        labelFormatter={(label) => `${isBn ? "কুপন কোডঃ" : "Coupon:"} ${label}`}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px", fontWeight: 700, paddingTop: "10px" }}
                      />
                      <Bar
                        yAxisId="left"
                        name={isBn ? "বিক্রয় আয় (৳)" : "Revenue (৳)"}
                        dataKey="revenue"
                        fill="var(--accent)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                      />
                      <Bar
                        yAxisId="right"
                        name={isBn ? "ব্যবহার সংখ্যা" : "Redemptions"}
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
                  {isBn ? "এখনও কোনো কুপন ব্যবহারের তথ্য রেকর্ড করা হয়নি।" : "No coupon usage data recorded yet."}
                </div>
              )}
            </div>

            {/* Coupon Breakdown Table (5 cols) */}
            <div className="lg:col-span-5 bg-foreground/5 border border-foreground/10 rounded-2xl p-5 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  {isBn ? "ক্যাম্পেইন ডিরেক্টরি" : "Campaign Directory"}
                </h3>
                <span className="text-[10px] font-bold opacity-60">
                  {isBn ? `মোট ${couponStats.statsList.length.toLocaleString("bn-BD")} টি` : `${couponStats.statsList.length} total`}
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
                            {c.isActive ? (isBn ? "সক্রিয়" : "Active") : (isBn ? "নিষ্ক্রিয়" : "Disabled")}
                          </span>
                        </div>
                        <div className="text-[10px] opacity-60 mt-1">
                          {c.discountPercent > 0
                            ? (isBn ? `${Number(c.discountPercent).toLocaleString("bn-BD")}% ছাড়` : `${c.discountPercent}% Discount`)
                            : (isBn ? "বিশেষ প্রমোশন" : "Special Promo")}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold text-foreground">
                          {c.usageCount.toLocaleString(isBn ? "bn-BD" : undefined)} {isBn ? "টি অর্ডার" : (c.usageCount === 1 ? "order" : "orders")}
                        </div>
                        <div className="text-[10px] font-bold text-accent">
                          ৳{c.totalRevenue.toLocaleString(isBn ? "bn-BD" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center opacity-50 text-xs font-bold">
                    {isBn ? "কোনো কুপন পাওয়া যায়নি।" : "No matching coupons found."}
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
                  {isBn ? "পেমেন্ট মাধ্যম পরিসংখ্যান" : "Payment Methods Breakdown"}
                </h2>
              </div>
              <p className="text-xs opacity-60 mt-1">
                {isBn
                  ? "ক্যাশ অন ডেলিভারি, বিকাশ, নগদ ও ভাইবকয়েনের অর্ডার বন্টন এবং আয়ের বিস্তারিত পর্যালোচনা।"
                  : "Distribution of orders, transaction volumes, and revenues across COD, bKash, Nagad, and VibeCoin."}
              </p>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "মোট লেনদেনের পরিমাণ" : "Total Transaction Volume"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  ৳{paymentStats.grandTotalRevenue.toLocaleString(isBn ? "bn-BD" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold text-accent">
                {isBn ? "● সকল মাধ্যমে সমন্বিত" : "● Across all channels"}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "মোট প্রক্রিয়াকৃত অর্ডার" : "Total Processed Orders"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {paymentStats.grandTotalOrders.toLocaleString(isBn ? "bn-BD" : undefined)}
                </span>
                <span className="text-xs font-bold opacity-60">{isBn ? "টি অর্ডার" : "orders"}</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {isBn ? "স্টোর ডাটাবেজ অনুসারে" : "In store database"}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "শীর্ষ পেমেন্ট মাধ্যম" : "Leading Gateway"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-accent">
                  {[...paymentStats.list].sort((a, b) => b.revenue - a.revenue)[0]?.label || "N/A"}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {isBn ? "অর্জিত আয়ের ভিত্তিতে" : "By generated revenue"}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "ডিজিটাল বনাম সিওডি ভাগ" : "Digital vs COD Share"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {Math.round(
                    paymentStats.list
                      .filter((p) => p.key !== "cod")
                      .reduce((acc, c) => acc + c.revenueSharePct, 0)
                  ).toLocaleString(isBn ? "bn-BD" : undefined)}
                  %
                </span>
                <span className="text-xs font-bold opacity-60">{isBn ? "ডিজিটাল পেমেন্ট" : "digital share"}</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {isBn ? "বিকাশ, নগদ ও ভাইবকয়েন" : "bKash, Nagad & VibeCoins"}
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
                    {isBn ? "পেমেন্ট মাধ্যম অনুযায়ী আয়ের ভাগ" : "Revenue Share by Gateway"}
                  </h3>
                  <p className="text-[11px] opacity-50 mt-0.5">
                    {isBn ? "মোট বিক্রয়ের শতকরা অনুপাত" : "Percentage distribution of sales"}
                  </p>
                </div>
                {selectedPaymentMethod && (
                  <button
                    onClick={() => setSelectedPaymentMethod(null)}
                    className="text-[10px] font-bold px-2 py-0.5 bg-foreground/10 hover:bg-foreground/20 rounded-md text-foreground transition-all cursor-pointer"
                  >
                    {isBn ? "ফিল্টার রিসেট" : "Reset Filter"}
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
                          `৳${Number(val).toLocaleString(isBn ? "bn-BD" : undefined)} (${item.payload.pct}%)`,
                          name,
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px", fontWeight: 700, paddingTop: "10px", cursor: "pointer" }}
                        formatter={(value) => (
                          <span style={{ color: "var(--foreground)", opacity: 0.9 }}>{value}</span>
                        )}
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
                  {isBn ? "কোনো পেমেন্ট তথ্য পাওয়া যায়নি।" : "No payment data available."}
                </div>
              )}
            </div>

            {/* Gateway Breakdown Table (7 cols) */}
            <div className="lg:col-span-7 bg-foreground/5 border border-foreground/10 rounded-2xl p-5 flex flex-col justify-between">
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    {isBn ? "পেমেন্ট গেটওয়ে পারফর্মেন্স অডিট" : "Gateway Performance Audit"}
                  </h3>
                  <p className="text-[11px] opacity-50 mt-0.5">
                    {isBn ? "চার্টে নির্দিষ্ট মাধ্যমটি ফোকাস করতে যেকোনো সারিতে ক্লিক করুন" : "Click any row to focus on that gateway in the charts"}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-foreground/10 opacity-60 text-[10px] font-black uppercase tracking-wider">
                      <th className="pb-3">{isBn ? "পেমেন্ট গেটওয়ে" : "Gateway"}</th>
                      <th className="pb-3 text-right">{isBn ? "মোট অর্ডার" : "Orders"}</th>
                      <th className="pb-3 text-right">{isBn ? "অর্ডার শেয়ার" : "Order Share"}</th>
                      <th className="pb-3 text-right">{isBn ? "সফল পেমেন্ট" : "Settled Count"}</th>
                      <th className="pb-3 text-right">{isBn ? "গড় টিকিট (AOV)" : "Avg Ticket"}</th>
                      <th className="pb-3 text-right">{isBn ? "মোট আয় (৳)" : "Revenue (৳)"}</th>
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
                          <td className="py-3.5 px-2 text-right font-bold opacity-80">{m.count.toLocaleString(isBn ? "bn-BD" : undefined)}</td>
                          <td className="py-3.5 px-2 text-right font-bold text-accent">{m.orderSharePct}%</td>
                          <td className="py-3.5 px-2 text-right font-semibold opacity-70">
                            {m.completedCount.toLocaleString(isBn ? "bn-BD" : undefined)} / {m.count.toLocaleString(isBn ? "bn-BD" : undefined)}
                          </td>
                          <td className="py-3.5 px-2 text-right font-semibold opacity-80">
                            ৳{m.avgValue.toLocaleString(isBn ? "bn-BD" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-2 text-right font-black text-foreground">
                            ৳{m.revenue.toLocaleString(isBn ? "bn-BD" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  {isBn ? "সর্বাধিক বিক্রিত পণ্য ও শেড ভ্যারিয়েন্ট" : "Top Selling Products & Shade Variants"}
                </h2>
              </div>
              <p className="text-xs opacity-60 mt-1">
                {isBn
                  ? "সর্বাধিক বিক্রিত প্রসাধনী সামগ্রী, শেডের গতিধারা, বিক্রিত ইউনিট এবং পণ্যভিত্তিক আয়ের হিসাব।"
                  : "Deep dive into best-selling cosmetics, shade velocity, units moved, and product revenue contributions."}
              </p>
            </div>

            {/* Product Quick Search */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder={isBn ? "পণ্য দিয়ে খুঁজুন..." : "Search product..."}
                className="w-full px-4 py-2 bg-background border border-foreground/15 rounded-xl text-xs font-bold text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>
          </div>

          {/* Product KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "মোট বিক্রিত ইউনিট" : "Total Units Sold"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {productPerformanceStats.overallUnitsSold.toLocaleString(isBn ? "bn-BD" : undefined)}
                </span>
                <span className="text-xs font-bold opacity-60">{isBn ? "টি পণ্য বিক্রয়" : "items ordered"}</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {isBn ? "সকল অর্ডার মিলিয়ে" : "Across all orders"}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "#১ শীর্ষ বিক্রিত পণ্য" : "#1 Bestseller Product"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-black text-accent truncate">
                  {productPerformanceStats.topProduct?.title || (isBn ? "তথ্য নেই" : "N/A")}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {isBn
                  ? `${(productPerformanceStats.topProduct?.totalUnitsSold || 0).toLocaleString("bn-BD")} টি বিক্রিত হয়েছে`
                  : `${productPerformanceStats.topProduct?.totalUnitsSold || 0} units sold`}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "আইটেম ক্যাটালগ আয়" : "Item Catalog Revenue"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  ৳{productPerformanceStats.overallCatalogRevenue.toLocaleString(isBn ? "bn-BD" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-semibold text-accent">
                {isBn ? "● পণ্য সাবটোটাল ভলিউম" : "● Product subtotal volume"}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "সক্রিয় শেড ভ্যারিয়েন্ট" : "Distinct Shades Active"}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {productPerformanceStats.allShadesList.length.toLocaleString(isBn ? "bn-BD" : undefined)}
                </span>
                <span className="text-xs font-bold opacity-60">{isBn ? "টি শেড রেকর্ডকৃত" : "shades recorded"}</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold opacity-60">
                {isBn ? "ক্রয় হিস্ট্রি অনুযায়ী" : "With purchase history"}
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
                    {isBn ? "পণ্যভিত্তিক আয়ের গতিধারা" : "Product Revenue Velocity"}
                  </h3>
                  <p className="text-[11px] opacity-50 mt-0.5">
                    {isBn ? "মোট আয় (৳ BDT) বনাম মোট বিক্রিত ইউনিট" : "Gross revenue (৳ BDT) vs. Total Units Sold per item"}
                  </p>
                </div>

                {/* Filter Limit Buttons */}
                <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl border border-foreground/10">
                  {(
                    [
                      { id: "5", label: isBn ? "শীর্ষ ৫" : "Top 5" },
                      { id: "10", label: isBn ? "শীর্ষ ১০" : "Top 10" },
                      { id: "all", label: isBn ? "সকল" : "All" },
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
                            name === (isBn ? "বিক্রয় আয় (৳)" : "Revenue (৳)")
                              ? `৳${Number(value).toLocaleString(isBn ? "bn-BD" : undefined)}`
                              : `${value} ${isBn ? "টি ইউনিট" : "units"}`,
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
                          name={isBn ? "বিক্রয় আয় (৳)" : "Revenue (৳)"}
                          dataKey="revenue"
                          fill="var(--accent)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={28}
                        />
                        <Bar
                          yAxisId="right"
                          name={isBn ? "বিক্রিত ইউনিট" : "Units Sold"}
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
                  {isBn ? "এখনও কোনো পণ্যের বিক্রয় রেকর্ড হয়নি।" : "No sales recorded for products yet."}
                </div>
              )}
            </div>

            {/* Top Shades Leaderboard (5 cols) */}
            <div className="lg:col-span-5 bg-foreground/5 border border-foreground/10 rounded-2xl p-5 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  {isBn ? "জনপ্রিয় শেড ভ্যারিয়েন্টসমূহ" : "Top Shade Variants"}
                </h3>
                <span className="text-[10px] font-bold opacity-60">
                  {isBn ? `শীর্ষ ${productPerformanceStats.allShadesList.length.toLocaleString("bn-BD")} টি শেড` : `${productPerformanceStats.allShadesList.length} top shades`}
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
                          {s.unitsSold.toLocaleString(isBn ? "bn-BD" : undefined)} {isBn ? "টি ইউনিট" : (s.unitsSold === 1 ? "unit" : "units")}
                        </div>
                        <div className="text-[10px] font-bold text-accent">
                          ৳{s.revenue.toLocaleString(isBn ? "bn-BD" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center opacity-50 text-xs font-bold">
                    {isBn ? "কোনো ভ্যারিয়েন্ট বিক্রয়ের তথ্য নেই।" : "No variant sales data recorded yet."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. COURIER LOGISTICS & DELIVERY ORDERS ANALYTICS */}
      {activeSubTab === "delivery-orders" && (
        <div className="bg-secondary text-foreground p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-foreground/10">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </span>
                <h2 className="text-base font-black uppercase tracking-widest text-foreground">
                  {isBn ? "কুরিয়ার ও ডেলিভারি পারফর্মেন্স অ্যানালিটিক্স" : "Courier & Delivery Analytics"}
                </h2>
              </div>
              <p className="text-xs opacity-60 mt-1">
                {isBn
                  ? "কুরিয়ার সার্ভিসের ব্যবহার, সফল ডেলিভারির হার এবং চলমান পার্সেল ট্র্যাকিং সংক্রান্ত বিস্তারিত রিপোর্ট।"
                  : "Comprehensive analytics on most used courier services, delivery success rates, and on-going parcels."}
              </p>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Orders Dispatched */}
            <div className="p-5 bg-background rounded-2xl border border-foreground/10 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "মোট পার্সেল / অর্ডার" : "Total Parcels Handled"}
              </span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-foreground">
                  {deliveryAnalytics.totalDispatched.toLocaleString(isBn ? "bn-BD" : undefined)}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-foreground/70">
                  {isBn ? "সর্বমোট" : "All Time"}
                </span>
              </div>
            </div>

            {/* Most Used Courier Service */}
            <div className="p-5 bg-background rounded-2xl border border-foreground/10 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "সর্বাধিক ব্যবহৃত কুরিয়ার" : "Most Used Courier"}
              </span>
              <div className="mt-3 flex items-center gap-3">
                {deliveryAnalytics.mostUsedCourier && (
                  deliveryAnalytics.mostUsedCourier.logo ? (
                    <div className="w-8 h-8 relative rounded-lg overflow-hidden bg-white shrink-0 p-0.5 border border-foreground/10 flex items-center justify-center">
                      <img
                        src={deliveryAnalytics.mostUsedCourier.logo}
                        alt={deliveryAnalytics.mostUsedCourier.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-foreground/10 shrink-0 flex items-center justify-center font-black text-[10px] text-foreground">
                      MNL
                    </div>
                  )
                )}
                <div className="min-w-0">
                  <div className="text-base font-black text-foreground truncate">
                    {deliveryAnalytics.mostUsedCourier ? deliveryAnalytics.mostUsedCourier.name : "N/A"}
                  </div>
                  <div className="text-[10px] font-bold text-accent">
                    {deliveryAnalytics.mostUsedCourier
                      ? `${deliveryAnalytics.mostUsedCourier.totalOrders.toLocaleString(isBn ? "bn-BD" : undefined)} ${isBn ? "টি পার্সেল" : "orders"}`
                      : ""}
                  </div>
                </div>
              </div>

            </div>

            {/* Delivery Success Rate */}
            <div className="p-5 bg-background rounded-2xl border border-foreground/10 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "ডেলিভারি সাফল্যের হার" : "Delivery Success Rate"}
              </span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-visible">
                  {deliveryAnalytics.overallSuccessRate}%
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-visible/15 text-visible">
                  {deliveryAnalytics.deliveredCount.toLocaleString(isBn ? "bn-BD" : undefined)} {isBn ? "ডেলিভার্ড" : "Delivered"}
                </span>
              </div>
            </div>

            {/* On-going Parcels */}
            <div className="p-5 bg-background rounded-2xl border border-foreground/10 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                {isBn ? "চলমান ডেলিভারি (On Going)" : "On Going Delivery"}
              </span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-accent">
                  {deliveryAnalytics.ongoingCount.toLocaleString(isBn ? "bn-BD" : undefined)}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                  {isBn ? "পাইপলাইনে সক্রিয়" : "In Pipeline"}
                </span>
              </div>
            </div>
          </div>

          {/* Recharts Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Courier Volume Comparison (Bar Chart) */}
            <div className="lg:col-span-2 p-6 bg-background rounded-3xl border border-foreground/10 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                    {isBn ? "কুরিয়ার অনুযায়ী পার্সেল বিতরণ ও কার্যকারিতা" : "Courier Volume & Delivery Breakdown"}
                  </h3>
                  <p className="text-[11px] opacity-60 mt-0.5">
                    {isBn
                      ? "প্রতিটি সার্ভিসের মোট পার্সেল সংখ্যা এবং ডেলিভার্ড ও চলমান অবস্থা।"
                      : "Total dispatched volume, successfully delivered, and ongoing orders per courier."}
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                {deliveryAnalytics.courierVolumeChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={deliveryAnalytics.courierVolumeChart}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                      <XAxis
                        dataKey="shortName"
                        stroke="currentColor"
                        opacity={0.6}
                        tick={{ fontSize: 11, fontWeight: 700 }}
                      />
                      <YAxis
                        stroke="currentColor"
                        opacity={0.6}
                        tick={{ fontSize: 11, fontWeight: 700 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--secondary)",
                          borderColor: "var(--foreground)",
                          borderRadius: "16px",
                          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                          color: "var(--foreground)",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px", fontWeight: "bold", paddingTop: "10px" }}
                      />
                      <Bar dataKey="delivered" name={isBn ? "ডেলিভার্ড" : "Delivered"} fill="var(--visible)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="ongoing" name={isBn ? "চলমান / ইন-ট্রানজিট" : "On Going"} fill="var(--accent)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="returned" name={isBn ? "ফেরত / ব্যর্থ" : "Returned"} fill="var(--hidden)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-50 text-xs font-bold">
                    {isBn ? "কোনো ডেলিভারি ডেটা পাওয়া যায়নি।" : "No courier delivery data available."}
                  </div>
                )}
              </div>
            </div>

            {/* Overall Delivery Status Breakdown (Pie Chart) */}
            <div className="p-6 bg-background rounded-3xl border border-foreground/10 shadow-xs flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  {isBn ? "ডেলিভারি স্ট্যাটাস অনুপাত" : "Status Ratio"}
                </h3>
                <p className="text-[11px] opacity-60 mt-0.5">
                  {isBn ? "চলমান বনাম সফল বনাম ফেরত পার্সেল।" : "Active vs Delivered vs Failed breakdown."}
                </p>
              </div>

              <div className="h-56 w-full relative flex items-center justify-center">
                {deliveryAnalytics.statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deliveryAnalytics.statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {deliveryAnalytics.statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--secondary)",
                          borderColor: "var(--foreground)",
                          borderRadius: "16px",
                          color: "var(--foreground)",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="opacity-50 text-xs font-bold text-center">
                    {isBn ? "কোনো স্ট্যাটাস তথ্য নেই" : "No status breakdown"}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-foreground/10">
                {deliveryAnalytics.statusPieData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="opacity-80">{item.name}</span>
                    </div>
                    <span className="font-black text-foreground">
                      {item.value.toLocaleString(isBn ? "bn-BD" : undefined)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Courier Performance Detailed Table */}
          <div className="p-6 bg-background rounded-3xl border border-foreground/10 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  {isBn ? "কুরিয়ার পার্টনার পারফর্মেন্স মেট্রিক্স" : "Courier Partner Performance Metrics"}
                </h3>
                <p className="text-[11px] opacity-60 mt-0.5">
                  {isBn
                    ? "প্রতিটি কুরিয়ার সার্ভিসের ডেলিভারি সাফল্যের হার, চলমান সংখ্যা ও মোট পণ্যের মূল্য।"
                    : "Individual success rate, active pipeline, and revenue handled by each service."}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-foreground/10 text-[10px] font-black uppercase tracking-wider opacity-60">
                    <th className="py-3 px-3">{isBn ? "কুরিয়ার সার্ভিস" : "Courier Service"}</th>
                    <th className="py-3 px-3">{isBn ? "মোট পার্সেল" : "Total Parcels"}</th>
                    <th className="py-3 px-3">{isBn ? "সফল ডেলিভারি" : "Delivered"}</th>
                    <th className="py-3 px-3">{isBn ? "চলমান (On Going)" : "On Going"}</th>
                    <th className="py-3 px-3">{isBn ? "ফেরত / ব্যর্থ" : "Returned"}</th>
                    <th className="py-3 px-3">{isBn ? "সাফল্যের হার" : "Success Rate"}</th>
                    <th className="py-3 px-3 text-right">{isBn ? "হ্যান্ডেলকৃত অর্ডার মূল্য" : "Total Value"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10 font-bold">
                  {deliveryAnalytics.courierList.length > 0 ? (
                    deliveryAnalytics.courierList.map((courier, idx) => (
                      <tr key={idx} className="hover:bg-primary/5 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            {courier.logo ? (
                              <div className="w-8 h-8 relative rounded-xl overflow-hidden bg-white shrink-0 p-1 border border-foreground/10 flex items-center justify-center">
                                <img
                                  src={courier.logo}
                                  alt={courier.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-foreground/10 shrink-0 flex items-center justify-center font-black text-xs text-foreground">
                                MNL
                              </div>
                            )}
                            <div>
                              <div className="font-extrabold text-foreground">{courier.name}</div>
                              <div className="text-[10px] opacity-60 uppercase font-mono tracking-wider">
                                {courier.code}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-black text-foreground">
                          {courier.totalOrders.toLocaleString(isBn ? "bn-BD" : undefined)}
                        </td>
                        <td className="py-3.5 px-3 text-visible font-extrabold">
                          {courier.delivered.toLocaleString(isBn ? "bn-BD" : undefined)}
                        </td>
                        <td className="py-3.5 px-3 text-accent font-extrabold">
                          {(courier.ongoing + courier.pending).toLocaleString(isBn ? "bn-BD" : undefined)}
                        </td>
                        <td className="py-3.5 px-3 text-hidden font-extrabold">
                          {courier.returned.toLocaleString(isBn ? "bn-BD" : undefined)}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-foreground/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-visible transition-all rounded-full"
                                style={{ width: `${courier.successRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-black text-visible">
                              {courier.successRate}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-black text-foreground">
                          {formatCurrency(courier.totalValue)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs opacity-50 font-bold">
                        {isBn ? "কোনো কুরিয়ার ডেটা পাওয়া যায়নি।" : "No courier performance records available."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

