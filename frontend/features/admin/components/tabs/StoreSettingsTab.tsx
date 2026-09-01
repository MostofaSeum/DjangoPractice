"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/store/LanguageContext";
import Swal from "sweetalert2";

interface StoreSettingsTabProps {
  apiBase: string;
  token: string | null;
}

interface SiteSettingsState {
  siteTitle: string;
  tagline: string;
  brandDescription: string;
  supportPhone: string;
  supportEmail: string;
  storeAddress: string;
  workingHours: string;
  footerCopyright: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  whatsappNumber: string;
}

const DEFAULT_SETTINGS: SiteSettingsState = {
  siteTitle: "VibeMart",
  tagline: "MAKE-UP STYLE",
  brandDescription:
    "VibeMart is a recognized multi-category fashion and lifestyle store built on the principle of \"best price at the highest quality\". Our collections are curated with premium materials that are durable, stylish, and perfect for your vibe.",
  supportPhone: "+880 1700-000000",
  supportEmail: "support@vibemart.com",
  storeAddress: "Homestead Gulshan Link Tower, 99 Gulshan Badda Link Rd, Dhaka 1212",
  workingHours: "Sat - Thu: 10:00 - 18:00",
  footerCopyright: "© 2026 VIBEMART. ALL RIGHTS RESERVED.",
  facebookUrl: "https://facebook.com",
  instagramUrl: "https://instagram.com",
  youtubeUrl: "https://youtube.com",
  whatsappNumber: "+8801700000000",
};

