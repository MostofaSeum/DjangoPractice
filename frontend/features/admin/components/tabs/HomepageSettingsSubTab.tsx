"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useLanguage } from "@/store/LanguageContext";
import { Collection } from "@/features/admin/types";
import Swal from "sweetalert2";

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
};

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
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/80">
              {formData.top_banner_is_active
                ? isBn
                  ? "ব্যানার সক্রিয়"
                  : "Banner Active"
                : isBn
                ? "ব্যানার লুকায়িত"
                : "Banner Hidden"}
            </span>
            <button
              type="button"
              onClick={() =>
                handleFieldChange("top_banner_is_active", !formData.top_banner_is_active)
              }
              className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer border border-foreground/15 ${
                formData.top_banner_is_active ? "bg-visible" : "bg-hidden/80"
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-secondary shadow-md transition-transform duration-200 ${
                  formData.top_banner_is_active ? "right-0.5" : "left-0.5"
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
                      // Target banner is 1907x150 (~12.71 aspect ratio). Allow sensible range [11.5 - 13.5] and minimum width 1200px
                      const isRatioValid = ratio >= 11.5 && ratio <= 13.5;
                      const isSizeSufficient = width >= 1200 && height >= 80;

                      if (!isRatioValid || !isSizeSufficient) {
                        URL.revokeObjectURL(objectUrl);
                        e.target.value = "";
                        Swal.fire({
                          icon: "error",
                          title: isBn ? "ছবির সাইজ মেলেনি!" : "Invalid Banner Dimensions!",
                          html: isBn
                            ? `<p class="text-sm">আপলোডকৃত ব্যানারের সাইজ: <b>${width} x ${height}px</b>।</p>
                               <p class="text-xs text-foreground/70 mt-2">ব্যানারের সাইজ অবশ্যই <b>১৯০৭ x ১৫০ পিক্সেল</b> (অনুপাত ~১২.৭ : ১) এর অনুরূপ হতে হবে যাতে হোমপেজে ডিজাইন নষ্ট না হয়।</p>`
                            : `<p class="text-sm">Uploaded image dimensions: <b>${width} x ${height}px</b>.</p>
                               <p class="text-xs text-foreground/70 mt-2">Banner must match the site banner size of <b>1907 x 150 px</b> (aspect ratio ~12.7:1) to maintain proper layout fit.</p>`,
                        });
                        return;
                      }

                      setBannerFile(file);
                      setBannerPreview(objectUrl);
                    };

                    img.onerror = () => {
                      URL.revokeObjectURL(objectUrl);
                      e.target.value = "";
                      Swal.fire({
                        icon: "error",
                        title: isBn ? "ত্রুটি" : "Error",
                        text: isBn ? "ছবি লোড করতে ব্যর্থ হয়েছে।" : "Failed to load image file.",
                      });
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
              <p className="text-[10px] font-semibold text-foreground/70">
                {isBn
                  ? "বাধ্যতামূলক সাইজ: ১৯০৭ x ১৫০ পিক্সেল (অনুপাত ১২.৭ : ১) (PNG/JPG/WEBP)"
                  : "Required size: 1907 x 150 pixels (aspect ratio ~12.7:1) (PNG/JPG/WEBP)"}
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "ব্যানার URL" : "Banner Target URL"}
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
        <div className="border-b border-foreground/10 pb-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Hero Badge (EN & BN) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "ছোট ব্যাজ টেক্সট (English)" : "Hero Badge Label (EN)"}</span>
              <span className="text-[9px] font-mono opacity-50">{formData.hero_badge.length}/30</span>
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
            <label className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>{isBn ? "ছোট ব্যাজ টেক্সট (বাংলা)" : "Hero Badge Label (BN)"}</span>
              <span className="text-[9px] font-mono opacity-60">{formData.hero_badge_bn.length}/35</span>
            </label>
            <input
              type="text"
              maxLength={35}
              value={formData.hero_badge_bn}
              onChange={(e) => handleFieldChange("hero_badge_bn", e.target.value)}
              placeholder="যেমনঃ নতুন কালেকশন"
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Hero Title Prefix (EN & BN) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "প্রধান শিরোনামের শুরু (English)" : "Main Title Prefix (EN)"}</span>
              <span className="text-[9px] font-mono opacity-50">{formData.hero_title_prefix.length}/40</span>
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
            <label className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>{isBn ? "প্রধান শিরোনামের শুরু (বাংলা)" : "Main Title Prefix (BN)"}</span>
              <span className="text-[9px] font-mono opacity-60">{formData.hero_title_prefix_bn.length}/50</span>
            </label>
            <input
              type="text"
              maxLength={50}
              value={formData.hero_title_prefix_bn}
              onChange={(e) => handleFieldChange("hero_title_prefix_bn", e.target.value)}
              placeholder="যেমনঃ উন্নত করুন আপনার"
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Rotating Words English */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "রোটেটিং শব্দমালা (English - কমা দিয়ে আলাদা)" : "Rotating Words (EN - comma separated)"}</span>
              <span className="text-[9px] font-mono opacity-50">{formData.hero_rotating_words.length}/80</span>
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
            <label className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>{isBn ? "রোটেটিং শব্দমালা (বাংলা - কমা দিয়ে আলাদা)" : "Rotating Words (BN - comma separated)"}</span>
              <span className="text-[9px] font-mono opacity-60">{formData.hero_rotating_words_bn.length}/100</span>
            </label>
            <input
              type="text"
              maxLength={100}
              value={formData.hero_rotating_words_bn}
              onChange={(e) => handleFieldChange("hero_rotating_words_bn", e.target.value)}
              placeholder="সৌন্দর্য, গ্লো, গ্ল্যামার, চমক, লুক"
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Hero Subtitle English */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "হিরো সাবটাইটেল (English)" : "Hero Subtitle (EN)"}</span>
              <span className="text-[9px] font-mono opacity-50">{formData.hero_subtitle.length}/200</span>
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
            <label className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>{isBn ? "হিরো সাবটাইটেল (বাংলা)" : "Hero Subtitle (BN)"}</span>
              <span className="text-[9px] font-mono opacity-60">{formData.hero_subtitle_bn.length}/250</span>
            </label>
            <textarea
              rows={2}
              maxLength={250}
              value={formData.hero_subtitle_bn}
              onChange={(e) => handleFieldChange("hero_subtitle_bn", e.target.value)}
              placeholder="প্রিমিয়াম কসমেটিকস এবং রূপচর্চার সেরা সমন্বয়..."
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Hero CTA Button Text English & Bangla */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
              <span>{isBn ? "বাটন টেক্সট (English)" : "Button Text (EN)"}</span>
              <span className="text-[9px] font-mono opacity-50">{formData.hero_btn_text.length}/25</span>
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
            <label className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>{isBn ? "বাটন টেক্সট (বাংলা)" : "Button Text (BN)"}</span>
              <span className="text-[9px] font-mono opacity-60">{formData.hero_btn_text_bn.length}/35</span>
            </label>
            <input
              type="text"
              maxLength={35}
              value={formData.hero_btn_text_bn}
              onChange={(e) => handleFieldChange("hero_btn_text_bn", e.target.value)}
              placeholder="কালেকশন দেখুন"
              className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Hero CTA Button Link */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider opacity-70 block">
              {isBn ? "বাটন লিংক" : "Button Link URL"}
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
                <span className="text-[9px] font-mono opacity-50">{formData.discover_title.length}/40</span>
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
              <label className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>{isBn ? "কার্ড টাইটেল (বাংলা)" : "Card Title (BN)"}</span>
                <span className="text-[9px] font-mono opacity-60">{formData.discover_title_bn.length}/50</span>
              </label>
              <input
                type="text"
                maxLength={50}
                value={formData.discover_title_bn}
                onChange={(e) => handleFieldChange("discover_title_bn", e.target.value)}
                placeholder="আবিষ্কার করুন সেরা গ্ল্যাম"
                className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Discover Subtitle EN & BN */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "কার্ড বিবরণ (English)" : "Card Description (EN)"}</span>
                <span className="text-[9px] font-mono opacity-50">{formData.discover_subtitle.length}/160</span>
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
              <label className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>{isBn ? "কার্ড বিবরণ (বাংলা)" : "Card Description (BN)"}</span>
                <span className="text-[9px] font-mono opacity-60">{formData.discover_subtitle_bn.length}/200</span>
              </label>
              <input
                type="text"
                maxLength={200}
                value={formData.discover_subtitle_bn}
                onChange={(e) => handleFieldChange("discover_subtitle_bn", e.target.value)}
                placeholder="এক্সক্লুসিভ মেকআপ ও স্কিনকেয়ার সামগ্রী..."
                className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Discover Button Text EN & BN */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{isBn ? "বাটন টেক্সট (English)" : "Button Text (EN)"}</span>
                <span className="text-[9px] font-mono opacity-50">{formData.discover_btn_text.length}/25</span>
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
              <label className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>{isBn ? "বাটন টেক্সট (বাংলা)" : "Button Text (BN)"}</span>
                <span className="text-[9px] font-mono opacity-60">{formData.discover_btn_text_bn.length}/35</span>
              </label>
              <input
                type="text"
                maxLength={35}
                value={formData.discover_btn_text_bn}
                onChange={(e) => handleFieldChange("discover_btn_text_bn", e.target.value)}
                placeholder="আকর্ষণীয় পণ্য দেখুন"
                className="w-full px-3.5 py-2 rounded-xl bg-primary/5 dark:bg-primary/20 border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Discover Button Link */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "বাটন লিংক" : "Button URL"}
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
        <div className="border-b border-foreground/10 pb-4">
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
                  <span className="text-[9px] font-mono opacity-50">{formData.bento_tile_1_title.length}/35</span>
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
                <label className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (বাংলা)" : "Title (BN)"}</span>
                  <span className="text-[9px] font-mono opacity-60">{formData.bento_tile_1_title_bn.length}/45</span>
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={formData.bento_tile_1_title_bn}
                  onChange={(e) => handleFieldChange("bento_tile_1_title_bn", e.target.value)}
                  placeholder="যেমনঃ লিপস্টিক"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "সংযুক্ত কালেকশন" : "Linked Collection"}
              </label>
              <select
                value={formData.bento_tile_1_collection}
                onChange={(e) => handleFieldChange("bento_tile_1_collection", e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- {isBn ? "ডিফল্ট কালেকশন (/collections/3)" : "Default (/collections/3)"} --</option>
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
                  <span className="text-[9px] font-mono opacity-50">{formData.bento_tile_2_title.length}/35</span>
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
                <label className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (বাংলা)" : "Title (BN)"}</span>
                  <span className="text-[9px] font-mono opacity-60">{formData.bento_tile_2_title_bn.length}/45</span>
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={formData.bento_tile_2_title_bn}
                  onChange={(e) => handleFieldChange("bento_tile_2_title_bn", e.target.value)}
                  placeholder="যেমনঃ স্কিনকেয়ার"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "সংযুক্ত কালেকশন" : "Linked Collection"}
              </label>
              <select
                value={formData.bento_tile_2_collection}
                onChange={(e) => handleFieldChange("bento_tile_2_collection", e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- {isBn ? "ডিফল্ট কালেকশন (/collections/4)" : "Default (/collections/4)"} --</option>
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
                  <span className="text-[9px] font-mono opacity-50">{formData.bento_tile_3_title.length}/35</span>
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
                <label className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (বাংলা)" : "Title (BN)"}</span>
                  <span className="text-[9px] font-mono opacity-60">{formData.bento_tile_3_title_bn.length}/45</span>
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={formData.bento_tile_3_title_bn}
                  onChange={(e) => handleFieldChange("bento_tile_3_title_bn", e.target.value)}
                  placeholder="যেমনঃ আই মেকআপ"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "সংযুক্ত কালেকশন" : "Linked Collection"}
              </label>
              <select
                value={formData.bento_tile_3_collection}
                onChange={(e) => handleFieldChange("bento_tile_3_collection", e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- {isBn ? "ডিফল্ট কালেকশন (/collections/6)" : "Default (/collections/6)"} --</option>
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
                  <span className="text-[9px] font-mono opacity-50">{formData.bento_tile_4_title.length}/35</span>
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
                <label className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (বাংলা)" : "Title (BN)"}</span>
                  <span className="text-[9px] font-mono opacity-60">{formData.bento_tile_4_title_bn.length}/45</span>
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={formData.bento_tile_4_title_bn}
                  onChange={(e) => handleFieldChange("bento_tile_4_title_bn", e.target.value)}
                  placeholder="যেমনঃ ফাউন্ডেশন ও গ্লো"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "সংযুক্ত কালেকশন" : "Linked Collection"}
              </label>
              <select
                value={formData.bento_tile_4_collection}
                onChange={(e) => handleFieldChange("bento_tile_4_collection", e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-background border border-foreground/15 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- {isBn ? "ডিফল্ট কালেকশন (/collections/5)" : "Default (/collections/5)"} --</option>
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
                  <span className="text-[9px] font-mono opacity-50">{formData.bento_tile_247_title.length}/35</span>
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
                <label className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (বাংলা - ঐচ্ছিক)" : "Title (BN - Optional)"}</span>
                  <span className="text-[9px] font-mono opacity-60">{formData.bento_tile_247_title_bn.length}/45</span>
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={formData.bento_tile_247_title_bn}
                  onChange={(e) => handleFieldChange("bento_tile_247_title_bn", e.target.value)}
                  placeholder="যেমনঃ ২৪/৭ গ্লোবাল ড্রপস"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "লক্ষ্য লিঙ্ক (ঐচ্ছিক)" : "Target Link (Optional)"}
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
                  <span className="text-[9px] font-mono opacity-50">{formData.bento_tile_delivery_title.length}/35</span>
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
                <label className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>{isBn ? "টাইটেল (বাংলা - ঐচ্ছিক)" : "Title (BN - Optional)"}</span>
                  <span className="text-[9px] font-mono opacity-60">{formData.bento_tile_delivery_title_bn.length}/45</span>
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={formData.bento_tile_delivery_title_bn}
                  onChange={(e) => handleFieldChange("bento_tile_delivery_title_bn", e.target.value)}
                  placeholder="যেমনঃ দ্রুত ডেলিভারি"
                  className="w-full px-3 py-1.5 rounded-xl bg-background border border-emerald-500/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                {isBn ? "লক্ষ্য লিঙ্ক (ঐচ্ছিক)" : "Target Link (Optional)"}
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
    </form>
  );
}
