"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useLanguage } from "@/store/LanguageContext";
import { Collection } from "@/features/admin/types";
import Swal from "sweetalert2";
import AutoTranslateButton from "@/features/admin/components/common/AutoTranslateButton";
import { translateText, translateWordList } from "@/services/translationService";
import { DEFAULT_MARQUEE_ITEMS, MarqueeItemConfig } from "@/components/ui/MarqueeTicker";
import { DEFAULT_STAT_ITEMS, StatItemConfig } from "@/components/ui/AnimatedCounter";
import IconPickerModal from "@/features/admin/components/common/IconPickerModal";

export interface WhyUsItemConfig {
  id: string;
  icon: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  is_active: boolean;
}

export const DEFAULT_WHY_US_ITEMS: WhyUsItemConfig[] = [
  {
    id: "fast_shipping",
    icon: "/icons/truck.png",
    titleEn: "Fast Shipping",
    titleBn: "দ্রুত শিপিং",
    descEn: "Reliable home delivery across all 64 districts in Bangladesh.",
    descBn: "বাংলাদেশের সকল ৬৪টি জেলায় নির্ভরযোগ্য হোম ডেলিভারি।",
    is_active: true,
  },
  {
    id: "elite_quality",
    icon: "/icons/star-filled.png",
    titleEn: "Elite Quality",
    titleBn: "সেরা কোয়ালিটি",
    descEn: "100% genuine and verified authentic cosmetics sourced directly from top brands.",
    descBn: "১০০% আসল ও পরীক্ষিত প্রসাধনী পণ্য সরাসরি বিশ্বস্ত ব্র্যান্ড থেকে সংগৃহীত।",
    is_active: true,
  },
  {
    id: "secure_checkout",
    icon: "/icons/return-arrow.png",
    titleEn: "Secure Checkout",
    titleBn: "নিরাপদ চেকআউট",
    descEn: "Complete peace of mind with Cash on Delivery and trusted instant bKash payment.",
    descBn: "ক্যাশ অন ডেলিভারি এবং তাত্ক্ষণিক বিকাশ পেমেন্ট সুরক্ষার সম্পূর্ণ নিশ্চয়তা।",
    is_active: true,
  },
];

interface HomepageSettingsSubTabProps {
  apiBase: string;
  token: string | null;
  collections: Collection[];
}

interface HomepageSettingsState {
  // Top Banner
  top_banner_link: string;
  top_banner_is_active: boolean;

  // Hero Section
  hero_badge: string;
  hero_badge_bn: string;
  hero_title_prefix: string;
  hero_title_prefix_bn: string;
  hero_rotating_words: string;
  hero_rotating_words_bn: string;
  hero_subtitle: string;
  hero_subtitle_bn: string;
  hero_btn_text: string;
  hero_btn_text_bn: string;
  hero_btn_link: string;

  // Discover Card
  discover_title: string;
  discover_title_bn: string;
  discover_subtitle: string;
  discover_subtitle_bn: string;
  discover_btn_text: string;
  discover_btn_text_bn: string;
  discover_btn_link: string;

  // Bento Tiles
  bento_tile_1_title: string;
  bento_tile_1_title_bn: string;
  bento_tile_1_collection: number | string;
  bento_tile_2_title: string;
  bento_tile_2_title_bn: string;
  bento_tile_2_collection: number | string;
  bento_tile_3_title: string;
  bento_tile_3_title_bn: string;
  bento_tile_3_collection: number | string;
  bento_tile_4_title: string;
  bento_tile_4_title_bn: string;
  bento_tile_4_collection: number | string;
  bento_tile_247_title: string;
  bento_tile_247_title_bn: string;
  bento_tile_247_link: string;
  bento_tile_delivery_title: string;
  bento_tile_delivery_title_bn: string;
  bento_tile_delivery_link: string;

  // Marquee Announcement Ticker
  marquee_is_active: boolean;
  marquee_items: MarqueeItemConfig[];

  // Live Stats & Social Proof Cards
  stats_is_active: boolean;
  stats_items: StatItemConfig[];

  // Why Choose Us Feature Cards
  why_us_is_active: boolean;
  why_us_items: WhyUsItemConfig[];
}

const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettingsState = {
  top_banner_link: "/gift-cards",
  top_banner_is_active: true,
  hero_badge: "New Collection",
  hero_badge_bn: "",
  hero_title_prefix: "Elevate Your",
  hero_title_prefix_bn: "",
  hero_rotating_words: "Beauty, Glow, Look, Glam, Charm",
  hero_rotating_words_bn: "",
  hero_subtitle:
    "Experience the intersection of luxury cosmetics, skincare, and radiant beauty aesthetics.",
  hero_subtitle_bn: "",
  hero_btn_text: "Explore Collection",
  hero_btn_text_bn: "",
  hero_btn_link: "/collections",
  discover_title: "Discover the Glam",
  discover_title_bn: "",
  discover_subtitle:
    "Collect exclusive beauty essentials and immerse yourself in the finest makeup shades.",
  discover_subtitle_bn: "",
  discover_btn_text: "View Exclusives",
  discover_btn_text_bn: "",
  discover_btn_link: "/products",
  bento_tile_1_title: "LIPSTICKS",
  bento_tile_1_title_bn: "",
  bento_tile_1_collection: "",
  bento_tile_2_title: "SKINCARE",
  bento_tile_2_title_bn: "",
  bento_tile_2_collection: "",
  bento_tile_3_title: "EYE MAKEUP",
  bento_tile_3_title_bn: "",
  bento_tile_3_collection: "",
  bento_tile_4_title: "FOUNDATION & GLOW",
  bento_tile_4_title_bn: "",
  bento_tile_4_collection: "",
  bento_tile_247_title: "",
  bento_tile_247_title_bn: "",
  bento_tile_247_link: "",
  bento_tile_delivery_title: "Fast Delivery",
  bento_tile_delivery_title_bn: "",
  bento_tile_delivery_link: "",
  marquee_is_active: true,
  marquee_items: DEFAULT_MARQUEE_ITEMS,
  stats_is_active: true,
  stats_items: DEFAULT_STAT_ITEMS,
  why_us_is_active: true,
  why_us_items: DEFAULT_WHY_US_ITEMS,
};

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

