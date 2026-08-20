"use client";

import { useState, useMemo } from "react";
import { Order, Product, CustomerItem } from "../../types";
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
} from "recharts";

type TimeRange = "24h" | "7d" | "15d" | "30d";

interface AnalyticsTabProps {
  orders?: Order[];
  products?: Product[];
  customers?: CustomerItem[];
}

export default function AnalyticsTab({
  orders = [],
  products = [],
  customers = [],
}: AnalyticsTabProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [chartType, setChartType] = useState<"area" | "bar">("area");

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
        const buckets: { [key: string]: { label: string; sales: number; orders: number } } = {};
        for (let i = 5; i >= 0; i--) {
          const slotStart = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
          const hour = slotStart.getHours();
          const key = `${hour}:00`;
          buckets[key] = { label: key, sales: 0, orders: 0 };
        }

        let salesSum = 0;
        let countSum = 0;
        let compSales = 0;

        const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        orders.forEach((o) => {
          const orderDate = o.placed_at ? new Date(o.placed_at) : new Date();
          if (orderDate >= cutoff) {
            const tot = getOrderTotal(o);
            salesSum += tot;
            countSum += 1;
            if (o.payment_status === "C") compSales += tot;

            const hoursAgo = Math.floor(
              (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60)
            );
            const slotIndex = Math.min(5, Math.floor(hoursAgo / 4));
            const slotTime = new Date(now.getTime() - slotIndex * 4 * 60 * 60 * 1000);
            const key = `${slotTime.getHours()}:00`;
            if (buckets[key]) {
              buckets[key].sales += tot;
              buckets[key].orders += 1;
            }
          }
        });

        const data = Object.values(buckets);
        return {
          chartData: data,
          totalSales: salesSum,
          totalOrdersCount: countSum,
          avgOrderValue: countSum > 0 ? salesSum / countSum : 0,
          completedSales: compSales,
        };
      }

      const daysCount = timeRange === "7d" ? 7 : timeRange === "15d" ? 15 : 30;
      const dayMap: { [key: string]: { label: string; sales: number; orders: number; dateStr: string } } = {};

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        dayMap[dateStr] = { label, sales: 0, orders: 0, dateStr };
      }

      const cutoff = new Date(now.getTime() - daysCount * 24 * 60 * 60 * 1000);
      let salesSum = 0;
      let countSum = 0;
      let compSales = 0;

      orders.forEach((o) => {
        const orderDate = o.placed_at ? new Date(o.placed_at) : new Date();
        if (orderDate >= cutoff) {
          const dateStr = orderDate.toISOString().split("T")[0];
          const tot = getOrderTotal(o);
          salesSum += tot;
          countSum += 1;
          if (o.payment_status === "C") compSales += tot;

          if (dayMap[dateStr]) {
            dayMap[dateStr].sales += tot;
            dayMap[dateStr].orders += 1;
          }
        }
      });

      const data = Object.values(dayMap);
      return {
        chartData: data,
        totalSales: salesSum,
        totalOrdersCount: countSum,
        avgOrderValue: countSum > 0 ? salesSum / countSum : 0,
        completedSales: compSales,
      };
    }, [orders, timeRange]);

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
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
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-colors ${
                  chartType === "area"
                    ? "bg-button-bg text-button-fg"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-colors ${
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
    </div>
  );
}
