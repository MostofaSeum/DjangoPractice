"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Product, Collection } from "../../types";
import ProductImage from "@/components/ui/ProductImage";

interface StockHealthTabProps {
  products: Product[];
  collections?: Collection[];
  onSelectProduct?: (product: Product) => void;
}

export default function StockHealthTab({
  products,
  collections = [],
  onSelectProduct,
}: StockHealthTabProps) {
  // Threshold input state: max 3 digit number, default 10
  const [thresholdInput, setThresholdInput] = useState<string>("10");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"inventory_asc" | "inventory_desc" | "title" | "price">("inventory_asc");

  // Handle threshold change ensuring max 3 digits (0-999)
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Allow empty string so user can clear and retype
    if (rawVal === "") {
      setThresholdInput("");
      return;
    }
    // Only allow positive integers up to 3 digits
    const digitsOnly = rawVal.replace(/\D/g, "");
    if (digitsOnly.length <= 3) {
      setThresholdInput(digitsOnly);
    }
  };

  const currentThreshold = useMemo(() => {
    if (thresholdInput === "") return 0;
    const parsed = parseInt(thresholdInput, 10);
    return isNaN(parsed) ? 10 : parsed;
  }, [thresholdInput]);

  // Overall catalog metrics
  const catalogMetrics = useMemo(() => {
    const totalItems = products.length;
    const outOfStockCount = products.filter((p) => Number(p.inventory || 0) <= 0).length;
    const lowStockCount = products.filter(
      (p) => Number(p.inventory || 0) > 0 && Number(p.inventory || 0) < currentThreshold
    ).length;
    const healthyStockCount = products.filter(
      (p) => Number(p.inventory || 0) >= currentThreshold
    ).length;

    const totalUnitsInCatalog = products.reduce(
      (acc, p) => acc + Math.max(0, Number(p.inventory || 0)),
      0
    );

    return {
      totalItems,
      outOfStockCount,
      lowStockCount,
      healthyStockCount,
      totalUnitsInCatalog,
    };
  }, [products, currentThreshold]);

  // Filtered products with inventory strictly less than threshold
  const lowStockProducts = useMemo(() => {
    return products.filter((product) => {
      const stock = Number(product.inventory || 0);
      const isUnderThreshold = stock < currentThreshold;

      if (!isUnderThreshold) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = product.title?.toLowerCase().includes(q);
        const matchesId = String(product.id).includes(q);
        if (!matchesTitle && !matchesId) return false;
      }

      // Filter by collection
      if (selectedCollectionId !== "ALL") {
        if (product.collection !== selectedCollectionId) return false;
      }

      return true;
    });
  }, [products, currentThreshold, searchQuery, selectedCollectionId]);

  // Sorted low stock list
  const sortedLowStockProducts = useMemo(() => {
    const list = [...lowStockProducts];
    if (sortBy === "inventory_asc") {
      list.sort((a, b) => Number(a.inventory || 0) - Number(b.inventory || 0));
    } else if (sortBy === "inventory_desc") {
      list.sort((a, b) => Number(b.inventory || 0) - Number(a.inventory || 0));
    } else if (sortBy === "title") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "price") {
      list.sort((a, b) => Number(b.unit_price || 0) - Number(a.unit_price || 0));
    }
    return list;
  }, [lowStockProducts, sortBy]);

  const getCollectionTitle = (collectionId?: number) => {
    if (!collectionId) return "Uncategorized";
    const found = collections.find((c) => c.id === collectionId);
    return found ? found.title : `Collection #${collectionId}`;
  };

  // Printable Report Generation (Save as PDF / Print via browser)
  const handlePrintPDF = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      alert("Please allow popups to generate and print the PDF report.");
      return;
    }

    const reportDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const rowsHtml = sortedLowStockProducts
      .map((item, index) => {
        const stock = Number(item.inventory || 0);
        const isZero = stock <= 0;
        const colTitle = getCollectionTitle(item.collection);
        const price = Number(item.unit_price || 0).toFixed(2);
        return `
          <tr style="border-bottom: 1px solid rgba(58, 53, 50, 0.12); font-size: 11px;">
            <td style="padding: 8px 10px; text-align: center; color: rgba(58, 53, 50, 0.6);">${index + 1}</td>
            <td style="padding: 8px 10px; font-weight: 700; color: #3a3532;">#${item.id}</td>
            <td style="padding: 8px 10px; font-weight: 700; color: #3a3532;">${item.title}</td>
            <td style="padding: 8px 10px; color: rgba(58, 53, 50, 0.7);">${colTitle}</td>
            <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: #8b7a66;">৳${price}</td>
            <td style="padding: 8px 10px; text-align: center;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; ${
                isZero
                  ? "background-color: rgba(58, 53, 50, 0.1); color: #3a3532; border: 1px solid rgba(58, 53, 50, 0.2);"
                  : "background-color: rgba(139, 122, 102, 0.15); color: #8b7a66; border: 1px solid rgba(139, 122, 102, 0.3);"
              }">
                ${isZero ? "Out of Stock" : "Low Stock"}
              </span>
            </td>
            <td style="padding: 8px 10px; text-align: center; font-weight: 800; font-family: monospace; font-size: 12px; color: ${
              isZero ? "#3a3532" : "#8b7a66"
            };">
              ${stock} units
            </td>
          </tr>
        `;
      })
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Stock Health Alert Report - Threshold &lt; ${currentThreshold}</title>
          <style>
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @page {
                margin: 1.2cm;
                size: A4 portrait;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #3a3532;
              background-color: #ffffff;
              margin: 0;
              padding: 24px;
            }
            .header-bar {
              border-bottom: 2px solid #8b7a66;
              padding-bottom: 16px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .title {
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0 0 4px 0;
              color: #3a3532;
            }
            .subtitle {
              font-size: 11px;
              color: rgba(58, 53, 50, 0.7);
              margin: 0;
            }
            .kpi-container {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 24px;
            }
            .kpi-card {
              border: 1px solid rgba(58, 53, 50, 0.12);
              background-color: rgba(230, 224, 212, 0.35);
              border-radius: 8px;
              padding: 10px 12px;
            }
            .kpi-title {
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: rgba(58, 53, 50, 0.7);
              margin-bottom: 4px;
            }
            .kpi-val {
              font-size: 16px;
              font-weight: 900;
              color: #3a3532;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background-color: #f3efe6;
              color: #3a3532;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 9px 10px;
              border-top: 1px solid rgba(58, 53, 50, 0.12);
              border-bottom: 1px solid #8b7a66;
            }
            .footer {
              margin-top: 30px;
              padding-top: 12px;
              border-top: 1px solid rgba(58, 53, 50, 0.12);
              font-size: 10px;
              color: rgba(58, 53, 50, 0.6);
              display: flex;
              justify-content: space-between;
            }
            .print-btn {
              background-color: #3a3532;
              color: #ffffff;
              border: none;
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <h1 class="title">Inventory &amp; Stock Health Alert Report</h1>
              <p class="subtitle">Threshold Filter: Less than <strong>${currentThreshold} units</strong> | Generated on: ${reportDate}</p>
            </div>
            <div class="no-print">
              <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
            </div>
          </div>

          <div class="kpi-container">
            <div class="kpi-card">
              <div class="kpi-title">Alert Items</div>
              <div class="kpi-val">${sortedLowStockProducts.length} Products</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Out of Stock</div>
              <div class="kpi-val">${catalogMetrics.outOfStockCount} Products</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Safety Threshold</div>
              <div class="kpi-val">&lt; ${currentThreshold} Units</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Total Catalog Units</div>
              <div class="kpi-val">${catalogMetrics.totalUnitsInCatalog} Units</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">#</th>
                <th style="width: 55px; text-align: left;">ID</th>
                <th style="text-align: left;">Product Title</th>
                <th style="text-align: left;">Collection</th>
                <th style="width: 80px; text-align: right;">Unit Price</th>
                <th style="width: 100px; text-align: center;">Status</th>
                <th style="width: 90px; text-align: center;">Stock Level</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="7" style="text-align:center; padding: 24px; font-weight: 600; color: #736b63;">No products found below the current threshold.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            <span>Storefront Admin Inventory Management</span>
            <span>Page 1 of 1</span>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header & Threshold Controller Card */}
      <div className="bg-secondary text-foreground p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-foreground/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
              </span>
              <h2 className="text-base font-black uppercase tracking-widest text-foreground">
                Inventory & Stock Health Alert Cards
              </h2>
            </div>
            <p className="text-xs text-foreground/70">
              Set your target stock safety threshold to identify, prioritize, and restock low-inventory items across your catalog.
            </p>
          </div>

          {/* Right Action Controls: Threshold Box + PDF Download Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Download/Print PDF Button */}
            <button
              type="button"
              onClick={handlePrintPDF}
              className="flex items-center gap-2 px-3.5 py-2 bg-button-bg text-button-fg rounded-xl text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-xs cursor-pointer"
              title="Download or print stock alert report as PDF"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print / Save PDF
            </button>

            {/* Threshold Input Control Box */}
            <div className="flex items-center gap-2.5 bg-primary/5 dark:bg-primary/20 px-3 py-2 rounded-xl border border-foreground/10">
              <label
                htmlFor="inventory-threshold-input"
                className="text-[10px] font-black uppercase tracking-wider text-foreground/70 shrink-0"
              >
                Alert Threshold
              </label>

              <div className="flex items-center gap-1.5">
                <input
                  id="inventory-threshold-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  value={thresholdInput}
                  onChange={handleThresholdChange}
                  placeholder="10"
                  className="w-14 px-2 py-1 text-center text-xs font-black tracking-wider bg-background border border-foreground/20 rounded-lg text-foreground focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setThresholdInput("10")}
                  className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-background hover:bg-button-bg hover:text-button-fg border border-foreground/15 rounded-lg transition-all shadow-xs cursor-pointer"
                  title="Reset threshold to default 10"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Top Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Alert Count */}
          <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground/70">
                Under Threshold (&lt; {currentThreshold})
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/20 text-accent">
                Needs Attention
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">
                {lowStockProducts.length}
              </span>
              <span className="text-xs font-bold text-foreground/60">
                items ({((lowStockProducts.length / (catalogMetrics.totalItems || 1)) * 100).toFixed(0)}% of catalog)
              </span>
            </div>
          </div>

          {/* Card 2: Out of Stock (0 units) */}
          <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground/70">
                Out of Stock (0 Units)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-foreground/10 text-foreground/80">
                Critical
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">
                {catalogMetrics.outOfStockCount}
              </span>
              <span className="text-xs font-bold text-foreground/60">
                items zero stock
              </span>
            </div>
          </div>

          {/* Card 3: Healthy Stock */}
          <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground/70">
                Adequate Stock (&ge; {currentThreshold})
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-foreground/10 text-foreground/80">
                Healthy
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">
                {catalogMetrics.healthyStockCount}
              </span>
              <span className="text-xs font-bold text-foreground/60">
                items safe
              </span>
            </div>
          </div>

          {/* Card 4: Total Inventory in Catalog */}
          <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground/70">
                Total Catalog Units
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-foreground/10 text-foreground/80">
                Inventory
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">
                {catalogMetrics.totalUnitsInCatalog}
              </span>
              <span className="text-xs font-bold text-foreground/60">
                total units across {catalogMetrics.totalItems} items
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filters and Search Bar */}
      <div className="bg-secondary text-foreground p-6 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alert items by title or ID..."
              className="w-full pl-4 pr-10 py-2.5 text-xs font-bold bg-background border border-foreground/15 rounded-2xl text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-accent outline-none transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            )}
          </div>

          {/* Collection Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 shrink-0">
                Collection:
              </label>
              <select
                value={selectedCollectionId}
                onChange={(e) =>
                  setSelectedCollectionId(
                    e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                  )
                }
                className="px-3 py-2 text-xs font-bold bg-background border border-foreground/15 rounded-xl text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-accent shadow-xs"
              >
                <option value="ALL">All Collections</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 shrink-0">
                Sort:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-xs font-bold bg-background border border-foreground/15 rounded-xl text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-accent shadow-xs"
              >
                <option value="inventory_asc">Stock: Lowest First</option>
                <option value="inventory_desc">Stock: Highest First</option>
                <option value="title">Title: Alphabetical</option>
                <option value="price">Price: Highest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Alert Items List / Grid Display */}
      <div className="bg-secondary text-foreground p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-foreground/10">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
              Low Stock Items List ({sortedLowStockProducts.length})
            </h3>
            <p className="text-[11px] text-foreground/60 mt-0.5">
              Showing all products with inventory strictly below {currentThreshold} units.
            </p>
          </div>

          <span className="text-[10px] font-bold px-3 py-1 bg-primary/5 rounded-full border border-foreground/10 text-foreground/70">
            Threshold: &lt; {currentThreshold}
          </span>
        </div>

        {sortedLowStockProducts.length === 0 ? (
          <div className="py-14 text-center border-2 border-dashed border-foreground/10 rounded-2xl bg-primary/5 dark:bg-primary/20">
            <div className="w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto mb-3 font-black text-base">
              ✓
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
              All Stock Levels Healthy
            </h4>
            <p className="text-xs text-foreground/60 max-w-sm mx-auto mt-1">
              No products found with inventory below {currentThreshold} units
              {searchQuery || selectedCollectionId !== "ALL" ? " matching your active filters" : ""}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedLowStockProducts.map((product) => {
              const stock = Number(product.inventory || 0);
              const isZero = stock <= 0;
              const unitPrice = Number(product.unit_price || 0);

              return (
                <div
                  key={product.id}
                  className="bg-background rounded-2xl border border-foreground/10 p-4.5 flex flex-col justify-between shadow-xs hover:border-foreground/25 hover:shadow-md transition-all duration-200"
                >
                  {/* Top Part: Product Image + Information */}
                  <div className="flex items-start gap-3.5">
                    <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-foreground/10 bg-secondary shadow-xs">
                      <ProductImage
                        title={product.title}
                        images={product.images}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
                          #{product.id}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            isZero
                              ? "bg-foreground/10 text-foreground border-foreground/20"
                              : "bg-accent/15 text-accent border-accent/30"
                          }`}
                        >
                          {isZero ? "Out of Stock" : "Low Stock"}
                        </span>
                      </div>

                      <h4
                        className="text-xs font-bold text-foreground truncate mt-1"
                        title={product.title}
                      >
                        {product.title}
                      </h4>

                      <p className="text-[10px] text-foreground/60 font-medium truncate mt-0.5">
                        {getCollectionTitle(product.collection)}
                      </p>

                      <p className="text-xs font-black text-accent mt-1">
                        ৳{unitPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Part: Stock Level Progress & Action */}
                  <div className="mt-4 pt-3 border-t border-foreground/10">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider mb-1.5">
                      <span className="text-foreground/70">Current Inventory</span>
                      <span
                        className={`text-xs font-mono font-black ${
                          isZero ? "text-foreground opacity-90" : "text-accent"
                        }`}
                      >
                        {stock} / {currentThreshold} units
                      </span>
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-primary/10 overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, (stock / Math.max(1, currentThreshold)) * 100))}%`,
                        }}
                      />
                    </div>

                    {/* Quick Select / Edit Action */}
                    {onSelectProduct && (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product)}
                          className="w-full py-2 bg-primary/5 hover:bg-button-bg hover:text-button-fg border border-foreground/15 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center cursor-pointer shadow-xs"
                        >
                          Manage Product
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
