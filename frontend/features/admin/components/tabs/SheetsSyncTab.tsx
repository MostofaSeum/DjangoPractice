"use client";

import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import { useLanguage } from "@/store/LanguageContext";

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

/**
 * Only renders character counter when user is near the limit (>= 80% or within 5 chars)
 */
function renderCharCounter(currentLen: number, maxLen: number) {
  const threshold = Math.min(Math.floor(maxLen * 0.8), Math.max(0, maxLen - 5));
  if (currentLen < threshold) return null;
  const isAtLimit = currentLen >= maxLen;
  return (
    <span
      className={`text-[9px] font-mono transition-colors ${
        isAtLimit ? "text-red-500 font-bold opacity-100" : "opacity-60 text-foreground"
      }`}
    >
      {currentLen}/{maxLen}
    </span>
  );
}

export default function SheetsSyncTab({
  apiBase,
  token,
  onSyncSuccess,
}: SheetsSyncTabProps) {
  const { locale } = useLanguage();
  const isBn = locale === "bn";

  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [savedSheetUrl, setSavedSheetUrl] = useState<string>("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isLoadingSavedUrl, setIsLoadingSavedUrl] = useState(true);

  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [isImportingFile, setIsImportingFile] = useState(false);
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [zipUploadProgress, setZipUploadProgress] = useState(0);
  const [zipUploadStage, setZipUploadStage] = useState<"uploading" | "processing">("uploading");
  const [isExporting, setIsExporting] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncStats | null>(null);
  const [lastSyncMode, setLastSyncMode] = useState<"sheets" | "file" | "zip" | null>(null);
  const [zipReport, setZipReport] = useState<{
    message: string;
    matched_products_count: number;
    total_images_uploaded: number;
    unmatched_folders: string[];
    details: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedZip, setSelectedZip] = useState<File | null>(null);

  // Fetch saved Google Sheet URL on mount
  useEffect(() => {
    if (!token) return;

    const fetchSavedSheetUrl = async () => {
      try {
        setIsLoadingSavedUrl(true);
        const res = await fetch(`${apiBase}/store/products/get_saved_sheet_url/`, {
          headers: {
            Authorization: `JWT ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.sheet_url) {
            setSavedSheetUrl(data.sheet_url);
            setGoogleSheetUrl(data.sheet_url);
          }
          if (data.last_synced_at) {
            setLastSyncedAt(data.last_synced_at);
          }
        }
      } catch (err) {
        console.error("Failed to load saved Google Sheet URL:", err);
      } finally {
        setIsLoadingSavedUrl(false);
      }
    };

    fetchSavedSheetUrl();
  }, [apiBase, token]);

  // Save or update Google Sheet URL in database
  const saveUrlToDatabase = async (urlToSave: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/store/products/save_google_sheet_url/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ url: urlToSave }),
      });
      if (res.ok) {
        setSavedSheetUrl(urlToSave);
        return true;
      }
    } catch (err) {
      console.error("Failed to save URL:", err);
    }
    return false;
  };

  // Delete saved Google Sheet URL
  const handleDeleteSavedUrl = async () => {
    if (!token) return;
    const confirmResult = await Swal.fire({
      title: isBn ? "গুগল শিট সংযোগ বিচ্ছিন্ন করবেন?" : "Disconnect Sheet?",
      text: isBn
        ? "আপনি কি নিশ্চিতভাবে এই গুগল শিট লিঙ্কটি বিচ্ছিন্ন করতে চান? পরবর্তীতে যেকোনো সময় নতুন লিঙ্ক যুক্ত করতে পারবেন।"
        : "Are you sure you want to disconnect this saved Google Sheet link? You will be able to connect a new link anytime.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isBn ? "হ্যাঁ, সংযোগ বিচ্ছিন্ন করুন" : "Yes, Disconnect",
      cancelButtonText: isBn ? "বাতিল" : "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "var(--accent)",
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const res = await fetch(`${apiBase}/store/products/delete_saved_sheet_url/`, {
        method: "DELETE",
        headers: {
          Authorization: `JWT ${token}`,
        },
      });

      if (res.ok) {
        setSavedSheetUrl("");
        setGoogleSheetUrl("");
        setLastSyncedAt(null);
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isBn ? "গুগল শিট সংযোগ বিচ্ছিন্ন করা হয়েছে।" : "Google Sheet disconnected.",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
      }
    } catch (err) {
      console.error("Failed to delete saved sheet URL:", err);
    }
  };

  // 1. Google Sheets Live Sync (Works for direct URL or 1-click update)
  const handleSyncGoogleSheet = async (urlOverride?: string) => {
    if (!token) return;

    const targetUrl = (urlOverride || googleSheetUrl).trim();
    if (!targetUrl) {
      Swal.fire({
        icon: "warning",
        title: isBn ? "লিঙ্ক প্রয়োজন" : "URL Required",
        text: isBn ? "অনুগ্রহ করে আপনার গুগল শিট লিঙ্ক প্রদান করুন।" : "Please enter your Google Sheets link.",
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
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && (data.created_count > 0 || data.updated_count > 0)) {
        setSyncResults(data);
        setLastSyncMode("sheets");
        setLastSyncedAt(data.last_synced_at || new Date().toISOString());

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isBn
            ? `ক্যাটালগ সফলভাবে সিঙ্ক হয়েছে! নতুন যুক্ত: ${data.created_count.toLocaleString("bn-BD")}, আপডেট: ${data.updated_count.toLocaleString("bn-BD")}`
            : `Catalog synced successfully! Created: ${data.created_count}, Updated: ${data.updated_count}`,
          showConfirmButton: false,
          timer: 2500,
          toast: true,
        });

        if (onSyncSuccess) onSyncSuccess();

        // Prompt to save URL ONLY if the sync was genuinely successful and products were synced
        if (!savedSheetUrl || savedSheetUrl !== targetUrl) {
          const promptSave = await Swal.fire({
            title: isBn ? "গুগল শিট লিঙ্ক সংরক্ষণ করবেন?" : "Save Google Sheet Link?",
            text: isBn
              ? "আপনি কি এই গুগল শিট লিঙ্কটি সংরক্ষণ করতে চান? পরবর্তীতে মাত্র ১ ক্লিকে পুরো ক্যাটালগ আপডেট করতে পারবেন!"
              : "Would you like to save this Google Sheet link? Next time, you can update your entire website catalog with just 1 click!",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: isBn ? "হ্যাঁ, সংরক্ষণ করুন" : "Yes, Save Link",
            cancelButtonText: isBn ? "এখন নয়" : "Not Now",
            confirmButtonColor: "var(--button-bg)",
            cancelButtonColor: "var(--accent)",
            reverseButtons: true,
          });

          if (promptSave.isConfirmed) {
            await saveUrlToDatabase(targetUrl);
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: isBn ? "লিঙ্ক সংরক্ষিত হয়েছে! এখন ১-ক্লিক আপডেট ব্যবহার করতে পারবেন।" : "Link saved! You can now use 1-Click Update.",
              showConfirmButton: false,
              timer: 2500,
              toast: true,
            });
          }
        }
      } else {
        Swal.fire({
          icon: "error",
          title: isBn ? "সিঙ্ক ব্যর্থ হয়েছে" : "Sync Failed",
          text: data?.error || (isBn ? "এই গুগল শিট থেকে সিঙ্ক করা সম্ভব হয়নি। শিটের কলাম ও শেয়ারিং পারমিশন চেক করুন।" : "Could not sync from this Google Sheet. Please check the columns and sharing permissions."),
          confirmButtonColor: "var(--accent)",
        });
      }
    } catch (err: any) {
      console.error("Google Sheets sync error:", err);
      Swal.fire({
        icon: "error",
        title: isBn ? "নেটওয়ার্ক সমস্যা" : "Network Error",
        text: err?.message || (isBn ? "সার্ভারের সাথে যোগাযোগ করা সম্ভব হয়নি।" : "Failed to reach the server."),
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
        title: isBn ? "ফাইল নির্বাচন করুন" : "File Required",
        text: isBn ? "অনুগ্রহ করে একটি CSV ফাইল নির্বাচন করুন।" : "Please choose a CSV file to import.",
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
          title: isBn
            ? `ফাইল সফলভাবে ইমপোর্ট হয়েছে। নতুন যুক্ত: ${data.created_count.toLocaleString("bn-BD")}, আপডেট: ${data.updated_count.toLocaleString("bn-BD")}`
            : `File imported successfully. Created: ${data.created_count}, Updated: ${data.updated_count}`,
          showConfirmButton: false,
          timer: 2500,
          toast: true,
        });
        if (onSyncSuccess) onSyncSuccess();
      } else {
        Swal.fire({
          icon: "error",
          title: isBn ? "ইমপোর্ট ব্যর্থ হয়েছে" : "Import Failed",
          text: data?.error || (isBn ? "CSV ফাইলটি প্রসেস করা সম্ভব হয়নি।" : "Failed to process the CSV file."),
          confirmButtonColor: "var(--accent)",
        });
      }
    } catch (err: any) {
      console.error("Bulk CSV import error:", err);
      Swal.fire({
        icon: "error",
        title: isBn ? "নেটওয়ার্ক সমস্যা" : "Network Error",
        text: err?.message || (isBn ? "ফাইল আপলোড করতে সমস্যা হয়েছে।" : "Failed to upload the file."),
        confirmButtonColor: "var(--accent)",
      });
    } finally {
      setIsImportingFile(false);
    }
  };

  // 2.5 Batch Upload Photos from ZIP Archive (with Real-time Progress)
  const handleUploadZip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedZip) return;

    try {
      setIsUploadingZip(true);
      setZipUploadProgress(0);
      setZipUploadStage("uploading");
      setZipReport(null);

      const formData = new FormData();
      formData.append("file", selectedZip);

      const data: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${apiBase}/store/products/bulk_upload_zip/`);
        xhr.setRequestHeader("Authorization", `JWT ${token}`);

        // Track byte upload percentage
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.min(99, Math.round((event.loaded / event.total) * 100));
            setZipUploadProgress(percentComplete);
            if (percentComplete >= 99) {
              setZipUploadStage("processing");
            }
          }
        };

        xhr.onload = () => {
          setZipUploadProgress(100);
          try {
            const parsed = JSON.parse(xhr.responseText || "{}");
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(parsed);
            } else {
              reject(new Error(parsed.error || `HTTP error ${xhr.status}`));
            }
          } catch (e) {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({});
            } else {
              reject(new Error(`Server error (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error(isBn ? "নেটওয়ার্ক কানেকশন সমস্যা।" : "Network connection failed."));
        };

        xhr.send(formData);
      });

      setZipReport(data);
      setLastSyncMode("zip");
      setSelectedZip(null);
      if (zipInputRef.current) zipInputRef.current.value = "";

      Swal.fire({
        icon: "success",
        title: isBn ? "ছবি আপলোড সম্পন্ন হয়েছে!" : "Photos Uploaded Successfully!",
        text: data?.message || (isBn ? "প্রোডাক্টের ছবি সফলভাবে সংযুক্ত করা হয়েছে।" : "All product images matched and uploaded."),
        confirmButtonColor: "var(--accent)",
      });
      if (onSyncSuccess) onSyncSuccess();
    } catch (err: any) {
      console.error("ZIP upload error:", err);
      Swal.fire({
        icon: "error",
        title: isBn ? "আপলোড ব্যর্থ হয়েছে" : "Upload Failed",
        text: err?.message || (isBn ? "ফাইল আপলোড করতে সমস্যা হয়েছে।" : "Failed to upload the ZIP file."),
        confirmButtonColor: "var(--accent)",
      });
    } finally {
      setIsUploadingZip(false);
      setZipUploadProgress(0);
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
          title: isBn ? "ক্যাটালগ CSV ডাউনলোড সম্পন্ন হয়েছে" : "Catalog CSV downloaded",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: isBn ? "এক্সপোর্ট ব্যর্থ হয়েছে" : "Export Failed",
          text: isBn ? "পণ্য ক্যাটালগ এক্সপোর্ট করা সম্ভব হয়নি।" : "Could not export product catalog.",
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
                {isBn ? "ক্যাটালগ, স্প্রেডশিট ও ফটো সিঙ্ক্রোনাইজেশন" : "Catalog, Sheets & Photo Sync"}
              </h2>
            </div>
            <p className="text-xs text-foreground/70 font-medium">
              {isBn
                ? "গুগল শিট, CSV অথবা বাল্ক ফটো জিপ (.ZIP) ফাইল থেকে সরাসরি আপনার প্রোডাক্ট ইনভেন্টরি, ক্যাটালগ ও ছবি সিঙ্ক করুন।"
                : "Synchronize product catalogs and bulk upload photo archives directly from Google Sheets, CSV, or ZIP packages."}
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
              <span>{isBn ? "নমুনা টেমপ্লেট" : "Sample Template"}</span>
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
              <span>{isExporting ? (isBn ? "এক্সপোর্ট হচ্ছে..." : "Exporting...") : (isBn ? "ক্যাটালগ এক্সপোর্ট" : "Export Catalog")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Google Sheets Live Sync, CSV Import & ZIP Photo Batch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Method 1: Google Sheets Live Sync */}
        <div className="p-6 md:p-7 rounded-3xl bg-secondary text-foreground border border-foreground/10 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-foreground/10">
              <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-black text-xs">
                01
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  {isBn ? "গুগল শিট লাইভ সিঙ্ক" : "Google Sheets Live Sync"}
                </h3>
                <p className="text-[10px] text-foreground/60">{isBn ? "শেয়ারেবল শিট লিঙ্ক যুক্ত করে ডাটাবেজ আপডেট করুন" : "Connect shareable sheet to update database"}</p>
              </div>
            </div>

            {/* Saved Sheet Active Card (If link is saved) */}
            {savedSheetUrl ? (
              <div className="mb-5 p-4.5 rounded-2xl bg-primary/10 dark:bg-primary/30 border border-accent/30 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-foreground">
                      {isBn ? "সংযুক্ত গুগল শিট" : "Connected Google Sheet"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDeleteSavedUrl}
                    className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>{isBn ? "সংযোগ বিচ্ছিন্ন করুন" : "Disconnect"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-secondary/80 rounded-xl border border-foreground/10 text-foreground text-xs overflow-hidden">
                  <span className="truncate flex-1 font-mono text-[11px] opacity-80 select-all">
                    {savedSheetUrl}
                  </span>
                  <a
                    href={savedSheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:opacity-80 shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                  >
                    <span>{isBn ? "খুলুন" : "Open"}</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                {lastSyncedAt && (
                  <p className="text-[10px] text-foreground/70 font-medium">
                    {isBn ? "সর্বশেষ সিঙ্কঃ" : "Last synced:"}{" "}
                    <span className="font-bold text-foreground">
                      {new Date(lastSyncedAt).toLocaleString(isBn ? "bn-BD" : undefined)}
                    </span>
                  </p>
                )}

                {/* 1-Click Update Button */}
                <button
                  type="button"
                  disabled={isSyncingSheet}
                  onClick={() => handleSyncGoogleSheet(savedSheetUrl)}
                  className="w-full py-3 px-4 bg-button-bg text-button-fg hover:bg-accent rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 group"
                >
                  {isSyncingSheet ? (
                    <>
                      <div className="w-4 h-4 border-2 border-button-fg border-t-transparent rounded-full animate-spin shrink-0"></div>
                      <span>{isBn ? "ক্যাটালগ সিঙ্ক হচ্ছে..." : "Updating Catalog..."}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:rotate-180 text-accent group-hover:text-button-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="truncate">{isBn ? "সংরক্ষিত শিট থেকে আপডেট" : "Update from Saved Sheet"}</span>
                    </>
                  )}
                </button>
              </div>
            ) : null}

            {/* Manual URL Input Form (or connecting a new link) */}
            <form onSubmit={(e) => { e.preventDefault(); handleSyncGoogleSheet(); }} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>
                    {savedSheetUrl
                      ? (isBn ? "অথবা অন্য গুগল শিট লিঙ্ক দিয়ে সিঙ্ক করুন" : "Or Sync with Another Google Sheet URL")
                      : (isBn ? "গুগল শিট শেয়ারেবল লিঙ্ক" : "Google Sheet Shareable URL")}
                  </span>
                  {renderCharCounter(googleSheetUrl.length, 255)}
                </label>
                <input
                  type="url"
                  required
                  maxLength={255}
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                  className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
                />
              </div>

              {/* Instructions Box */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10 text-[11px] space-y-1.5 text-foreground/80 leading-relaxed font-medium">
                <p className="font-bold text-foreground">{isBn ? "সংযোগ নির্দেশিকাঃ" : "Connection Guide:"}</p>
                <ol className="list-decimal pl-4 space-y-1 opacity-80 text-[10.5px]">
                  {isBn ? (
                    <>
                      <li>গুগল শিটে গিয়ে <b>Share</b> সেটিংসে ক্লিক করুন।</li>
                      <li>পারমিশন দিন <b>&quot;Anyone with the link can view&quot;</b>।</li>
                      <li>উপরের বক্সে লিংকটি পেস্ট করে সাবমিট করুন।</li>
                    </>
                  ) : (
                    <>
                      <li>In Google Sheets, open the <b>Share</b> settings.</li>
                      <li>Set access permissions to <b>&quot;Anyone with the link can view&quot;</b>.</li>
                      <li>Paste the URL above and submit to synchronize changes.</li>
                    </>
                  )}
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
                    <span>{isBn ? "সিঙ্ক হচ্ছে..." : "Synchronizing..."}</span>
                  </>
                ) : (
                  <span>{savedSheetUrl ? (isBn ? "নতুন এই লিঙ্কে সিঙ্ক করুন" : "Sync This New URL") : (isBn ? "গুগল শিট সিঙ্ক করুন" : "Sync Google Sheet")}</span>
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
                  {isBn ? "বাল্ক CSV / এক্সেল ফাইল ইমপোর্ট" : "Bulk CSV / Excel File Import"}
                </h3>
                <p className="text-[10px] text-foreground/60">{isBn ? "অফলাইনে প্রস্তুতকৃত ক্যাটালগ ফাইল ইমপোর্ট করুন" : "Import catalog files prepared offline"}</p>
              </div>
            </div>

            <form onSubmit={handleImportFile} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? "CSV স্প্রেডশিট ফাইল নির্বাচন করুন" : "Select CSV Spreadsheet"}
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
                <p className="font-bold text-foreground">{isBn ? "বিদ্যমান ইনভেন্টরি আপডেট পদ্ধতিঃ" : "Updating Existing Inventory:"}</p>
                <p className="opacity-80 text-[10.5px]">
                  {isBn
                    ? "উপরে থাকা \"ক্যাটালগ এক্সপোর্ট\" বাটনে ক্লিক করে বর্তমান পণ্যের আইডি সহ ফাইল ডাউনলোড করুন, অফলাইনে স্টক বা মূল্য পরিবর্তন করে এখানে আপলোড করুন।"
                    : "Use the \"Export Catalog\" action to download current IDs, make offline quantity or price edits, and upload the updated spreadsheet here."}
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
                    <span>{isBn ? "ফাইল প্রসেস হচ্ছে..." : "Processing File..."}</span>
                  </>
                ) : (
                  <span>{isBn ? "CSV ইমপোর্ট প্রসেস করুন" : "Process CSV Import"}</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Method 3: Batch Upload Photos via ZIP Archive */}
        <div className="p-6 md:p-7 rounded-3xl bg-secondary text-foreground border border-foreground/10 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-foreground/10">
              <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-black text-xs">
                03
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  {isBn ? "বাল্ক ফটো জিপ আপলোড" : "Batch Photo ZIP Upload"}
                </h3>
                <p className="text-[10px] text-foreground/60">{isBn ? "ফোল্ডারসহ জিপ ফাইল থেকে স্বয়ংক্রিয় ছবি যুক্ত" : "Auto-match photos from ZIP folders"}</p>
              </div>
            </div>

            <form onSubmit={handleUploadZip} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? "প্রোডাক্ট ছবির ZIP ফাইল নির্বাচন করুন" : "Select Photos (.ZIP) Archive"}
                </label>
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  required
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setSelectedZip(f);
                  }}
                  className="block w-full text-xs text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-button-bg file:text-button-fg hover:file:opacity-90 cursor-pointer"
                />
              </div>

              {/* Instructions Box */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10 text-[11px] space-y-1.5 text-foreground/80 leading-relaxed font-medium">
                <p className="font-bold text-foreground">{isBn ? "ফোল্ডার গঠন প্রণালীঃ" : "ZIP Organization Rules:"}</p>
                <ul className="list-disc pl-4 space-y-1 text-[10.5px] opacity-80">
                  <li>
                    {isBn
                      ? "প্রোডাক্টের নামে ফোল্ডার রাখুন (যেমন: Nivea_Shea_Lotion)"
                      : "Name folders after products (e.g. Nivea_Shea_Lotion)"}
                  </li>
                  <li>
                    {isBn
                      ? "প্রতি ফোল্ডারে ১ থেকে ৫টি ছবি রাখুন (৫টির বেশি থাকলে প্রথম ৫টি নেওয়া হবে)"
                      : "Put 1 to 5 photos inside each folder (top 5 are auto-selected)"}
                  </li>
                  <li>
                    {isBn
                      ? "সব ফোল্ডার সিলেক্ট করে একসাথে .ZIP বানিয়ে এখানে আপলোড করুন।"
                      : "Compress the folders into a single .zip file and upload here."}
                  </li>
                  <li className="font-semibold text-accent pt-1">
                    {isBn
                      ? "পরামর্শ: দ্রুততম আপলোডের জন্য প্রতি ব্যাচে ১০-২০টি প্রোডাক্টের ছবি (১০-২৫ মেগাবাইট) আপলোড করুন।"
                      : "Tip: For optimal cloud upload speed, upload batches of 10–20 products (~10–25MB) at a time."}
                  </li>
                </ul>
              </div>

              {/* Progress Bar & Status (Visible during upload) */}
              {isUploadingZip && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-primary/5 border border-foreground/10 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                      {zipUploadStage === "uploading"
                        ? isBn
                          ? "ফাইল সার্ভারে আপলোড হচ্ছে..."
                          : "Uploading file to server..."
                        : isBn
                        ? "ছবিগুলো ক্লাউডে প্রসেস হচ্ছে..."
                        : "Processing & optimizing in Cloud..."}
                    </span>
                    <span className="text-accent font-black text-xs font-mono">{zipUploadProgress}%</span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-2.5 bg-foreground/10 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-300 ease-out shadow-xs"
                      style={{ width: `${zipUploadProgress}%` }}
                    ></div>
                  </div>

                  <p className="text-[10px] text-foreground/60 text-right">
                    {zipUploadStage === "uploading"
                      ? isBn
                        ? "অনুগ্রহ করে উইন্ডো বন্ধ করবেন না"
                        : "Please keep this tab open"
                      : isBn
                      ? "ক্লাউড স্টোরেজে ছবি যুক্ত হচ্ছে..."
                      : "Matching folders & syncing with Cloudinary..."}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isUploadingZip || !selectedZip}
                className="w-full py-2.5 bg-accent text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploadingZip ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-button-fg border-t-transparent rounded-full animate-spin"></div>
                    <span>
                      {zipUploadStage === "uploading"
                        ? `${isBn ? "আপলোড হচ্ছে" : "Uploading"} (${zipUploadProgress}%)`
                        : isBn
                        ? "ছবি প্রসেস হচ্ছে..."
                        : "Processing Images..."}
                    </span>
                  </>
                ) : (
                  <span>{isBn ? "ZIP থেকে ছবি আপলোড করুন" : "Upload Photos from ZIP"}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ZIP Upload Execution Report */}
      {zipReport && (
        <div className="p-6 md:p-8 rounded-3xl bg-secondary text-foreground border border-foreground/10 shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center pb-3 border-b border-foreground/10">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                {isBn ? "জিপ ফটো আপলোড রিপোর্ট" : "ZIP Photo Upload Report"}
              </h3>
              <p className="text-[10px] text-foreground/60">{zipReport.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setZipReport(null)}
              className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 hover:text-foreground cursor-pointer"
            >
              {isBn ? "বন্ধ করুন" : "Dismiss"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                {isBn ? "ম্যাচ হওয়া প্রোডাক্ট" : "Matched Products"}
              </span>
              <p className="text-2xl font-black text-foreground mt-1">
                {zipReport.matched_products_count.toLocaleString(isBn ? "bn-BD" : undefined)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                {isBn ? "মোট ছবি আপলোড" : "Total Photos Uploaded"}
              </span>
              <p className="text-2xl font-black text-accent mt-1">
                {zipReport.total_images_uploaded.toLocaleString(isBn ? "bn-BD" : undefined)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                {isBn ? "অমিলে থাকা ফোল্ডার" : "Unmatched Folders"}
              </span>
              <p className={`text-2xl font-black mt-1 ${zipReport.unmatched_folders.length > 0 ? "text-red-500" : "text-foreground/70"}`}>
                {zipReport.unmatched_folders.length.toLocaleString(isBn ? "bn-BD" : undefined)}
              </p>
            </div>
          </div>

          {zipReport.details.length > 0 && (
            <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10 space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-accent">
                {isBn ? "সফলভাবে আপলোড হওয়া পণ্যের তালিকাঃ" : "Uploaded Product Details:"}
              </p>
              <ul className="list-disc pl-5 text-xs text-foreground/80 space-y-1 max-h-40 overflow-y-auto">
                {zipReport.details.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {zipReport.unmatched_folders.length > 0 && (
            <div className="p-4 rounded-2xl bg-primary/5 border border-red-500/30 space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-red-500">
                {isBn ? "যেসব ফোল্ডারের নামের সাথে পণ্য মেলেনিঃ" : "Folders not matched to any product title/slug:"}
              </p>
              <ul className="list-disc pl-5 text-xs text-foreground/80 space-y-1 max-h-36 overflow-y-auto">
                {zipReport.unmatched_folders.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sync Results & Audit Report Card */}
      {syncResults && (
        <div className="p-6 md:p-8 rounded-3xl bg-secondary text-foreground border border-foreground/10 shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center pb-3 border-b border-foreground/10">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                {isBn ? "সিঙ্ক এক্সিকিউশন রিপোর্ট" : "Sync Execution Report"}
              </h3>
              <p className="text-[10px] text-foreground/60">
                {isBn ? "উৎসঃ" : "Source:"}{" "}
                {lastSyncMode === "sheets"
                  ? (isBn ? "গুগল শিটস" : "Google Sheets")
                  : (isBn ? "আপলোডকৃত CSV" : "Uploaded CSV")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSyncResults(null)}
              className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 hover:text-foreground cursor-pointer"
            >
              {isBn ? "বন্ধ করুন" : "Dismiss"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                {isBn ? "নতুন পণ্য তৈরি" : "Products Created"}
              </span>
              <p className="text-2xl font-black text-foreground mt-1">
                {syncResults.created_count.toLocaleString(isBn ? "bn-BD" : undefined)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                {isBn ? "পণ্য আপডেট" : "Products Updated"}
              </span>
              <p className="text-2xl font-black text-accent mt-1">
                {syncResults.updated_count.toLocaleString(isBn ? "bn-BD" : undefined)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-foreground/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                {isBn ? "সতর্কতা / ত্রুটি" : "Warnings / Errors"}
              </span>
              <p className={`text-2xl font-black mt-1 ${syncResults.errors.length > 0 ? "text-red-500" : "text-foreground/70"}`}>
                {syncResults.errors.length.toLocaleString(isBn ? "bn-BD" : undefined)}
              </p>
            </div>
          </div>

          {syncResults.errors.length > 0 && (
            <div className="p-4 rounded-2xl bg-primary/5 border border-red-500/30 space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-red-500">
                {isBn ? "ত্রুটির বিবরণীঃ" : "Error Details:"}
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
