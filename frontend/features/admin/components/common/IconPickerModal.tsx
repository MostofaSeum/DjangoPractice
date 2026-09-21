"use client";

import React, { useState } from "react";
import Image from "next/image";

export const STORE_PRESET_ICONS = [
  { path: "/icons/check-circle.png", label: "Check / Authentic" },
  { path: "/icons/truck.png", label: "Truck / Delivery" },
  { path: "/icons/star-filled.png", label: "Star Filled" },
  { path: "/icons/star-empty.png", label: "Star Outline" },
  { path: "/icons/return-arrow.png", label: "Return / Security" },
  { path: "/icons/pin.png", label: "Pin / Location" },
  { path: "/icons/sun.png", label: "Sun / Glow" },
  { path: "/love.png", label: "Heart / Love" },
  { path: "/bubble-chat.png", label: "Chat / Support" },
  { path: "/bKash.png", label: "bKash" },
  { path: "/nagad.webp", label: "Nagad" },
  { path: "/discount.png", label: "Discount / Offer" },
  { path: "/bot.png", label: "AI Bot" },
  { path: "/messenger.png", label: "Messenger" },
  { path: "/whatsapp.png", label: "WhatsApp" },
  { path: "/HomePage/shopping-cart.png", label: "Shopping Cart" },
  { path: "/favorite.png", label: "Favorite" },
  { path: "/analytics.png", label: "Analytics" },
  { path: "/dashboard.png", label: "Dashboard" },
];

interface IconPickerModalProps {
  isOpen: boolean;
  currentIcon: string;
  title?: string;
  onSelectIcon: (iconPath: string) => void;
  onClose: () => void;
  isBn?: boolean;
}

export default function IconPickerModal({
  isOpen,
  currentIcon,
  title,
  onSelectIcon,
  onClose,
  isBn = false,
}: IconPickerModalProps) {
  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          onSelectIcon(loadEvent.target.result as string);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-secondary text-foreground w-full max-w-lg rounded-3xl border border-foreground/15 p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {title || (isBn ? "আইকন নির্বাচন করুন" : "Select an Icon")}
            </h3>
            <p className="text-xs opacity-60 mt-0.5">
              {isBn
                ? "প্রিসেট তালিকা থেকে নির্বাচন করুন অথবা আপনার ডিভাইস থেকে আপলোড করুন"
                : "Choose from existing store icons or upload a custom image"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/15 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Current Icon Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-foreground/10">
          <div className="w-10 h-10 rounded-lg bg-secondary border border-foreground/10 flex items-center justify-center p-1.5 flex-shrink-0">
            {currentIcon ? (
              <Image
                src={currentIcon}
                alt="Current"
                width={32}
                height={32}
                unoptimized
                className="object-contain max-h-8 max-w-8"
              />
            ) : (
              <span className="text-xs opacity-40">None</span>
            )}
          </div>
          <div className="text-xs overflow-hidden">
            <span className="font-bold opacity-70 block">
              {isBn ? "বর্তমান আইকন:" : "Current Icon:"}
            </span>
            <span className="font-mono text-[11px] truncate block opacity-60">
              {currentIcon.startsWith("data:") ? "Custom Uploaded Image" : currentIcon}
            </span>
          </div>
        </div>

        {/* Preset Library Grid */}
        <div className="space-y-2">
          <div className="text-[11px] font-black uppercase tracking-wider opacity-70">
            {isBn ? "স্টোর আইকন লাইব্রেরি" : "Store Icon Library"}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-48 overflow-y-auto p-1 custom-scrollbar">
            {STORE_PRESET_ICONS.map((preset) => {
              const isSelected = currentIcon === preset.path;
              return (
                <button
                  key={preset.path}
                  type="button"
                  onClick={() => {
                    onSelectIcon(preset.path);
                    onClose();
                  }}
                  title={preset.label}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer group ${
                    isSelected
                      ? "border-accent bg-accent/15 shadow-sm scale-105"
                      : "border-foreground/10 bg-secondary hover:border-accent/40 hover:bg-accent/5 hover:scale-105"
                  }`}
                >
                  <div className="w-7 h-7 relative flex items-center justify-center mb-1">
                    <Image
                      src={preset.path}
                      alt={preset.label}
                      width={28}
                      height={28}
                      unoptimized
                      className="object-contain max-h-7 max-w-7"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-center truncate w-full opacity-70 group-hover:opacity-100">
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Custom Icon */}
        <div className="space-y-2 border-t border-foreground/10 pt-4">
          <div className="text-[11px] font-black uppercase tracking-wider opacity-70">
            {isBn ? "অথবা কাস্টম আইকন ফাইল আপলোড করুন" : "Or Upload Custom Icon File"}
          </div>
          <label className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer text-xs font-bold text-accent">
            <span>
              {isBn ? "ডিভাইস থেকে ছবি বাছাই করুন" : "Choose Image From Device (PNG, WebP)"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