export default function StoreSettingsTab({ apiBase, token }: StoreSettingsTabProps) {
  const { locale } = useLanguage();
  const isBn = locale === "bn";

  // Initial loaded states (for change detection)
  const [initialSettings, setInitialSettings] = useState<SiteSettingsState>(DEFAULT_SETTINGS);

  // Form states
  const [siteTitle, setSiteTitle] = useState(DEFAULT_SETTINGS.siteTitle);
  const [tagline, setTagline] = useState(DEFAULT_SETTINGS.tagline);
  const [brandDescription, setBrandDescription] = useState(DEFAULT_SETTINGS.brandDescription);
  const [supportPhone, setSupportPhone] = useState(DEFAULT_SETTINGS.supportPhone);
  const [supportEmail, setSupportEmail] = useState(DEFAULT_SETTINGS.supportEmail);
  const [storeAddress, setStoreAddress] = useState(DEFAULT_SETTINGS.storeAddress);
  const [workingHours, setWorkingHours] = useState(DEFAULT_SETTINGS.workingHours);
  const [footerCopyright, setFooterCopyright] = useState(DEFAULT_SETTINGS.footerCopyright);
  const [facebookUrl, setFacebookUrl] = useState(DEFAULT_SETTINGS.facebookUrl);
  const [instagramUrl, setInstagramUrl] = useState(DEFAULT_SETTINGS.instagramUrl);
  const [youtubeUrl, setYoutubeUrl] = useState(DEFAULT_SETTINGS.youtubeUrl);
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_SETTINGS.whatsappNumber);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [initialLogoUrl, setInitialLogoUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch initial settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/store/site-settings/`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const loaded: SiteSettingsState = {
          siteTitle: data.site_title !== undefined && data.site_title !== null ? data.site_title : "VibeMart",
          tagline: data.tagline !== undefined && data.tagline !== null ? data.tagline : "",
          brandDescription: data.brand_description !== undefined && data.brand_description !== null ? data.brand_description : "",
          supportPhone: data.support_phone !== undefined && data.support_phone !== null ? data.support_phone : "",
          supportEmail: data.support_email !== undefined && data.support_email !== null ? data.support_email : "",
          storeAddress: data.store_address !== undefined && data.store_address !== null ? data.store_address : "",
          workingHours: data.working_hours !== undefined && data.working_hours !== null ? data.working_hours : "",
          footerCopyright: data.footer_copyright !== undefined && data.footer_copyright !== null ? data.footer_copyright : "",
          facebookUrl: data.facebook_url !== undefined && data.facebook_url !== null ? data.facebook_url : "",
          instagramUrl: data.instagram_url !== undefined && data.instagram_url !== null ? data.instagram_url : "",
          youtubeUrl: data.youtube_url !== undefined && data.youtube_url !== null ? data.youtube_url : "",
          whatsappNumber: data.whatsapp_number !== undefined && data.whatsapp_number !== null ? data.whatsapp_number : "",
        };

        setInitialSettings(loaded);
        setSiteTitle(loaded.siteTitle);
        setTagline(loaded.tagline);
        setBrandDescription(loaded.brandDescription);
        setSupportPhone(loaded.supportPhone);
        setSupportEmail(loaded.supportEmail);
        setStoreAddress(loaded.storeAddress);
        setWorkingHours(loaded.workingHours);
        setFooterCopyright(loaded.footerCopyright);
        setFacebookUrl(loaded.facebookUrl);
        setInstagramUrl(loaded.instagramUrl);
        setYoutubeUrl(loaded.youtubeUrl);
        setWhatsappNumber(loaded.whatsappNumber);

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
  };

  useEffect(() => {
    fetchSettings();
  }, [apiBase]);

  // Check if any change has been made
  const hasChanges = useMemo(() => {
    if (logoFile !== null) return true;
    if (logoPreview !== initialLogoUrl) return true;
    if (siteTitle !== initialSettings.siteTitle) return true;
    if (tagline !== initialSettings.tagline) return true;
    if (brandDescription !== initialSettings.brandDescription) return true;
    if (supportPhone !== initialSettings.supportPhone) return true;
    if (supportEmail !== initialSettings.supportEmail) return true;
    if (storeAddress !== initialSettings.storeAddress) return true;
    if (workingHours !== initialSettings.workingHours) return true;
    if (footerCopyright !== initialSettings.footerCopyright) return true;
    if (facebookUrl !== initialSettings.facebookUrl) return true;
    if (instagramUrl !== initialSettings.instagramUrl) return true;
    if (youtubeUrl !== initialSettings.youtubeUrl) return true;
    if (whatsappNumber !== initialSettings.whatsappNumber) return true;
    return false;
  }, [
    logoFile,
    logoPreview,
    initialLogoUrl,
    siteTitle,
    tagline,
    brandDescription,
    supportPhone,
    supportEmail,
    storeAddress,
    workingHours,
    footerCopyright,
    facebookUrl,
    instagramUrl,
    youtubeUrl,
    whatsappNumber,
    initialSettings,
  ]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
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
      formData.append("tagline", tagline);
      formData.append("brand_description", brandDescription);
      formData.append("support_phone", supportPhone);
      formData.append("support_email", supportEmail);
      formData.append("store_address", storeAddress);
      formData.append("working_hours", workingHours);
      formData.append("footer_copyright", footerCopyright);
      formData.append("facebook_url", facebookUrl);
      formData.append("instagram_url", instagramUrl);
      formData.append("youtube_url", youtubeUrl);
      formData.append("whatsapp_number", whatsappNumber);

      if (logoFile) {
        formData.append("logo", logoFile);
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
          tagline,
          brandDescription,
          supportPhone,
          supportEmail,
          storeAddress,
          workingHours,
          footerCopyright,
          facebookUrl,
          instagramUrl,
          youtubeUrl,
          whatsappNumber,
        };
        setInitialSettings(updated);
        if (data.logo) {
          setInitialLogoUrl(data.logo);
          setLogoPreview(data.logo);
        }
        setLogoFile(null);

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isBn ? "সেটিংস সফলভাবে সংরক্ষিত হয়েছে!" : "Store settings updated successfully!",
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
    <form onSubmit={handleSaveSettings} className="space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Logo Upload & Brand Identity */}
        <div className="space-y-6">
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
                className="w-full py-2 text-xs font-bold text-red-500 hover:underline text-center cursor-pointer"
              >
                {isBn ? "লোগো রিমুভ করুন" : "Clear preview"}
              </button>
            )}
          </div>

          {/* Website Title, Tagline & Philosophy */}
          <div className="bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                {isBn ? "ব্র্যান্ড ও পরিচয়" : "Brand & Identity"}
              </h2>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                {isBn ? "ওয়েবসাইটের নাম / টাইটেল" : "Website Title"}
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
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                {isBn ? "ট্যাগলাইন / স্লোগান" : "Store Tagline / Slogan"}
              </label>
              <input
                type="text"
                maxLength={30}
                value={tagline}
                onChange={(e) => setTagline(e.target.value.slice(0, 30))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                placeholder="e.g. MAKE-UP STYLE"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                {isBn ? "ব্র্যান্ড বিবরণ (ফুটারে প্রদর্শিত)" : "Brand Philosophy (Footer Description)"}
              </label>
              <textarea
                rows={4}
                value={brandDescription}
                onChange={(e) => {
                  const val = e.target.value;
                  const words = val.trim().split(/\s+/).filter(Boolean);
                  if (words.length <= 70 || val.length < brandDescription.length) {
                    setBrandDescription(val);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent resize-none leading-relaxed"
                placeholder="Enter store brand philosophy..."
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                  {isBn ? "অফিস / শোরুমের ঠিকানা" : "Store Office Address"}
                </label>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value.slice(0, 200))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent resize-none"
                  placeholder="Enter physical address..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                  {isBn ? "কাজের সময় (Working Hours)" : "Working / Support Hours"}
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
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                {isBn ? "কপিরাইট নোটিশ" : "Copyright Notice"}
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
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                  Facebook URL
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
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                  Instagram URL
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
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                  YouTube URL
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
                <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                  WhatsApp Number / Link
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

          {/* Action Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={!hasChanges || saving}
              className={`px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 ${
                !hasChanges || saving
                  ? "bg-foreground/10 text-foreground/40 cursor-not-allowed opacity-60 shadow-none"
                  : "bg-accent text-button-fg hover:opacity-90 active:scale-95 cursor-pointer"
              }`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{isBn ? "সংরক্ষণ করা হচ্ছে..." : "Saving..."}</span>
                </>
              ) : (
                <span>{isBn ? "সকল সেটিংস সংরক্ষণ করুন" : "Save All Settings"}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
