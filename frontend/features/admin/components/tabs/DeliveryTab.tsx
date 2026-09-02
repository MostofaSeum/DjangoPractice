"use client";

import { useState } from "react";
import {
  DeliverySettingsState,
  CourierProvider,
  DeliveryProviderCode,
  DeliverySubTab,
} from "../../types";
import { useLanguage } from "@/store/LanguageContext";
import Swal from "sweetalert2";

interface DeliveryTabProps {
  deliverySubTab: DeliverySubTab;
  setDeliverySubTab: (subTab: DeliverySubTab) => void;
  deliverySettings: DeliverySettingsState;
  initialDeliverySettings: DeliverySettingsState;
  setDeliverySettings: React.Dispatch<React.SetStateAction<DeliverySettingsState>>;
  savingDeliverySettings: boolean;
  handleSaveDeliverySettings: (e?: React.FormEvent) => Promise<void>;

  // Courier Providers Props
  courierProviders?: CourierProvider[];
  handleSaveCourierProvider?: (providerData: Partial<CourierProvider>) => Promise<boolean>;
  handleDeleteCourierProvider?: (providerId: number, name: string) => Promise<void>;
  handleToggleCourierActive?: (provider: CourierProvider) => Promise<void>;
  handleSetDefaultCourier?: (providerId: number, area: "inside" | "outside" | "both") => Promise<void>;
  handleTestCourierConnection?: (providerId: number) => Promise<void>;
}

const PRESET_COURIERS: Array<{
  code: DeliveryProviderCode;
  name: string;
  defaultTrackingUrl: string;
  defaultBaseUrl: string;
  description: string;
}> = [
  {
    code: "steadfast",
    name: "Steadfast Courier",
    defaultTrackingUrl: "https://steadfast.com.bd/t/{tracking_code}",
    defaultBaseUrl: "https://portal.steadfast.com.bd/api/v1",
    description: "Full automated parcel dispatch across Bangladesh with instant COD tracking.",
  },
  {
    code: "pathao",
    name: "Pathao Courier",
    defaultTrackingUrl: "https://merchant.pathao.com/tracking?consignment_id={tracking_code}",
    defaultBaseUrl: "https://courier-api.pathao.com/aladdin/api/v1",
    description: "Reliable express courier service inside Dhaka and nationwide hubs.",
  },
  {
    code: "redx",
    name: "RedX Delivery",
    defaultTrackingUrl: "https://redx.com.bd/track-order?trackingId={tracking_code}",
    defaultBaseUrl: "https://openapi.redx.com.bd/v1.0.0-beta",
    description: "Doorstep delivery partner with live parcel tracking and doorstep exchange.",
  },
  {
    code: "paperfly",
    name: "Paperfly",
    defaultTrackingUrl: "https://paperfly.com.bd/track?tracking_id={tracking_code}",
    defaultBaseUrl: "https://api.paperfly.com.bd/v1",
    description: "Nationwide doorstep courier coverage with smart return management.",
  },
  {
    code: "ecourier",
    name: "eCourier",
    defaultTrackingUrl: "https://ecourier.com.bd/track-parcel/?track_id={tracking_code}",
    defaultBaseUrl: "https://backoffice.ecourier.com.bd/api",
    description: "Tech-enabled logistics provider for direct web storefronts.",
  },
  {
    code: "custom",
    name: "Custom / In-House Delivery",
    defaultTrackingUrl: "",
    defaultBaseUrl: "",
    description: "For merchants doing in-house rider delivery or using local manual couriers.",
  },
];

