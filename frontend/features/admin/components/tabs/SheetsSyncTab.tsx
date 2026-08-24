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
        confirmButtonColor: "var(--accent)",
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
          title: `Catalog synced successfully. Created: ${data.created_count}, Updated: ${data.updated_count}`,
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
          confirmButtonColor: "var(--accent)",
        });
      }
    } catch (err: any) {
      console.error("Google Sheets sync error:", err);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: err?.message || "Failed to reach the server.",
        confirmButtonColor: "var(--accent)",
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
        confirmButtonColor: "var(--accent)",
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
          title: `File imported successfully. Created: ${data.created_count}, Updated: ${data.updated_count}`,
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
          confirmButtonColor: "var(--accent)",
        });
      }
    } catch (err: any) {
      console.error("Bulk CSV import error:", err);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: err?.message || "Failed to upload the file.",
        confirmButtonColor: "var(--accent)",
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
          title: "Catalog CSV downloaded",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Export Failed",
          text: "Could not export product catalog.",
          confirmButtonColor: "var(--accent)",
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
      "image_url",
    ];

    const sampleRows = [
      [
        "",
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
        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800",
      ],
      [
        "",
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
        "",
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
        "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800",
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-secondary text-foreground border border-foreground/10 shadow-sm transition-colors duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                Spreadsheet & Catalog Synchronization
              </h2>
            </div>
            <p className="text-xs text-foreground/70 font-medium">
              Synchronize inventory and product catalogs directly from Google Sheets or standard CSV files.
            </p>
          </div>

          {/* Action Template Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadSampleTemplate}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-primary/5 hover:bg-primary/10 text-foreground border border-foreground/15 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Sample Template</span>
            </button>
            <button
              type="button"
              onClick={handleExportCatalog}
              disabled={isExporting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-button-bg text-button-fg hover:opacity-90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{isExporting ? "Exporting..." : "Export Catalog"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Google Sheets Live Sync & CSV File Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Method 1: Google Sheets Live Sync */}
        <div className="p-6 md:p-7 rounded-3xl bg-secondary text-foreground border border-foreground/10 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-foreground/10">
              <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-black text-xs">
                01
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Google Sheets Live Sync
                </h3>
                <p className="text-[10px] text-foreground/60">Connect shareable sheet to update database</p>
              </div>
            </div>

            <form onSubmit={handleSyncGoogleSheet} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Google Sheet Shareable URL
                </label>
                <input
                  type="url"
                  required
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                  className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
                />
              </div>

              {/* Instructions Box */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10 text-[11px] space-y-1.5 text-foreground/80 leading-relaxed font-medium">
                <p className="font-bold text-foreground">Connection Guide:</p>
                <ol className="list-decimal pl-4 space-y-1 opacity-80 text-[10.5px]">
                  <li>In Google Sheets, open the <b>Share</b> settings.</li>
                  <li>Set access permissions to <b>&quot;Anyone with the link can view&quot;</b>.</li>
                  <li>Paste the URL above and submit to synchronize changes.</li>
                </ol>
              </div>

              <button
                type="submit"
                disabled={isSyncingSheet}
                className="w-full py-2.5 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSyncingSheet ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-button-fg border-t-transparent rounded-full animate-spin"></div>
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <span>Sync Google Sheet</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Method 2: Offline CSV / Excel File Upload */}
        <div className="p-6 md:p-7 rounded-3xl bg-secondary text-foreground border border-foreground/10 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-foreground/10">
              <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-black text-xs">
                02
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Bulk CSV / Excel File Import
                </h3>
                <p className="text-[10px] text-foreground/60">Import catalog files prepared offline</p>
              </div>
            </div>

            <form onSubmit={handleImportFile} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Select CSV Spreadsheet
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
              <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10 text-[11px] space-y-1.5 text-foreground/80 leading-relaxed font-medium">
                <p className="font-bold text-foreground">Updating Existing Inventory:</p>
                <p className="opacity-80 text-[10.5px]">
                  Use the <b>&quot;Export Catalog&quot;</b> action to download current IDs, make offline quantity or price edits, and upload the updated spreadsheet here.
                </p>
              </div>

              <button
                type="submit"
                disabled={isImportingFile || !selectedFile}
                className="w-full py-2.5 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isImportingFile ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-button-fg border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing File...</span>
                  </>
                ) : (
                  <span>Process CSV Import</span>
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
              <p className="text-[10px] text-foreground/60">
                Source: {lastSyncMode === "sheets" ? "Google Sheets" : "Uploaded CSV"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSyncResults(null)}
              className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 hover:text-foreground cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                Products Created
              </span>
              <p className="text-2xl font-black text-foreground mt-1">
                {syncResults.created_count}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                Products Updated
              </span>
              <p className="text-2xl font-black text-accent mt-1">
                {syncResults.updated_count}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                Warnings / Errors
              </span>
              <p className={`text-2xl font-black mt-1 ${syncResults.errors.length > 0 ? "text-red-500" : "text-foreground/70"}`}>
                {syncResults.errors.length}
              </p>
            </div>
          </div>

          {syncResults.errors.length > 0 && (
            <div className="p-4 rounded-2xl bg-primary/5 border border-red-500/30 space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-red-500">
                Error Details:
              </p>
              <ul className="list-disc pl-5 text-xs text-foreground/80 space-y-1 max-h-40 overflow-y-auto">
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
