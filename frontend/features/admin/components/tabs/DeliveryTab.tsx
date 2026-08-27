"use client";

import { DeliverySettingsState } from "../../types";
import { useLanguage } from "@/store/LanguageContext";

interface DeliveryTabProps {
  deliverySettings: DeliverySettingsState;
  initialDeliverySettings: DeliverySettingsState;
  setDeliverySettings: React.Dispatch<React.SetStateAction<DeliverySettingsState>>;
  savingDeliverySettings: boolean;
  handleSaveDeliverySettings: (e?: React.FormEvent) => Promise<void>;
}

export default function DeliveryTab({
  deliverySettings,
  initialDeliverySettings,
  setDeliverySettings,
  savingDeliverySettings,
  handleSaveDeliverySettings,
}: DeliveryTabProps) {
  const { locale } = useLanguage();
  const isBn = locale === "bn";

  const hasDeliveryChanges =
    deliverySettings.inside_dhaka_charge !==
      initialDeliverySettings.inside_dhaka_charge ||
    deliverySettings.outside_dhaka_charge !==
      initialDeliverySettings.outside_dhaka_charge ||
    deliverySettings.estimated_days_inside !==
      initialDeliverySettings.estimated_days_inside ||
    deliverySettings.estimated_days_outside !==
      initialDeliverySettings.estimated_days_outside ||
    deliverySettings.is_active !== initialDeliverySettings.is_active;

  return (
    <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header & Save Action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-foreground/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
                {isBn ? "ডেলিভারি ও শিপিং চার্জ সেটিংস" : "Manage Delivery & Shipping Charges"}
              </h2>
            </div>
            <p className="text-xs opacity-60 font-medium">
              {isBn
                ? "ঢাকার ভিতরে ও ঢাকার বাইরের জন্য ডেলিভারি ফি এবং আনুমানিক সময় নির্ধারণ করুন।"
                : "Configure delivery fees and estimated timeframes for Inside Dhaka and Outside Dhaka. Customers will select these during checkout."}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {hasDeliveryChanges && (
              <button
                type="button"
                onClick={() => setDeliverySettings(initialDeliverySettings)}
                className="px-4 py-2.5 rounded-xl border border-foreground/15 text-xs font-bold uppercase tracking-wider hover:bg-foreground/5 transition-all text-foreground/70 cursor-pointer"
              >
                {isBn ? "রিসেট" : "Reset"}
              </button>
            )}
            <button
              type="button"
              disabled={savingDeliverySettings || !hasDeliveryChanges}
              onClick={() => handleSaveDeliverySettings()}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-button-bg text-button-fg rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {savingDeliverySettings ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>{isBn ? "সংরক্ষণ হচ্ছে..." : "Saving..."}</span>
                </>
              ) : (
                <span>{isBn ? "সংরক্ষণ করুন" : "Save"}</span>
              )}
            </button>
          </div>
        </div>

        {/* Edit Form Fields */}
        <form onSubmit={handleSaveDeliverySettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inside Dhaka Config */}
            <div className="p-6 rounded-3xl bg-primary/5 dark:bg-primary/30 border border-foreground/10 space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-black text-sm text-foreground">
                    {isBn ? "ঢাকার ভিতরে ডেলিভারি" : "In Side Dhaka Delivery"}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                    {isBn ? "ডিফল্ট এলাকা" : "Default Standard Area"}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? "ডেলিভারি চার্জ (টাকা / BDT) *" : "Delivery Charge (Taka / BDT) *"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm text-foreground/50">
                    ৳
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={deliverySettings.inside_dhaka_charge}
                    onChange={(e) =>
                      setDeliverySettings({
                        ...deliverySettings,
                        inside_dhaka_charge: e.target.value,
                      })
                    }
                    placeholder={isBn ? "যেমনঃ ৬০" : "e.g. 60"}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <p className="text-[10px] opacity-50 font-medium">
                  {isBn
                    ? "ঢাকার ভেতরে ডেলিভারি সিলেক্ট করলে অর্ডারে এই চার্জ যুক্ত হবে।"
                    : "Amount added to customer order when Inside Dhaka is chosen (e.g. 60 tk)."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? "আনুমানিক ডেলিভারির সময়সীমা" : "Estimated Delivery Timeframe"}
                </label>
                <input
                  type="text"
                  value={deliverySettings.estimated_days_inside}
                  onChange={(e) =>
                    setDeliverySettings({
                      ...deliverySettings,
                      estimated_days_inside: e.target.value,
                    })
                  }
                  placeholder={isBn ? "যেমনঃ ১-২ দিন" : "e.g. 1-2 Days"}
                  className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Outside Dhaka Config */}
            <div className="p-6 rounded-3xl bg-primary/5 dark:bg-primary/30 border border-foreground/10 space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-black text-sm text-foreground">
                    {isBn ? "ঢাকার বাইরে ডেলিভারি" : "Out Side Dhaka Delivery"}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {isBn ? "সারাদেশে / অন্যান্য জেলা" : "Nationwide / Regional Area"}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? "ডেলিভারি চার্জ (টাকা / BDT) *" : "Delivery Charge (Taka / BDT) *"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm text-foreground/50">
                    ৳
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={deliverySettings.outside_dhaka_charge}
                    onChange={(e) =>
                      setDeliverySettings({
                        ...deliverySettings,
                        outside_dhaka_charge: e.target.value,
                      })
                    }
                    placeholder={isBn ? "যেমনঃ ১৩০" : "e.g. 130"}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <p className="text-[10px] opacity-50 font-medium">
                  {isBn
                    ? "ঢাকার বাইরে ডেলিভারি সিলেক্ট করলে অর্ডারে এই চার্জ যুক্ত হবে।"
                    : "Amount added to customer order when Outside Dhaka is chosen (e.g. 130 tk)."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isBn ? "আনুমানিক ডেলিভারির সময়সীমা" : "Estimated Delivery Timeframe"}
                </label>
                <input
                  type="text"
                  value={deliverySettings.estimated_days_outside}
                  onChange={(e) =>
                    setDeliverySettings({
                      ...deliverySettings,
                      estimated_days_outside: e.target.value,
                    })
                  }
                  placeholder={isBn ? "যেমনঃ ৩-৫ দিন" : "e.g. 3-5 Days"}
                  className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
