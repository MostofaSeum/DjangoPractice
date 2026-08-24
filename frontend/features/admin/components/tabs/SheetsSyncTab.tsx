"use client";

import { useState, useRef } from "react";
import Swal from "sweetalert2";

interface SheetsSyncTabProps {
  apiBase: string;
  token: string | null;
  onSyncSuccess?: () => void;
}

interface SyncStats {
  created_count: number;
  updated_count: number;
  errors: string[];
}

export default function SheetsSyncTab({
  apiBase,
  token,
  onSyncSuccess,
}: SheetsSyncTabProps) {
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [isImportingFile, setIsImportingFile] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncStats | null>(null);
  const [lastSyncMode, setLastSyncMode] = useState<"sheets" | "file" | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 1. Google Sheets Live Sync
  const handleSyncGoogleSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const trimmedUrl = googleSheetUrl.trim();
    if (!trimmedUrl) {
      Swal.fire({
        icon: "warning",
        title: "URL Required",
        text: "Please enter your Google Sheets link.",
      });
      return;
    }

    try {
      setIsSyncingSheet(true);
      setSyncResults(null);

      const res = await fetch(`${apiBase}/store/products/sync_google_sheet/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setSyncResults(data);
        setLastSyncMode("sheets");
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: `Google Sheet Synced! Created: ${data.created_count}, Updated: ${data.updated_count}`,
          showConfirmButton: false,
          timer: 2500,
          toast: true,
        });
        if (onSyncSuccess) onSyncSuccess();
      } else {
        Swal.fire({
          icon: "error",
          title: "Sync Failed",
          text: data?.error || "Could not fetch or sync from this Google Sheet.",
        });
      }
    } catch (err: any) {
      console.error("Google Sheets sync error:", err);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: err?.message || "Failed to reach the server.",
      });
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // 2. Offline CSV File Import
  const handleImportFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "File Required",
        text: "Please choose a CSV file to import.",
      });
      return;
    }

    try {
      setIsImportingFile(true);
      setSyncResults(null);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`${apiBase}/store/products/bulk_import_csv/`, {
        method: "POST",
        headers: {
          Authorization: `JWT ${token}`,
        },
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setSyncResults(data);
        setLastSyncMode("file");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: `File Imported! Created: ${data.created_count}, Updated: ${data.updated_count}`,
          showConfirmButton: false,
          timer: 2500,
          toast: true,
        });
        if (onSyncSuccess) onSyncSuccess();
      } else {
        Swal.fire({
          icon: "error",
          title: "Import Failed",
          text: data?.error || "Failed to process the CSV file.",
        });
      }
    } catch (err: any) {
      console.error("Bulk CSV import error:", err);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: err?.message || "Failed to upload the file.",
      });
    } finally {
      setIsImportingFile(false);
    }
  };

  // 3. Export Catalog CSV
  const handleExportCatalog = async () => {
    if (!token) return;
    try {
      setIsExporting(true);
      const res = await fetch(`${apiBase}/store/products/export_csv/`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vibemart_products_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Catalog CSV downloaded!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Export Failed",
          text: "Could not export product catalog.",
        });
      }
    } catch (err) {
      console.error("Catalog export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // 4. Download Sample CSV Template
  const handleDownloadSampleTemplate = () => {
    const headers = [
      "id",
      "title",
      "collection",
      "unit_price",
      "discount_percent",
      "inventory",
      "short_description",
      "description",
      "variant_name",
      "variant_color_name",
      "variant_color_code",
      "variant_size",
      "variant_price",
      "variant_inventory",
    ];

    const sampleRows = [
      [
        "", // Leave id blank for new products
        "Velvet Matte Lipstick",
        "Lips",
        "850.00",
        "10",
        "20",
        "Hydrating long-lasting matte lipstick with rich pigment",
        "Infused with Vitamin E and Jojoba oil for smooth all-day comfort.",
        "Shade 01 Ruby Red",
        "Ruby Red",
        "#C82333",
        "4.5g",
        "850.00",
        "10",
      ],
      [
        "", // Second variant of the same product
        "Velvet Matte Lipstick",
        "Lips",
        "850.00",
        "10",
        "20",
        "Hydrating long-lasting matte lipstick with rich pigment",
        "Infused with Vitamin E and Jojoba oil for smooth all-day comfort.",
        "Shade 02 Berry Nude",
        "Berry Nude",
        "#9E4770",
        "4.5g",
        "850.00",
        "10",
      ],
      [
        "",
        "Hydra Glow Foundation",
        "Face",
        "1450.00",
        "0",
        "30",
        "Lightweight buildable foundation with SPF 25",
        "Breathable liquid formula designed for all skin tones.",
        "01 Ivory",
        "Ivory",
        "#F6E3CE",
        "30ml",
        "1450.00",
        "15",
      ],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...sampleRows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join(
        "\n"
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vibemart_products_sample_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-secondary text-foreground border border-foreground/10 shadow-sm transition-colors duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                Google Sheets & Excel Bulk Sync
              </h2>
            </div>
            <p className="text-xs text-foreground/60">
              Manage your stock and products in Google Sheets or Excel.
            </p>
          </div>

          {/* Action Template Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadSampleTemplate}
              className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-primary/10 text-foreground hover:bg-primary/20 transition-all border border-foreground/10 cursor-pointer"
            >
              📥 Sample CSV Template
            </button>
            <button
              type="button"
              onClick={handleExportCatalog}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-button-bg text-button-fg hover:opacity-90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isExporting ? "Exporting..." : "⬇️ Export Catalog (CSV)"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Option 1 (Google Sheets) & Option 2 (Excel / CSV Upload) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Method 1: Google Sheets Live Sync */}
        <div className="p-6 md:p-8 rounded-3xl bg-secondary text-foreground border border-foreground/10 shadow-sm flex flex-col justify-between h-full transition-colors duration-300">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-foreground/10">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                1
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Google Sheets Live Sync
                </h3>
                <span className="text-[10px] opacity-60">Paste link & sync in real-time</span>
              </div>
            </div>

            <form onSubmit={handleSyncGoogleSheet} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70">
                  Google Sheet Shareable Link *
                </label>
                <input
                  type="url"
                  required
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
                  className="px-4 py-3 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all shadow-inner"
                />
              </div>

              {/* Instructions Box */}
              <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 text-[11px] space-y-1.5 opacity-85 leading-relaxed">
                <p className="font-bold text-foreground">⚡ How to get the link:</p>
                <ol className="list-decimal pl-4 space-y-1 opacity-75">
                  <li>In your Google Sheet, click the top right <b>Share</b> button.</li>
                  <li>Under General Access, choose <b>&quot;Anyone with the link can view&quot;</b>.</li>
                  <li>Copy and paste the URL here and click <b>Sync Now</b>.</li>
                </ol>
              </div>

              <button
                type="submit"
                disabled={isSyncingSheet}
                className="w-full py-3 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSyncingSheet ? (
                  <>
                    <div className="w-4 h-4 border-2 border-button-fg border-t-transparent rounded-full animate-spin"></div>
                    <span>Syncing from Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <span>🔄 Sync from Google Sheets</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Method 2: Offline CSV / Excel File Upload */}
        <div className="p-6 md:p-8 rounded-3xl bg-secondary text-foreground border border-foreground/10 shadow-sm flex flex-col justify-between h-full transition-colors duration-300">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-foreground/10">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                2
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Upload CSV / Excel File
                </h3>
                <span className="text-[10px] opacity-60">Bulk import offline spreadsheets</span>
              </div>
            </div>

            <form onSubmit={handleImportFile} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70">
                  Select CSV File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  required
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setSelectedFile(f);
                  }}
                  className="block w-full text-xs text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-button-bg file:text-button-fg hover:file:opacity-90 cursor-pointer"
                />
              </div>

              {/* Instructions Box */}
              <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 text-[11px] space-y-1.5 opacity-85 leading-relaxed">
                <p className="font-bold text-foreground">💡 Tip for existing products:</p>
                <p className="opacity-75">
                  Click <b>&quot;Export Catalog (CSV)&quot;</b> above to get your existing products with their IDs, update stock or prices in Excel, and upload here to bulk update!
                </p>
              </div>

              <button
                type="submit"
                disabled={isImportingFile || !selectedFile}
                className="w-full py-3 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isImportingFile ? (
                  <>
                    <div className="w-4 h-4 border-2 border-button-fg border-t-transparent rounded-full animate-spin"></div>
                    <span>Importing CSV file...</span>
                  </>
                ) : (
                  <>
                    <span>📤 Upload & Process File</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Sync Results & Audit Report Card */}
      {syncResults && (
        <div className="p-6 md:p-8 rounded-3xl bg-secondary text-foreground border border-foreground/10 shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center pb-3 border-b border-foreground/10">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                Sync Execution Report
              </h3>
              <span className="text-[10px] opacity-60">
                Source: {lastSyncMode === "sheets" ? "Google Sheets" : "Uploaded CSV"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSyncResults(null)}
              className="text-[10px] font-bold uppercase tracking-wider opacity-60 hover:opacity-100"
            >
              ✕ Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                New Products Created
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {syncResults.created_count}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Existing Products Updated
              </span>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {syncResults.updated_count}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Row Warnings / Errors
              </span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {syncResults.errors.length}
              </p>
            </div>
          </div>

          {syncResults.errors.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-red-500">
                Error Details:
              </p>
              <ul className="list-disc pl-5 text-xs text-red-500 space-y-1 max-h-40 overflow-y-auto">
                {syncResults.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