export default function HomepageSettingsSubTab({
  apiBase,
  token,
  collections,
}: HomepageSettingsSubTabProps) {
  const { locale } = useLanguage();
  const isBn = locale === "bn";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [initialSettings, setInitialSettings] = useState<HomepageSettingsState>(
    DEFAULT_HOMEPAGE_SETTINGS
  );
  const [formData, setFormData] = useState<HomepageSettingsState>(
    DEFAULT_HOMEPAGE_SETTINGS
  );

  // Icon Picker Modal State
  const [iconPickerTarget, setIconPickerTarget] = useState<{
    type: "marquee" | "stats" | "why_us";
    index: number;
    currentIcon: string;
    title: string;
  } | null>(null);

  // Top Banner Image file & preview
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [initialBannerUrl, setInitialBannerUrl] = useState<string | null>(null);

  // Bento Tiles Image files & previews (4 slots)
  const [bento1File, setBento1File] = useState<File | null>(null);
  const [bento1Preview, setBento1Preview] = useState<string | null>(null);
  const [initialBento1Url, setInitialBento1Url] = useState<string | null>(null);

  const [bento2File, setBento2File] = useState<File | null>(null);
  const [bento2Preview, setBento2Preview] = useState<string | null>(null);
  const [initialBento2Url, setInitialBento2Url] = useState<string | null>(null);

  const [bento3File, setBento3File] = useState<File | null>(null);
  const [bento3Preview, setBento3Preview] = useState<string | null>(null);
  const [initialBento3Url, setInitialBento3Url] = useState<string | null>(null);

  const [bento4File, setBento4File] = useState<File | null>(null);
  const [bento4Preview, setBento4Preview] = useState<string | null>(null);
  const [initialBento4Url, setInitialBento4Url] = useState<string | null>(null);

  // 24/7 Slot
  const [bento247File, setBento247File] = useState<File | null>(null);
  const [bento247Preview, setBento247Preview] = useState<string | null>(null);
  const [initialBento247Url, setInitialBento247Url] = useState<string | null>(null);

  // Delivery Slot
  const [bentoDeliveryFile, setBentoDeliveryFile] = useState<File | null>(null);
  const [bentoDeliveryPreview, setBentoDeliveryPreview] = useState<string | null>(null);
  const [initialBentoDeliveryUrl, setInitialBentoDeliveryUrl] = useState<string | null>(null);

  const getFullUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
      return url;
    }
    return `${apiBase.replace(/\/+$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/store/site-settings/`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const loaded: HomepageSettingsState = {
          top_banner_link: data.top_banner_link || "/gift-cards",
          top_banner_is_active: data.top_banner_is_active !== false,
          hero_badge: data.hero_badge || "New Collection",
          hero_badge_bn: data.hero_badge_bn || "",
          hero_title_prefix: data.hero_title_prefix || "Elevate Your",
          hero_title_prefix_bn: data.hero_title_prefix_bn || "",
          hero_rotating_words:
            data.hero_rotating_words || "Beauty, Glow, Look, Glam, Charm",
          hero_rotating_words_bn: data.hero_rotating_words_bn || "",
          hero_subtitle:
            data.hero_subtitle ||
            "Experience the intersection of luxury cosmetics, skincare, and radiant beauty aesthetics.",
          hero_subtitle_bn: data.hero_subtitle_bn || "",
          hero_btn_text: data.hero_btn_text || "Explore Collection",
          hero_btn_text_bn: data.hero_btn_text_bn || "",
          hero_btn_link: data.hero_btn_link || "/collections",
          discover_title: data.discover_title || "Discover the Glam",
          discover_title_bn: data.discover_title_bn || "",
          discover_subtitle:
            data.discover_subtitle ||
            "Collect exclusive beauty essentials and immerse yourself in the finest makeup shades.",
          discover_subtitle_bn: data.discover_subtitle_bn || "",
          discover_btn_text: data.discover_btn_text || "View Exclusives",
          discover_btn_text_bn: data.discover_btn_text_bn || "",
          discover_btn_link: data.discover_btn_link || "/products",
          bento_tile_1_title: data.bento_tile_1_title || "LIPSTICKS",
          bento_tile_1_title_bn: data.bento_tile_1_title_bn || "",
          bento_tile_1_collection: data.bento_tile_1_collection || "",
          bento_tile_2_title: data.bento_tile_2_title || "SKINCARE",
          bento_tile_2_title_bn: data.bento_tile_2_title_bn || "",
          bento_tile_2_collection: data.bento_tile_2_collection || "",
          bento_tile_3_title: data.bento_tile_3_title || "EYE MAKEUP",
          bento_tile_3_title_bn: data.bento_tile_3_title_bn || "",
          bento_tile_3_collection: data.bento_tile_3_collection || "",
          bento_tile_4_title: data.bento_tile_4_title || "FOUNDATION & GLOW",
          bento_tile_4_title_bn: data.bento_tile_4_title_bn || "",
          bento_tile_4_collection: data.bento_tile_4_collection || "",
          bento_tile_247_title: data.bento_tile_247_title || "",
          bento_tile_247_title_bn: data.bento_tile_247_title_bn || "",
          bento_tile_247_link: data.bento_tile_247_link || "",
          bento_tile_delivery_title: data.bento_tile_delivery_title || "Fast Delivery",
          bento_tile_delivery_title_bn: data.bento_tile_delivery_title_bn || "",
          bento_tile_delivery_link: data.bento_tile_delivery_link || "",
          marquee_is_active: data.marquee_is_active !== false,
          marquee_items: (() => {
            if (data.marquee_items_json) {
              try {
                const parsed = JSON.parse(data.marquee_items_json);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
              } catch (e) {
                console.error("Failed to parse marquee_items_json:", e);
              }
            }
            return DEFAULT_MARQUEE_ITEMS;
          })(),
          stats_is_active: data.stats_is_active !== false,
          stats_items: (() => {
            if (data.stats_items_json) {
              try {
                const parsed = JSON.parse(data.stats_items_json);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
              } catch (e) {
                console.error("Failed to parse stats_items_json:", e);
              }
            }
            return DEFAULT_STAT_ITEMS;
          })(),
          why_us_is_active: data.why_us_is_active !== false,
          why_us_items: (() => {
            if (data.why_us_items_json) {
              try {
                const parsed = JSON.parse(data.why_us_items_json);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
              } catch (e) {
                console.error("Failed to parse why_us_items_json:", e);
              }
            }
            return DEFAULT_WHY_US_ITEMS;
          })(),
        };

        setInitialSettings(loaded);
        setFormData(loaded);

        if (data.top_banner_image) {
          const full = getFullUrl(data.top_banner_image);
          setInitialBannerUrl(full);
          setBannerPreview(full);
        }

        if (data.bento_tile_1_image) {
          const full = getFullUrl(data.bento_tile_1_image);
          setInitialBento1Url(full);
          setBento1Preview(full);
        }
        if (data.bento_tile_2_image) {
          const full = getFullUrl(data.bento_tile_2_image);
          setInitialBento2Url(full);
          setBento2Preview(full);
        }
        if (data.bento_tile_3_image) {
          const full = getFullUrl(data.bento_tile_3_image);
          setInitialBento3Url(full);
          setBento3Preview(full);
        }
        if (data.bento_tile_4_image) {
          const full = getFullUrl(data.bento_tile_4_image);
          setInitialBento4Url(full);
          setBento4Preview(full);
        }
        if (data.bento_tile_247_image) {
          const full = getFullUrl(data.bento_tile_247_image);
          setInitialBento247Url(full);
          setBento247Preview(full);
        }
        if (data.bento_tile_delivery_image) {
          const full = getFullUrl(data.bento_tile_delivery_image);
          setInitialBentoDeliveryUrl(full);
          setBentoDeliveryPreview(full);
        }
      }
    } catch (err) {
      console.error("Failed to load homepage settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [apiBase]);

  // Track unsaved modifications
  const hasChanges = useMemo(() => {
    const textChanged = JSON.stringify(formData) !== JSON.stringify(initialSettings);
    const bannerChanged = bannerFile !== null || bannerPreview !== initialBannerUrl;
    const bento1Changed = bento1File !== null || bento1Preview !== initialBento1Url;
    const bento2Changed = bento2File !== null || bento2Preview !== initialBento2Url;
    const bento3Changed = bento3File !== null || bento3Preview !== initialBento3Url;
    const bento4Changed = bento4File !== null || bento4Preview !== initialBento4Url;
    const bento247Changed = bento247File !== null || bento247Preview !== initialBento247Url;
    const bentoDeliveryChanged = bentoDeliveryFile !== null || bentoDeliveryPreview !== initialBentoDeliveryUrl;

    return (
      textChanged ||
      bannerChanged ||
      bento1Changed ||
      bento2Changed ||
      bento3Changed ||
      bento4Changed ||
      bento247Changed ||
      bentoDeliveryChanged
    );
  }, [
    formData,
    initialSettings,
    bannerFile,
    bannerPreview,
    initialBannerUrl,
    bento1File,
    bento1Preview,
    initialBento1Url,
    bento2File,
    bento2Preview,
    initialBento2Url,
    bento3File,
    bento3Preview,
    initialBento3Url,
    bento4File,
    bento4Preview,
    initialBento4Url,
    bento247File,
    bento247Preview,
    initialBento247Url,
    bentoDeliveryFile,
    bentoDeliveryPreview,
    initialBentoDeliveryUrl,
  ]);

  const handleFieldChange = (key: keyof HomepageSettingsState, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleMarqueeItemChange = (
    index: number,
    field: keyof MarqueeItemConfig,
    value: any
  ) => {
    setFormData((prev) => {
      const updated = [...prev.marquee_items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, marquee_items: updated };
    });
  };

  const handleStatItemChange = (
    index: number,
    field: keyof StatItemConfig,
    value: any
  ) => {
    setFormData((prev) => {
      const updated = [...prev.stats_items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, stats_items: updated };
    });
  };

  const handleWhyUsItemChange = (
    index: number,
    field: keyof WhyUsItemConfig,
    value: any
  ) => {
    setFormData((prev) => {
      const updated = [...prev.why_us_items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, why_us_items: updated };
    });
  };

  const handleApplySelectedIcon = (iconPath: string) => {
    if (!iconPickerTarget) return;
    const { type, index } = iconPickerTarget;
    if (type === "marquee") {
      handleMarqueeItemChange(index, "icon", iconPath);
    } else if (type === "stats") {
      handleStatItemChange(index, "icon", iconPath);
    } else if (type === "why_us") {
      handleWhyUsItemChange(index, "icon", iconPath);
    }
  };

  const [batchTranslatingHero, setBatchTranslatingHero] = useState(false);
  const [batchTranslatingBento, setBatchTranslatingBento] = useState(false);

  const handleAutoTranslateAllHero = async () => {
    setBatchTranslatingHero(true);
    try {
      const updates: Partial<HomepageSettingsState> = {};
      if (formData.hero_badge?.trim() && !formData.hero_badge_bn?.trim()) {
        updates.hero_badge_bn = await translateText(formData.hero_badge);
      }
      if (formData.hero_title_prefix?.trim() && !formData.hero_title_prefix_bn?.trim()) {
        updates.hero_title_prefix_bn = await translateText(formData.hero_title_prefix);
      }
      if (formData.hero_rotating_words?.trim() && !formData.hero_rotating_words_bn?.trim()) {
        updates.hero_rotating_words_bn = await translateWordList(formData.hero_rotating_words);
      }
      if (formData.hero_subtitle?.trim() && !formData.hero_subtitle_bn?.trim()) {
        updates.hero_subtitle_bn = await translateText(formData.hero_subtitle);
      }
      if (formData.hero_btn_text?.trim() && !formData.hero_btn_text_bn?.trim()) {
        updates.hero_btn_text_bn = await translateText(formData.hero_btn_text);
      }
      if (formData.discover_title?.trim() && !formData.discover_title_bn?.trim()) {
        updates.discover_title_bn = await translateText(formData.discover_title);
      }
      if (formData.discover_subtitle?.trim() && !formData.discover_subtitle_bn?.trim()) {
        updates.discover_subtitle_bn = await translateText(formData.discover_subtitle);
      }
      if (formData.discover_btn_text?.trim() && !formData.discover_btn_text_bn?.trim()) {
        updates.discover_btn_text_bn = await translateText(formData.discover_btn_text);
      }

      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({ ...prev, ...updates }));
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isBn ? "হিরো টেক্সট সফলভাবে বাংলায় অনুবাদ হয়েছে!" : "Hero texts auto-translated to Bangla!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "info",
          title: isBn ? "সকল হিরো বাংলা ফিল্ড ইতিমধ্যেই পূর্ণ আছে" : "All Hero Bangla fields are already populated",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBatchTranslatingHero(false);
    }
  };

  const handleAutoTranslateAllBento = async () => {
    setBatchTranslatingBento(true);
    try {
      const updates: Partial<HomepageSettingsState> = {};
      if (formData.bento_tile_1_title?.trim() && !formData.bento_tile_1_title_bn?.trim()) {
        updates.bento_tile_1_title_bn = await translateText(formData.bento_tile_1_title);
      }
      if (formData.bento_tile_2_title?.trim() && !formData.bento_tile_2_title_bn?.trim()) {
        updates.bento_tile_2_title_bn = await translateText(formData.bento_tile_2_title);
      }
      if (formData.bento_tile_3_title?.trim() && !formData.bento_tile_3_title_bn?.trim()) {
        updates.bento_tile_3_title_bn = await translateText(formData.bento_tile_3_title);
      }
      if (formData.bento_tile_4_title?.trim() && !formData.bento_tile_4_title_bn?.trim()) {
        updates.bento_tile_4_title_bn = await translateText(formData.bento_tile_4_title);
      }
      if (formData.bento_tile_247_title?.trim() && !formData.bento_tile_247_title_bn?.trim()) {
        updates.bento_tile_247_title_bn = await translateText(formData.bento_tile_247_title);
      }
      if (formData.bento_tile_delivery_title?.trim() && !formData.bento_tile_delivery_title_bn?.trim()) {
        updates.bento_tile_delivery_title_bn = await translateText(formData.bento_tile_delivery_title);
      }

      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({ ...prev, ...updates }));
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isBn ? "বেন্টো গ্রিড টাইটেল সফলভাবে বাংলায় অনুবাদ হয়েছে!" : "Bento titles auto-translated to Bangla!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "info",
          title: isBn ? "সকল বেন্টো বাংলা ফিল্ড ইতিমধ্যেই পূর্ণ আছে" : "All Bento Bangla fields are already populated",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBatchTranslatingBento(false);
    }
  };

  const confirmRemoveImage = (onConfirm: () => void) => {
    Swal.fire({
      icon: "warning",
      title: isBn ? "ছবি মুছে ফেলতে চান?" : "Remove photo?",
      text: isBn
        ? "আপনি কি নিশ্চিত যে এই ছবিটি মুছে ফেলতে চান?"
        : "Are you sure you want to remove this photo?",
      showCancelButton: true,
      confirmButtonColor: "var(--button-bg, #111)",
      cancelButtonColor: "#888",
      confirmButtonText: isBn ? "হ্যাঁ, মুছে ফেলুন" : "Yes, Remove",
      cancelButtonText: isBn ? "বাতিল" : "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        onConfirm();
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    // Check mandatory photos
    const hasBannerPhoto = Boolean(bannerFile || bannerPreview || initialBannerUrl);
    const hasSlot1Photo = Boolean(bento1File || bento1Preview || initialBento1Url);
    const hasSlot2Photo = Boolean(bento2File || bento2Preview || initialBento2Url);
    const hasSlot3Photo = Boolean(bento3File || bento3Preview || initialBento3Url);
    const hasSlot4Photo = Boolean(bento4File || bento4Preview || initialBento4Url);
    const hasSlot247Photo = Boolean(bento247File || bento247Preview || initialBento247Url);
    const hasSlotDeliveryPhoto = Boolean(bentoDeliveryFile || bentoDeliveryPreview || initialBentoDeliveryUrl);

    if (!hasBannerPhoto) {
      Swal.fire({
        icon: "warning",
        title: isBn ? "ব্যানারের ছবি আবশ্যক!" : "Banner Photo Required!",
        text: isBn
          ? "অনুগ্রহ করে শীর্ষ প্রমোশনাল ব্যানারের জন্য একটি ছবি আপলোড করুন।"
          : "Please upload a photo for the Top Promotional Banner. It cannot be empty.",
      });
      return;
    }

    if (
      !hasSlot1Photo ||
      !hasSlot2Photo ||
      !hasSlot3Photo ||
      !hasSlot4Photo ||
      !hasSlot247Photo ||
      !hasSlotDeliveryPhoto
    ) {
      const missingSlots: string[] = [];
      if (!hasSlot1Photo) missingSlots.push(isBn ? "স্লট ১" : "Slot 1");
      if (!hasSlot2Photo) missingSlots.push(isBn ? "স্লট ২" : "Slot 2");
      if (!hasSlot3Photo) missingSlots.push(isBn ? "স্লট ৩" : "Slot 3");
      if (!hasSlot4Photo) missingSlots.push(isBn ? "স্লট ৪" : "Slot 4");
      if (!hasSlot247Photo) missingSlots.push(isBn ? "২৪/৭ ড্রপস স্লট" : "24/7 Drops Slot");
      if (!hasSlotDeliveryPhoto) missingSlots.push(isBn ? "ফ্রি ডেলিভারি স্লট" : "Free Delivery Slot");

      Swal.fire({
        icon: "warning",
        title: isBn ? "স্লটের ছবি আবশ্যক!" : "Slot Photos Required!",
        text: isBn
          ? `প্রতিটি স্লটের জন্য ছবি থাকা বাধ্যতামূলক। অনুপস্থিত: ${missingSlots.join(", ")}`
          : `Photos are mandatory for all category slots. Missing: ${missingSlots.join(", ")}`,
      });
      return;
    }

    // Check mandatory collections for Slots 1 to 4
    const hasSlot1Collection = Boolean(formData.bento_tile_1_collection);
    const hasSlot2Collection = Boolean(formData.bento_tile_2_collection);
    const hasSlot3Collection = Boolean(formData.bento_tile_3_collection);
    const hasSlot4Collection = Boolean(formData.bento_tile_4_collection);

    if (
      !hasSlot1Collection ||
      !hasSlot2Collection ||
      !hasSlot3Collection ||
      !hasSlot4Collection
    ) {
      const missingCollectionSlots: string[] = [];
      if (!hasSlot1Collection) missingCollectionSlots.push(isBn ? "স্লট ১" : "Slot 1");
      if (!hasSlot2Collection) missingCollectionSlots.push(isBn ? "স্লট ২" : "Slot 2");
      if (!hasSlot3Collection) missingCollectionSlots.push(isBn ? "স্লট ৩" : "Slot 3");
      if (!hasSlot4Collection) missingCollectionSlots.push(isBn ? "স্লট ৪" : "Slot 4");

      Swal.fire({
        icon: "warning",
        title: isBn ? "কালেকশন নির্বাচন আবশ্যক!" : "Collection Selection Required!",
        text: isBn
          ? `স্লট ১ থেকে ৪ এর প্রতিটিতে কালেকশন নির্বাচন করা বাধ্যতামূলক। অনুগ্রহ করে নির্বাচন করুন: ${missingCollectionSlots.join(", ")}`
          : `Selecting a collection for Slot 1 to 4 is mandatory. Please select a collection for: ${missingCollectionSlots.join(", ")}`,
      });
      return;
    }

    if (!token) {
      Swal.fire({
        icon: "error",
        title: isBn ? "অনুমোদন ব্যর্থ" : "Authentication Required",
        text: isBn ? "সেটিংস সংরক্ষণ করতে লগইন করুন।" : "You must be logged in as admin to save settings.",
      });
      return;
    }

    try {
      setSaving(true);
      const payload = new FormData();

      // Top Banner
      payload.append("top_banner_link", formData.top_banner_link);
      payload.append("top_banner_is_active", String(formData.top_banner_is_active));
      if (bannerFile) {
        payload.append("top_banner_image", bannerFile);
      } else if (!bannerPreview && initialBannerUrl) {
        payload.append("remove_top_banner", "true");
      }

      // Hero
      payload.append("hero_badge", formData.hero_badge);
      payload.append("hero_badge_bn", formData.hero_badge_bn);
      payload.append("hero_title_prefix", formData.hero_title_prefix);
      payload.append("hero_title_prefix_bn", formData.hero_title_prefix_bn);
      payload.append("hero_rotating_words", formData.hero_rotating_words);
      payload.append("hero_rotating_words_bn", formData.hero_rotating_words_bn);
      payload.append("hero_subtitle", formData.hero_subtitle);
      payload.append("hero_subtitle_bn", formData.hero_subtitle_bn);
      payload.append("hero_btn_text", formData.hero_btn_text);
      payload.append("hero_btn_text_bn", formData.hero_btn_text_bn);
      payload.append("hero_btn_link", formData.hero_btn_link);

      // Discover
      payload.append("discover_title", formData.discover_title);
      payload.append("discover_title_bn", formData.discover_title_bn);
      payload.append("discover_subtitle", formData.discover_subtitle);
      payload.append("discover_subtitle_bn", formData.discover_subtitle_bn);
      payload.append("discover_btn_text", formData.discover_btn_text);
      payload.append("discover_btn_text_bn", formData.discover_btn_text_bn);
      payload.append("discover_btn_link", formData.discover_btn_link);

      // Bento 1
      payload.append("bento_tile_1_title", formData.bento_tile_1_title);
      payload.append("bento_tile_1_title_bn", formData.bento_tile_1_title_bn);
      if (formData.bento_tile_1_collection) {
        payload.append("bento_tile_1_collection", String(formData.bento_tile_1_collection));
      } else {
        payload.append("bento_tile_1_collection", "");
      }
      if (bento1File) {
        payload.append("bento_tile_1_image", bento1File);
      } else if (!bento1Preview && initialBento1Url) {
        payload.append("remove_bento_tile_1_image", "true");
      }

      // Bento 2
      payload.append("bento_tile_2_title", formData.bento_tile_2_title);
      payload.append("bento_tile_2_title_bn", formData.bento_tile_2_title_bn);
      if (formData.bento_tile_2_collection) {
        payload.append("bento_tile_2_collection", String(formData.bento_tile_2_collection));
      } else {
        payload.append("bento_tile_2_collection", "");
      }
      if (bento2File) {
        payload.append("bento_tile_2_image", bento2File);
      } else if (!bento2Preview && initialBento2Url) {
        payload.append("remove_bento_tile_2_image", "true");
      }

      // Bento 3
      payload.append("bento_tile_3_title", formData.bento_tile_3_title);
      payload.append("bento_tile_3_title_bn", formData.bento_tile_3_title_bn);
      if (formData.bento_tile_3_collection) {
        payload.append("bento_tile_3_collection", String(formData.bento_tile_3_collection));
      } else {
        payload.append("bento_tile_3_collection", "");
      }
      if (bento3File) {
        payload.append("bento_tile_3_image", bento3File);
      } else if (!bento3Preview && initialBento3Url) {
        payload.append("remove_bento_tile_3_image", "true");
      }

      // Bento 4
      payload.append("bento_tile_4_title", formData.bento_tile_4_title);
      payload.append("bento_tile_4_title_bn", formData.bento_tile_4_title_bn);
      if (formData.bento_tile_4_collection) {
        payload.append("bento_tile_4_collection", String(formData.bento_tile_4_collection));
      } else {
        payload.append("bento_tile_4_collection", "");
      }
      if (bento4File) {
        payload.append("bento_tile_4_image", bento4File);
      } else if (!bento4Preview && initialBento4Url) {
        payload.append("remove_bento_tile_4_image", "true");
      }

      // Bento 24/7 Slot
      payload.append("bento_tile_247_title", formData.bento_tile_247_title);
      payload.append("bento_tile_247_title_bn", formData.bento_tile_247_title_bn);
      payload.append("bento_tile_247_link", formData.bento_tile_247_link);
      if (bento247File) {
        payload.append("bento_tile_247_image", bento247File);
      } else if (!bento247Preview && initialBento247Url) {
        payload.append("remove_bento_tile_247_image", "true");
      }

      // Bento Delivery Slot
      payload.append("bento_tile_delivery_title", formData.bento_tile_delivery_title);
      payload.append("bento_tile_delivery_title_bn", formData.bento_tile_delivery_title_bn);
      payload.append("bento_tile_delivery_link", formData.bento_tile_delivery_link);
      if (bentoDeliveryFile) {
        payload.append("bento_tile_delivery_image", bentoDeliveryFile);
      } else if (!bentoDeliveryPreview && initialBentoDeliveryUrl) {
        payload.append("remove_bento_tile_delivery_image", "true");
      }

      // Marquee Announcement Ticker
      payload.append("marquee_is_active", String(formData.marquee_is_active));
      payload.append("marquee_items_json", JSON.stringify(formData.marquee_items));

      // Live Stats & Social Proof Cards
      payload.append("stats_is_active", String(formData.stats_is_active));
      payload.append("stats_items_json", JSON.stringify(formData.stats_items));

      // Why Choose Us Feature Cards
      payload.append("why_us_is_active", String(formData.why_us_is_active));
      payload.append("why_us_items_json", JSON.stringify(formData.why_us_items));

      const res = await fetch(`${apiBase}/store/site-settings/update_settings/`, {
        method: "POST",
        headers: {
          Authorization: `JWT ${token}`,
        },
        body: payload,
      });

      if (res.ok) {
        const updated = await res.json();
        setInitialSettings(formData);
        setBannerFile(null);
        setBento1File(null);
        setBento2File(null);
        setBento3File(null);
        setBento4File(null);
        setBento247File(null);
        setBentoDeliveryFile(null);

        const newBanner = getFullUrl(updated.top_banner_image);
        setInitialBannerUrl(newBanner);
        setBannerPreview(newBanner);

        const newB1 = getFullUrl(updated.bento_tile_1_image);
        setInitialBento1Url(newB1);
        setBento1Preview(newB1);

        const newB2 = getFullUrl(updated.bento_tile_2_image);
        setInitialBento2Url(newB2);
        setBento2Preview(newB2);

        const newB3 = getFullUrl(updated.bento_tile_3_image);
        setInitialBento3Url(newB3);
        setBento3Preview(newB3);

        const newB4 = getFullUrl(updated.bento_tile_4_image);
        setInitialBento4Url(newB4);
        setBento4Preview(newB4);

        const newB247 = getFullUrl(updated.bento_tile_247_image);
        setInitialBento247Url(newB247);
        setBento247Preview(newB247);

        const newBDelivery = getFullUrl(updated.bento_tile_delivery_image);
        setInitialBentoDeliveryUrl(newBDelivery);
        setBentoDeliveryPreview(newBDelivery);

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isBn
            ? "হোমপেজ সেটিংস ও ব্যানার সফলভাবে সংরক্ষিত হয়েছে!"
            : "Homepage settings & banners saved successfully!",
          showConfirmButton: false,
          timer: 2000,
          toast: true,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        Swal.fire({
          icon: "error",
          title: isBn ? "সংরক্ষণ ব্যর্থ হয়েছে" : "Save Failed",
          text: JSON.stringify(err),
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
        {isBn ? "হোমপেজ সেটিংস লোড হচ্ছে..." : "Loading homepage settings..."}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* 1. TOP PROMOTIONAL BANNER SECTION */}
      <div className="bg-secondary p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-foreground/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
                {isBn ? "শীর্ষ প্রমোশনাল ব্যানার (Top Promo Banner)" : "Top Promotional Banner"}
              </h2>
            </div>
            <p className="text-xs opacity-70 mt-1">
              {isBn
                ? "হোমপেজের সবার উপরে প্রদর্শিত ব্যানার (যেমনঃ গিফট কার্ড প্রমোশন)। লিংক পরিবর্তন করুন বা ব্যানার প্রদর্শন অন/অফ করুন।"
                : "Promotional banner displayed at the top of the homepage. Upload custom graphic, set target URL, or toggle visibility."}
            </p>
          </div>

          {/* Active / Inactive Toggle Switch */}
          <div className="self-start sm:self-auto">
            <button
              type="button"
              onClick={() =>
                handleFieldChange("top_banner_is_active", !formData.top_banner_is_active)
              }
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.top_banner_is_active ? "bg-visible" : "bg-hidden/80"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  formData.top_banner_is_active ? "translate-x-7" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Banner Preview & Upload Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-3">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 block">
              {isBn ? "ব্যানার প্রিভিউ (Banner Preview)" : "Banner Preview"}
            </label>
            <div className="relative w-full rounded-2xl overflow-hidden border-2 border-dashed border-foreground/20 bg-primary/5 min-h-[90px] flex flex-col items-center justify-center p-3 text-center">
              {bannerPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-auto max-h-24 sm:max-h-28 object-contain rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-1.5 py-2">
                  <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/40">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-foreground/70">
                    {isBn ? "কোনো ব্যানার ছবি নেই" : "No Banner Image Uploaded"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "ব্যানার ছবি (আবশ্যক)" : "Banner Photo (Required)"} <span className="text-hidden">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                id="banner-file-input"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const img = new window.Image();
                    const objectUrl = URL.createObjectURL(file);
                    img.onload = () => {
                      const width = img.naturalWidth;
                      const height = img.naturalHeight;
                      const ratio = width / height;

                      // Minimum width check to prevent blurry low-res graphics
                      if (width < 1200) {
                        Swal.fire({
                          icon: "warning",
                          title: isBn ? "ছবির রেজোলিউশন কম" : "Low Resolution Image",
                          text: isBn
                            ? `ব্যানারের ছবির প্রস্থ কমপক্ষে ১২০০ পিক্সেল হতে হবে (আপনার ছবির সাইজ: ${width} × ${height} পিক্সেল)।`
                            : `Banner image width must be at least 1200 pixels for optimal sharpness (Your image: ${width} × ${height} px).`,
                          confirmButtonColor: "var(--button-bg, #836e9f)",
                        });
                        URL.revokeObjectURL(objectUrl);
                        e.target.value = "";
                        return;
                      }

                      // Aspect ratio check: ideal ~10:1 (e.g. 1907x186 ~ 10.25:1, 1920x186 ~ 10.3:1, 1920x200 ~ 9.6:1)
                      if (ratio < 9.0 || ratio > 11.5) {
                        Swal.fire({
                          icon: "warning",
                          title: isBn ? "অনুপযুক্ত ব্যানার অনুপাত" : "Invalid Aspect Ratio",
                          text: isBn
                            ? `ব্যানারের অনুপাত প্রায় ১০:১ হতে হবে (যেমন: ১৯০৭ × ১৮৬ বা ১৯২০ × ১৮৬ বা ১৯২০ × ২০০ পিক্সেল)। আপনার আপলোডকৃত ছবির সাইজ: ${width} × ${height} পিক্সেল (অনুপাত: ${ratio.toFixed(1)}:১)।`
                            : `Banner must be a slim horizontal strip with approx 10:1 aspect ratio (recommended: 1907 × 186 px or 1920 × 186 px). Your image: ${width} × ${height} px (ratio: ${ratio.toFixed(1)}:1).`,
                          confirmButtonColor: "var(--button-bg, #836e9f)",
                        });
                        URL.revokeObjectURL(objectUrl);
                        e.target.value = "";
                        return;
                      }

                      setBannerFile(file);
                      setBannerPreview(objectUrl);
                    };
                    img.src = objectUrl;
                  }
                }}
              />
              <div className="flex items-center gap-2">
                {bannerPreview !== null || bannerFile !== null ? (
                  <button
                    type="button"
                    onClick={() => {
                      confirmRemoveImage(() => {
                        setBannerFile(null);
                        setBannerPreview(null);
                        const input = document.getElementById("banner-file-input") as HTMLInputElement;
                        if (input) input.value = "";
                      });
                    }}
                    className="px-4 py-2 bg-hidden/15 text-hidden hover:bg-hidden hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {isBn ? "রিমুভ" : "Remove"}
                  </button>
                ) : (
                  <label
                    htmlFor="banner-file-input"
                    className="px-4 py-2 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer inline-block"
                  >
                    {isBn ? "ছবি আপলোড" : "Upload"}
                  </label>
                )}
              </div>
              <div className="space-y-1 pt-1">
                <p className="text-[11px] font-semibold text-foreground/80">
                  <span className="opacity-60">{isBn ? "প্রস্তাবিত সাইজ:" : "Recommended size:"} </span>
                  <span className="font-bold text-foreground">1907 × 186 px</span>
                  <span className="opacity-50"> {isBn ? "বা" : "or"} </span>
                  <span className="font-bold text-foreground">1920 × 186 px</span>
                </p>
                <p className="text-[10px] text-foreground/50 leading-normal">
                  {isBn
                    ? "অনুপাত প্রায় ১০:১ (প্রস্থ কমপক্ষে ১২০০ পিক্সেল)। ফর্ম্যাট: PNG, JPG, WEBP।"
                    : "Slim banner strip (~10:1 ratio, min width 1200px). Supported: PNG, JPG, WEBP."}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "ব্যানার URL" : "Banner Target URL"}</span>
                {renderCharCounter(formData.top_banner_link.length, 255)}
              </label>
              <input
                type="text"
                maxLength={255}
                value={formData.top_banner_link}
                onChange={(e) => handleFieldChange("top_banner_link", e.target.value)}
                placeholder="/gift-cards or /products or https://..."
                className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. HERO SECTION & TYPOGRAPHY */}
      <div className="bg-secondary p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm space-y-6">
        <div className="border-b border-foreground/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
                {isBn ? "হিরো সেকশন ও টেক্সট কন্ট্রোল (Hero Section & Texts)" : "Hero Section & Texts"}
              </h2>
            </div>
            <p className="text-xs opacity-70 mt-1">
              {isBn
                ? "হোমপেজের প্রধান শিরোনাম, ঘূর্ণায়মান শব্দমালা এবং বিবরণ সরাসরি পরিবর্তন করুন।"
                : "Customize the primary hero headline, rotating animated keywords, subtitles, and CTA buttons."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoTranslateAllHero}
            disabled={batchTranslatingHero}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent/10 hover:bg-accent text-accent hover:text-white dark:hover:text-black text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
            title="Auto-translate all empty Hero Bangla fields from English"
          >
            {batchTranslatingHero ? "Translating..." : "✨ Auto-Fill Hero Bangla with AI"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Hero Badge (EN & BN) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "ছোট ব্যাজ টেক্সট (English)" : "Hero Badge Label (EN)"}</span>
              {renderCharCounter(formData.hero_badge.length, 30)}
            </label>
            <input
              type="text"
              maxLength={30}
              value={formData.hero_badge}
              onChange={(e) => handleFieldChange("hero_badge", e.target.value)}
              placeholder="e.g. New Collection / Limited Drop"
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "ছোট ব্যাজ টেক্সট (বাংলা)" : "Hero Badge Label (BN)"}</span>
              <div className="flex items-center gap-2">
                {renderCharCounter(formData.hero_badge_bn.length, 35)}
                <AutoTranslateButton
                  sourceText={formData.hero_badge}
                  onTranslated={(val) => handleFieldChange("hero_badge_bn", val)}
                />
              </div>
            </label>
            <input
              type="text"
              maxLength={35}
              value={formData.hero_badge_bn}
              onChange={(e) => handleFieldChange("hero_badge_bn", e.target.value)}
              placeholder="যেমনঃ নতুন কালেকশন"
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Hero Title Prefix (EN & BN) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "প্রধান শিরোনামের শুরু (English)" : "Main Title Prefix (EN)"}</span>
              {renderCharCounter(formData.hero_title_prefix.length, 40)}
            </label>
            <input
              type="text"
              maxLength={40}
              value={formData.hero_title_prefix}
              onChange={(e) => handleFieldChange("hero_title_prefix", e.target.value)}
              placeholder="e.g. Elevate Your"
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "প্রধান শিরোনামের শুরু (বাংলা)" : "Main Title Prefix (BN)"}</span>
              <div className="flex items-center gap-2">
                {renderCharCounter(formData.hero_title_prefix_bn.length, 50)}
                <AutoTranslateButton
                  sourceText={formData.hero_title_prefix}
                  onTranslated={(val) => handleFieldChange("hero_title_prefix_bn", val)}
                />
              </div>
            </label>
            <input
              type="text"
              maxLength={50}
              value={formData.hero_title_prefix_bn}
              onChange={(e) => handleFieldChange("hero_title_prefix_bn", e.target.value)}
              placeholder="যেমনঃ উন্নত করুন আপনার"
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Rotating Words English */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "রোটেটিং শব্দমালা (English - কমা দিয়ে আলাদা)" : "Rotating Words (EN - comma separated)"}</span>
              {renderCharCounter(formData.hero_rotating_words.length, 80)}
            </label>
            <input
              type="text"
              maxLength={80}
              value={formData.hero_rotating_words}
              onChange={(e) => handleFieldChange("hero_rotating_words", e.target.value)}
              placeholder="Beauty, Glow, Look, Glam, Charm"
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Rotating Words Bangla */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "রোটেটিং শব্দমালা (বাংলা - কমা দিয়ে আলাদা)" : "Rotating Words (BN - comma separated)"}</span>
              <div className="flex items-center gap-2">
                {renderCharCounter(formData.hero_rotating_words_bn.length, 100)}
                <AutoTranslateButton
                  sourceText={formData.hero_rotating_words}
                  isWordList={true}
                  onTranslated={(val) => handleFieldChange("hero_rotating_words_bn", val)}
                />
              </div>
            </label>
            <input
              type="text"
              maxLength={100}
              value={formData.hero_rotating_words_bn}
              onChange={(e) => handleFieldChange("hero_rotating_words_bn", e.target.value)}
              placeholder="সৌন্দর্য, গ্লো, গ্ল্যামার, চমক, লুক"
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Hero Subtitle English */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "হিরো সাবটাইটেল (English)" : "Hero Subtitle (EN)"}</span>
              {renderCharCounter(formData.hero_subtitle.length, 200)}
            </label>
            <textarea
              rows={2}
              maxLength={200}
              value={formData.hero_subtitle}
              onChange={(e) => handleFieldChange("hero_subtitle", e.target.value)}
              placeholder="Experience the intersection of luxury cosmetics..."
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Hero Subtitle Bangla */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "হিরো সাবটাইটেল (বাংলা)" : "Hero Subtitle (BN)"}</span>
              <div className="flex items-center gap-2">
                {renderCharCounter(formData.hero_subtitle_bn.length, 250)}
                <AutoTranslateButton
                  sourceText={formData.hero_subtitle}
                  onTranslated={(val) => handleFieldChange("hero_subtitle_bn", val)}
                />
              </div>
            </label>
            <textarea
              rows={2}
              maxLength={250}
              value={formData.hero_subtitle_bn}
              onChange={(e) => handleFieldChange("hero_subtitle_bn", e.target.value)}
              placeholder="প্রিমিয়াম কসমেটিকস এবং রূপচর্চার সেরা সমন্বয়..."
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Hero CTA Button Text English & Bangla */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "বাটন টেক্সট (English)" : "Button Text (EN)"}</span>
              {renderCharCounter(formData.hero_btn_text.length, 25)}
            </label>
            <input
              type="text"
              maxLength={25}
              value={formData.hero_btn_text}
              onChange={(e) => handleFieldChange("hero_btn_text", e.target.value)}
              placeholder="Explore Collection"
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "বাটন টেক্সট (বাংলা)" : "Button Text (BN)"}</span>
              <div className="flex items-center gap-2">
                {renderCharCounter(formData.hero_btn_text_bn.length, 35)}
                <AutoTranslateButton
                  sourceText={formData.hero_btn_text}
                  onTranslated={(val) => handleFieldChange("hero_btn_text_bn", val)}
                />
              </div>
            </label>
            <input
              type="text"
              maxLength={35}
              value={formData.hero_btn_text_bn}
              onChange={(e) => handleFieldChange("hero_btn_text_bn", e.target.value)}
              placeholder="কালেকশন দেখুন"
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Hero CTA Button Link */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "বাটন লিংক" : "Button Link URL"}</span>
              {renderCharCounter(formData.hero_btn_link.length, 255)}
            </label>
            <input
              type="text"
              maxLength={255}
              value={formData.hero_btn_link}
              onChange={(e) => handleFieldChange("hero_btn_link", e.target.value)}
              placeholder="/collections"
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Discover Card Settings */}
        <div className="pt-6 border-t border-foreground/10 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-accent">
            {isBn ? "ডিসকভার কার্ড সেটিংস (Discover Card)" : "Discover Card Settings"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Discover Title EN & BN */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "কার্ড টাইটেল (English)" : "Card Title (EN)"}</span>
                {renderCharCounter(formData.discover_title.length, 40)}
              </label>
              <input
                type="text"
                maxLength={40}
                value={formData.discover_title}
                onChange={(e) => handleFieldChange("discover_title", e.target.value)}
                placeholder="Discover the Glam"
                className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "কার্ড টাইটেল (বাংলা)" : "Card Title (BN)"}</span>
                <div className="flex items-center gap-2">
                  {renderCharCounter(formData.discover_title_bn.length, 50)}
                  <AutoTranslateButton
                    sourceText={formData.discover_title}
                    onTranslated={(val) => handleFieldChange("discover_title_bn", val)}
                  />
                </div>
              </label>
              <input
                type="text"
                maxLength={50}
                value={formData.discover_title_bn}
                onChange={(e) => handleFieldChange("discover_title_bn", e.target.value)}
                placeholder="আবিষ্কার করুন সেরা গ্ল্যাম"
                className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Discover Subtitle EN & BN */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "কার্ড বিবরণ (English)" : "Card Description (EN)"}</span>
                {renderCharCounter(formData.discover_subtitle.length, 160)}
              </label>
              <input
                type="text"
                maxLength={160}
                value={formData.discover_subtitle}
                onChange={(e) => handleFieldChange("discover_subtitle", e.target.value)}
                placeholder="Collect exclusive beauty essentials..."
                className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "কার্ড বিবরণ (বাংলা)" : "Card Description (BN)"}</span>
                <div className="flex items-center gap-2">
                  {renderCharCounter(formData.discover_subtitle_bn.length, 200)}
                  <AutoTranslateButton
                    sourceText={formData.discover_subtitle}
                    onTranslated={(val) => handleFieldChange("discover_subtitle_bn", val)}
                  />
                </div>
              </label>
              <input
                type="text"
                maxLength={200}
                value={formData.discover_subtitle_bn}
                onChange={(e) => handleFieldChange("discover_subtitle_bn", e.target.value)}
                placeholder="এক্সক্লুসিভ মেকআপ ও স্কিনকেয়ার সামগ্রী..."
                className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Discover Button Text EN & BN */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "বাটন টেক্সট (English)" : "Button Text (EN)"}</span>
                {renderCharCounter(formData.discover_btn_text.length, 25)}
              </label>
              <input
                type="text"
                maxLength={25}
                value={formData.discover_btn_text}
                onChange={(e) => handleFieldChange("discover_btn_text", e.target.value)}
                placeholder="View Exclusives"
                className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "বাটন টেক্সট (বাংলা)" : "Button Text (BN)"}</span>
                <div className="flex items-center gap-2">
                  {renderCharCounter(formData.discover_btn_text_bn.length, 35)}
                  <AutoTranslateButton
                    sourceText={formData.discover_btn_text}
                    onTranslated={(val) => handleFieldChange("discover_btn_text_bn", val)}
                  />
                </div>
              </label>
              <input
                type="text"
                maxLength={35}
                value={formData.discover_btn_text_bn}
                onChange={(e) => handleFieldChange("discover_btn_text_bn", e.target.value)}
                placeholder="আকর্ষণীয় পণ্য দেখুন"
                className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Discover Button Link */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "বাটন লিংক" : "Button URL"}</span>
                {renderCharCounter(formData.discover_btn_link.length, 255)}
              </label>
              <input
                type="text"
                maxLength={255}
                value={formData.discover_btn_link}
                onChange={(e) => handleFieldChange("discover_btn_link", e.target.value)}
                placeholder="/products"
                className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. BENTO GRID TILES MANAGER (6 SLOTS) */}
      <div className="bg-secondary p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm space-y-6">
        <div className="border-b border-foreground/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
                {isBn ? "বেন্টো গ্রিড কার্ডসমূহ (Bento Grid Tiles - ৬টি স্লট)" : "Bento Grid Tiles (6 Slots)"}
              </h2>
            </div>
            <p className="text-xs opacity-70 mt-1">
              {isBn
                ? "হোমপেজের ৪টি ক্যাটাগরি স্লট, ২৪/৭ ড্রপস এবং ফ্রি ডেলিভারি স্লটের ছবি, টাইটেল ও লিংক নিয়ন্ত্রণ করুন।"
                : "Manage titles, links, and custom photos for the 4 category positions, 24/7 drops, and fast delivery tiles."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoTranslateAllBento}
            disabled={batchTranslatingBento}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent/10 hover:bg-accent text-accent hover:text-white dark:hover:text-black text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
            title="Auto-translate all empty Bento Bangla titles from English"
          >
            {batchTranslatingBento ? "Translating..." : "✨ Auto-Fill Bento Bangla with AI"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Slot 1 */}
          <div className="p-5 rounded-2xl border border-foreground/10 bg-primary/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                {isBn ? "স্লট ১" : "Slot 1"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (English)" : "Title (EN)"}</span>
                  {renderCharCounter(formData.bento_tile_1_title.length, 35)}
                </label>
                <input
                  type="text"
                  maxLength={35}
                  value={formData.bento_tile_1_title}
                  onChange={(e) => handleFieldChange("bento_tile_1_title", e.target.value)}
                  placeholder="LIPSTICKS"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (বাংলা)" : "Title (BN)"}</span>
                  <div className="flex items-center gap-2">
                    {renderCharCounter(formData.bento_tile_1_title_bn.length, 45)}
                    <AutoTranslateButton
                      sourceText={formData.bento_tile_1_title}
                      onTranslated={(val) => handleFieldChange("bento_tile_1_title_bn", val)}
                    />
                  </div>
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={formData.bento_tile_1_title_bn}
                  onChange={(e) => handleFieldChange("bento_tile_1_title_bn", e.target.value)}
                  placeholder="যেমনঃ লিপস্টিক"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "সংযুক্ত কালেকশন (আবশ্যক)" : "Linked Collection (Required)"} <span className="text-hidden">*</span>
              </label>
              <select
                required
                value={formData.bento_tile_1_collection}
                onChange={(e) => handleFieldChange("bento_tile_1_collection", e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- {isBn ? "কালেকশন নির্বাচন করুন" : "Select a Collection"} --</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title} (#{col.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "কাস্টম ছবি (আবশ্যক)" : "Custom Photo (Required)"} <span className="text-hidden">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-foreground/25 bg-background flex items-center justify-center overflow-hidden shrink-0">
                  {bento1Preview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={bento1Preview}
                      alt="Slot 1"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-foreground/30 flex items-center justify-center" title="No photo uploaded">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="bento-1-input"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setBento1File(file);
                      setBento1Preview(URL.createObjectURL(file));
                    }
                  }}
                />
                {bento1Preview !== null || bento1File !== null ? (
                  <button
                    type="button"
                    onClick={() => {
                      confirmRemoveImage(() => {
                        setBento1File(null);
                        setBento1Preview(null);
                        const input = document.getElementById("bento-1-input") as HTMLInputElement;
                        if (input) input.value = "";
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-hidden/15 text-hidden hover:bg-hidden hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {isBn ? "রিমুভ" : "Remove"}
                  </button>
                ) : (
                  <label
                    htmlFor="bento-1-input"
                    className="px-3 py-1.5 rounded-lg bg-button-bg text-button-fg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 cursor-pointer"
                  >
                    {isBn ? "ছবি আপলোড" : "Upload"}
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Slot 2 */}
          <div className="p-5 rounded-2xl border border-foreground/10 bg-primary/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                {isBn ? "স্লট ২" : "Slot 2"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (English)" : "Title (EN)"}</span>
                  {renderCharCounter(formData.bento_tile_2_title.length, 35)}
                </label>
                <input
                  type="text"
                  maxLength={35}
                  value={formData.bento_tile_2_title}
                  onChange={(e) => handleFieldChange("bento_tile_2_title", e.target.value)}
                  placeholder="SKINCARE"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (বাংলা)" : "Title (BN)"}</span>
                  <div className="flex items-center gap-2">
                    {renderCharCounter(formData.bento_tile_2_title_bn.length, 45)}
                    <AutoTranslateButton
                      sourceText={formData.bento_tile_2_title}
                      onTranslated={(val) => handleFieldChange("bento_tile_2_title_bn", val)}
                    />
                  </div>
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={formData.bento_tile_2_title_bn}
                  onChange={(e) => handleFieldChange("bento_tile_2_title_bn", e.target.value)}
                  placeholder="যেমনঃ স্কিনকেয়ার"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "সংযুক্ত কালেকশন (আবশ্যক)" : "Linked Collection (Required)"} <span className="text-hidden">*</span>
              </label>
              <select
                required
                value={formData.bento_tile_2_collection}
                onChange={(e) => handleFieldChange("bento_tile_2_collection", e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- {isBn ? "কালেকশন নির্বাচন করুন" : "Select a Collection"} --</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title} (#{col.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "কাস্টম ছবি (আবশ্যক)" : "Custom Photo (Required)"} <span className="text-hidden">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-foreground/25 bg-background flex items-center justify-center overflow-hidden shrink-0">
                  {bento2Preview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={bento2Preview}
                      alt="Slot 2"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-foreground/30 flex items-center justify-center" title="No photo uploaded">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="bento-2-input"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setBento2File(file);
                      setBento2Preview(URL.createObjectURL(file));
                    }
                  }}
                />
                {bento2Preview !== null || bento2File !== null ? (
                  <button
                    type="button"
                    onClick={() => {
                      confirmRemoveImage(() => {
                        setBento2File(null);
                        setBento2Preview(null);
                        const input = document.getElementById("bento-2-input") as HTMLInputElement;
                        if (input) input.value = "";
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-hidden/15 text-hidden hover:bg-hidden hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {isBn ? "রিমুভ" : "Remove"}
                  </button>
                ) : (
                  <label
                    htmlFor="bento-2-input"
                    className="px-3 py-1.5 rounded-lg bg-button-bg text-button-fg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 cursor-pointer"
                  >
                    {isBn ? "ছবি আপলোড" : "Upload"}
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Slot 3 */}
          <div className="p-5 rounded-2xl border border-foreground/10 bg-primary/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                {isBn ? "স্লট ৩" : "Slot 3"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (English)" : "Title (EN)"}</span>
                  {renderCharCounter(formData.bento_tile_3_title.length, 35)}
                </label>
                <input
                  type="text"
                  maxLength={35}
                  value={formData.bento_tile_3_title}
                  onChange={(e) => handleFieldChange("bento_tile_3_title", e.target.value)}
                  placeholder="EYE MAKEUP"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (বাংলা)" : "Title (BN)"}</span>
                  <div className="flex items-center gap-2">
                    {renderCharCounter(formData.bento_tile_3_title_bn.length, 45)}
                    <AutoTranslateButton
                      sourceText={formData.bento_tile_3_title}
                      onTranslated={(val) => handleFieldChange("bento_tile_3_title_bn", val)}
                    />
                  </div>
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={formData.bento_tile_3_title_bn}
                  onChange={(e) => handleFieldChange("bento_tile_3_title_bn", e.target.value)}
                  placeholder="যেমনঃ আই মেকআপ"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "সংযুক্ত কালেকশন (আবশ্যক)" : "Linked Collection (Required)"} <span className="text-hidden">*</span>
              </label>
              <select
                required
                value={formData.bento_tile_3_collection}
                onChange={(e) => handleFieldChange("bento_tile_3_collection", e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- {isBn ? "কালেকশন নির্বাচন করুন" : "Select a Collection"} --</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title} (#{col.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "কাস্টম ছবি (আবশ্যক)" : "Custom Photo (Required)"} <span className="text-hidden">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-foreground/25 bg-background flex items-center justify-center overflow-hidden shrink-0">
                  {bento3Preview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={bento3Preview}
                      alt="Slot 3"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-foreground/30 flex items-center justify-center" title="No photo uploaded">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="bento-3-input"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setBento3File(file);
                      setBento3Preview(URL.createObjectURL(file));
                    }
                  }}
                />
                {bento3Preview !== null || bento3File !== null ? (
                  <button
                    type="button"
                    onClick={() => {
                      confirmRemoveImage(() => {
                        setBento3File(null);
                        setBento3Preview(null);
                        const input = document.getElementById("bento-3-input") as HTMLInputElement;
                        if (input) input.value = "";
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-hidden/15 text-hidden hover:bg-hidden hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {isBn ? "রিমুভ" : "Remove"}
                  </button>
                ) : (
                  <label
                    htmlFor="bento-3-input"
                    className="px-3 py-1.5 rounded-lg bg-button-bg text-button-fg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 cursor-pointer"
                  >
                    {isBn ? "ছবি আপলোড" : "Upload"}
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Slot 4 */}
          <div className="p-5 rounded-2xl border border-foreground/10 bg-primary/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                {isBn ? "স্লট ৪" : "Slot 4"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (English)" : "Title (EN)"}</span>
                  {renderCharCounter(formData.bento_tile_4_title.length, 35)}
                </label>
                <input
                  type="text"
                  maxLength={35}
                  value={formData.bento_tile_4_title}
                  onChange={(e) => handleFieldChange("bento_tile_4_title", e.target.value)}
                  placeholder="FOUNDATION & GLOW"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (বাংলা)" : "Title (BN)"}</span>
                  <div className="flex items-center gap-2">
                    {renderCharCounter(formData.bento_tile_4_title_bn.length, 45)}
                    <AutoTranslateButton
                      sourceText={formData.bento_tile_4_title}
                      onTranslated={(val) => handleFieldChange("bento_tile_4_title_bn", val)}
                    />
                  </div>
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={formData.bento_tile_4_title_bn}
                  onChange={(e) => handleFieldChange("bento_tile_4_title_bn", e.target.value)}
                  placeholder="যেমনঃ ফাউন্ডেশন ও গ্লো"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "সংযুক্ত কালেকশন (আবশ্যক)" : "Linked Collection (Required)"} <span className="text-hidden">*</span>
              </label>
              <select
                required
                value={formData.bento_tile_4_collection}
                onChange={(e) => handleFieldChange("bento_tile_4_collection", e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- {isBn ? "কালেকশন নির্বাচন করুন" : "Select a Collection"} --</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title} (#{col.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "কাস্টম ছবি (আবশ্যক)" : "Custom Photo (Required)"} <span className="text-hidden">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-foreground/25 bg-background flex items-center justify-center overflow-hidden shrink-0">
                  {bento4Preview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={bento4Preview}
                      alt="Slot 4"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-foreground/30 flex items-center justify-center" title="No photo uploaded">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="bento-4-input"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setBento4File(file);
                      setBento4Preview(URL.createObjectURL(file));
                    }
                  }}
                />
                {bento4Preview !== null || bento4File !== null ? (
                  <button
                    type="button"
                    onClick={() => {
                      confirmRemoveImage(() => {
                        setBento4File(null);
                        setBento4Preview(null);
                        const input = document.getElementById("bento-4-input") as HTMLInputElement;
                        if (input) input.value = "";
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-hidden/15 text-hidden hover:bg-hidden hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {isBn ? "রিমুভ" : "Remove"}
                  </button>
                ) : (
                  <label
                    htmlFor="bento-4-input"
                    className="px-3 py-1.5 rounded-lg bg-button-bg text-button-fg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 cursor-pointer"
                  >
                    {isBn ? "ছবি আপলোড" : "Upload"}
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Slot 5 (24/7 Drops) */}
          <div className="p-5 rounded-2xl border border-foreground/10 bg-primary/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                {isBn ? "স্লট ৫" : "Slot 5"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (English - ঐচ্ছিক)" : "Title (EN - Optional)"}</span>
                  {renderCharCounter(formData.bento_tile_247_title.length, 35)}
                </label>
                <input
                  type="text"
                  maxLength={35}
                  value={formData.bento_tile_247_title}
                  onChange={(e) => handleFieldChange("bento_tile_247_title", e.target.value)}
                  placeholder="24/7 GLOBAL DROPS"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (বাংলা - ঐচ্ছিক)" : "Title (BN - Optional)"}</span>
                  <div className="flex items-center gap-2">
                    {renderCharCounter(formData.bento_tile_247_title_bn.length, 45)}
                    <AutoTranslateButton
                      sourceText={formData.bento_tile_247_title}
                      onTranslated={(val) => handleFieldChange("bento_tile_247_title_bn", val)}
                    />
                  </div>
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={formData.bento_tile_247_title_bn}
                  onChange={(e) => handleFieldChange("bento_tile_247_title_bn", e.target.value)}
                  placeholder="যেমনঃ ২৪/৭ গ্লোবাল ড্রপস"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "লক্ষ্য লিঙ্ক (ঐচ্ছিক)" : "Target Link (Optional)"}</span>
                {renderCharCounter(formData.bento_tile_247_link.length, 255)}
              </label>
              <input
                type="text"
                maxLength={255}
                value={formData.bento_tile_247_link}
                onChange={(e) => handleFieldChange("bento_tile_247_link", e.target.value)}
                placeholder="/collections or /products or https://..."
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "কাস্টম ছবি (আবশ্যক)" : "Custom Photo (Required)"} <span className="text-hidden">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-foreground/25 bg-background flex items-center justify-center overflow-hidden shrink-0">
                  {bento247Preview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={bento247Preview}
                      alt="24/7 Drops"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-foreground/30 flex items-center justify-center" title="No photo uploaded">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="bento-247-input"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setBento247File(file);
                      setBento247Preview(URL.createObjectURL(file));
                    }
                  }}
                />
                {bento247Preview !== null || bento247File !== null ? (
                  <button
                    type="button"
                    onClick={() => {
                      confirmRemoveImage(() => {
                        setBento247File(null);
                        setBento247Preview(null);
                        const input = document.getElementById("bento-247-input") as HTMLInputElement;
                        if (input) input.value = "";
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-hidden/15 text-hidden hover:bg-hidden hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {isBn ? "রিমুভ" : "Remove"}
                  </button>
                ) : (
                  <label
                    htmlFor="bento-247-input"
                    className="px-3 py-1.5 rounded-lg bg-button-bg text-button-fg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 cursor-pointer"
                  >
                    {isBn ? "ছবি আপলোড" : "Upload"}
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Slot 6 (Fast Delivery) */}
          <div className="p-5 rounded-2xl border border-foreground/10 bg-primary/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                {isBn ? "স্লট ৬" : "Slot 6"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (English - ঐচ্ছিক)" : "Title (EN - Optional)"}</span>
                  {renderCharCounter(formData.bento_tile_delivery_title.length, 35)}
                </label>
                <input
                  type="text"
                  maxLength={35}
                  value={formData.bento_tile_delivery_title}
                  onChange={(e) => handleFieldChange("bento_tile_delivery_title", e.target.value)}
                  placeholder="Fast Delivery"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (বাংলা - ঐচ্ছিক)" : "Title (BN - Optional)"}</span>
                  <div className="flex items-center gap-2">
                    {renderCharCounter(formData.bento_tile_delivery_title_bn.length, 45)}
                    <AutoTranslateButton
                      sourceText={formData.bento_tile_delivery_title}
                      onTranslated={(val) => handleFieldChange("bento_tile_delivery_title_bn", val)}
                    />
                  </div>
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={formData.bento_tile_delivery_title_bn}
                  onChange={(e) => handleFieldChange("bento_tile_delivery_title_bn", e.target.value)}
                  placeholder="যেমনঃ দ্রুত ডেলিভারি"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "লক্ষ্য লিঙ্ক (ঐচ্ছিক)" : "Target Link (Optional)"}</span>
                {renderCharCounter(formData.bento_tile_delivery_link.length, 255)}
              </label>
              <input
                type="text"
                maxLength={255}
                value={formData.bento_tile_delivery_link}
                onChange={(e) => handleFieldChange("bento_tile_delivery_link", e.target.value)}
                placeholder="/shipping or /products or https://..."
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "কাস্টম ছবি (আবশ্যক)" : "Custom Photo (Required)"} <span className="text-hidden">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-foreground/25 bg-background flex items-center justify-center overflow-hidden shrink-0">
                  {bentoDeliveryPreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={bentoDeliveryPreview}
                      alt="Delivery Slot"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-foreground/30 flex items-center justify-center" title="No photo uploaded">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id="bento-delivery-input"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setBentoDeliveryFile(file);
                      setBentoDeliveryPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {bentoDeliveryPreview !== null || bentoDeliveryFile !== null ? (
                  <button
                    type="button"
                    onClick={() => {
                      confirmRemoveImage(() => {
                        setBentoDeliveryFile(null);
                        setBentoDeliveryPreview(null);
                        const input = document.getElementById("bento-delivery-input") as HTMLInputElement;
                        if (input) input.value = "";
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-hidden/15 text-hidden hover:bg-hidden hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {isBn ? "রিমুভ" : "Remove"}
                  </button>
                ) : (
                  <label
                    htmlFor="bento-delivery-input"
                    className="px-3 py-1.5 rounded-lg bg-button-bg text-button-fg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 cursor-pointer"
                  >
                    {isBn ? "ছবি আপলোড" : "Upload"}
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION: MARQUEE ANNOUNCEMENT TICKER                         */}
      {/* ============================================================ */}
      <div className="bg-secondary rounded-2xl border border-foreground/10 p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {isBn ? "মারকুই ব্যানার সেটিংস (Marquee Announcement Ticker)" : "Marquee Announcement Ticker"}
            </h3>
            <p className="text-xs opacity-60 mt-0.5">
              {isBn
                ? "হোমপেজের হিরো সেকশনের নিচে চলমান অ্যানাউন্সমেন্ট টেক্সট নিয়ন্ত্রণ করুন"
                : "Manage the scrolling highlight messages displayed directly below the hero section"}
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() =>
                handleFieldChange("marquee_is_active", !formData.marquee_is_active)
              }
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.marquee_is_active ? "bg-visible" : "bg-hidden/80"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  formData.marquee_is_active ? "translate-x-7" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {formData.marquee_is_active && (
          <div className="space-y-4">
            <div className="text-[11px] font-black uppercase tracking-wider opacity-70">
              {isBn ? "মারকুই মেসেজ তালিকা (Marquee Items List)" : "Marquee Items List"}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.marquee_items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    item.is_active !== false
                      ? "border-foreground/15 bg-primary/5"
                      : "border-foreground/10 bg-foreground/5 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setIconPickerTarget({
                            type: "marquee",
                            index: idx,
                            currentIcon: item.icon || "/icons/check-circle.png",
                            title: `${isBn ? "আইকন পরিবর্তন করুন" : "Change Icon"} - Item ${idx + 1}`,
                          })
                        }
                        title={isBn ? "আইকন পরিবর্তন করতে ক্লিক করুন" : "Click to change icon"}
                        className="w-7 h-7 relative flex items-center justify-center p-0.5 rounded-md bg-secondary border border-foreground/15 hover:border-accent hover:scale-105 transition-all cursor-pointer shadow-xs"
                      >
                        <Image
                          src={item.icon || "/icons/check-circle.png"}
                          alt=""
                          width={20}
                          height={20}
                          unoptimized
                          className="object-contain max-h-5 max-w-5"
                        />
                      </button>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-foreground block">
                          Item {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setIconPickerTarget({
                              type: "marquee",
                              index: idx,
                              currentIcon: item.icon || "/icons/check-circle.png",
                              title: `${isBn ? "আইকন পরিবর্তন করুন" : "Change Icon"} - Item ${idx + 1}`,
                            })
                          }
                          className="text-[10px] text-accent font-bold hover:underline cursor-pointer"
                        >
                          {isBn ? "আইকন পরিবর্তন" : "Change Icon"}
                        </button>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={item.is_active !== false}
                        onChange={(e) =>
                          handleMarqueeItemChange(idx, "is_active", e.target.checked)
                        }
                        className="rounded border-foreground/20 text-accent focus:ring-accent cursor-pointer"
                      />
                      <span className="text-[10px] uppercase tracking-wider opacity-80">
                        {item.is_active !== false
                          ? isBn
                            ? "প্রদর্শিত"
                            : "Visible"
                          : isBn
                            ? "লুকানো"
                            : "Hidden"}
                      </span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                        English Text
                      </label>
                      <input
                        type="text"
                        value={item.text_en || ""}
                        onChange={(e) =>
                          handleMarqueeItemChange(idx, "text_en", e.target.value)
                        }
                        placeholder="Enter message in English..."
                        className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/15 text-xs font-semibold focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                          বাংলা টেক্সট (Bangla Text)
                        </label>
                        <AutoTranslateButton
                          sourceText={item.text_en}
                          onTranslated={(translated) =>
                            handleMarqueeItemChange(idx, "text_bn", translated)
                          }
                        />
                      </div>
                      <input
                        type="text"
                        value={item.text_bn || ""}
                        onChange={(e) =>
                          handleMarqueeItemChange(idx, "text_bn", e.target.value)
                        }
                        placeholder="বাংলা মেসেজ লিখুন..."
                        className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/15 text-xs font-semibold focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION: LIVE STATS & SOCIAL PROOF CARDS                     */}
      {/* ============================================================ */}
      <div className="bg-secondary rounded-2xl border border-foreground/10 p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {isBn ? "লাইভ স্ট্যাটস ও সোশ্যাল প্রুফ কার্ডস (Live Stats & Social Proof Cards)" : "Live Stats & Social Proof Cards"}
            </h3>
            <p className="text-xs opacity-60 mt-0.5">
              {isBn
                ? "হোমপেজের 'Why Choose Us' সেকশনের উপরে অ্যানিমেটেড সংখ্যা, আইকন ও পরিসংখ্যান পরিবর্তন করুন"
                : "Customize the animated numbers, icons, labels, and statistics displayed above Why Choose Us"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold opacity-70">
              {formData.stats_is_active
                ? isBn
                  ? "সক্রিয়"
                  : "Active"
                : isBn
                  ? "নিষ্ক্রিয়"
                  : "Disabled"}
            </span>
            <button
              type="button"
              onClick={() =>
                handleFieldChange("stats_is_active", !formData.stats_is_active)
              }
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.stats_is_active ? "bg-visible" : "bg-hidden/80"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  formData.stats_is_active ? "translate-x-7" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {formData.stats_is_active && (
          <div className="space-y-4">
            <div className="text-[11px] font-black uppercase tracking-wider opacity-70">
              {isBn ? "পরিসংখ্যান কার্ড তালিকা (Stats Cards)" : "Stats Cards Configuration"}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.stats_items.map((stat, idx) => (
                <div
                  key={stat.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    stat.is_active !== false
                      ? "border-foreground/15 bg-primary/5"
                      : "border-foreground/10 bg-foreground/5 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setIconPickerTarget({
                            type: "stats",
                            index: idx,
                            currentIcon: stat.icon || "/icons/star-filled.png",
                            title: `${isBn ? "আইকন পরিবর্তন করুন" : "Change Icon"} - Stat Card ${idx + 1}`,
                          })
                        }
                        title={isBn ? "আইকন পরিবর্তন করতে ক্লিক করুন" : "Click to change icon"}
                        className="w-8 h-8 relative flex items-center justify-center p-0.5 rounded-md bg-secondary border border-foreground/15 hover:border-accent hover:scale-105 transition-all cursor-pointer shadow-xs"
                      >
                        <Image
                          src={stat.icon || "/icons/star-filled.png"}
                          alt=""
                          width={24}
                          height={24}
                          unoptimized
                          className="object-contain max-h-6 max-w-6"
                        />
                      </button>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-foreground block">
                          Stat Card {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setIconPickerTarget({
                              type: "stats",
                              index: idx,
                              currentIcon: stat.icon || "/icons/star-filled.png",
                              title: `${isBn ? "আইকন পরিবর্তন করুন" : "Change Icon"} - Stat Card ${idx + 1}`,
                            })
                          }
                          className="text-[10px] text-accent font-bold hover:underline cursor-pointer"
                        >
                          {isBn ? "আইকন পরিবর্তন" : "Change Icon"}
                        </button>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={stat.is_active !== false}
                        onChange={(e) =>
                          handleStatItemChange(idx, "is_active", e.target.checked)
                        }
                        className="rounded border-foreground/20 text-accent focus:ring-accent cursor-pointer"
                      />
                      <span className="text-[10px] uppercase tracking-wider opacity-80">
                        {stat.is_active !== false
                          ? isBn
                            ? "প্রদর্শিত"
                            : "Visible"
                          : isBn
                            ? "লুকানো"
                            : "Hidden"}
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                        Target Value
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={stat.target ?? 0}
                        onChange={(e) =>
                          handleStatItemChange(idx, "target", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/15 text-xs font-semibold focus:outline-none focus:border-accent font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                        Suffix (+, %, ★, etc.)
                      </label>
                      <input
                        type="text"
                        value={stat.suffix || ""}
                        onChange={(e) =>
                          handleStatItemChange(idx, "suffix", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/15 text-xs font-semibold focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                        English Label
                      </label>
                      <input
                        type="text"
                        value={stat.labelEn || ""}
                        onChange={(e) =>
                          handleStatItemChange(idx, "labelEn", e.target.value)
                        }
                        placeholder="e.g. Happy Customers"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/15 text-xs font-semibold focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                          বাংলা লেবেল (Bangla Label)
                        </label>
                        <AutoTranslateButton
                          sourceText={stat.labelEn}
                          onTranslated={(translated) =>
                            handleStatItemChange(idx, "labelBn", translated)
                          }
                        />
                      </div>
                      <input
                        type="text"
                        value={stat.labelBn || ""}
                        onChange={(e) =>
                          handleStatItemChange(idx, "labelBn", e.target.value)
                        }
                        placeholder="যেমনঃ সন্তুষ্ট কাস্টমার"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/15 text-xs font-semibold focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                        English Subtitle / Note
                      </label>
                      <input
                        type="text"
                        value={stat.subEn || ""}
                        onChange={(e) =>
                          handleStatItemChange(idx, "subEn", e.target.value)
                        }
                        placeholder="e.g. Loved nationwide"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/15 text-xs font-semibold focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                          বাংলা সাবটাইটেল (Bangla Subtitle)
                        </label>
                        <AutoTranslateButton
                          sourceText={stat.subEn}
                          onTranslated={(translated) =>
                            handleStatItemChange(idx, "subBn", translated)
                          }
                        />
                      </div>
                      <input
                        type="text"
                        value={stat.subBn || ""}
                        onChange={(e) =>
                          handleStatItemChange(idx, "subBn", e.target.value)
                        }
                        placeholder="যেমনঃ দেশজুড়ে বিশ্বস্ত"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/15 text-xs font-semibold focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION: WHY CHOOSE US FEATURE CARDS                         */}
      {/* ============================================================ */}
      <div className="bg-secondary rounded-2xl border border-foreground/10 p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {isBn ? "কেন আমাদের নির্বাচন করবেন? (Why Choose Us Cards)" : "Why Choose Us Cards"}
            </h3>
            <p className="text-xs opacity-60 mt-0.5">
              {isBn
                ? "হোমপেজের ৩টি প্রধান ফিচার কার্ডের আইকন, টাইটেল ও বিবরণ পরিবর্তন করুন"
                : "Customize the icons, titles, and descriptions of the 3 feature highlight cards"}
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() =>
                handleFieldChange("why_us_is_active", !formData.why_us_is_active)
              }
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.why_us_is_active ? "bg-visible" : "bg-hidden/80"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  formData.why_us_is_active ? "translate-x-7" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {formData.why_us_is_active && (
          <div className="space-y-4">
            <div className="text-[11px] font-black uppercase tracking-wider opacity-70">
              {isBn ? "ফিচার কার্ড তালিকা (Feature Cards)" : "Feature Cards Configuration"}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.why_us_items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    item.is_active !== false
                      ? "border-foreground/15 bg-primary/5"
                      : "border-foreground/10 bg-foreground/5 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setIconPickerTarget({
                            type: "why_us",
                            index: idx,
                            currentIcon: item.icon || "/icons/truck.png",
                            title: `${isBn ? "আইকন পরিবর্তন করুন" : "Change Icon"} - Feature Card ${idx + 1}`,
                          })
                        }
                        title={isBn ? "আইকন পরিবর্তন করতে ক্লিক করুন" : "Click to change icon"}
                        className="w-9 h-9 relative flex items-center justify-center p-1 rounded-xl bg-secondary border border-foreground/15 hover:border-accent hover:scale-105 transition-all cursor-pointer shadow-xs"
                      >
                        <Image
                          src={item.icon || "/icons/truck.png"}
                          alt=""
                          width={28}
                          height={28}
                          unoptimized
                          className="object-contain max-h-7 max-w-7"
                        />
                      </button>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-foreground block">
                          Card {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setIconPickerTarget({
                              type: "why_us",
                              index: idx,
                              currentIcon: item.icon || "/icons/truck.png",
                              title: `${isBn ? "আইকন পরিবর্তন করুন" : "Change Icon"} - Feature Card ${idx + 1}`,
                            })
                          }
                          className="text-[10px] text-accent font-bold hover:underline cursor-pointer"
                        >
                          {isBn ? "আইকন পরিবর্তন" : "Change Icon"}
                        </button>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={item.is_active !== false}
                        onChange={(e) =>
                          handleWhyUsItemChange(idx, "is_active", e.target.checked)
                        }
                        className="rounded border-foreground/20 text-accent focus:ring-accent cursor-pointer"
                      />
                      <span className="text-[10px] uppercase tracking-wider opacity-80">
                        {item.is_active !== false
                          ? isBn
                            ? "প্রদর্শিত"
                            : "Visible"
                          : isBn
                            ? "লুকানো"
                            : "Hidden"}
                      </span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                        English Title
                      </label>
                      <input
                        type="text"
                        value={item.titleEn || ""}
                        onChange={(e) =>
                          handleWhyUsItemChange(idx, "titleEn", e.target.value)
                        }
                        placeholder="e.g. Fast Shipping"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/15 text-xs font-semibold focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                          বাংলা টাইটেল (Bangla Title)
                        </label>
                        <AutoTranslateButton
                          sourceText={item.titleEn}
                          onTranslated={(translated) =>
                            handleWhyUsItemChange(idx, "titleBn", translated)
                          }
                        />
                      </div>
                      <input
                        type="text"
                        value={item.titleBn || ""}
                        onChange={(e) =>
                          handleWhyUsItemChange(idx, "titleBn", e.target.value)
                        }
                        placeholder="যেমনঃ দ্রুত শিপিং"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/15 text-xs font-semibold focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                        English Description
                      </label>
                      <textarea
                        rows={2}
                        value={item.descEn || ""}
                        onChange={(e) =>
                          handleWhyUsItemChange(idx, "descEn", e.target.value)
                        }
                        placeholder="e.g. Reliable home delivery across BD..."
                        className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/15 text-xs font-semibold focus:outline-none focus:border-accent resize-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                          বাংলা বিবরণ (Bangla Description)
                        </label>
                        <AutoTranslateButton
                          sourceText={item.descEn}
                          onTranslated={(translated) =>
                            handleWhyUsItemChange(idx, "descBn", translated)
                          }
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={item.descBn || ""}
                        onChange={(e) =>
                          handleWhyUsItemChange(idx, "descBn", e.target.value)
                        }
                        placeholder="যেমনঃ নির্ভরযোগ্য ডেলিভারি..."
                        className="w-full px-3 py-2 rounded-lg bg-background border border-foreground/15 text-xs font-semibold focus:outline-none focus:border-accent resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end pt-4 pb-2">
        <button
          type="submit"
          disabled={!hasChanges || saving}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            hasChanges && !saving
              ? "bg-button-bg text-button-fg hover:opacity-90 cursor-pointer shadow-md hover:scale-102"
              : "bg-foreground/15 text-foreground/70 border border-foreground/20 cursor-not-allowed"
          }`}
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>{isBn ? "সংরক্ষণ হচ্ছে..." : "Saving..."}</span>
            </>
          ) : (
            <span>{isBn ? "পরিবর্তন সংরক্ষণ" : "Save Changes"}</span>
          )}
        </button>
      </div>

      {/* REUSABLE ICON PICKER MODAL */}
      {iconPickerTarget && (
        <IconPickerModal
          isOpen={Boolean(iconPickerTarget)}
          currentIcon={iconPickerTarget.currentIcon}
          title={iconPickerTarget.title}
          onSelectIcon={handleApplySelectedIcon}
          onClose={() => setIconPickerTarget(null)}
          isBn={isBn}
        />
      )}
    </form>
  );
}
