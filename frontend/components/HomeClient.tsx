"use client";

import Image from "next/image";
import Link from "next/link";
import AnimatedWord from "@/components/ui/AnimatedWord";
import JoinTheClub from "@/components/ui/JoinTheClub";
import AddToCartButton from "@/features/products/components/AddToCartButton";
import ProductImage from "@/components/ui/ProductImage";
import ProductDeliveryOfferBadge from "@/components/ProductDeliveryOfferBadge";
import ScrollReveal from "@/components/ui/ScrollReveal";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { DEFAULT_WHY_US_ITEMS, WhyUsItemConfig } from "@/features/admin/components/tabs/HomepageSettingsSubTab";
import { useLanguage } from "@/store/LanguageContext";
import { Product } from "@/types/product";

interface Collection {
  id: number;
  title: string;
  image?: string | null;
}

interface HomeClientProps {
  trendingProducts: Product[];
  featuredCollections: Collection[];
  siteSettings?: any;
  apiBaseUrl: string;
}

export default function HomeClient({
  trendingProducts,
  featuredCollections,
  siteSettings,
  apiBaseUrl,
}: HomeClientProps) {
  const { t, formatCurrency, locale } = useLanguage();

  const getMediaUrl = (url?: string | null, fallback: string = "") => {
    if (!url) return fallback;
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      return url;
    }
    // If it's already an external absolute URL
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // Normalize relative backend URLs to local /media proxy so they never break cross-origin or port mismatches
    const mediaIdx = url.indexOf("/media/");
    if (mediaIdx !== -1) {
      return url.slice(mediaIdx);
    }
    return `/media/${url.replace(/^\/+/, "")}`;
  };

  const getCollectionImageUrl = (col: Collection) => {
    if (col.image) {
      return getMediaUrl(col.image);
    }
    return null;
  };

  const isBn = locale === "bn";

  // Top Promotional Banner dynamic settings
  const isBannerActive = siteSettings ? siteSettings.top_banner_is_active !== false : true;
  const bannerImage = siteSettings?.top_banner_image ? getMediaUrl(siteSettings.top_banner_image) : "";
  const bannerLink = siteSettings?.top_banner_link || "/gift-cards";

  // Hero Section Dynamic Settings
  const heroBadge = isBn
    ? siteSettings?.hero_badge_bn || siteSettings?.hero_badge || t("hero.newCollection")
    : siteSettings?.hero_badge || t("hero.newCollection");

  const heroTitlePrefix = isBn
    ? siteSettings?.hero_title_prefix_bn || siteSettings?.hero_title_prefix || t("hero.elevateYour")
    : siteSettings?.hero_title_prefix || t("hero.elevateYour");

  const heroSubtitle = isBn
    ? siteSettings?.hero_subtitle_bn || siteSettings?.hero_subtitle || t("hero.heroSubtitle")
    : siteSettings?.hero_subtitle || t("hero.heroSubtitle");

  const heroBtnText = isBn
    ? siteSettings?.hero_btn_text_bn || siteSettings?.hero_btn_text || t("hero.exploreCollection")
    : siteSettings?.hero_btn_text || t("hero.exploreCollection");

  const heroBtnLink = siteSettings?.hero_btn_link || "/collections";

  // Rotating words
  const activeRotatingRaw = isBn
    ? siteSettings?.hero_rotating_words_bn || siteSettings?.hero_rotating_words
    : siteSettings?.hero_rotating_words;

  const customRotatingWords = activeRotatingRaw
    ? activeRotatingRaw
        .split(",")
        .map((w: string) => w.trim())
        .filter(Boolean)
    : undefined;

  // Discover Box Dynamic Settings
  const discoverTitle = isBn
    ? siteSettings?.discover_title_bn || siteSettings?.discover_title || t("hero.discoverVibe")
    : siteSettings?.discover_title || t("hero.discoverVibe");

  const discoverSubtitle = isBn
    ? siteSettings?.discover_subtitle_bn || siteSettings?.discover_subtitle || t("hero.discoverSubtitle")
    : siteSettings?.discover_subtitle || t("hero.discoverSubtitle");

  const discoverBtnText = isBn
    ? siteSettings?.discover_btn_text_bn || siteSettings?.discover_btn_text || t("hero.viewExclusives")
    : siteSettings?.discover_btn_text || t("hero.viewExclusives");

  const discoverBtnLink = siteSettings?.discover_btn_link || "/products";

  // Bento Tiles dynamic configuration (only uploaded photos, no hardcoded demo images)
  const bentoTile1 = {
    title: isBn
      ? siteSettings?.bento_tile_1_title_bn || siteSettings?.bento_tile_1_title || ""
      : siteSettings?.bento_tile_1_title || "",
    link: siteSettings?.bento_tile_1_collection ? `/collections/${siteSettings.bento_tile_1_collection}` : "",
    image: siteSettings?.bento_tile_1_image ? getMediaUrl(siteSettings.bento_tile_1_image) : "",
  };

  const bentoTile2 = {
    title: isBn
      ? siteSettings?.bento_tile_2_title_bn || siteSettings?.bento_tile_2_title || ""
      : siteSettings?.bento_tile_2_title || "",
    link: siteSettings?.bento_tile_2_collection ? `/collections/${siteSettings.bento_tile_2_collection}` : "",
    image: siteSettings?.bento_tile_2_image ? getMediaUrl(siteSettings.bento_tile_2_image) : "",
  };

  const bentoTile3 = {
    title: isBn
      ? siteSettings?.bento_tile_3_title_bn || siteSettings?.bento_tile_3_title || ""
      : siteSettings?.bento_tile_3_title || "",
    link: siteSettings?.bento_tile_3_collection ? `/collections/${siteSettings.bento_tile_3_collection}` : "",
    image: siteSettings?.bento_tile_3_image ? getMediaUrl(siteSettings.bento_tile_3_image) : "",
  };

  const bentoTile4 = {
    title: isBn
      ? siteSettings?.bento_tile_4_title_bn || siteSettings?.bento_tile_4_title || ""
      : siteSettings?.bento_tile_4_title || "",
    link: siteSettings?.bento_tile_4_collection ? `/collections/${siteSettings.bento_tile_4_collection}` : "",
    image: siteSettings?.bento_tile_4_image ? getMediaUrl(siteSettings.bento_tile_4_image) : "",
  };

  const bentoTile247 = {
    title: isBn
      ? siteSettings?.bento_tile_247_title_bn || siteSettings?.bento_tile_247_title || ""
      : siteSettings?.bento_tile_247_title || "",
    image: siteSettings?.bento_tile_247_image ? getMediaUrl(siteSettings.bento_tile_247_image) : "",
    link: siteSettings?.bento_tile_247_link || "",
  };

  const bentoTileDelivery = {
    title: isBn
      ? siteSettings?.bento_tile_delivery_title_bn || siteSettings?.bento_tile_delivery_title || ""
      : siteSettings?.bento_tile_delivery_title || "",
    image: siteSettings?.bento_tile_delivery_image ? getMediaUrl(siteSettings.bento_tile_delivery_image) : "",
    link: siteSettings?.bento_tile_delivery_link || "",
  };

  return (
    <div className="min-h-screen pb-24 bg-background text-foreground font-sans transition-colors duration-300 relative overflow-x-hidden">
      {/* Hero Ambient Glow Aura Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[750px] pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-24 left-1/4 w-[500px] md:w-[700px] h-[350px] md:h-[500px] bg-accent/20 dark:bg-accent/15 rounded-full blur-[110px] animate-aura" />
        <div
          className="absolute top-48 right-10 w-[350px] md:w-[550px] h-[300px] md:h-[450px] bg-primary/20 dark:bg-primary/25 rounded-full blur-[100px] animate-aura"
          style={{ animationDelay: "4s" }}
        />
      </div>

      {/* Top Banner Image */}
      {isBannerActive && bannerImage && (
        <ScrollReveal direction="down" delayMs={50}>
          <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 pt-6 relative z-10">
            <Link
              href={bannerLink}
              className="block w-full rounded-[2rem] overflow-hidden shadow-lg border border-foreground/10 group flex justify-center bg-secondary cursor-pointer"
            >
              <Image
                src={bannerImage}
                alt="Special Promotion Banner"
                width={1400}
                height={500}
                priority
                unoptimized
                className="w-full h-auto object-contain rounded-[2rem] group-hover:scale-[1.01] transition-transform duration-500"
              />
            </Link>
          </div>
        </ScrollReveal>
      )}

      {/* Bento Box Hero Section */}
      <ScrollReveal direction="none" delayMs={100}>
        <section className="relative w-full pt-8 pb-10 px-4 md:px-8 max-w-[1400px] mx-auto flex items-center justify-center z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4 md:gap-6 w-full h-full">
            {/* Main Large Bento Item (Text & Main CTA) */}
            <div className="md:col-span-2 md:row-span-2 bg-secondary rounded-[2rem] p-8 md:p-12 flex flex-col justify-center relative overflow-hidden group shadow-sm hover:shadow-xl ambient-border-glow min-h-[360px] md:min-h-0 text-foreground">
            <div className="absolute top-10 right-10 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 pointer-events-none">
              <Image
                src="/icons/star-filled.png"
                alt=""
                width={100}
                height={100}
                unoptimized
                className="object-contain"
              />
            </div>
            <span className="bg-accent/20 text-foreground text-[10px] font-bold px-3 py-1 mb-8 inline-block uppercase tracking-widest rounded-md self-start">
              {heroBadge}
            </span>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tighter mb-6 uppercase z-10">
              {heroTitlePrefix} <br /> <AnimatedWord customWords={customRotatingWords} />
            </h1>
            <p className="text-base font-semibold opacity-90 max-w-sm mb-10 text-foreground leading-relaxed z-10">
              {heroSubtitle}
            </p>
            <div className="flex gap-4 z-10">
              <Link
                href={heroBtnLink}
                className="bg-button-bg text-button-fg px-6 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2 duration-300"
              >
                {heroBtnText}
              </Link>
            </div>
          </div>

          {/* Top Right Bento Item (Discover Card) */}
          <div className="md:col-span-2 md:row-span-1 bg-primary rounded-[2rem] p-8 md:p-10 relative overflow-hidden flex flex-col justify-center group shadow-xl ambient-border-glow min-h-[220px] md:min-h-0">
            <Image
              src="/HomePage/Fashion.jpg"
              alt="Discover"
              fill
              className="object-cover opacity-15 mix-blend-overlay group-hover:opacity-30 group-hover:scale-105 transition-all duration-700"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none"></div>
            <h2 className="text-3xl md:text-4xl font-black mb-3 uppercase tracking-tight relative z-10 text-background dark:text-foreground">
              {discoverTitle}
            </h2>
            <p className="text-sm font-semibold opacity-95 mb-8 leading-relaxed relative z-10 max-w-md text-background dark:text-foreground">
              {discoverSubtitle}
            </p>
            <div className="flex gap-4 relative z-10">
              <Link
                href={discoverBtnLink}
                className="bg-background text-primary dark:bg-accent dark:text-foreground px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all hover:-translate-y-0.5 duration-300 inline-flex justify-center items-center shadow-lg"
              >
                {discoverBtnText}
              </Link>
            </div>
          </div>

          {/* Middle Right Item 1 (Slot 1) */}
          {bentoTile1.link ? (
            <Link
              href={bentoTile1.link}
              className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm flex items-center justify-center group ambient-border-glow min-h-[220px] md:min-h-0 cursor-pointer"
            >
              {bentoTile1.image && (
                <Image
                  src={bentoTile1.image}
                  alt={bentoTile1.title || "Slot 1"}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
              )}
              {bentoTile1.title && (
                <>
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                      {bentoTile1.title}
                    </span>
                  </div>
                </>
              )}
            </Link>
          ) : (
            <div className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm flex items-center justify-center group ambient-border-glow min-h-[220px] md:min-h-0">
              {bentoTile1.image && (
                <Image
                  src={bentoTile1.image}
                  alt={bentoTile1.title || "Slot 1"}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
              )}
              {bentoTile1.title && (
                <>
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                      {bentoTile1.title}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Middle Right Item 2 (Slot 5) */}
          {bentoTile247.link ? (
            <Link
              href={bentoTile247.link}
              className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm flex items-center justify-center group ambient-border-glow min-h-[220px] md:min-h-0 cursor-pointer"
            >
              {bentoTile247.image && (
                <Image
                  src={bentoTile247.image}
                  alt={bentoTile247.title || "Slot 5"}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  unoptimized
                />
              )}
              <div className="absolute inset-0 bg-black/5 dark:bg-black/25 pointer-events-none transition-colors duration-500"></div>
              {bentoTile247.title && (
                <>
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                      {bentoTile247.title}
                    </span>
                  </div>
                </>
              )}
            </Link>
          ) : (
            <div className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm flex items-center justify-center group ambient-border-glow min-h-[220px] md:min-h-0">
              {bentoTile247.image && (
                <Image
                  src={bentoTile247.image}
                  alt={bentoTile247.title || "Slot 5"}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  unoptimized
                />
              )}
              <div className="absolute inset-0 bg-black/5 dark:bg-black/25 pointer-events-none transition-colors duration-500"></div>
              {bentoTile247.title && (
                <>
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                      {bentoTile247.title}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Bottom Row Item 1 (Slot 6) */}
          {bentoTileDelivery.link ? (
            <Link
              href={bentoTileDelivery.link}
              className="md:col-span-1 md:row-span-1 bg-accent/20 rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden group shadow-md ambient-border-glow flex items-end min-h-[220px] md:min-h-0 cursor-pointer"
            >
              {bentoTileDelivery.image && (
                <Image
                  src={bentoTileDelivery.image}
                  alt={bentoTileDelivery.title || "Slot 6"}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  unoptimized
                />
              )}
              {bentoTileDelivery.title && (
                <>
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
                  <div className="group-hover:-translate-y-1 transition-transform duration-500 relative z-20">
                    <div className="text-xl font-black uppercase tracking-tight mb-1 drop-shadow-md">
                      {bentoTileDelivery.title}
                    </div>
                  </div>
                </>
              )}
            </Link>
          ) : (
            <div className="md:col-span-1 md:row-span-1 bg-accent/20 rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden group shadow-md ambient-border-glow flex items-end min-h-[220px] md:min-h-0">
              {bentoTileDelivery.image && (
                <Image
                  src={bentoTileDelivery.image}
                  alt={bentoTileDelivery.title || "Slot 6"}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  unoptimized
                />
              )}
              {bentoTileDelivery.title && (
                <>
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
                  <div className="group-hover:-translate-y-1 transition-transform duration-500 relative z-20">
                    <div className="text-xl font-black uppercase tracking-tight mb-1 drop-shadow-md">
                      {bentoTileDelivery.title}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Bottom Row Item 2 (Slot 2) */}
          {bentoTile2.link ? (
            <Link
              href={bentoTile2.link}
              className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm flex items-center justify-center group ambient-border-glow min-h-[220px] md:min-h-0 cursor-pointer"
            >
              {bentoTile2.image && (
                <Image
                  src={bentoTile2.image}
                  alt={bentoTile2.title || "Slot 2"}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
              )}
              {bentoTile2.title && (
                <>
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                      {bentoTile2.title}
                    </span>
                  </div>
                </>
              )}
            </Link>
          ) : (
            <div className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm flex items-center justify-center group ambient-border-glow min-h-[220px] md:min-h-0">
              {bentoTile2.image && (
                <Image
                  src={bentoTile2.image}
                  alt={bentoTile2.title || "Slot 2"}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
              )}
              {bentoTile2.title && (
                <>
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                      {bentoTile2.title}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Bottom Row Item 3 (Slot 3) */}
          {bentoTile3.link ? (
            <Link
              href={bentoTile3.link}
              className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm flex items-center justify-center group ambient-border-glow min-h-[220px] md:min-h-0 cursor-pointer"
            >
              {bentoTile3.image && (
                <Image
                  src={bentoTile3.image}
                  alt={bentoTile3.title || "Slot 3"}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
              )}
              {bentoTile3.title && (
                <>
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                      {bentoTile3.title}
                    </span>
                  </div>
                </>
              )}
            </Link>
          ) : (
            <div className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm flex items-center justify-center group ambient-border-glow min-h-[220px] md:min-h-0">
              {bentoTile3.image && (
                <Image
                  src={bentoTile3.image}
                  alt={bentoTile3.title || "Slot 3"}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
              )}
              {bentoTile3.title && (
                <>
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                      {bentoTile3.title}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Bottom Row Item 4 (Slot 4) */}
          {bentoTile4.link ? (
            <Link
              href={bentoTile4.link}
              className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm flex items-center justify-center group ambient-border-glow min-h-[220px] md:min-h-0 cursor-pointer"
            >
              {bentoTile4.image && (
                <Image
                  src={bentoTile4.image}
                  alt={bentoTile4.title || "Slot 4"}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
              )}
              {bentoTile4.title && (
                <>
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                      {bentoTile4.title}
                    </span>
                  </div>
                </>
              )}
            </Link>
          ) : (
            <div className="md:col-span-1 md:row-span-1 bg-secondary rounded-[2rem] relative overflow-hidden shadow-sm flex items-center justify-center group ambient-border-glow min-h-[220px] md:min-h-0">
              {bentoTile4.image && (
                <Image
                  src={bentoTile4.image}
                  alt={bentoTile4.title || "Slot 4"}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
              )}
              {bentoTile4.title && (
                <>
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-500"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <span className="text-2xl font-black uppercase tracking-widest text-white group-hover:scale-105 transition-all duration-500 drop-shadow-md">
                      {bentoTile4.title}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>
      </ScrollReveal>


      <main className="pb-12">
        {/* Featured Categories */}
        <ScrollReveal direction="up" delayMs={100}>
          <section className="max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 mt-12 md:mt-20">
            <div className="flex justify-between items-center mb-6 md:mb-8 gap-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight sm:tracking-tighter leading-tight">
                {t("categories.featuredTitle")}
              </h2>
              <Link
                href="/collections"
                className="flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/5 text-foreground border border-foreground/15 hover:bg-primary hover:text-secondary rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest transition-all shadow-sm inline-flex items-center"
              >
                <span>{t("categories.viewAll")}</span>
              </Link>
            </div>

          <div
            className={`grid grid-cols-1 ${featuredCollections.length > 0 ? "lg:grid-cols-3 h-auto lg:h-[600px]" : "grid-cols-1 h-auto"} gap-6`}
          >
            {featuredCollections.length > 0 ? (
              <>
                {/* 1st Collection: Large Card (Col Span 2) */}
                {featuredCollections[0] &&
                  (() => {
                    const imgUrl = getCollectionImageUrl(featuredCollections[0]);
                    return (
                      <Link
                        href={`/collections/${featuredCollections[0].id}`}
                        className="lg:col-span-2 relative rounded-3xl overflow-hidden group cursor-pointer shadow-lg min-h-[400px] bg-secondary flex items-end p-10 border border-foreground/10"
                      >
                        {imgUrl ? (
                          <>
                            <Image
                              src={imgUrl}
                              alt={featuredCollections[0].title}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90" />
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-primary/10 dark:bg-primary/40 flex items-center justify-center text-foreground/40 font-black text-2xl uppercase tracking-widest p-6 text-center">
                            {featuredCollections[0].title}
                          </div>
                        )}
                        <div className="relative z-20 text-foreground transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                          <span className="bg-accent/20 text-foreground text-xs font-bold px-3 py-1 mb-4 inline-block uppercase tracking-widest rounded-md shadow-md">
                            {t("categories.featured")}
                          </span>
                          <h3
                            className={`text-4xl md:text-5xl font-black uppercase tracking-tight drop-shadow-md ${imgUrl ? "text-white" : "text-foreground"}`}
                          >
                            {featuredCollections[0].title}
                          </h3>
                        </div>
                      </Link>
                    );
                  })()}

                {/* 2nd & 3rd Collections: Small Stacked Cards */}
                {featuredCollections.length > 1 && (
                  <div className="flex flex-col gap-6">
                    {featuredCollections.slice(1, 3).map((col) => {
                      const imgUrl = getCollectionImageUrl(col);
                      return (
                        <Link
                          key={col.id}
                          href={`/collections/${col.id}`}
                          className="flex-1 relative rounded-3xl overflow-hidden group cursor-pointer shadow-lg min-h-[250px] bg-secondary flex items-end p-8 border border-foreground/10"
                        >
                          {imgUrl ? (
                            <>
                              <Image
                                src={imgUrl}
                                alt={col.title}
                                fill
                                unoptimized
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90" />
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-primary/10 dark:bg-primary/40 flex items-center justify-center text-foreground/40 font-black text-xl uppercase tracking-widest p-4 text-center">
                              {col.title}
                            </div>
                          )}
                          <div className="relative z-20 text-foreground transform transition-transform duration-500 group-hover:translate-y-[-3px]">
                            <h3
                              className={`text-2xl font-bold uppercase tracking-tight drop-shadow-md ${imgUrl ? "text-white" : "text-foreground"}`}
                            >
                              {col.title}
                            </h3>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-full py-12 text-center text-sm font-bold uppercase tracking-wider opacity-60">
                {t("categories.noCollections")}
              </div>
            )}
          </div>
        </section>
      </ScrollReveal>

      {/* Trending Now */}
      <ScrollReveal direction="up" delayMs={100}>
          <section className="max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 mt-12 md:mt-20">
            <div className="flex justify-between items-center mb-6 md:mb-8 gap-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight sm:tracking-tighter leading-tight">
                {t("trending.title")}
              </h2>
              <Link
                href="/products"
                className="flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/5 text-foreground border border-foreground/15 hover:bg-primary hover:text-secondary rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest transition-all shadow-sm inline-flex items-center"
              >
                <span>{t("trending.viewAll")}</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.length > 0 ? (
                trendingProducts.map((product) => {
                  const activeVariant = (product as any).variants?.find((v: any) => v.is_active !== false);
                  const basePrice = activeVariant?.price_override
                    ? Number(activeVariant.price_override)
                    : Number(product.unit_price || 0);

                  const discountPercent = Number(product.discount_percent || 0);
                  const isExpired = product.discount_valid_until && new Date() > new Date(product.discount_valid_until);
                  const isDiscountActive = product.is_discount_active !== false && !isExpired;

                  let effectivePrice = basePrice;
                  if (activeVariant?.discounted_price !== undefined) {
                    effectivePrice = Number(activeVariant.discounted_price);
                  } else if (product.discounted_price !== undefined) {
                    effectivePrice = Number(product.discounted_price);
                  } else if (discountPercent > 0 && isDiscountActive) {
                    effectivePrice = basePrice * (1 - discountPercent / 100);
                  }

                  const hasDiscount = isDiscountActive && basePrice > effectivePrice;
                  const computedDiscountPercent = hasDiscount
                    ? discountPercent > 0
                      ? discountPercent
                      : Math.round(((basePrice - effectivePrice) / basePrice) * 100)
                    : 0;

                  return (
                    <div
                      key={product.id}
                      className="bg-secondary rounded-2xl p-5 shadow-sm border border-foreground/10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer flex flex-col justify-between shimmer-container"
                    >
                      <Link href={`/products/${product.id}`} className="block">
                        <div className="aspect-square bg-primary/5 dark:bg-primary/40 rounded-xl mb-6 flex items-center justify-center overflow-hidden relative group-hover:scale-[1.02] transition-transform duration-500">
                          {hasDiscount && computedDiscountPercent > 0 && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-accent text-button-fg font-extrabold text-[9px] uppercase tracking-wider shadow-md z-10 flex items-center gap-1">
                              <img
                                src="/discount.png"
                                alt="Discount"
                                className="w-3.5 h-3.5 object-contain brightness-0 invert"
                              />
                              -{locale === "bn" ? Math.round(computedDiscountPercent).toLocaleString("bn-BD") : Math.round(computedDiscountPercent)}% {locale === "bn" ? "ছাড়" : t("trending.off")}
                            </span>
                          )}
                          <ProductImage
                            title={product.title}
                            images={product.images}
                          />

                          {/* Glassmorphic Delivery Offer Badge at Bottom of Image */}
                          <div className="absolute bottom-2.5 left-0 right-0 z-10 pointer-events-none flex justify-center px-2">
                            <ProductDeliveryOfferBadge
                              productId={product.id}
                              collectionId={
                                typeof (product as any).collection === "object" &&
                                (product as any).collection !== null
                                  ? (product as any).collection.id
                                  : (product as any).collection ||
                                    (product as any).collection_id
                              }
                              badgeOnly
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-start gap-1 mb-1">
                          <h4 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                            {product.title}
                          </h4>
                          {Number(product.average_rating || 0) > 0 && (
                            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0 mt-1">
                              <span>★</span>
                              <span>
                                {Number(product.average_rating).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        {Number(product.units_sold || 0) > 0 && (
                          <div className="mb-3">
                            <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">
                              {locale === "bn"
                                ? `${Number(product.units_sold).toLocaleString("bn-BD")} ${locale === "bn" ? "বিক্রিত" : "Sold"}`
                                : `${product.units_sold} Sold`}
                            </span>
                          </div>
                        )}
                      </Link>

                      <div>
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-accent font-bold text-lg">
                            {formatCurrency(effectivePrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs line-through opacity-50 font-bold">
                              {formatCurrency(basePrice)}
                            </span>
                          )}
                        </div>
                        <AddToCartButton
                          productId={product.id}
                          productTitle={product.title}
                          inventory={(product as any).total_inventory ?? product.inventory}
                          variants={(product as any).variants}
                          className="w-full py-3 bg-button-bg text-button-fg rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-sm font-bold uppercase tracking-wider opacity-60">
                  {t("trending.noTrending")}
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>

        {/* Option B: Dynamic Animated Counters (Social Proof Stats) */}
        <ScrollReveal direction="up" delayMs={100}>
          <AnimatedCounter siteSettings={siteSettings} />
        </ScrollReveal>

        {/* Why Choose Us */}
        {(siteSettings?.why_us_is_active ?? true) && (() => {
          let whyUsItems: WhyUsItemConfig[] = DEFAULT_WHY_US_ITEMS;
          if (siteSettings?.why_us_items_json) {
            try {
              const parsed = JSON.parse(siteSettings.why_us_items_json);
              if (Array.isArray(parsed) && parsed.length > 0) {
                whyUsItems = parsed;
              }
            } catch (e) {
              console.error("Failed to parse why_us_items_json", e);
            }
          }
          const activeWhyUsItems = whyUsItems.filter(item => item.is_active !== false);
          if (activeWhyUsItems.length === 0) return null;

          return (
            <ScrollReveal direction="up" delayMs={100}>
              <section className="bg-secondary text-foreground border border-foreground/10 mt-6 md:mt-10 py-14 md:py-16 px-8 md:px-12 rounded-[3rem] mx-4 md:mx-12 lg:mx-20 shadow-2xl transition-colors duration-300">
                <div className="max-w-[1200px] mx-auto">
                  <h2 className="text-3xl font-black text-center mb-10 md:mb-12 uppercase tracking-tighter">
                    {t("whyUs.title")}
                  </h2>
                  <div className={`grid grid-cols-1 md:grid-cols-${Math.min(activeWhyUsItems.length, 3)} gap-10 md:gap-12 text-center`}>
                    {activeWhyUsItems.map((item, idx) => {
                      const title = isBn && item.titleBn ? item.titleBn : item.titleEn;
                      const desc = isBn && item.descBn ? item.descBn : item.descEn;
                      const rotateClass = idx % 2 === 0 ? "rotate-3" : "-rotate-3";

                      return (
                        <div key={item.id || idx} className="flex flex-col items-center group">
                          <div className={`w-16 h-16 md:w-20 md:h-20 bg-accent/20 text-foreground rounded-2xl flex items-center justify-center mb-6 transform ${rotateClass} group-hover:rotate-0 group-hover:scale-110 transition-all duration-300 shadow-md`}>
                            {item.icon ? (
                              <Image
                                src={item.icon}
                                alt={title}
                                width={36}
                                height={36}
                                unoptimized
                                className="object-contain w-8 h-8 md:w-10 md:h-10 transition-transform duration-300 group-hover:scale-110"
                              />
                            ) : (
                              <Image
                                src="/icons/star-filled.png"
                                alt=""
                                width={36}
                                height={36}
                                unoptimized
                                className="object-contain w-8 h-8 md:w-10 md:h-10"
                              />
                            )}
                          </div>
                          <h3 className="text-xl font-black mb-3 uppercase tracking-widest">
                            {title}
                          </h3>
                          <p className="opacity-70 leading-relaxed text-sm font-medium">
                            {desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </ScrollReveal>
          );
        })()}
      </main>

      {/* Join the Club Section */}
      <ScrollReveal direction="up" delayMs={100} className="mb-14 md:mb-16">
        <JoinTheClub />
      </ScrollReveal>
    </div>
  );
}
