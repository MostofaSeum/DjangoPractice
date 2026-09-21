import { useState, useMemo, useEffect } from "react";
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
import { siteConfig } from "@/config/siteConfig";

type TimeRange = "24h" | "7d" | "15d" | "30d";

interface AnalyticsTabProps {
  orders?: Order[];
  products?: Product[];
  customers?: CustomerItem[];
  coupons?: CouponItem[];
  analyticsSubTab?: AnalyticsSubTab;
  onSubTabChange?: (subTab: AnalyticsSubTab) => void;
  token?: string | null;
  apiBase?: string;
}

export default function AnalyticsTab({
  orders = [],
  products = [],
  customers = [],
  coupons = [],
  analyticsSubTab = "sales",
  onSubTabChange,
  token,
  apiBase: propApiBase,
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
  const [gaId, setGaId] = useState<string>("");
  const [metaPixelId, setMetaPixelId] = useState<string>("");
  const [isGaLoading, setIsGaLoading] = useState<boolean>(true);
  const [gaTimeRange, setGaTimeRange] = useState<"1d" | "7d" | "15d" | "30d" | "90d">("7d");
  const [gaLiveData, setGaLiveData] = useState<{
    is_configured: boolean;
    property_id?: string;
    days?: number;
    realtime_active_users: number;
    total_active_users: number;
    total_sessions: number;
    total_screen_page_views: number;
    bounce_rate: number;
    avg_session_duration?: number;
    views_per_session?: number;
    channels: Array<{ channel: string; sessions: number; percentage: number }>;
    devices: Array<{ category: string; users: number; percentage: number }>;
    top_pages: Array<{ path: string; title: string; views: number; users: number }>;
    daily_trends: Array<{ date: string; users: number; views: number }>;
    event_counts?: Record<string, number>;
    cities?: Array<{ city: string; country: string; users: number; sessions: number; percentage: number }>;
    traffic_sources?: Array<{ source_medium: string; sessions: number; users: number; percentage: number }>;
    hourly_traffic?: Array<{ hour: string; label: string; users: number; sessions: number }>;
    funnel?: {
      steps: Array<{
        step: string;
        label: string;
        count: number;
        conversion_rate: number;
        dropoff_rate: number;
      }>;
      overall_conversion_rate: number;
    };
  } | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const effectiveApiBase = (propApiBase || siteConfig.apiBaseUrl).replace(/\/+$/, "");

  // Fetch configured Google Analytics ID from site settings
  useEffect(() => {
    let isMounted = true;
    const fetchGAConfig = async () => {
      try {
        const res = await fetch(`${effectiveApiBase}/store/site-settings/`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.google_analytics_id) {
            setGaId(String(data.google_analytics_id).trim());
          }
          if (isMounted && data.meta_pixel_id) {
            setMetaPixelId(String(data.meta_pixel_id).trim());
          }
        }
      } catch (err) {
        console.error("Failed to load GA ID for analytics tab:", err);
      } finally {
        if (isMounted) setIsGaLoading(false);
      }
    };
    fetchGAConfig();
    return () => {
      isMounted = false;
    };
  }, [effectiveApiBase]);

  // Fetch real Google Analytics Data API numbers from Django backend
  const fetchLiveGaData = async (targetRange?: "1d" | "7d" | "15d" | "30d" | "90d") => {
    const activeRange = targetRange || gaTimeRange;
    const daysParam =
      activeRange === "1d"
        ? 1
        : activeRange === "7d"
        ? 7
        : activeRange === "15d"
        ? 15
        : activeRange === "30d"
        ? 30
        : 90;

    setIsLiveLoading(true);
    setLiveError(null);
    try {
      const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) {
        headers["Authorization"] = `JWT ${authToken}`;
      }
      const res = await fetch(`${effectiveApiBase}/store/analytics/ga4-live/?days=${daysParam}`, {
        headers,
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setGaLiveData(data);
        if (data.is_configured === false) {
          setLiveError(data.message || (isBn ? "গুগল ক্লাউড সার্ভিস অ্যাকাউন্ট কনফিগার করা হয়নি।" : "Google Cloud Service Account is not configured on the backend server."));
        }
      } else if (res.status === 401 || res.status === 403) {
        setLiveError(isBn ? "লাইভ গুগল ডেটা দেখার জন্য অ্যাডমিন পারমিশন প্রয়োজন।" : "Admin authentication required to access live Google telemetry.");
      } else {
        const errorData = await res.json().catch(() => null);
        setLiveError(
          errorData?.message ||
          errorData?.error ||
          (isBn ? "গুগল সার্ভার থেকে ডেটা লোড করতে সমস্যা হয়েছে।" : "Google Analytics Data API credentials or package not installed on the backend.")
        );
      }
    } catch (err) {
      console.error("Error fetching live GA4 data:", err);
      setLiveError(isBn ? "নেটওয়ার্ক ত্রুটি ঘটেছে।" : "Network error fetching live Google Analytics data.");
    } finally {
      setIsLiveLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "traffic") {
      fetchLiveGaData(gaTimeRange);
    }
  }, [activeSubTab, gaTimeRange, token]);

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
    <div className="space-y-6 md:space-y-8">
      {/* Mobile-Only Horizontal Subtab Pill Navigation */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {[
          { id: "sales" as AnalyticsSubTab, label: isBn ? "বিক্রয় ও আয়" : "Sales" },
          { id: "coupons" as AnalyticsSubTab, label: isBn ? "কুপন" : "Coupons" },
          { id: "payments" as AnalyticsSubTab, label: isBn ? "পেমেন্ট" : "Payments" },
          { id: "top-products" as AnalyticsSubTab, label: isBn ? "টপ প্রোডাক্টস" : "Top Products" },
          { id: "delivery-orders" as AnalyticsSubTab, label: isBn ? "কুরিয়ার রিপোর্ট" : "Delivery" },
          { id: "traffic" as AnalyticsSubTab, label: isBn ? "ট্র্যাফিক ও পিক্সেল" : "Traffic & Pixels" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveSubTab(item.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === item.id
                ? "bg-accent text-white shadow-xs font-black"
                : "bg-secondary text-foreground/70 hover:bg-foreground/5 border border-foreground/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

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

      {/* 6. WEB TRAFFIC & AUDIENCE (GA4) ANALYTICS SUBSECTION */}
      {activeSubTab === "traffic" && (
        <div className="space-y-6">
          {/* Top Header Card */}
          <div className="bg-secondary text-foreground p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-foreground/10">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-visible opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-visible"></span>
                  </span>
                  <h2 className="text-base font-black uppercase tracking-widest text-foreground">
                    {isBn ? "লাইভ গুগল অ্যানালিটিক্স ৪ (GA4) ড্যাশবোর্ড" : "Live Google Analytics 4 Telemetry"}
                  </h2>
                </div>
                <p className="text-xs opacity-70 mt-1 font-medium max-w-2xl">
                  {isBn
                    ? "গুগল ক্লাউড ডেটা এপিআই (v1beta) এর মাধ্যমে সরাসরি গুগল অ্যানালিটিক্স থেকে লাইভ তথ্য প্রদর্শিত হচ্ছে।"
                    : "Live traffic streams, real-time visitors, channels, and platform metrics pulled directly via Google Analytics Data API."}
                </p>
              </div>

              {/* Action Buttons & Time Range Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
                {/* Real-time GA4 Range Selector Pills */}
                <div className="inline-flex items-center p-1 bg-foreground/5 border border-foreground/10 rounded-2xl gap-1">
                  {[
                    { id: "1d", labelEn: "Today", labelBn: "আজ" },
                    { id: "7d", labelEn: "7 Days", labelBn: "৭ দিন" },
                    { id: "15d", labelEn: "15 Days", labelBn: "১৫ দিন" },
                    { id: "30d", labelEn: "30 Days", labelBn: "৩০ দিন" },
                    { id: "90d", labelEn: "90 Days", labelBn: "৯০ দিন" },
                  ].map((r) => {
                    const isActive = gaTimeRange === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setGaTimeRange(r.id as any)}
                        disabled={isLiveLoading}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          isActive
                            ? "bg-accent text-white shadow-xs"
                            : "text-foreground opacity-70 hover:opacity-100 hover:bg-foreground/5"
                        } disabled:opacity-50`}
                      >
                        {isBn ? r.labelBn : r.labelEn}
                      </button>
                    );
                  })}
                </div>

                {/* Sync and Console Action Group */}
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fetchLiveGaData(gaTimeRange)}
                    disabled={isLiveLoading}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 border border-foreground/10 shadow-xs"
                    title={isBn ? "তথ্য রিফ্রেশ করুন" : "Refresh Google Analytics"}
                  >
                    <svg className={`w-3.5 h-3.5 ${isLiveLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{isLiveLoading ? (isBn ? "লোড হচ্ছে..." : "Syncing...") : (isBn ? "সিঙ্ক" : "Sync")}</span>
                  </button>

                  <a
                    href="https://analytics.google.com/analytics/web/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-95 transition-opacity shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <span>{isBn ? "গুগল কনসোল" : "Open Console"}</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Setup / Configuration Guidance Banner */}
            {liveError && (
              <div className="mt-4 p-4 bg-primary/10 border border-foreground/15 rounded-2xl text-foreground text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start sm:items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-accent mt-1 sm:mt-0 shrink-0" />
                  <div>
                    <span className="font-bold block sm:inline">
                      {isBn ? "গুগল ক্লাউড টেলিমেট্রি স্ট্যাটাস: " : "Google Cloud Telemetry Setup: "}
                    </span>
                    <span className="opacity-80 leading-relaxed">
                      {liveError}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <a
                    href="https://analytics.google.com/analytics/web/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-accent text-white rounded-xl font-bold text-[11px] uppercase tracking-wider hover:opacity-90 transition-opacity"
                  >
                    {isBn ? "লাইভ ট্র্যাফিক দেখুন" : "View Live in GA4"} &rarr;
                  </a>
                  <button
                    type="button"
                    onClick={() => fetchLiveGaData(gaTimeRange)}
                    className="px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {isBn ? "রিফ্রেশ" : "Retry"}
                  </button>
                </div>
              </div>
            )}

            {/* Status & Realtime Overview (Direct from Google) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
              {/* Card 1: Real-Time Active Users */}
              <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between relative overflow-hidden">
                <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  {isBn ? "লাইভ সক্রিয় ভিজিটর (৩০ মিনিট)" : "Real-Time Active Users (30m)"}
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-visible font-mono">
                    {isLiveLoading && !gaLiveData
                      ? "..."
                      : (gaLiveData?.realtime_active_users ?? 0).toLocaleString(isBn ? "bn-BD" : undefined)}
                  </span>
                  <span className="text-xs font-bold opacity-75 text-visible">
                    {isBn ? "জন ভিজিটর এখনই লাইভ" : "users active now"}
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-semibold opacity-60">
                  {isBn ? "গুগল রিয়েলটাইম এপিআই দ্বারা পরীক্ষিত" : "Direct from Google Analytics Realtime API"}
                </div>
              </div>

              {/* Card 2: Total Active Users (Dynamic Selected Range) */}
              <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  {isBn
                    ? `মোট ভিজিটর (${gaTimeRange === "1d" ? "আজ" : gaTimeRange === "7d" ? "৭ দিন" : gaTimeRange === "15d" ? "১৫ দিন" : gaTimeRange === "30d" ? "৩০ দিন" : "৯০ দিন"})`
                    : `Active Users (${gaTimeRange === "1d" ? "Today" : gaTimeRange === "7d" ? "7 Days" : gaTimeRange === "15d" ? "15 Days" : gaTimeRange === "30d" ? "30 Days" : "90 Days"})`}
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-accent font-mono">
                    {isLiveLoading && !gaLiveData
                      ? "..."
                      : (gaLiveData?.total_active_users ?? 0).toLocaleString(isBn ? "bn-BD" : undefined)}
                  </span>
                  <span className="text-xs font-bold opacity-60">
                    {isBn ? "জন স্বতন্ত্র ইউজার" : "unique visitors"}
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-semibold opacity-60">
                  {isBn
                    ? `সেশন সংখ্যা: ${(gaLiveData?.total_sessions ?? 0).toLocaleString("bn-BD")}`
                    : `Total Sessions: ${(gaLiveData?.total_sessions ?? 0).toLocaleString()}`}
                </div>
              </div>

              {/* Card 3: Screen Page Views */}
              <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  {isBn
                    ? `মোট পেজভিউ (${gaTimeRange === "1d" ? "আজ" : gaTimeRange === "7d" ? "৭ দিন" : gaTimeRange === "15d" ? "১৫ দিন" : gaTimeRange === "30d" ? "৩০ দিন" : "৯০ দিন"})`
                    : `Total Page Views (${gaTimeRange === "1d" ? "Today" : gaTimeRange === "7d" ? "7 Days" : gaTimeRange === "15d" ? "15 Days" : gaTimeRange === "30d" ? "30 Days" : "90 Days"})`}
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground font-mono">
                    {isLiveLoading && !gaLiveData
                      ? "..."
                      : (gaLiveData?.total_screen_page_views ?? 0).toLocaleString(isBn ? "bn-BD" : undefined)}
                  </span>
                  <span className="text-xs font-bold opacity-60">
                    {isBn ? "টি ভিউ" : "page views"}
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-semibold opacity-60">
                  {isBn
                    ? `বাউন্স রেট: ${gaLiveData?.bounce_rate ?? 0}%`
                    : `Bounce Rate: ${gaLiveData?.bounce_rate ?? 0}%`}
                </div>
              </div>

              {/* Card 4: Engagement & Session Quality */}
              <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  {isBn ? "গড় সেশন সময় ও এনগেজমেন্ট" : "Avg Session & Pages"}
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-nagad font-mono">
                    {isLiveLoading && !gaLiveData
                      ? "..."
                      : (() => {
                          const sec = Math.round(gaLiveData?.avg_session_duration ?? 0);
                          const m = Math.floor(sec / 60);
                          const s = sec % 60;
                          return `${m}m ${s}s`;
                        })()}
                  </span>
                  <span className="text-xs font-bold opacity-60">
                    {isBn ? "গড় সময়" : "avg stay"}
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-semibold opacity-60">
                  {isBn
                    ? `প্রতি সেশনে পেজ: ${gaLiveData?.views_per_session ?? 0} টি`
                    : `Pages/Session: ${gaLiveData?.views_per_session ?? 0}`}
                </div>
              </div>

              {/* Card 5: Property & Measurement Config */}
              <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  {isBn ? "প্রোপার্টি ও স্ট্রিম" : "GA4 Property & Stream"}
                </span>
                <div className="mt-3 space-y-1">
                  <div className="text-xs font-mono font-black text-accent truncate">
                    {gaLiveData?.property_id ? `ID: ${gaLiveData.property_id}` : (isBn ? "প্রোপার্টি সেট নেই" : "No Property ID")}
                  </div>
                  <div className="text-[11px] font-mono opacity-70 truncate">
                    {gaId ? `Stream: ${gaId}` : (isBn ? "স্ট্রিম সেট নেই" : "No Stream")}
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-semibold text-visible flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-visible inline-block"></span>
                  <span>{isBn ? "ক্লাউড সার্ভিস এপিআই কানেক্টেড" : "Cloud Data API Active"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE 2: E-Commerce Conversion Drop-off Funnel */}
          <div className="bg-secondary text-foreground p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-6 border-b border-foreground/10">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
                  {isBn ? "ই-কমার্স কনভার্সন ফানেল ও ড্রপ-অফ অ্যানালিটিক্স" : "E-Commerce Conversion Funnel & Drop-Off (GA4)"}
                </h3>
                <p className="text-xs opacity-70 mt-1 font-medium">
                  {isBn
                    ? "পণ্য দেখা থেকে শুরু করে কার্টে যোগ, চেকআউট এবং সফল অর্ডার সম্পন্ন হওয়ার প্রতিটি ধাপের কনভার্সন হার।"
                    : "Track visitor retention and customer drop-offs at every critical purchasing stage."}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-black tracking-wider opacity-60 block">
                  {isBn ? "সামগ্রিক রূপান্তর হার" : "Overall Funnel CR"}
                </span>
                <span className="text-xl font-black font-mono text-visible">
                  {gaLiveData?.funnel?.overall_conversion_rate ?? 0}%
                </span>
              </div>
            </div>

            {/* Funnel Steps Visual Hierarchy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {gaLiveData?.funnel?.steps ? (
                gaLiveData.funnel.steps.map((step, idx) => {
                  const stepColors = [
                    { border: "border-accent/30", text: "text-accent", badge: "bg-accent/15 text-accent" },
                    { border: "border-visible/30", text: "text-visible", badge: "bg-visible/15 text-visible" },
                    { border: "border-nagad/30", text: "text-nagad", badge: "bg-nagad/15 text-nagad" },
                    { border: "border-bkash/30", text: "text-bkash", badge: "bg-bkash/15 text-bkash" },
                  ];
                  const col = stepColors[idx % stepColors.length];
                  const stepNamesBn: Record<string, string> = {
                    view_item: "পণ্য দর্শন (View Item)",
                    add_to_cart: "কার্টে যোগ (Add To Cart)",
                    begin_checkout: "চেকআউট শুরু (Checkout)",
                    purchase: "অর্ডার সম্পন্ন (Purchase)",
                  };

                  return (
                    <div
                      key={step.step}
                      className={`p-5 rounded-2xl bg-foreground/5 border ${col.border} flex flex-col justify-between relative overflow-hidden`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                            {isBn ? `ধাপ ${idx + 1}` : `Step ${idx + 1}`}
                          </span>
                          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${col.badge}`}>
                            {idx === 0 ? (isBn ? "শুরু (১০০%)" : "100% Base") : `${step.conversion_rate}% CR`}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground mt-1">
                          {isBn ? (stepNamesBn[step.step] || step.label) : step.label}
                        </h4>
                      </div>

                      <div className="mt-4">
                        <div className={`text-2xl font-black font-mono ${col.text}`}>
                          {step.count.toLocaleString(isBn ? "bn-BD" : undefined)}
                        </div>
                        <div className="text-[10px] font-semibold opacity-60 mt-0.5">
                          {isBn ? "বার এই ইভেন্টটি সম্পন্ন হয়েছে" : "recorded events"}
                        </div>

                        {idx > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-foreground/10 flex justify-between items-center text-[10px]">
                            <span className="opacity-60 font-medium">
                              {isBn ? "ড্রপ-অফ:" : "Drop-off:"}
                            </span>
                            <span className="font-mono font-bold text-hidden">
                              {step.dropoff_rate}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-4 py-8 text-center text-xs opacity-50 font-bold">
                  {isLiveLoading
                    ? (isBn ? "ফানেল মেট্রিক্স লোড হচ্ছে..." : "Loading conversion funnel data...")
                    : (isBn ? "কোনো ফানেল ডেটা রেকর্ড হয়নি।" : "No e-commerce funnel events recorded yet.")}
                </div>
              )}
            </div>
          </div>

          {/* Traffic Channel Sources & Device Breakdown (Direct Google Figures) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Traffic Acquisition Channels (From Google) */}
            <div className="bg-secondary text-foreground p-6 rounded-3xl border border-foreground/10 shadow-sm">
              <div className="pb-4 border-b border-foreground/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                  {isBn ? "গুগল ট্র্যাফিক চ্যানেল অধিগ্রহণ" : "Google Traffic Channels (GA4)"}
                </h3>
              </div>

              <div className="space-y-4 mt-5">
                {gaLiveData?.channels && gaLiveData.channels.length > 0 ? (
                  gaLiveData.channels.map((ch, idx) => {
                    const colorClasses = [
                      { fill: "bg-accent", text: "text-accent", dot: "bg-accent" },
                      { fill: "bg-visible", text: "text-visible", dot: "bg-visible" },
                      { fill: "bg-bkash", text: "text-bkash", dot: "bg-bkash" },
                      { fill: "bg-nagad", text: "text-nagad", dot: "bg-nagad" },
                      { fill: "bg-primary", text: "text-primary", dot: "bg-primary" },
                    ];
                    const color = colorClasses[idx % colorClasses.length];

                    return (
                      <div key={idx} className="p-3.5 rounded-2xl bg-foreground/5 border border-foreground/10 space-y-2">
                        <div className="flex justify-between items-center text-xs font-black">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-md ${color.dot} shrink-0 shadow-xs`} />
                            <span className="text-foreground tracking-wide">{ch.channel}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] opacity-70 font-semibold font-mono">
                              {ch.sessions} {isBn ? "সেশন" : "sessions"}
                            </span>
                            <span className={`font-mono text-sm font-black ${color.text}`}>
                              {ch.percentage}%
                            </span>
                          </div>
                        </div>

                        {/* High Contrast Progress Bar */}
                        <div className="h-3.5 w-full bg-foreground/15 rounded-full overflow-hidden p-0.5 border border-foreground/10">
                          <div
                            className={`h-full rounded-full ${color.fill} transition-all duration-700 shadow-sm`}
                            style={{ width: `${Math.max(ch.percentage, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs opacity-50 font-bold">
                    {isLiveLoading
                      ? (isBn ? "গুগল থেকে ডেটা লোড হচ্ছে..." : "Loading live channels from Google...")
                      : (isBn ? "বর্তমানে কোনো চ্যানেল সেশন পাওয়া যায়নি।" : "No traffic sessions recorded in this period yet.")}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-foreground/10 flex items-center justify-between text-[11px] font-medium opacity-70">
                <span>{isBn ? "অ্যাকুইজিশন হিস্ট্রি ও অ্যাট্রিবিউশন" : "Direct GA4 channel attribution"}</span>
                <a
                  href="https://analytics.google.com/analytics/web/#/reports/reportinghub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent font-bold hover:underline"
                >
                  {isBn ? "গুগলে বিস্তারিত রিপোর্ট" : "View on Google Analytics"} &rarr;
                </a>
              </div>
            </div>

            {/* 2. Device & Platform Breakdown (From Google) */}
            <div className="bg-secondary text-foreground p-6 rounded-3xl border border-foreground/10 shadow-sm">
              <div className="pb-4 border-b border-foreground/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                  {isBn ? "ডিভাইস ও প্ল্যাটফর্ম রিপোর্ট" : "Visitor Device Category (GA4)"}
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                {gaLiveData?.devices && gaLiveData.devices.length > 0 ? (
                  gaLiveData.devices.map((dev, i) => {
                    const devColors = [
                      { fill: "bg-accent", text: "text-accent", border: "border-accent/30", dot: "bg-accent" },
                      { fill: "bg-visible", text: "text-visible", border: "border-visible/30", dot: "bg-visible" },
                      { fill: "bg-nagad", text: "text-nagad", border: "border-nagad/30", dot: "bg-nagad" },
                    ];
                    const dCol = devColors[i % devColors.length];

                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-2xl bg-foreground/5 border ${dCol.border} flex flex-col justify-between`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-70 truncate">
                            {dev.category}
                          </span>
                          <span className={`w-2.5 h-2.5 rounded-full ${dCol.dot}`} />
                        </div>
                        <div className={`text-2xl sm:text-3xl font-black ${dCol.text} mt-2 font-mono`}>
                          {dev.percentage}%
                        </div>
                        <div className="text-[10px] font-semibold opacity-60 mt-1">
                          {dev.users} {isBn ? "জন ইউজার" : "users"}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 py-8 text-center text-xs opacity-50 font-bold">
                    {isLiveLoading
                      ? (isBn ? "গুগল থেকে ডিভাইস তথ্য লোড হচ্ছে..." : "Loading device telemetry from Google...")
                      : (isBn ? "কোনো ডিভাইস রেকর্ড পাওয়া যায়নি।" : "No device sessions recorded yet.")}
                  </div>
                )}
              </div>

              {/* Progress bar visual for devices - bold high-contrast stacked track */}
              {gaLiveData?.devices && gaLiveData.devices.length > 0 && (
                <div className="mt-6 p-4 rounded-2xl bg-foreground/5 border border-foreground/10 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-foreground uppercase tracking-wider text-[10px] font-black opacity-70">
                      {isBn ? "প্ল্যাটফর্ম শেয়ার অনুপাত" : "Platform Share Breakdown"}
                    </span>
                  </div>

                  <div className="h-5 w-full bg-foreground/15 rounded-full overflow-hidden flex p-0.5 border border-foreground/10 gap-0.5">
                    {gaLiveData.devices.map((dev, i) => {
                      const devBarColors = ["bg-accent", "bg-visible", "bg-nagad"];
                      const barColor = devBarColors[i % devBarColors.length];
                      return (
                        <div
                          key={i}
                          className={`${barColor} h-full first:rounded-l-full last:rounded-r-full transition-all duration-700`}
                          style={{ width: `${dev.percentage}%` }}
                          title={`${dev.category}: ${dev.percentage}%`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-extrabold pt-1">
                    {gaLiveData.devices.map((dev, i) => {
                      const devDotColors = ["bg-accent text-accent", "bg-visible text-visible", "bg-nagad text-nagad"];
                      const [dotBg, textColor] = devDotColors[i % devDotColors.length].split(" ");
                      return (
                        <span key={i} className="flex items-center gap-1.5 text-foreground">
                          <span className={`w-3 h-3 rounded-full ${dotBg} inline-block shrink-0 shadow-xs`} />
                          <span>{dev.category}:</span>
                          <span className={`font-mono font-black ${textColor}`}>{dev.percentage}%</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-foreground/10 flex items-center justify-between text-[11px] font-medium opacity-70">
                <span>{isBn ? "অপারেটিং সিস্টেম ও ব্রাউজার মেট্রিক্স" : "Operating system & browser telemetry"}</span>
                <a
                  href="https://analytics.google.com/analytics/web/#/reports/tech-details"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent font-bold hover:underline"
                >
                  {isBn ? "টেক রিপোর্ট দেখুন" : "View Tech Reports"} &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* FEATURE 1 & FEATURE 3: Top Cities / Geographic & Traffic Acquisition / Campaigns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature 1: Geographic / City Breakdown */}
            <div className="bg-secondary text-foreground p-6 rounded-3xl border border-foreground/10 shadow-sm">
              <div className="pb-4 border-b border-foreground/10 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-visible inline-block" />
                  {isBn ? "শীর্ষ শহর ও ভৌগোলিক অবস্থান" : "Top Visitor Cities & Locations (GA4)"}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider opacity-60 font-mono">
                  {isBn
                    ? `${gaTimeRange === "1d" ? "আজ" : gaTimeRange === "7d" ? "বিগত ৭ দিন" : gaTimeRange === "15d" ? "বিগত ১৫ দিন" : gaTimeRange === "30d" ? "বিগত ৩০ দিন" : "বিগত ৯০ দিন"}`
                    : `${gaTimeRange === "1d" ? "Today" : gaTimeRange === "7d" ? "Last 7 Days" : gaTimeRange === "15d" ? "Last 15 Days" : gaTimeRange === "30d" ? "Last 30 Days" : "Last 90 Days"}`}
                </span>
              </div>

              <div className="divide-y divide-foreground/10 mt-3">
                {gaLiveData?.cities && gaLiveData.cities.length > 0 ? (
                  gaLiveData.cities.map((c, i) => (
                    <div key={i} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-xs font-black opacity-50 w-5">#{i + 1}</span>
                        <div className="truncate">
                          <div className="font-bold text-xs text-foreground truncate">{c.city}</div>
                          <div className="text-[10px] opacity-60 font-semibold">{c.country}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-4">
                        <div>
                          <div className="font-mono text-xs font-black text-foreground">
                            {c.users.toLocaleString(isBn ? "bn-BD" : undefined)} {isBn ? "ইউজার" : "users"}
                          </div>
                          <div className="text-[10px] opacity-60 font-semibold">
                            {c.sessions} {isBn ? "সেশন" : "sessions"}
                          </div>
                        </div>
                        <span className="font-mono text-xs font-black text-visible px-2 py-0.5 rounded-md bg-visible/10 min-w-[48px] text-center">
                          {c.percentage}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs opacity-50 font-bold">
                    {isLiveLoading
                      ? (isBn ? "শহরের তথ্য লোড হচ্ছে..." : "Loading city data from Google...")
                      : (isBn ? "কোনো শহরের ডেটা পাওয়া যায়নি।" : "No location data recorded yet.")}
                  </div>
                )}
              </div>
            </div>

            {/* Feature 3: Campaign & Ad Source Attribution */}
            <div className="bg-secondary text-foreground p-6 rounded-3xl border border-foreground/10 shadow-sm">
              <div className="pb-4 border-b border-foreground/10 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
                  {isBn ? "ট্র্যাফিক সোর্স ও ক্যাম্পেইন অ্যাট্রিবিউশন" : "Traffic Source / Medium Attribution (GA4)"}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider opacity-60 font-mono">
                  {isBn ? "বিজ্ঞাপন ও রেফারেল" : "Ads & Referrals"}
                </span>
              </div>

              <div className="divide-y divide-foreground/10 mt-3">
                {gaLiveData?.traffic_sources && gaLiveData.traffic_sources.length > 0 ? (
                  gaLiveData.traffic_sources.map((src, i) => (
                    <div key={i} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-bold text-accent truncate">
                          {src.source_medium}
                        </div>
                        <div className="text-[10px] opacity-60 font-semibold mt-0.5">
                          {src.users} {isBn ? "ইউজার" : "users"}
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div className="font-mono text-xs font-black text-foreground">
                          {src.sessions} {isBn ? "সেশন" : "sessions"}
                        </div>
                        <span className="font-mono text-xs font-black text-accent px-2 py-0.5 rounded-md bg-accent/10 min-w-[48px] text-center">
                          {src.percentage}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs opacity-50 font-bold">
                    {isLiveLoading
                      ? (isBn ? "সোর্স ডেটা লোড হচ্ছে..." : "Loading source attribution data...")
                      : (isBn ? "কোনো ক্যাম্পেইন ডেটা পাওয়া যায়নি।" : "No campaign or source data recorded yet.")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FEATURE 5: Hourly Peak Shopping Times (Hour 00 to 23 Heatmap) */}
          <div className="bg-secondary text-foreground p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-6 border-b border-foreground/10">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-nagad inline-block" />
                  {isBn ? "দৈনিক পিক শপিং সময় ও আওয়ারলি ট্র্যাফিক (২৪ ঘণ্টা)" : "Peak Shopping Hours & 24h Activity Distribution (GA4)"}
                </h3>
                <p className="text-xs opacity-70 mt-1 font-medium">
                  {isBn
                    ? "কোন কোন ঘণ্টায় সবচেয়ে বেশি গ্রাহক ভিজিট করে ও কেনাকাটা করে তার ২৪ ঘণ্টার হিটম্যাপ।"
                    : "Discover which hours of the day generate the highest customer traffic to optimize ad schedules."}
                </p>
              </div>
            </div>

            {/* 24-Hour Grid Heatmap */}
            <div className="mt-6">
              {gaLiveData?.hourly_traffic && gaLiveData.hourly_traffic.length > 0 ? (
                (() => {
                  const maxHourlyUsers = Math.max(...gaLiveData.hourly_traffic.map((h) => h.users), 1);
                  return (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                      {gaLiveData.hourly_traffic.map((h) => {
                        const intensity = Math.min(1, h.users / maxHourlyUsers);
                        const isHighTraffic = intensity > 0.6;
                        return (
                          <div
                            key={h.hour}
                            className={`p-3 rounded-xl border flex flex-col justify-between items-center transition-all duration-300 ${
                              isHighTraffic
                                ? "bg-nagad/15 border-nagad/40 text-foreground"
                                : intensity > 0.2
                                ? "bg-foreground/10 border-foreground/15 text-foreground"
                                : "bg-foreground/5 border-foreground/10 text-foreground"
                            }`}
                            title={`${h.label}: ${h.users} visitors (${h.sessions} sessions)`}
                          >
                            <span className="text-[10px] font-black font-mono opacity-60">{h.label}</span>
                            <span className={`text-base font-black font-mono mt-1 ${isHighTraffic ? "text-nagad" : "text-foreground"}`}>
                              {h.users}
                            </span>
                            <div className="w-full bg-foreground/10 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isHighTraffic ? "bg-nagad" : "bg-accent"}`}
                                style={{ width: `${Math.max(intensity * 100, 5)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <div className="py-8 text-center text-xs opacity-50 font-bold">
                  {isLiveLoading
                    ? (isBn ? "আওয়ারলি ট্র্যাফিক লোড হচ্ছে..." : "Loading hourly distribution data...")
                    : (isBn ? "কোনো আওয়ারলি ডেটা পাওয়া যায়নি।" : "No hourly activity recorded yet.")}
                </div>
              )}
            </div>
          </div>

          {/* Top Visited Store Pages (From Google) & Event Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Store URLs / Pages Recorded by Google */}
            <div className="bg-secondary text-foreground p-6 rounded-3xl border border-foreground/10 shadow-sm">
              <div className="pb-4 border-b border-foreground/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                  {isBn ? "গুগল দ্বারা রেকর্ডকৃত শীর্ষ পেজ ও রুট" : "Most Viewed Store Pages (GA4 Data)"}
                </h3>
              </div>

              <div className="divide-y divide-foreground/10 mt-2">
                {gaLiveData?.top_pages && gaLiveData.top_pages.length > 0 ? (
                  gaLiveData.top_pages.map((p, i) => (
                    <div key={i} className="py-3 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-mono text-xs font-bold text-accent truncate">{p.path}</div>
                        <div className="text-[11px] opacity-60 font-semibold truncate">
                          {p.title || (isBn ? "স্টোর পেজ" : "Store Page")}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-black text-foreground">
                          {p.views} {isBn ? "ভিউ" : "views"}
                        </div>
                        <div className="text-[10px] opacity-60 font-semibold">
                          {p.users} {isBn ? "জন ইউজার" : "users"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs opacity-50 font-bold">
                    {isLiveLoading
                      ? (isBn ? "গুগল থেকে পেজ ডেটা লোড হচ্ছে..." : "Loading page view data from Google...")
                      : (isBn ? "কোনো পেজভিউ ডেটা পাওয়া যায়নি।" : "No page view data recorded yet.")}
                  </div>
                )}
              </div>
            </div>

            {/* Configured GA4 E-Commerce Events */}
            <div className="bg-secondary text-foreground p-6 rounded-3xl border border-foreground/10 shadow-sm">
              <div className="pb-4 border-b border-foreground/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                  {isBn ? "সক্রিয় GA4 ই-কমার্স ইভেন্ট ট্র্যাকিং" : "Configured GA4 E-Commerce Events"}
                </h3>
              </div>

              <div className="divide-y divide-foreground/10 mt-2">
                {[
                  {
                    name: "page_view",
                    desc: isBn ? "প্রতিটি নতুন পেজ লোড ও এসপিএ নেভিগেশনে স্বয়ংক্রিয়ভাবে রেকর্ড হয়" : "Fired automatically on Next.js client-side route transitions and URL changes",
                  },
                  {
                    name: "view_item",
                    desc: isBn ? "গ্রাহক কোনো পণ্যের বিস্তারিত ডিটেইলস পেজে প্রবেশ করলে রেকর্ড হয়" : "Triggered when a shopper opens and views a specific product details page",
                  },
                  {
                    name: "add_to_cart",
                    desc: isBn ? "গ্রাহক শপিং ব্যাগে কোনো পণ্য অথবা ভেরিয়েন্ট যুক্ত করলে রেকর্ড হয়" : "Triggered when an item or specific shade/variant is added to the cart",
                  },
                  {
                    name: "begin_checkout",
                    desc: isBn ? "গ্রাহক চেকআউট পেজে গিয়ে অর্ডার প্রক্রিয়া শুরু করলে রেকর্ড হয়" : "Triggered when the user proceeds to the checkout delivery and payment step",
                  },
                  {
                    name: "purchase",
                    desc: isBn ? "অর্ডার সম্পন্ন হলে ট্রানজ্যাকশন আইডি ও মূল্যসহ রেকর্ড হয়" : "Triggered upon order placement confirmation with order total & currency",
                  },
                ].map((ev, i) => (
                  <div key={i} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-mono text-xs font-black text-visible">{ev.name}</div>
                      <div className="text-[11px] opacity-70 font-medium mt-0.5">{ev.desc}</div>
                    </div>
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-visible shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Meta (Facebook) Pixel Conversion & Telemetry Hub */}
          <div className="bg-secondary text-foreground p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-foreground/10">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-visible opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-visible"></span>
                  </span>
                  <h2 className="text-base font-black uppercase tracking-widest text-foreground">
                    {isBn ? "মেটা পিক্সেল ও কনভার্সন ফানেল অ্যানালিটিক্স" : "Meta Pixel Conversion & Ad Telemetry"}
                  </h2>
                </div>
                <p className="text-xs opacity-70 mt-1 font-medium max-w-2xl">
                  {isBn
                    ? "পণ্য ভিউ থেকে শুরু করে পারচেজ পর্যন্ত প্রকৃত রূপান্তর হার এবং মেটা পিক্সেল ডেটাসেট ট্র্যাকিং।"
                    : "Real conversion funnel metrics from product views to checkout orders and live event telemetry."}
                </p>
              </div>

              {/* Meta Events Manager Direct Deep-Link */}
              <a
                href={metaPixelId ? `https://business.facebook.com/events_manager2/list/dataset/${metaPixelId}/overview` : "https://business.facebook.com/events_manager2/"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-bkash text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-95 transition-opacity shadow-xs cursor-pointer"
              >
                <span>{isBn ? "মেটা ইভেন্টস ম্যানেজার" : "Open Meta Events Manager"}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Meta KPI Overview Cards (Real Orders and Catalog Data) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {/* Card 1: Pixel Status */}
              <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  {isBn ? "পিক্সেল স্ট্যাটাস" : "Pixel Status"}
                </span>
                <div className="mt-3 flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${metaPixelId ? "bg-visible" : "bg-hidden"}`} />
                  <span className={`text-xl font-black ${metaPixelId ? "text-visible" : "text-hidden"}`}>
                    {metaPixelId
                      ? (isBn ? "সক্রিয় ও সংযুক্ত" : "Active & Streaming")
                      : (isBn ? "কনফিগার করা হয়নি" : "Not Configured")}
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-semibold opacity-60 font-mono truncate">
                  {metaPixelId ? `ID: ${metaPixelId}` : (isBn ? "স্টোর সেটিংস থেকে আইডি সেট করুন" : "Set in Store Settings")}
                </div>
              </div>

              {/* Card 2: Tracked Orders */}
              <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  {isBn ? "ট্র্যাক করা ক্রয় অর্ডার" : "Completed Orders"}
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-visible font-mono">
                    {orders.length.toLocaleString(isBn ? "bn-BD" : undefined)}
                  </span>
                  <span className="text-xs font-bold opacity-60">
                    {isBn ? "টি সফল ক্রয়" : "store orders"}
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-semibold opacity-60">
                  {isBn ? "Purchase কনভার্সন ইভেন্ট" : "Attributed purchase conversions"}
                </div>
              </div>

              {/* Card 3: Tracked Revenue GMV */}
              <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  {isBn ? "মোট অর্ডার মূল্য (GMV)" : "Total Order GMV"}
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-accent font-mono truncate">
                    {formatCurrency(orders.reduce((acc, o) => acc + getOrderTotal(o), 0))}
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-semibold opacity-60">
                  {isBn
                    ? `গড় অর্ডার মান: ${formatCurrency(orders.length > 0 ? orders.reduce((acc, o) => acc + getOrderTotal(o), 0) / orders.length : 0)}`
                    : `AOV: ${formatCurrency(orders.length > 0 ? orders.reduce((acc, o) => acc + getOrderTotal(o), 0) / orders.length : 0)}`}
                </div>
              </div>

              {/* Card 4: Catalog Content IDs */}
              <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/10 flex flex-col justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  {isBn ? "কন্টেন্ট আইডি ক্যাটালগ" : "Content IDs Synced"}
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground font-mono">
                    {products.length.toLocaleString(isBn ? "bn-BD" : undefined)}
                  </span>
                  <span className="text-xs font-bold opacity-60">
                    {isBn ? "টি পণ্য" : "catalog items"}
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-semibold opacity-60">
                  {isBn ? "ViewContent ও AddToCart প্যারামিটার" : "Matched with catalog products"}
                </div>
              </div>
            </div>

            {/* Real Funnel Progression (Using actual GA4 and Order Data, 0 Mock) */}
            <div className="mt-6 p-6 rounded-3xl bg-foreground/5 border border-foreground/10 space-y-4">
              <div className="pb-3 border-b border-foreground/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                  {isBn ? "কনভার্সন ফানেল ও ইভেন্ট অগ্রগতি" : "Conversion Funnel & Event Progression"}
                </h3>
                <p className="text-[11px] opacity-60 font-medium mt-0.5">
                  {isBn
                    ? "বাস্তব স্টোরফ্রন্ট ভিজিট এবং প্রাপ্ত অর্ডারের ভিত্তিতে প্রস্তুতকৃত ফানেল"
                    : "Funnel drop-off progression computed directly from store telemetry and completed orders"}
                </p>
              </div>

              {(() => {
                const totalPageViews = gaLiveData?.total_screen_page_views || 0;
                const viewItemCount = gaLiveData?.event_counts?.["view_item"] || 0;
                
                // Calculate orders placed within the same 7-day window as GA4 telemetry
                const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                const recentOrders = orders.filter((o) => {
                  if (!o.placed_at) return false;
                  const t = new Date(o.placed_at).getTime();
                  return !isNaN(t) && t >= sevenDaysAgo;
                });
                
                // If GA4 recorded native purchase events, prefer it; otherwise use orders from the same 7-day period
                const gaPurchaseCount = gaLiveData?.event_counts?.["purchase"];
                const orderCount = typeof gaPurchaseCount === "number" && gaPurchaseCount > 0
                  ? gaPurchaseCount
                  : recentOrders.length;

                const funnelSteps = [
                  {
                    stage: "PageView",
                    desc: isBn ? "স্টোরফ্রন্ট ভিজিট ও রুট লোড (৭ দিন)" : "Storefront Visits / Landing (7 Days)",
                    count: totalPageViews,
                    color: "bg-accent",
                    textColor: "text-accent",
                  },
                  {
                    stage: "ViewContent",
                    desc: isBn ? "পণ্যের বিস্তারিত পেজ ভিউ" : "Product Detail Views",
                    count: viewItemCount,
                    color: "bg-visible",
                    textColor: "text-visible",
                  },
                  {
                    stage: "Purchase",
                    desc: isBn ? "সম্পন্ন অর্ডার (বিগত ৭ দিন)" : "Completed Orders (Last 7 Days)",
                    count: orderCount,
                    color: "bg-bkash",
                    textColor: "text-bkash",
                  },
                ];

                return (
                  <div className="space-y-3 pt-2">
                    {funnelSteps.map((st, i) => {
                      const percentage = totalPageViews > 0
                        ? Math.min(100, Math.round((st.count / totalPageViews) * 100))
                        : (st.count > 0 ? 100 : 0);

                      return (
                        <div key={i} className="p-4 rounded-2xl bg-secondary border border-foreground/10 space-y-2">
                          <div className="flex justify-between items-center text-xs font-black">
                            <div className="space-y-0.5">
                              <span className="font-mono text-foreground tracking-wide font-black">{st.stage}</span>
                              <div className="text-[10px] opacity-60 font-semibold">{st.desc}</div>
                            </div>
                            <div className="text-right">
                              <div className={`font-mono text-sm font-black ${st.textColor}`}>
                                {st.count > 0 ? st.count.toLocaleString(isBn ? "bn-BD" : undefined) : "0"}
                              </div>
                              <div className="text-[10px] opacity-60 font-mono">
                                {totalPageViews > 0 ? `${percentage}%` : (isBn ? "০%" : "0%")}
                              </div>
                            </div>
                          </div>

                          <div className="h-3.5 w-full bg-foreground/10 rounded-full overflow-hidden p-0.5 border border-foreground/10">
                            <div
                              className={`h-full rounded-full ${st.color} transition-all duration-700`}
                              style={{ width: `${Math.max(percentage, st.count > 0 ? 3 : 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Active Pixel E-Commerce Event Parameters */}
            <div className="mt-6 pt-4 border-t border-foreground/10">
              <div className="pb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                  {isBn ? "মেটা পিক্সেল সক্রিয় ইভেন্ট ও প্যারামিটার ম্যাপিং" : "Active Meta Pixel Event Parameters"}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    name: "PageView",
                    desc: isBn ? "প্রতিটি পেজ ভিজিটে স্বয়ংক্রিয়ভাবে ফায়ার হয়" : "Fired automatically across all storefront routes and landing pages",
                    color: "text-accent",
                    tag: isBn ? "রুট পরিবর্তন" : "Route Change",
                  },
                  {
                    name: "ViewContent",
                    desc: isBn ? "গ্রাহক কোনো পণ্যের বিস্তারিত পেজ খুললে কন্টেন্ট আইডি ও মূল্যসহ ফায়ার হয়" : "Transmits content_ids, content_name, currency, and value",
                    color: "text-visible",
                    tag: isBn ? "প্রোডাক্ট পেজ" : "Product Details",
                  },
                  {
                    name: "AddToCart",
                    desc: isBn ? "গ্রাহক শপিং কার্টে পণ্য যুক্ত করলে ভেরিয়েন্ট ও কোয়ান্টিটি সহ রেকর্ড হয়" : "Transmits content_ids, content_type, value, and quantity",
                    color: "text-bkash",
                    tag: isBn ? "কার্ট অ্যাকশন" : "Cart Action",
                  },
                  {
                    name: "InitiateCheckout",
                    desc: isBn ? "চেকআউট পেজে গিয়ে অর্ডার প্রক্রিয়া শুরু করলে কার্ট টোটাল সহ রেকর্ড হয়" : "Transmits num_items, currency, and total checkout value",
                    color: "text-nagad",
                    tag: isBn ? "চেকআউট ফানেল" : "Checkout Step",
                  },
                  {
                    name: "Purchase",
                    desc: isBn ? "অর্ডার সম্পন্ন হলে মোট অর্ডার মূল্য ও BDT কারেন্সিসহ রেকর্ড হয়" : "Transmits order_id, value, currency, and content_ids",
                    color: "text-visible",
                    tag: isBn ? "কনভার্সন" : "Conversion",
                  },
                  {
                    name: "Search",
                    desc: isBn ? "গ্রাহক কোনো পণ্য সার্চ করলে সার্চ কি-ওয়ার্ড সহ রেকর্ড হয়" : "Transmits search_string for catalog query attribution",
                    color: "text-primary",
                    tag: isBn ? "সার্চ কি-ওয়ার্ড" : "Search Query",
                  },
                ].map((ev, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-foreground/5 border border-foreground/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs font-black ${ev.color}`}>{ev.name}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-foreground/10 text-foreground">
                        {ev.tag}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-70 font-medium leading-relaxed">{ev.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


