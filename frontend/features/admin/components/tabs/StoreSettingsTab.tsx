"use client";

import { useState } from "react";
import { useLanguage } from "@/store/LanguageContext";

export default function StoreSettingsTab() {
  const { locale } = useLanguage();
  const isBn = locale === "bn";

  // Mock initial UI states (Non-functional template as requested)
  const [siteTitle, setSiteTitle] = useState("VibeMart");
  const [tagline, setTagline] = useState("Your modern multi-category ecommerce store");
  const [supportPhone, setSupportPhone] = useState("+880 1700-000000");
  const [supportEmail, setSupportEmail] = useState("support@vibemart.com");
  const [storeAddress, setStoreAddress] = useState("Level 4, House 12, Road 5, Dhanmondi, Dhaka-1205");
  const [footerCopyright, setFooterCopyright] = useState("© 2026 VibeMart Inc. All rights reserved.");
  const [facebookUrl, setFacebookUrl] = useState("https://facebook.com/vibemart");
  const [instagramUrl, setInstagramUrl] = useState("https://instagram.com/vibemart");
  const [youtubeUrl, setYoutubeUrl] = useState("https://youtube.com/@vibemart");

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* 🌟 Header Banner */}
      <div className="relative overflow-hidden bg-primary rounded-3xl p-6 sm:p-8 text-button-fg border border-foreground/10 shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-accent">
                {isBn ? "কাস্টমাইজেশন প্যানেল" : "Branding & Customization"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              {isBn ? "স্টোর সেটিংস ও ব্র্যান্ডিং" : "General Store Settings"}
            </h1>
            <p className="text-xs sm:text-sm opacity-80 mt-1 max-w-xl font-medium">
              {isBn
                ? "ওয়েবসাইটের লোগো, টাইটেল, ফুটার তথ্য, হেল্পলাইন ও সোশ্যাল লিংক পরিবর্তন করুন।"
                : "Manage website logo, brand title, footer information, contact details, and social links."}
            </p>
          </div>

          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-accent text-button-fg text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            {isBn ? "সংরক্ষণ করুন (ডেমো)" : "Save Settings (Demo)"}
          </button>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Logo Upload & Brand Meta */}
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
                onClick={() => setLogoPreview(null)}
                className="w-full py-2 text-xs font-bold text-hidden hover:underline text-center cursor-pointer"
              >
                {isBn ? "লোগো রিমুভ করুন" : "Remove uploaded logo"}
              </button>
            )}
          </div>

          {/* Website Title & Tagline */}
          <div className="bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                {isBn ? "ব্র্যান্ড টাইটেল" : "Brand Identity"}
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
                placeholder="e.g. Your modern multi-category ecommerce store"
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

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                {isBn ? "অফিস / শোরুমের ঠিকানা" : "Store Office Address"}
              </label>
              <textarea
                rows={3}
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent resize-none"
                placeholder="Enter physical address..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider opacity-70">
                {isBn ? "কপিরাইট টেক্সট" : "Copyright Notice"}
              </label>
              <input
                type="text"
                value={footerCopyright}
                onChange={(e) => setFooterCopyright(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background text-foreground text-xs font-medium border border-foreground/15 focus:outline-none focus:border-accent"
                placeholder="© 2026 VibeMart. All rights reserved."
              />
            </div>
          </div>

          {/* Social Media Links */}
          <div className="bg-secondary p-6 sm:p-7 rounded-3xl border border-foreground/10 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                {isBn ? "সোশ্যাল মিডিয়া লিংকস" : "Social Media Links"}
              </h2>
            </div>
            <p className="text-xs opacity-70">
              {isBn
                ? "ফুটার ও হেডারে সোশ্যাল আইকনের সাথে সংযুক্ত করার লিংকসমূহ।"
                : "Provide profile URLs for Facebook, Instagram, and YouTube."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-6 py-3 rounded-xl bg-button-bg text-button-fg text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              {isBn ? "সকল সেটিংস সংরক্ষণ করুন" : "Save All Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
