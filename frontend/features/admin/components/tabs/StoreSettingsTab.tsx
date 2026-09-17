"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "@/store/LanguageContext";
import { Collection } from "@/features/admin/types";
import HomepageSettingsSubTab from "./HomepageSettingsSubTab";
import Swal from "sweetalert2";
import AutoTranslateButton from "@/features/admin/components/common/AutoTranslateButton";
import { translateText } from "@/services/translationService";

interface StoreSettingsTabProps {
  apiBase: string;
  token: string | null;
  collections?: Collection[];
  settingsSubTab?: "general" | "homepage";
  onSubTabChange?: (subTab: "general" | "homepage") => void;
}

interface SiteSettingsState {
  siteTitle: string;
  siteTitleBn: string;
  tagline: string;
  taglineBn: string;
  brandDescription: string;
  brandDescriptionBn: string;
  currencyCode: string;
  supportPhone: string;
  supportEmail: string;
  storeAddress: string;
  storeAddressBn: string;
  workingHours: string;
  workingHoursBn: string;
  footerCopyright: string;
  footerCopyrightBn: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  whatsappNumber: string;
  metaPixelId: string;
  aiChatActive: boolean;
  aiNudgeActive: boolean;
  aiNudgeDelaySeconds: number;
  aiNudgeDurationSeconds: number;
  aiNudgeHomeMsg: string;
  aiNudgeHomeMsgBn: string;
  aiNudgeProductMsg: string;
  aiNudgeProductMsgBn: string;
}

const DEFAULT_SETTINGS: SiteSettingsState = {
  siteTitle: "VibeMart",
  siteTitleBn: "",
  tagline: "MAKE-UP STYLE",
  taglineBn: "",
  brandDescription:
    "VibeMart is a recognized multi-category fashion and lifestyle store built on the principle of \"best price at the highest quality\". Our collections are curated with premium materials that are durable, stylish, and perfect for your vibe.",
  brandDescriptionBn: "",
  currencyCode: "BDT",
  supportPhone: "+880 1700-000000",
  supportEmail: "support@vibemart.com",
  storeAddress: "Homestead Gulshan Link Tower, 99 Gulshan Badda Link Rd, Dhaka 1212",
  storeAddressBn: "",
  workingHours: "Sat - Thu: 10:00 - 18:00",
  workingHoursBn: "",
  footerCopyright: "© 2026 VIBEMART. ALL RIGHTS RESERVED.",
  footerCopyrightBn: "",
  facebookUrl: "https://facebook.com",
  instagramUrl: "https://instagram.com",
  youtubeUrl: "https://youtube.com",
  whatsappNumber: "+8801700000000",
  metaPixelId: "",
  aiChatActive: true,
  aiNudgeActive: true,
  aiNudgeDelaySeconds: 5,
  aiNudgeDurationSeconds: 8,
  aiNudgeHomeMsg: "Welcome to VibeMart! Need any shopping help? Let's chat 👋",
  aiNudgeHomeMsgBn: "স্বাগতম VibeMart-এ! কেনাকাটায় কোনো সাহায্য লাগবে? চ্যাট করুন 👋",
  aiNudgeProductMsg: "Any confusion or questions? Just ask me",
  aiNudgeProductMsgBn: "কোনো প্রশ্ন বা দ্বিধা আছে? আমাকে জিজ্ঞেস করুন!",
};

const AVAILABLE_CURRENCIES = [
  { code: "BDT", label: "BDT (৳) - Bangladeshi Taka", symbol: "৳" },
  { code: "USD", label: "USD ($) - US Dollar", symbol: "$" },
  { code: "EUR", label: "EUR (€) - Euro", symbol: "€" },
  { code: "GBP", label: "GBP (£) - British Pound", symbol: "£" },
  { code: "INR", label: "INR (₹) - Indian Rupee", symbol: "₹" },
  { code: "SAR", label: "SAR (﷼) - Saudi Riyal", symbol: "﷼" },
  { code: "AED", label: "AED (د.إ) - UAE Dirham", symbol: "د.إ" },
  { code: "CAD", label: "CAD ($) - Canadian Dollar", symbol: "CA$" },
];

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

