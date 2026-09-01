"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/store/LanguageContext";
import Swal from "sweetalert2";

interface StoreSettingsTabProps {
  apiBase: string;
  token: string | null;
}

export default function StoreSettingsTab({ apiBase, token }: StoreSettingsTabProps) {
  const { locale } = useLanguage();
  const isBn = locale === "bn";

  // Form states
  const [siteTitle, setSiteTitle] = useState("VibeMart");
  const [tagline, setTagline] = useState("MAKE-UP STYLE");
  const [brandDescription, setBrandDescription] = useState(
    "VibeMart is a recognized multi-category fashion and lifestyle store built on the principle of \"best price at the highest quality\". Our collections are curated with premium materials that are durable, stylish, and perfect for your vibe."
  );
  const [supportPhone, setSupportPhone] = useState("+880 1700-000000");
  const [supportEmail, setSupportEmail] = useState("support@vibemart.com");
  const [storeAddress, setStoreAddress] = useState(
    "Homestead Gulshan Link Tower, 99 Gulshan Badda Link Rd, Dhaka 1212"
  );
  const [workingHours, setWorkingHours] = useState("Sat - Thu: 10:00 - 18:00");
  const [footerCopyright, setFooterCopyright] = useState("© 2026 VIBEMART. ALL RIGHTS RESERVED.");
  const [facebookUrl, setFacebookUrl] = useState("https://facebook.com");
  const [instagramUrl, setInstagramUrl] = useState("https://instagram.com");
  const [youtubeUrl, setYoutubeUrl] = useState("https://youtube.com");
  const [whatsappNumber, setWhatsappNumber] = useState("+8801700000000");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
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
        setSiteTitle(data.site_title || "VibeMart");
        setTagline(data.tagline || "MAKE-UP STYLE");
        if (data.brand_description) setBrandDescription(data.brand_description);
        setSupportPhone(data.support_phone || "+880 1700-000000");
        setSupportEmail(data.support_email || "support@vibemart.com");
        setStoreAddress(
          data.store_address || "Homestead Gulshan Link Tower, 99 Gulshan Badda Link Rd, Dhaka 1212"
        );
        setWorkingHours(data.working_hours || "Sat - Thu: 10:00 - 18:00");
        setFooterCopyright(data.footer_copyright || "© 2026 VIBEMART. ALL RIGHTS RESERVED.");
        setFacebookUrl(data.facebook_url || "https://facebook.com");
        setInstagramUrl(data.instagram_url || "https://instagram.com");
        setYoutubeUrl(data.youtube_url || "https://youtube.com");
        setWhatsappNumber(data.whatsapp_number || "+8801700000000");
        if (data.logo) {
          setCurrentLogoUrl(data.logo);
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
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
        if (data.logo) {
          setCurrentLogoUrl(data.logo);
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
        Swal.fire(
          "Error",
          errData.detail || "Failed to update settings. Please check your inputs.",
          "error"
        );
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
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
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
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
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
                onChange={(e) => setBrandDescription(e.target.value)}
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
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
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
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
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
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
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
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
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
                value={footerCopyright}
                onChange={(e) => setFooterCopyright(e.target.value)}
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
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
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
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
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
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
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
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
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
              disabled={saving}
              className="px-8 py-3.5 rounded-xl bg-accent text-button-fg text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
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