export default function DeliveryTab({
  deliverySubTab = "rates",
  setDeliverySubTab,
  deliverySettings,
  initialDeliverySettings,
  setDeliverySettings,
  savingDeliverySettings,
  handleSaveDeliverySettings,

  // Courier Providers
  courierProviders = [],
  handleSaveCourierProvider,
  handleDeleteCourierProvider,
  handleToggleCourierActive,
  handleSetDefaultCourier,
  handleTestCourierConnection,
}: DeliveryTabProps) {
  const { t, locale } = useLanguage();
  const isBn = locale === "bn";

  // Courier Form State
  const [editingCourier, setEditingCourier] = useState<CourierProvider | null>(null);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [courierName, setCourierName] = useState("");
  const [courierProviderCode, setCourierProviderCode] = useState<DeliveryProviderCode>("steadfast");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [clientId, setClientId] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [trackingUrlTemplate, setTrackingUrlTemplate] = useState("");
  const [isDefaultInsideDhaka, setIsDefaultInsideDhaka] = useState(false);
  const [isDefaultOutsideDhaka, setIsDefaultOutsideDhaka] = useState(false);
  const [isSandbox, setIsSandbox] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isSavingCourier, setIsSavingCourier] = useState(false);
  const [testingConnectionId, setTestingConnectionId] = useState<number | null>(null);

  const handleOpenAddCourier = () => {
    const defaultPreset = PRESET_COURIERS[0];
    setEditingCourier(null);
    setCourierName(defaultPreset.name);
    setCourierProviderCode(defaultPreset.code);
    setApiKey("");
    setSecretKey("");
    setClientId("");
    setBaseUrl(defaultPreset.defaultBaseUrl);
    setTrackingUrlTemplate(defaultPreset.defaultTrackingUrl);
    setIsDefaultInsideDhaka(courierProviders.length === 0);
    setIsDefaultOutsideDhaka(courierProviders.length === 0);
    setIsSandbox(false);
    setIsActive(true);
    setNotes("");
    setShowSecret(false);
    setIsCourierModalOpen(true);
  };

  const handleOpenEditCourier = (provider: CourierProvider) => {
    setEditingCourier(provider);
    setCourierName(provider.name);
    setCourierProviderCode(provider.provider_code);
    setApiKey(provider.api_key || "");
    setSecretKey(provider.secret_key || "");
    setClientId(provider.client_id || "");
    setBaseUrl(provider.base_url || "");
    setTrackingUrlTemplate(provider.tracking_url_template || "");
    setIsDefaultInsideDhaka(provider.is_default_inside_dhaka);
    setIsDefaultOutsideDhaka(provider.is_default_outside_dhaka);
    setIsSandbox(provider.is_sandbox);
    setIsActive(provider.is_active);
    setNotes(provider.notes || "");
    setShowSecret(false);
    setIsCourierModalOpen(true);
  };

  const handleSelectPresetProvider = (code: DeliveryProviderCode) => {
    setCourierProviderCode(code);
    const preset = PRESET_COURIERS.find((p) => p.code === code);
    if (preset) {
      if (!editingCourier) {
        setCourierName(preset.name);
      }
      setBaseUrl(preset.defaultBaseUrl);
      setTrackingUrlTemplate(preset.defaultTrackingUrl);
    }
  };

  const handleSubmitCourierForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierName.trim()) {
      Swal.fire("Error", "Please provide a name for this delivery partner.", "error");
      return;
    }

    if (!handleSaveCourierProvider) return;

    try {
      setIsSavingCourier(true);
      const payload: Partial<CourierProvider> = {
        name: courierName.trim(),
        provider_code: courierProviderCode,
        api_key: apiKey.trim() || null,
        secret_key: secretKey.trim() || null,
        client_id: clientId.trim() || null,
        base_url: baseUrl.trim() || null,
        tracking_url_template: trackingUrlTemplate.trim() || null,
        is_default_inside_dhaka: isDefaultInsideDhaka,
        is_default_outside_dhaka: isDefaultOutsideDhaka,
        is_sandbox: isSandbox,
        is_active: isActive,
        notes: notes.trim(),
      };

      if (editingCourier) {
        payload.id = editingCourier.id;
      }

      const success = await handleSaveCourierProvider(payload);
      if (success) {
        setIsCourierModalOpen(false);
      }
    } finally {
      setIsSavingCourier(false);
    }
  };

  const handleTriggerTestConnection = async (provider: CourierProvider) => {
    if (!handleTestCourierConnection) return;
    try {
      setTestingConnectionId(provider.id);
      await handleTestCourierConnection(provider.id);
    } finally {
      setTestingConnectionId(null);
    }
  };

  const hasDeliveryChanges =
    deliverySettings.inside_dhaka_charge !== initialDeliverySettings.inside_dhaka_charge ||
    deliverySettings.outside_dhaka_charge !== initialDeliverySettings.outside_dhaka_charge ||
    deliverySettings.estimated_days_inside !== initialDeliverySettings.estimated_days_inside ||
    deliverySettings.estimated_days_outside !== initialDeliverySettings.estimated_days_outside ||
    deliverySettings.is_active !== initialDeliverySettings.is_active;

  return (
    <div className="bg-secondary text-foreground p-6 sm:p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300 space-y-8">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-foreground/10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                {t("admin.delivery.title")}
              </h2>
              <p className="text-xs opacity-60 font-medium">
                {t("admin.delivery.subtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* SUB-TAB 1: GENERAL RATES & TIMEFRAMES */}
      {deliverySubTab === "rates" && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {isBn ? "বেসিক ডেলিভারি চার্জ ও সময়সীমা" : "Standard Delivery Rates & Schedules"}
            </h3>

            <div className="flex items-center gap-3">
              {hasDeliveryChanges && (
                <button
                  type="button"
                  onClick={() => setDeliverySettings(initialDeliverySettings)}
                  className="px-4 py-2 rounded-xl border border-foreground/15 text-xs font-bold uppercase tracking-wider hover:bg-foreground/5 transition-all text-foreground/70 cursor-pointer"
                >
                  {t("admin.delivery.reset")}
                </button>
              )}
              <button
                type="button"
                disabled={savingDeliverySettings || !hasDeliveryChanges}
                onClick={() => handleSaveDeliverySettings()}
                className="px-6 py-2.5 bg-button-bg text-button-fg rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingDeliverySettings ? (
                  <span>{t("admin.delivery.saving")}</span>
                ) : (
                  <span>{t("admin.delivery.saveSettings")}</span>
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveDeliverySettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inside Dhaka Config */}
              <div className="p-6 rounded-3xl bg-background border border-foreground/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-foreground">
                    {t("admin.delivery.insideDhakaTitle")}
                  </h4>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-accent/15 text-accent rounded-full uppercase tracking-wider">
                    Inside Zone
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {t("admin.delivery.insideDhakaCharge")}
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
                      placeholder="e.g. 60"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-foreground/15 bg-secondary text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {t("admin.delivery.insideEstimated")}
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
                    placeholder="e.g. 1-2 Days"
                    className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-secondary text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent shadow-xs"
                  />
                </div>
              </div>

              {/* Outside Dhaka Config */}
              <div className="p-6 rounded-3xl bg-background border border-foreground/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-foreground">
                    {t("admin.delivery.outsideDhakaTitle")}
                  </h4>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-foreground/10 text-foreground/80 rounded-full uppercase tracking-wider">
                    Outside Zone
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {t("admin.delivery.outsideDhakaCharge")}
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
                      placeholder="e.g. 130"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-foreground/15 bg-secondary text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {t("admin.delivery.outsideEstimated")}
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
                    placeholder="e.g. 3-5 Days"
                    className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-secondary text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent shadow-xs"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 2: COURIER PARTNERS & API INTEGRATION */}
      {deliverySubTab === "couriers" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                {isBn ? "কুরিয়ার সার্ভিস ও এপিআই কনফিগারেশন" : "Courier Services & Automated APIs"}
              </h3>
              <p className="text-xs opacity-60 font-medium">
                {isBn
                  ? "আপনার পছন্দের ডেলিভারি পার্টনার যুক্ত করুন। এপিআই কি থাকলে সরাসরি বুকিং হবে, না থাকলে ম্যানুয়ালি ট্র্যাক করা যাবে।"
                  : "Connect automated courier APIs (Steadfast, Pathao, RedX, etc.) or manage custom in-house delivery."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddCourier}
              className="px-5 py-2.5 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span className="text-sm">+</span>
              <span>{t("admin.delivery.addCourier")}</span>
            </button>
          </div>

          {/* Courier Providers Grid */}
          {courierProviders.length === 0 ? (
            <div className="p-12 rounded-3xl bg-background border border-foreground/10 text-center space-y-4 max-w-lg mx-auto">
              <div className="space-y-1">
                <h4 className="font-black text-base text-foreground">
                  {t("admin.delivery.noCouriers")}
                </h4>
                <p className="text-xs opacity-70 font-medium leading-relaxed">
                  {t("admin.delivery.noCouriersSub")}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleOpenAddCourier}
                  className="px-6 py-3 bg-button-bg text-button-fg rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md cursor-pointer"
                >
                  {t("admin.delivery.addCourier")}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courierProviders.map((provider) => {
                const hasApiKey = Boolean(provider.api_key && provider.api_key.trim());
                return (
                  <div
                    key={provider.id}
                    className={`p-6 rounded-3xl border flex flex-col justify-between space-y-5 transition-all group ${
                      provider.is_active
                        ? "bg-secondary border-foreground/10 shadow-sm hover:shadow-md"
                        : "bg-secondary/40 border-foreground/5 opacity-60"
                    }`}
                  >
                    <div>
                      {/* Top Badges & Status */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span
                          className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            hasApiKey
                              ? "bg-visible/15 text-visible"
                              : "bg-foreground/10 text-foreground/70"
                          }`}
                        >
                          {hasApiKey ? "API Connected" : "Manual Tracking"}
                        </span>

                        {provider.is_sandbox && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-accent/20 text-accent uppercase tracking-wider">
                            Sandbox
                          </span>
                        )}
                      </div>

                      {/* Name & Provider Type */}
                      <h4 className="font-black text-base text-foreground group-hover:text-accent transition-colors">
                        {provider.name}
                      </h4>
                      <p className="text-xs opacity-60 font-bold uppercase tracking-wider mt-0.5">
                        {provider.provider_code_display || provider.provider_code}
                      </p>

                      {/* Default Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {provider.is_default_inside_dhaka && (
                          <span className="px-2.5 py-1 rounded-lg bg-accent/15 text-accent font-extrabold text-[10px] uppercase tracking-wider">
                            Default Inside Dhaka
                          </span>
                        )}
                        {provider.is_default_outside_dhaka && (
                          <span className="px-2.5 py-1 rounded-lg bg-accent/15 text-accent font-extrabold text-[10px] uppercase tracking-wider">
                            Default Outside Dhaka
                          </span>
                        )}
                      </div>

                      {/* Tracking Template Info */}
                      {provider.tracking_url_template && (
                        <div className="mt-4 p-2.5 rounded-xl bg-background border border-foreground/10 text-[10px] opacity-75 truncate">
                          <span className="font-bold opacity-60">URL: </span>
                          <span className="font-mono">{provider.tracking_url_template}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions & Defaults Menu */}
                    <div className="pt-4 border-t border-foreground/10 space-y-3">
                      {/* Set As Default Action */}
                      <div className="flex items-center gap-2">
                        {handleSetDefaultCourier && (
                          <>
                            {!provider.is_default_inside_dhaka && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetDefaultCourier(provider.id, "inside")
                                }
                                className="flex-1 py-1.5 px-2 bg-background hover:bg-foreground/5 border border-foreground/10 rounded-lg text-[10px] font-bold text-foreground/70 uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Set Inside
                              </button>
                            )}
                            {!provider.is_default_outside_dhaka && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetDefaultCourier(provider.id, "outside")
                                }
                                className="flex-1 py-1.5 px-2 bg-background hover:bg-foreground/5 border border-foreground/10 rounded-lg text-[10px] font-bold text-foreground/70 uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Set Outside
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {handleToggleCourierActive && (
                            <button
                              type="button"
                              onClick={() => handleToggleCourierActive(provider)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                provider.is_active
                                  ? "bg-visible/15 text-visible hover:bg-visible/25"
                                  : "bg-foreground/10 text-foreground/60 hover:bg-foreground/20"
                              }`}
                            >
                              {provider.is_active ? "Active" : "Disabled"}
                            </button>
                          )}

                          {hasApiKey && (
                            <button
                              type="button"
                              disabled={testingConnectionId === provider.id}
                              onClick={() => handleTriggerTestConnection(provider)}
                              className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-accent/10 text-accent hover:bg-accent/20 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                            >
                              {testingConnectionId === provider.id ? (
                                <span>Testing...</span>
                              ) : (
                                <span>{t("admin.delivery.testConnection")}</span>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCourier(provider)}
                            className="px-2.5 py-1.5 rounded-xl bg-background border border-foreground/10 hover:bg-foreground/5 text-foreground/80 text-[11px] font-bold transition-colors cursor-pointer"
                            title="Edit Courier"
                          >
                            Edit
                          </button>
                          {handleDeleteCourierProvider && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteCourierProvider(provider.id, provider.name)
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-hidden/10 hover:bg-hidden/20 text-hidden text-[11px] font-bold transition-colors cursor-pointer"
                              title="Delete Courier"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* COURIER PARTNER MODAL (ADD / EDIT) */}
      {isCourierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-secondary text-foreground rounded-3xl p-6 sm:p-8 border border-foreground/15 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-foreground/10">
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
                  {editingCourier
                    ? t("admin.delivery.editCourier")
                    : t("admin.delivery.addCourier")}
                </h3>
                <p className="text-xs opacity-60 font-medium">
                  {isBn
                    ? "আপনার কুরিয়ার অ্যাকাউন্ট এপিআই দিয়ে সংযুক্ত করুন অথবা ম্যানুয়াল রাখুন।"
                    : "Configure API credentials or keep in manual tracking mode."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCourierModalOpen(false)}
                className="w-8 h-8 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center text-xs font-bold text-foreground transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Provider Preset Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block">
                {t("admin.delivery.courierType")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_COURIERS.map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => handleSelectPresetProvider(preset.code)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      courierProviderCode === preset.code
                        ? "bg-accent/15 border-accent text-accent font-black shadow-xs"
                        : "bg-background border-foreground/10 text-foreground hover:border-foreground/30 font-bold"
                    }`}
                  >
                    <div className="text-xs">{preset.name}</div>
                    <div className="text-[9px] opacity-60 uppercase tracking-widest mt-0.5">
                      {preset.code}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitCourierForm} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1.5">
                  {t("admin.delivery.courierName")}
                </label>
                <input
                  type="text"
                  required
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Steadfast Courier"
                  className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* API Credentials */}
              <div className="p-4 rounded-2xl bg-background border border-foreground/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    API Credentials (Optional / Future Ready)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[10px] font-bold text-accent hover:underline cursor-pointer"
                  >
                    {showSecret ? "Hide Keys" : "Show Keys"}
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                    {t("admin.delivery.apiKey")}
                  </label>
                  <input
                    type={showSecret ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API Key from courier portal"
                    className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-secondary text-foreground text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                    {t("admin.delivery.secretKey")}
                  </label>
                  <input
                    type={showSecret ? "text" : "password"}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Enter Secret Key / Password"
                    className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-secondary text-foreground text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                    {t("admin.delivery.clientId")}
                  </label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="e.g. STORE-ID or SENDER-101"
                    className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-secondary text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              {/* URL Configurations */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                    {t("admin.delivery.trackingUrl")}
                  </label>
                  <input
                    type="text"
                    value={trackingUrlTemplate}
                    onChange={(e) => setTrackingUrlTemplate(e.target.value)}
                    placeholder="e.g. https://steadfast.com.bd/t/{tracking_code}"
                    className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                  />
                  <p className="text-[10px] opacity-60 mt-1">
                    Use <code className="font-bold font-mono">{"{tracking_code}"}</code> as placeholder for parcel ID.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                    {t("admin.delivery.baseUrl")}
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="e.g. https://portal.steadfast.com.bd/api/v1"
                    className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Toggles & Defaults */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-2xl bg-background border border-foreground/10 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDefaultInsideDhaka}
                    onChange={(e) => setIsDefaultInsideDhaka(e.target.checked)}
                    className="w-4 h-4 rounded text-accent cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {t("admin.delivery.isDefaultInside")}
                  </span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-2xl bg-background border border-foreground/10 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDefaultOutsideDhaka}
                    onChange={(e) => setIsDefaultOutsideDhaka(e.target.checked)}
                    className="w-4 h-4 rounded text-accent cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {t("admin.delivery.isDefaultOutside")}
                  </span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-2xl bg-background border border-foreground/10 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSandbox}
                    onChange={(e) => setIsSandbox(e.target.checked)}
                    className="w-4 h-4 rounded text-accent cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {t("admin.delivery.isSandbox")}
                  </span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-2xl bg-background border border-foreground/10 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-accent cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {t("admin.delivery.isActive")}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-foreground/10">
                <button
                  type="button"
                  onClick={() => setIsCourierModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-foreground/15 text-xs font-bold uppercase tracking-wider text-foreground/70 hover:bg-foreground/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCourier}
                  className="px-6 py-2.5 bg-button-bg text-button-fg rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingCourier ? (
                    <span>Saving...</span>
                  ) : (
                    <span>{editingCourier ? "Update Partner" : "Save Partner"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