export default function StoreSettingsTab({
  apiBase,
  token,
  collections = [],
  settingsSubTab: externalSubTab,
  onSubTabChange,
}: StoreSettingsTabProps) {
  const { locale, setCurrency } = useLanguage();
  const isBn = locale === "bn";

  const [internalSubTab, setInternalSubTab] = useState<"general" | "homepage">("homepage");
  const activeSubTab = externalSubTab !== undefined ? externalSubTab : internalSubTab;

  const handleSubTabChange = (tab: "general" | "homepage") => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

  // Initial loaded states (for change detection)
  const [initialSettings, setInitialSettings] = useState<SiteSettingsState>(DEFAULT_SETTINGS);

  // Form states
  const [siteTitle, setSiteTitle] = useState(DEFAULT_SETTINGS.siteTitle);
  const [siteTitleBn, setSiteTitleBn] = useState(DEFAULT_SETTINGS.siteTitleBn);
  const [tagline, setTagline] = useState(DEFAULT_SETTINGS.tagline);
  const [taglineBn, setTaglineBn] = useState(DEFAULT_SETTINGS.taglineBn);
  const [brandDescription, setBrandDescription] = useState(DEFAULT_SETTINGS.brandDescription);
  const [brandDescriptionBn, setBrandDescriptionBn] = useState(DEFAULT_SETTINGS.brandDescriptionBn);
  const [currencyCode, setCurrencyCode] = useState(DEFAULT_SETTINGS.currencyCode);
  const [supportPhone, setSupportPhone] = useState(DEFAULT_SETTINGS.supportPhone);
  const [supportEmail, setSupportEmail] = useState(DEFAULT_SETTINGS.supportEmail);
  const [storeAddress, setStoreAddress] = useState(DEFAULT_SETTINGS.storeAddress);
  const [storeAddressBn, setStoreAddressBn] = useState(DEFAULT_SETTINGS.storeAddressBn);
  const [workingHours, setWorkingHours] = useState(DEFAULT_SETTINGS.workingHours);
  const [workingHoursBn, setWorkingHoursBn] = useState(DEFAULT_SETTINGS.workingHoursBn);
  const [footerCopyright, setFooterCopyright] = useState(DEFAULT_SETTINGS.footerCopyright);
  const [footerCopyrightBn, setFooterCopyrightBn] = useState(DEFAULT_SETTINGS.footerCopyrightBn);
  const [facebookUrl, setFacebookUrl] = useState(DEFAULT_SETTINGS.facebookUrl);
  const [instagramUrl, setInstagramUrl] = useState(DEFAULT_SETTINGS.instagramUrl);
  const [youtubeUrl, setYoutubeUrl] = useState(DEFAULT_SETTINGS.youtubeUrl);
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_SETTINGS.whatsappNumber);
  const [metaPixelId, setMetaPixelId] = useState(DEFAULT_SETTINGS.metaPixelId);
  const [aiChatActive, setAiChatActive] = useState(DEFAULT_SETTINGS.aiChatActive);
  const [aiNudgeActive, setAiNudgeActive] = useState(DEFAULT_SETTINGS.aiNudgeActive);
  const [aiNudgeDelaySeconds, setAiNudgeDelaySeconds] = useState(DEFAULT_SETTINGS.aiNudgeDelaySeconds);
  const [aiNudgeDurationSeconds, setAiNudgeDurationSeconds] = useState(DEFAULT_SETTINGS.aiNudgeDurationSeconds);
  const [aiNudgeHomeMsg, setAiNudgeHomeMsg] = useState(DEFAULT_SETTINGS.aiNudgeHomeMsg);
  const [aiNudgeHomeMsgBn, setAiNudgeHomeMsgBn] = useState(DEFAULT_SETTINGS.aiNudgeHomeMsgBn);
  const [aiNudgeProductMsg, setAiNudgeProductMsg] = useState(DEFAULT_SETTINGS.aiNudgeProductMsg);
  const [aiNudgeProductMsgBn, setAiNudgeProductMsgBn] = useState(DEFAULT_SETTINGS.aiNudgeProductMsgBn);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [initialLogoUrl, setInitialLogoUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch initial settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/store/site-settings/`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const loaded: SiteSettingsState = {
          siteTitle: data.site_title !== undefined && data.site_title !== null ? data.site_title : "VibeMart",
          siteTitleBn: data.site_title_bn !== undefined && data.site_title_bn !== null ? data.site_title_bn : "",
          tagline: data.tagline !== undefined && data.tagline !== null ? data.tagline : "",
          taglineBn: data.tagline_bn !== undefined && data.tagline_bn !== null ? data.tagline_bn : "",
          brandDescription: data.brand_description !== undefined && data.brand_description !== null ? data.brand_description : "",
          brandDescriptionBn: data.brand_description_bn !== undefined && data.brand_description_bn !== null ? data.brand_description_bn : "",
          currencyCode: data.currency_code || "BDT",
          supportPhone: data.support_phone !== undefined && data.support_phone !== null ? data.support_phone : "",
          supportEmail: data.support_email !== undefined && data.support_email !== null ? data.support_email : "",
          storeAddress: data.store_address !== undefined && data.store_address !== null ? data.store_address : "",
          storeAddressBn: data.store_address_bn !== undefined && data.store_address_bn !== null ? data.store_address_bn : "",
          workingHours: data.working_hours !== undefined && data.working_hours !== null ? data.working_hours : "",
          workingHoursBn: data.working_hours_bn !== undefined && data.working_hours_bn !== null ? data.working_hours_bn : "",
          footerCopyright: data.footer_copyright !== undefined && data.footer_copyright !== null ? data.footer_copyright : "",
          footerCopyrightBn: data.footer_copyright_bn !== undefined && data.footer_copyright_bn !== null ? data.footer_copyright_bn : "",
          facebookUrl: data.facebook_url !== undefined && data.facebook_url !== null ? data.facebook_url : "",
          instagramUrl: data.instagram_url !== undefined && data.instagram_url !== null ? data.instagram_url : "",
          youtubeUrl: data.youtube_url !== undefined && data.youtube_url !== null ? data.youtube_url : "",
          whatsappNumber: data.whatsapp_number !== undefined && data.whatsapp_number !== null ? data.whatsapp_number : "",
          metaPixelId: data.meta_pixel_id !== undefined && data.meta_pixel_id !== null ? data.meta_pixel_id : "",
          aiChatActive: data.ai_chat_active !== undefined ? Boolean(data.ai_chat_active) : true,
          aiNudgeActive: data.ai_nudge_active !== undefined ? Boolean(data.ai_nudge_active) : true,
          aiNudgeDelaySeconds: Number(data.ai_nudge_delay_seconds) || 5,
          aiNudgeDurationSeconds: Number(data.ai_nudge_duration_seconds) || 8,
          aiNudgeHomeMsg: data.ai_nudge_home_msg !== undefined && data.ai_nudge_home_msg !== null ? data.ai_nudge_home_msg : DEFAULT_SETTINGS.aiNudgeHomeMsg,
          aiNudgeHomeMsgBn: data.ai_nudge_home_msg_bn !== undefined && data.ai_nudge_home_msg_bn !== null ? data.ai_nudge_home_msg_bn : DEFAULT_SETTINGS.aiNudgeHomeMsgBn,
          aiNudgeProductMsg: data.ai_nudge_product_msg !== undefined && data.ai_nudge_product_msg !== null ? data.ai_nudge_product_msg : DEFAULT_SETTINGS.aiNudgeProductMsg,
          aiNudgeProductMsgBn: data.ai_nudge_product_msg_bn !== undefined && data.ai_nudge_product_msg_bn !== null ? data.ai_nudge_product_msg_bn : DEFAULT_SETTINGS.aiNudgeProductMsgBn,
        };

        setInitialSettings(loaded);
        setSiteTitle(loaded.siteTitle);
        setSiteTitleBn(loaded.siteTitleBn);
        setTagline(loaded.tagline);
        setTaglineBn(loaded.taglineBn);
        setBrandDescription(loaded.brandDescription);
        setBrandDescriptionBn(loaded.brandDescriptionBn);
        setCurrencyCode(loaded.currencyCode);
        setSupportPhone(loaded.supportPhone);
        setSupportEmail(loaded.supportEmail);
        setStoreAddress(loaded.storeAddress);
        setStoreAddressBn(loaded.storeAddressBn);
        setWorkingHours(loaded.workingHours);
        setWorkingHoursBn(loaded.workingHoursBn);
        setFooterCopyright(loaded.footerCopyright);
        setFooterCopyrightBn(loaded.footerCopyrightBn);
        setFacebookUrl(loaded.facebookUrl);
        setInstagramUrl(loaded.instagramUrl);
        setYoutubeUrl(loaded.youtubeUrl);
        setWhatsappNumber(loaded.whatsappNumber);
        setMetaPixelId(loaded.metaPixelId);
        setAiChatActive(loaded.aiChatActive);
        setAiNudgeActive(loaded.aiNudgeActive);
        setAiNudgeDelaySeconds(loaded.aiNudgeDelaySeconds);
        setAiNudgeDurationSeconds(loaded.aiNudgeDurationSeconds);
        setAiNudgeHomeMsg(loaded.aiNudgeHomeMsg);
        setAiNudgeHomeMsgBn(loaded.aiNudgeHomeMsgBn);
        setAiNudgeProductMsg(loaded.aiNudgeProductMsg);
        setAiNudgeProductMsgBn(loaded.aiNudgeProductMsgBn);

        if (data.logo) {
          setInitialLogoUrl(data.logo);
          setLogoPreview(data.logo);
        }
      }
    } catch (err) {
      console.error("Failed to load site settings:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Check if any change has been made
  const hasChanges = useMemo(() => {
    if (logoFile !== null) return true;
    if (logoPreview !== initialLogoUrl) return true;
    if (siteTitle !== initialSettings.siteTitle) return true;
    if (siteTitleBn !== initialSettings.siteTitleBn) return true;
    if (tagline !== initialSettings.tagline) return true;
    if (taglineBn !== initialSettings.taglineBn) return true;
    if (brandDescription !== initialSettings.brandDescription) return true;
    if (brandDescriptionBn !== initialSettings.brandDescriptionBn) return true;
    if (currencyCode !== initialSettings.currencyCode) return true;
    if (supportPhone !== initialSettings.supportPhone) return true;
    if (supportEmail !== initialSettings.supportEmail) return true;
    if (storeAddress !== initialSettings.storeAddress) return true;
    if (storeAddressBn !== initialSettings.storeAddressBn) return true;
    if (workingHours !== initialSettings.workingHours) return true;
    if (workingHoursBn !== initialSettings.workingHoursBn) return true;
    if (footerCopyright !== initialSettings.footerCopyright) return true;
    if (footerCopyrightBn !== initialSettings.footerCopyrightBn) return true;
    if (facebookUrl !== initialSettings.facebookUrl) return true;
    if (instagramUrl !== initialSettings.instagramUrl) return true;
    if (youtubeUrl !== initialSettings.youtubeUrl) return true;
    if (whatsappNumber !== initialSettings.whatsappNumber) return true;
    if (metaPixelId !== initialSettings.metaPixelId) return true;
    if (aiChatActive !== initialSettings.aiChatActive) return true;
    if (aiNudgeActive !== initialSettings.aiNudgeActive) return true;
    if (aiNudgeDelaySeconds !== initialSettings.aiNudgeDelaySeconds) return true;
    if (aiNudgeDurationSeconds !== initialSettings.aiNudgeDurationSeconds) return true;
    if (aiNudgeHomeMsg !== initialSettings.aiNudgeHomeMsg) return true;
    if (aiNudgeHomeMsgBn !== initialSettings.aiNudgeHomeMsgBn) return true;
    if (aiNudgeProductMsg !== initialSettings.aiNudgeProductMsg) return true;
    if (aiNudgeProductMsgBn !== initialSettings.aiNudgeProductMsgBn) return true;
    return false;
  }, [
    logoFile,
    logoPreview,
    initialLogoUrl,
    siteTitle,
    siteTitleBn,
    tagline,
    taglineBn,
    brandDescription,
    brandDescriptionBn,
    currencyCode,
    supportPhone,
    supportEmail,
    storeAddress,
    storeAddressBn,
    workingHours,
    workingHoursBn,
    footerCopyright,
    footerCopyrightBn,
    facebookUrl,
    instagramUrl,
    youtubeUrl,
    whatsappNumber,
    metaPixelId,
    aiChatActive,
    aiNudgeActive,
    aiNudgeDelaySeconds,
    aiNudgeDurationSeconds,
    aiNudgeHomeMsg,
    aiNudgeHomeMsgBn,
    aiNudgeProductMsg,
    aiNudgeProductMsgBn,
    initialSettings,
  ]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const [batchTranslatingGeneral, setBatchTranslatingGeneral] = useState(false);

  const handleAutoTranslateAllGeneral = async () => {
    setBatchTranslatingGeneral(true);
    try {
      let count = 0;
      if (siteTitle?.trim() && !siteTitleBn?.trim()) {
        const val = await translateText(siteTitle);
        if (val) { setSiteTitleBn(val.slice(0, 25)); count++; }
      }
      if (tagline?.trim() && !taglineBn?.trim()) {
        const val = await translateText(tagline);
        if (val) { setTaglineBn(val.slice(0, 45)); count++; }
      }
      if (brandDescription?.trim() && !brandDescriptionBn?.trim()) {
        const val = await translateText(brandDescription);
        if (val) { setBrandDescriptionBn(val.slice(0, 400)); count++; }
      }
      if (storeAddress?.trim() && !storeAddressBn?.trim()) {
        const val = await translateText(storeAddress);
        if (val) { setStoreAddressBn(val.slice(0, 250)); count++; }
      }
      if (workingHours?.trim() && !workingHoursBn?.trim()) {
        const val = await translateText(workingHours);
        if (val) { setWorkingHoursBn(val.slice(0, 80)); count++; }
      }
      if (footerCopyright?.trim() && !footerCopyrightBn?.trim()) {
        const val = await translateText(footerCopyright);
        if (val) { setFooterCopyrightBn(val.slice(0, 120)); count++; }
      }

      if (count > 0) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isBn ? "স্টোর সেটিংস সফলভাবে বাংলায় অনুবাদ হয়েছে!" : "Store settings auto-translated to Bangla!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "info",
          title: isBn ? "সকল বাংলা ফিল্ড ইতিমধ্যেই পূর্ণ আছে" : "All Bangla fields are already populated",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBatchTranslatingGeneral(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    if (!token) {
      Swal.fire("Error", "You must be authenticated as admin to save settings.", "error");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("site_title", siteTitle);
      formData.append("site_title_bn", siteTitleBn);
      formData.append("tagline", tagline);
      formData.append("tagline_bn", taglineBn);
      formData.append("brand_description", brandDescription);
      formData.append("brand_description_bn", brandDescriptionBn);
      formData.append("currency_code", currencyCode);
      formData.append("support_phone", supportPhone);
      formData.append("support_email", supportEmail);
      formData.append("store_address", storeAddress);
      formData.append("store_address_bn", storeAddressBn);
      formData.append("working_hours", workingHours);
      formData.append("working_hours_bn", workingHoursBn);
      formData.append("footer_copyright", footerCopyright);
      formData.append("footer_copyright_bn", footerCopyrightBn);
      formData.append("facebook_url", facebookUrl);
      formData.append("instagram_url", instagramUrl);
      formData.append("youtube_url", youtubeUrl);
      formData.append("whatsapp_number", whatsappNumber);
      formData.append("meta_pixel_id", metaPixelId);
      formData.append("ai_chat_active", String(aiChatActive));
      formData.append("ai_nudge_active", String(aiNudgeActive));
      formData.append("ai_nudge_delay_seconds", String(aiNudgeDelaySeconds));
      formData.append("ai_nudge_duration_seconds", String(aiNudgeDurationSeconds));
      formData.append("ai_nudge_home_msg", aiNudgeHomeMsg);
      formData.append("ai_nudge_home_msg_bn", aiNudgeHomeMsgBn);
      formData.append("ai_nudge_product_msg", aiNudgeProductMsg);
      formData.append("ai_nudge_product_msg_bn", aiNudgeProductMsgBn);

      if (logoFile) {
        formData.append("logo", logoFile);
      } else if (!logoPreview && initialLogoUrl) {
        formData.append("remove_logo", "true");
      }

      const res = await fetch(`${apiBase}/store/site-settings/update_settings/`, {
        method: "POST",
        headers: {
          Authorization: `JWT ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const updated: SiteSettingsState = {
          siteTitle,
          siteTitleBn,
          tagline,
          taglineBn,
          brandDescription,
          brandDescriptionBn,
          currencyCode,
          supportPhone,
          supportEmail,
          storeAddress,
          storeAddressBn,
          workingHours,
          workingHoursBn,
          footerCopyright,
          footerCopyrightBn,
          facebookUrl,
          instagramUrl,
          youtubeUrl,
          whatsappNumber,
          metaPixelId,
          aiChatActive,
          aiNudgeActive,
          aiNudgeDelaySeconds,
          aiNudgeDurationSeconds,
          aiNudgeHomeMsg,
          aiNudgeHomeMsgBn,
          aiNudgeProductMsg,
          aiNudgeProductMsgBn,
        };
        setInitialSettings(updated);
        setInitialLogoUrl(data.logo || null);
        setLogoPreview(data.logo || null);
        setLogoFile(null);

        // Update global context currency
        if (data.currency_code) {
          setCurrency(data.currency_code);
        }

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isBn ? "সেটিংস ও কারেন্সি সফলভাবে সংরক্ষিত হয়েছে!" : "Store settings & currency updated successfully!",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        let errorMsg = "Failed to update settings. Please check your inputs.";
        if (typeof errData === "object" && errData !== null) {
          const formatted = Object.entries(errData)
            .map(([field, msgs]) => {
              const msg = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
              return `${field.replace("_", " ").toUpperCase()}: ${msg}`;
            })
            .join("\n");
          if (formatted) errorMsg = formatted;
        }
        Swal.fire({
          icon: "error",
          title: isBn ? "ভুল ইনপুট পাওয়া গেছে" : "Validation Error",
          text: errorMsg,
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Network error while saving settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-foreground/60 animate-pulse">
        {isBn ? "সেটিংস লোড হচ্ছে..." : "Loading store settings..."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile-Only Horizontal Subtab Pill Navigation */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          type="button"
          onClick={() => handleSubTabChange("homepage")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === "homepage"
              ? "bg-accent text-white shadow-xs font-black"
              : "bg-secondary text-foreground/70 hover:bg-foreground/5 border border-foreground/10"
          }`}
        >
          {isBn ? "হোমপেজ ও ব্যানার" : "Homepage & Banners"}
        </button>
        <button
          type="button"
          onClick={() => handleSubTabChange("general")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === "general"
              ? "bg-accent text-white shadow-xs font-black"
              : "bg-secondary text-foreground/70 hover:bg-foreground/5 border border-foreground/10"
          }`}
        >
          {isBn ? "সাধারণ সেটিংস" : "General Settings"}
        </button>
      </div>

      {/* SubTab Content */}
      {activeSubTab === "homepage" ? (
        <HomepageSettingsSubTab
          apiBase={apiBase}
          token={token}
          collections={collections || []}
        />
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-8 animate-in fade-in duration-300 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column: Logo Upload & Brand Identity & Currency */}
            <div className="space-y-6">
          {/* Currency Configuration Card */}
          <div className="bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                {isBn ? "ওয়েবসাইট কারেন্সি (Currency)" : "Store Currency"}
              </h2>
            </div>
            <p className="text-xs opacity-70">
              {isBn
                ? "ওয়েবসাইটের প্রধান মুদ্রা নির্বাচন করুন। পণ্যের দাম এবং হিসাব লাইভ ফরেক্স রেটে স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে।"
                : "Select primary currency. Product prices and checkouts will dynamically convert using live exchange rates."}
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                {isBn ? "সক্রিয় মুদ্রা / Currency" : "Active Currency"}
              </label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-bold border border-foreground/15 focus:outline-none focus:border-accent cursor-pointer"
              >
                {AVAILABLE_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Logo Upload Card */}
          <div className="bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                {isBn ? "ওয়েবসাইট লোগো" : "Store Logo"}
              </h2>
            </div>
            <p className="text-xs opacity-70">
              {isBn
                ? "ওয়েবসাইটের হেডার ও ব্যানারের জন্য স্বচ্ছ পিএনজি বা জেপিজি লোগো আপলোড করুন।"
                : "Upload high-resolution transparent PNG or SVG store logo."}
            </p>

            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-foreground/20 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors cursor-pointer relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              {logoPreview ? (
                <div className="relative w-40 h-20 flex items-center justify-center">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-accent/15 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-foreground block">
                    {isBn ? "লোগো নির্বাচন করুন" : "Click or Drag Logo Here"}
                  </span>
                  <span className="text-[10px] opacity-60 block">PNG, JPG, SVG up to 2MB</span>
                </div>
              )}
            </div>

            {logoPreview && (
              <button
                type="button"
                onClick={() => {
                  setLogoPreview(null);
                  setLogoFile(null);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-hidden/10 hover:bg-hidden/20 text-hidden text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>{isBn ? "লোগো ডিলিট করুন" : "Delete / Remove Logo"}</span>
              </button>
            )}
          </div>

          {/* Website Title, Tagline & Philosophy */}
          <div className="bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-foreground/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                  {isBn ? "ব্র্যান্ড ও পরিচয়" : "Brand & Identity"}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAutoTranslateAllGeneral}
                disabled={batchTranslatingGeneral}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent text-accent hover:text-white dark:hover:text-black text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
                title="Auto-translate all empty General Bangla fields from English"
              >
                {batchTranslatingGeneral ? "Translating..." : "✨ Auto-Fill All Bangla with AI"}
              </button>
            </div>

            {/* Site Title: English & Bangla */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "ওয়েবসাইটের নাম (English)" : "Website Title (EN)"}</span>
                  {renderCharCounter(siteTitle.length, 15)}
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value.slice(0, 15))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-bold border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="e.g. VibeMart"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "ওয়েবসাইটের নাম (বাংলা)" : "Website Title (BN)"}</span>
                  <div className="flex items-center gap-2">
                    {renderCharCounter(siteTitleBn.length, 25)}
                    <AutoTranslateButton
                      sourceText={siteTitle}
                      onTranslated={(val) => setSiteTitleBn(val.slice(0, 25))}
                    />
                  </div>
                </label>
                <input
                  type="text"
                  maxLength={25}
                  value={siteTitleBn}
                  onChange={(e) => setSiteTitleBn(e.target.value.slice(0, 25))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-bold border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="যেমনঃ ভাইবমার্ট"
                />
              </div>
            </div>

            {/* Tagline: English & Bangla */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "ট্যাগলাইন (English)" : "Store Tagline (EN)"}</span>
                  {renderCharCounter(tagline.length, 30)}
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value.slice(0, 30))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="e.g. Premium Beauty & Cosmetics"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "ট্যাগলাইন (বাংলা)" : "Store Tagline (BN)"}</span>
                  <div className="flex items-center gap-2">
                    {renderCharCounter(taglineBn.length, 45)}
                    <AutoTranslateButton
                      sourceText={tagline}
                      onTranslated={(val) => setTaglineBn(val.slice(0, 45))}
                    />
                  </div>
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={taglineBn}
                  onChange={(e) => setTaglineBn(e.target.value.slice(0, 45))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="যেমনঃ প্রিমিয়াম বিউটি ও কসমেটিকস"
                />
              </div>
            </div>

            {/* Brand Philosophy English */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                  {isBn ? "ব্র্যান্ড দর্শন (English - ফুটারে প্রদর্শিত)" : "Brand Philosophy (EN - Footer)"}
                </label>
                {(() => {
                  const words = brandDescription.trim().split(/\s+/).filter(Boolean).length;
                  if (words < 55) return null;
                  return (
                    <span
                      className={`text-[9px] font-mono transition-colors ${
                        words >= 70 ? "text-red-500 font-bold opacity-100" : "opacity-60 text-foreground"
                      }`}
                    >
                      {words}/70 words
                    </span>
                  );
                })()}
              </div>
              <textarea
                rows={3}
                maxLength={350}
                value={brandDescription}
                onChange={(e) => {
                  const val = e.target.value;
                  const words = val.trim().split(/\s+/).filter(Boolean);
                  if (words.length <= 70 || val.length < brandDescription.length) {
                    setBrandDescription(val);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent resize-none leading-relaxed"
                placeholder="Enter store brand philosophy in English (max 70 words)..."
              />
            </div>

            {/* Brand Philosophy Bangla */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "ব্র্যান্ড দর্শন (বাংলা - ফুটারে প্রদর্শিত)" : "Brand Philosophy (BN - Footer)"}</span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const words = brandDescriptionBn.trim().split(/\s+/).filter(Boolean).length;
                    if (words < 55) return null;
                    return (
                      <span
                        className={`text-[9px] font-mono transition-colors ${
                          words >= 70 ? "text-red-500 font-bold opacity-100" : "opacity-60 text-foreground"
                        }`}
                      >
                        {words}/70 words
                      </span>
                    );
                  })()}
                  <AutoTranslateButton
                    sourceText={brandDescription}
                    onTranslated={(val) => setBrandDescriptionBn(val.slice(0, 400))}
                  />
                </div>
              </label>
              <textarea
                rows={3}
                maxLength={400}
                value={brandDescriptionBn}
                onChange={(e) => {
                  const val = e.target.value;
                  const words = val.trim().split(/\s+/).filter(Boolean);
                  if (words.length <= 70 || val.length < brandDescriptionBn.length) {
                    setBrandDescriptionBn(val);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent resize-none leading-relaxed"
                placeholder="ফুটারে প্রদর্শনের জন্য বাংলায় স্টোরের বিবরণ লিখুন (সর্বোচ্চ ৭০ শব্দ)..."
              />
            </div>
          </div>
        </div>

        {/* Middle & Right Column: Footer, Contact & Social Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Footer Information & Contact Details */}
          <div className="bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-visible" />
              <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                {isBn ? "ফুটার তথ্য ও কন্টাক্ট ইনফো" : "Footer Info & Contact Details"}
              </h2>
            </div>
            <p className="text-xs opacity-70">
              {isBn
                ? "ওয়েবসাইটের ফুটারে প্রদর্শিত ফোন নম্বর, ঠিকানা এবং ইমেইল তথ্য আপডেট করুন।"
                : "Manage contact information and physical address displayed in website footer."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                  {isBn ? "হেল্পলাইন ফোন নম্বর" : "Support Phone Number"}
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value.slice(0, 30))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-bold border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="+880 1700-000000"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                  {isBn ? "সাপোর্ট ইমেইল" : "Support Email Address"}
                </label>
                <input
                  type="email"
                  maxLength={100}
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value.slice(0, 100))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-bold border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="support@vibemart.com"
                />
              </div>
            </div>

            {/* Address: English & Bangla */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "অফিস ঠিকানা (English)" : "Store Office Address (EN)"}</span>
                  {renderCharCounter(storeAddress.length, 200)}
                </label>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value.slice(0, 200))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent resize-none"
                  placeholder="Enter physical address in English..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "অফিস ঠিকানা (বাংলা)" : "Store Office Address (BN)"}</span>
                  <div className="flex items-center gap-2">
                    {renderCharCounter(storeAddressBn.length, 250)}
                    <AutoTranslateButton
                      sourceText={storeAddress}
                      onTranslated={(val) => setStoreAddressBn(val.slice(0, 250))}
                    />
                  </div>
                </label>
                <textarea
                  rows={2}
                  maxLength={250}
                  value={storeAddressBn}
                  onChange={(e) => setStoreAddressBn(e.target.value.slice(0, 250))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent resize-none"
                  placeholder="শোরুম বা অফিসের বাংলা ঠিকানা লিখুন..."
                />
              </div>
            </div>

            {/* Working Hours: English & Bangla */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "কাজের সময় (English)" : "Working Hours (EN)"}</span>
                  {renderCharCounter(workingHours.length, 60)}
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value.slice(0, 60))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="Sat - Thu: 10:00 - 18:00"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "কাজের সময় (বাংলা)" : "Working Hours (BN)"}</span>
                  <div className="flex items-center gap-2">
                    {renderCharCounter(workingHoursBn.length, 80)}
                    <AutoTranslateButton
                      sourceText={workingHours}
                      onTranslated={(val) => setWorkingHoursBn(val.slice(0, 80))}
                    />
                  </div>
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={workingHoursBn}
                  onChange={(e) => setWorkingHoursBn(e.target.value.slice(0, 80))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="শনি - বৃহস্পতি: সকাল ১০:০০ - সন্ধ্যা ৬:০০"
                />
              </div>
            </div>

            {/* Copyright: English & Bangla */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "কপিরাইট নোটিশ (English)" : "Copyright Notice (EN)"}</span>
                  {renderCharCounter(footerCopyright.length, 100)}
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={footerCopyright}
                  onChange={(e) => setFooterCopyright(e.target.value.slice(0, 100))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="© 2026 VIBEMART. ALL RIGHTS RESERVED."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "কপিরাইট নোটিশ (বাংলা)" : "Copyright Notice (BN)"}</span>
                  <div className="flex items-center gap-2">
                    {renderCharCounter(footerCopyrightBn.length, 120)}
                    <AutoTranslateButton
                      sourceText={footerCopyright}
                      onTranslated={(val) => setFooterCopyrightBn(val.slice(0, 120))}
                    />
                  </div>
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={footerCopyrightBn}
                  onChange={(e) => setFooterCopyrightBn(e.target.value.slice(0, 120))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="© ২০২৬ ভাইবমার্ট। সর্বস্বত্ব সংরক্ষিত।"
                />
              </div>
            </div>
          </div>

          {/* Social Media Links & WhatsApp */}
          <div className="bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                {isBn ? "সোশ্যাল মিডিয়া ও মেসেজিং লিংকস" : "Social Media & Messaging Links"}
              </h2>
            </div>
            <p className="text-xs opacity-70">
              {isBn
                ? "ফুটার ও হেডারে সোশ্যাল আইকনের সাথে সংযুক্ত করার লিংকসমূহ।"
                : "Provide official URLs for Facebook, Instagram, YouTube, and WhatsApp."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>Facebook URL</span>
                  {renderCharCounter(facebookUrl.length, 255)}
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value.slice(0, 255))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>Instagram URL</span>
                  {renderCharCounter(instagramUrl.length, 255)}
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value.slice(0, 255))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>YouTube URL</span>
                  {renderCharCounter(youtubeUrl.length, 255)}
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value.slice(0, 255))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>WhatsApp Number / Link</span>
                  {renderCharCounter(whatsappNumber.length, 50)}
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.slice(0, 50))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                  placeholder="+8801700000000"
                />
              </div>
            </div>
          </div>

          {/* Meta (Facebook) Pixel Settings */}
          <div className="bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                {isBn ? "মেটা (ফেসবুক) পিক্সেল ট্র্যাকিং" : "Meta (Facebook) Pixel Tracking"}
              </h2>
            </div>
            <p className="text-xs opacity-70">
              {isBn
                ? "ফেসবুক ও ইনস্টাগ্রাম বিজ্ঞাপনের জন্য আপনার মেটা পিক্সেল আইডি এখানে দিন (যেমন: 123456789012345)। এটি স্বয়ংক্রিয়ভাবে পেজ ভিউ, ভিউ কন্টেন্ট, অ্যাড টু কার্ট এবং পারচেজ ট্র্যাক করবে।"
                : "Enter your Meta (Facebook) Pixel ID (e.g. 123456789012345) to enable conversion tracking, PageView, ViewContent, AddToCart, and Purchase events across your storefront."}
            </p>

            <div className="max-w-md space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "মেটা পিক্সেল আইডি" : "Meta Pixel ID"}</span>
                {renderCharCounter(metaPixelId.length, 50)}
              </label>
              <input
                type="text"
                maxLength={50}
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value.trim().slice(0, 50))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-mono font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                placeholder="e.g. 123456789012345"
              />
              <p className="text-[10px] opacity-60">
                {isBn
                  ? "খালি রাখলে পিক্সেল ট্র্যাকিং নিষ্ক্রিয় থাকবে।"
                  : "Leave blank to disable Pixel tracking on the storefront."}
              </p>
            </div>
          </div>

          {/* AI Assistant (VibeBuddy) & Proactive Nudge Settings */}
          <div className="bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                  {isBn ? "এআই সহকারী (VibeBuddy) ও পপআপ সেটিংস" : "AI Assistant (VibeBuddy) & Popup Settings"}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-2">
                  <span>{isBn ? "চ্যাটবট সক্রিয়" : "AI Chat Active"}</span>
                  <input
                    type="checkbox"
                    checked={aiChatActive}
                    onChange={(e) => setAiChatActive(e.target.checked)}
                    className="w-4 h-4 rounded text-accent focus:ring-accent accent-accent cursor-pointer"
                  />
                </label>
              </div>
            </div>
            <p className="text-xs opacity-70">
              {isBn
                ? "গ্রাহকদের কেনাকাটায় সাহায্য করার জন্য লাইভ এআই চ্যাটবট এবং হোম ও প্রোডাক্ট পেজের স্বয়ংক্রিয় প্রম্পট পপআপ নিয়ন্ত্রণ করুন।"
                : "Manage the storefront 24/7 AI shopping companion and configure proactive speech bubble popups on landing and product pages."}
            </p>

            {/* Proactive Popup Toggle & Timers */}
            <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    {isBn ? "স্বয়ংক্রিয় প্রম্পট পপআপ (Proactive Nudge)" : "Proactive Popup Bubble"}
                  </h3>
                  <p className="text-[11px] opacity-60">
                    {isBn
                      ? "হোমপেজ ও প্রোডাক্ট পেজে গ্রাহকের দৃষ্টি আকর্ষণে ছোট স্পিচ বাবল দেখানো হবে।"
                      : "Shows a friendly floating speech bubble inviting shoppers to ask questions."}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-accent/15 text-accent">
                    {aiNudgeActive ? (isBn ? "সক্রিয়" : "Active") : (isBn ? "নিষ্ক্রিয়" : "Disabled")}
                  </span>
                  <input
                    type="checkbox"
                    checked={aiNudgeActive}
                    onChange={(e) => setAiNudgeActive(e.target.checked)}
                    className="w-4 h-4 rounded text-accent focus:ring-accent accent-accent cursor-pointer"
                  />
                </label>
              </div>

              {aiNudgeActive && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-foreground/10">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                      {isBn ? "পপআপ আসার সময় (Delay in Seconds)" : "Popup Delay (Seconds)"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={aiNudgeDelaySeconds}
                      onChange={(e) => setAiNudgeDelaySeconds(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold border border-foreground/15 focus:outline-none focus:border-accent"
                    />
                    <p className="text-[10px] opacity-50">
                      {isBn ? "পেজে আসার কত সেকেন্ড পর পপআপ আসবে (ডিফল্ট: ৫)" : "How many seconds after page load before the bubble pops up (default: 5)"}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                      {isBn ? "পপআপ থাকার সময় (Duration in Seconds)" : "Popup Duration (Seconds)"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={aiNudgeDurationSeconds}
                      onChange={(e) => setAiNudgeDurationSeconds(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold border border-foreground/15 focus:outline-none focus:border-accent"
                    />
                    <p className="text-[10px] opacity-50">
                      {isBn ? "কত সেকেন্ড পর স্বয়ংক্রিয়ভাবে বন্ধ হবে (ডিফল্ট: ৮)" : "How many seconds the bubble stays visible before auto-closing (default: 8)"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Messages for Home & Product Pages */}
            {aiNudgeActive && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                      <span>{isBn ? "হোমপেজ বার্তা (English)" : "Home Page Message (EN)"}</span>
                      {renderCharCounter(aiNudgeHomeMsg.length, 200)}
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      value={aiNudgeHomeMsg}
                      onChange={(e) => setAiNudgeHomeMsg(e.target.value.slice(0, 200))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                      placeholder="Welcome to VibeMart! Need any shopping help? Let's chat 👋"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                      <span>{isBn ? "হোমপেজ বার্তা (বাংলা)" : "Home Page Message (BN)"}</span>
                      <div className="flex items-center gap-2">
                        {renderCharCounter(aiNudgeHomeMsgBn.length, 250)}
                        <AutoTranslateButton
                          sourceText={aiNudgeHomeMsg}
                          onTranslated={(val) => setAiNudgeHomeMsgBn(val.slice(0, 250))}
                        />
                      </div>
                    </label>
                    <input
                      type="text"
                      maxLength={250}
                      value={aiNudgeHomeMsgBn}
                      onChange={(e) => setAiNudgeHomeMsgBn(e.target.value.slice(0, 250))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                      placeholder="স্বাগতম VibeMart-এ! কেনাকাটায় কোনো সাহায্য লাগবে? চ্যাট করুন 👋"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                      <span>{isBn ? "প্রোডাক্ট পেজ বার্তা (English)" : "Product Page Message (EN)"}</span>
                      {renderCharCounter(aiNudgeProductMsg.length, 200)}
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      value={aiNudgeProductMsg}
                      onChange={(e) => setAiNudgeProductMsg(e.target.value.slice(0, 200))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                      placeholder="Any confusion or questions? Just ask me"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                      <span>{isBn ? "প্রোডাক্ট পেজ বার্তা (বাংলা)" : "Product Page Message (BN)"}</span>
                      <div className="flex items-center gap-2">
                        {renderCharCounter(aiNudgeProductMsgBn.length, 250)}
                        <AutoTranslateButton
                          sourceText={aiNudgeProductMsg}
                          onTranslated={(val) => setAiNudgeProductMsgBn(val.slice(0, 250))}
                        />
                      </div>
                    </label>
                    <input
                      type="text"
                      maxLength={250}
                      value={aiNudgeProductMsgBn}
                      onChange={(e) => setAiNudgeProductMsgBn(e.target.value.slice(0, 250))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                      placeholder="কোনো প্রশ্ন বা দ্বিধা আছে? আমাকে জিজ্ঞেস করুন!"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={!hasChanges || saving}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                !hasChanges || saving
                  ? "bg-foreground/15 text-foreground/70 border border-foreground/20 cursor-not-allowed"
                  : "bg-button-bg text-button-fg hover:opacity-90 active:scale-95 cursor-pointer shadow-sm"
              }`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{isBn ? "সংরক্ষণ..." : "Saving..."}</span>
                </>
              ) : (
                <span>{isBn ? "সংরক্ষণ" : "Save Changes"}</span>
              )}
            </button>
          </div>
          </div>
        </div>
      </form>
      )}
    </div>
  );
}
