"use client";

import Image from "next/image";
import { PaymentSettingsState } from "../../types";
import { useLanguage } from "@/store/LanguageContext";

interface PaymentsTabProps {
  paymentSettings: PaymentSettingsState;
  initialPaymentSettings: PaymentSettingsState;
  setPaymentSettings: React.Dispatch<React.SetStateAction<PaymentSettingsState>>;
  savingPaymentSettings: boolean;
  handleSavePaymentSettings: () => Promise<void>;
}

export default function PaymentsTab({
  paymentSettings,
  initialPaymentSettings,
  setPaymentSettings,
  savingPaymentSettings,
  handleSavePaymentSettings,
}: PaymentsTabProps) {
  const { t } = useLanguage();

  const hasPaymentChanges =
    paymentSettings.bkash_number !== initialPaymentSettings.bkash_number ||
    paymentSettings.bkash_active !== initialPaymentSettings.bkash_active ||
    paymentSettings.nagad_number !== initialPaymentSettings.nagad_number ||
    paymentSettings.nagad_active !== initialPaymentSettings.nagad_active ||
    paymentSettings.cod_active !== initialPaymentSettings.cod_active ||
    paymentSettings.vibecoin_active !== initialPaymentSettings.vibecoin_active;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-foreground/10">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              {t("admin.payments.title")}
            </h2>
            <p className="text-xs opacity-60 mt-1">
              {t("admin.payments.subtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSavePaymentSettings()}
            disabled={savingPaymentSettings || !hasPaymentChanges}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 ${
              hasPaymentChanges && !savingPaymentSettings
                ? "bg-button-bg text-button-fg hover:opacity-90 cursor-pointer scale-102"
                : "bg-foreground/10 text-foreground/40 cursor-not-allowed shadow-none border border-foreground/10"
            }`}
          >
            {savingPaymentSettings
              ? t("admin.payments.saving")
              : hasPaymentChanges
                ? t("admin.payments.saveChanges")
                : t("admin.payments.noChanges")}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. bKash Settings */}
          <div className="p-6 rounded-3xl bg-primary/5 dark:bg-primary/30 border border-foreground/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary border border-foreground/10 p-1 flex items-center justify-center shadow-xs">
                  <Image
                    src="/bKash.png"
                    alt="bKash"
                    width={40}
                    height={40}
                    className="h-6 w-auto object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">
                    {t("admin.payments.bkashTitle")}
                  </h3>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      paymentSettings.bkash_active
                        ? "text-accent"
                        : "text-foreground/50"
                    }`}
                  >
                    {paymentSettings.bkash_active
                      ? t("admin.payments.active")
                      : t("admin.payments.disabled")}
                  </span>
                </div>
              </div>

              {/* Toggle Button */}
              <button
                type="button"
                onClick={() =>
                  setPaymentSettings({
                    ...paymentSettings,
                    bkash_active: !paymentSettings.bkash_active,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  paymentSettings.bkash_active
                    ? "bg-accent"
                    : "bg-foreground/20"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    paymentSettings.bkash_active
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {t("admin.payments.bkashReceiver")}
              </label>
              <input
                type="tel"
                maxLength={11}
                value={paymentSettings.bkash_number}
                onChange={(e) =>
                  setPaymentSettings({
                    ...paymentSettings,
                    bkash_number: e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 11),
                  })
                }
                placeholder={t("admin.payments.bkashPlaceholder")}
                className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-[10px] opacity-50 font-medium">
                {t("admin.payments.bkashHint")}
              </p>
            </div>
          </div>

          {/* 2. Nagad Settings */}
          <div className="p-6 rounded-3xl bg-primary/5 dark:bg-primary/30 border border-foreground/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary border border-foreground/10 p-1 flex items-center justify-center shadow-xs">
                  <Image
                    src="/nagad.webp"
                    alt="Nagad"
                    width={40}
                    height={40}
                    className="h-6 w-auto object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">
                    {t("admin.payments.nagadTitle")}
                  </h3>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      paymentSettings.nagad_active
                        ? "text-accent"
                        : "text-foreground/50"
                    }`}
                  >
                    {paymentSettings.nagad_active
                      ? t("admin.payments.active")
                      : t("admin.payments.disabled")}
                  </span>
                </div>
              </div>

              {/* Toggle Button */}
              <button
                type="button"
                onClick={() =>
                  setPaymentSettings({
                    ...paymentSettings,
                    nagad_active: !paymentSettings.nagad_active,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  paymentSettings.nagad_active
                    ? "bg-accent"
                    : "bg-foreground/20"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    paymentSettings.nagad_active
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {t("admin.payments.nagadReceiver")}
              </label>
              <input
                type="tel"
                maxLength={11}
                value={paymentSettings.nagad_number}
                onChange={(e) =>
                  setPaymentSettings({
                    ...paymentSettings,
                    nagad_number: e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 11),
                  })
                }
                placeholder={t("admin.payments.nagadPlaceholder")}
                className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-[10px] opacity-50 font-medium">
                {t("admin.payments.nagadHint")}
              </p>
            </div>
          </div>

          {/* 3. Cash on Delivery (COD) Settings */}
          <div className="p-6 rounded-3xl bg-primary/5 dark:bg-primary/30 border border-foreground/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-secondary border border-foreground/10 flex items-center justify-center font-black text-sm shadow-xs">
                💵
              </div>
              <div>
                <h3 className="font-black text-sm text-foreground">
                  {t("admin.payments.codTitle")}
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    paymentSettings.cod_active
                      ? "text-accent"
                      : "text-foreground/50"
                  }`}
                >
                  {paymentSettings.cod_active
                    ? t("admin.payments.active")
                    : t("admin.payments.disabled")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setPaymentSettings({
                  ...paymentSettings,
                  cod_active: !paymentSettings.cod_active,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                paymentSettings.cod_active
                  ? "bg-accent"
                  : "bg-foreground/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  paymentSettings.cod_active
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 4. VibeCoin Settings */}
          <div className="p-6 rounded-3xl bg-primary/5 dark:bg-primary/30 border border-foreground/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-secondary border border-foreground/10 flex items-center justify-center p-2 shadow-xs">
                <Image
                  src="/VibeCoin/VibeCoin.png"
                  alt="VibeCoin"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div>
                <h3 className="font-black text-sm text-foreground">
                  {t("admin.payments.vibecoinTitle")}
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    paymentSettings.vibecoin_active
                      ? "text-accent"
                      : "text-foreground/50"
                  }`}
                >
                  {paymentSettings.vibecoin_active
                    ? t("admin.payments.active")
                    : t("admin.payments.disabled")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setPaymentSettings({
                  ...paymentSettings,
                  vibecoin_active: !paymentSettings.vibecoin_active,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                paymentSettings.vibecoin_active
                  ? "bg-accent"
                  : "bg-foreground/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  paymentSettings.vibecoin_active
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
