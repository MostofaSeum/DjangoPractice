"use client";

import { Collection, DeliveryRuleItem, DeliverySettingsState, Product } from "../../types";

interface DeliveryTabProps {
  deliverySettings: DeliverySettingsState;
  initialDeliverySettings: DeliverySettingsState;
  setDeliverySettings: React.Dispatch<React.SetStateAction<DeliverySettingsState>>;
  savingDeliverySettings: boolean;
  handleSaveDeliverySettings: (e?: React.FormEvent) => Promise<void>;
  deliveryRulesList: DeliveryRuleItem[];
  editingDeliveryRuleId: number | null;
  deliveryRuleTitle: string;
  setDeliveryRuleTitle: (title: string) => void;
  deliveryRuleTargetType: "product" | "collection";
  setDeliveryRuleTargetType: (type: "product" | "collection") => void;
  deliveryRuleType: "free" | "reduced";
  setDeliveryRuleType: (type: "free" | "reduced") => void;
  deliveryRuleInsideCharge: string;
  setDeliveryRuleInsideCharge: (charge: string) => void;
  deliveryRuleOutsideCharge: string;
  setDeliveryRuleOutsideCharge: (charge: string) => void;
  deliveryRuleSelectedProductIds: number[];
  setDeliveryRuleSelectedProductIds: React.Dispatch<React.SetStateAction<number[]>>;
  deliveryRuleCollectionId: number | "";
  setDeliveryRuleCollectionId: (id: number | "") => void;
  deliveryRuleMinQuantity: string;
  setDeliveryRuleMinQuantity: (qty: string) => void;
  deliveryRuleIsActive: boolean;
  setDeliveryRuleIsActive: (active: boolean) => void;
  deliveryRuleSearchInput: string;
  setDeliveryRuleSearchInput: (input: string) => void;
  isDeliveryRuleDropdownOpen: boolean;
  setIsDeliveryRuleDropdownOpen: (open: boolean) => void;
  deliveryRuleCreating: boolean;
  deliveryRuleFilterSearch: string;
  setDeliveryRuleFilterSearch: (search: string) => void;
  selectedDeliveryRuleProducts: Product[];
  promoProductsCatalog: Product[];
  collections: Collection[];
  handleSaveDeliveryRule: (e: React.FormEvent) => Promise<void>;
  handleCancelEditDeliveryRule: () => void;
  handleStartEditDeliveryRule: (rule: DeliveryRuleItem) => void;
  handleToggleDeliveryRule: (rule: DeliveryRuleItem) => Promise<void>;
  handleDeleteDeliveryRule: (ruleId: number, title: string) => Promise<void>;
}

export default function DeliveryTab({
  deliverySettings,
  initialDeliverySettings,
  setDeliverySettings,
  savingDeliverySettings,
  handleSaveDeliverySettings,
  deliveryRulesList,
  editingDeliveryRuleId,
  deliveryRuleTitle,
  setDeliveryRuleTitle,
  deliveryRuleTargetType,
  setDeliveryRuleTargetType,
  deliveryRuleType,
  setDeliveryRuleType,
  deliveryRuleInsideCharge,
  setDeliveryRuleInsideCharge,
  deliveryRuleOutsideCharge,
  setDeliveryRuleOutsideCharge,
  deliveryRuleSelectedProductIds,
  setDeliveryRuleSelectedProductIds,
  deliveryRuleCollectionId,
  setDeliveryRuleCollectionId,
  deliveryRuleMinQuantity,
  setDeliveryRuleMinQuantity,
  deliveryRuleIsActive,
  setDeliveryRuleIsActive,
  deliveryRuleSearchInput,
  setDeliveryRuleSearchInput,
  isDeliveryRuleDropdownOpen,
  setIsDeliveryRuleDropdownOpen,
  deliveryRuleCreating,
  deliveryRuleFilterSearch,
  setDeliveryRuleFilterSearch,
  selectedDeliveryRuleProducts,
  promoProductsCatalog,
  collections,
  handleSaveDeliveryRule,
  handleCancelEditDeliveryRule,
  handleStartEditDeliveryRule,
  handleToggleDeliveryRule,
  handleDeleteDeliveryRule,
}: DeliveryTabProps) {
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
                Manage Delivery & Shipping Charges
              </h2>
            </div>
            <p className="text-xs opacity-60 font-medium">
              Configure delivery fees and estimated timeframes for Inside Dhaka
              and Outside Dhaka. Customers will select these during checkout.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {hasDeliveryChanges && (
              <button
                type="button"
                onClick={() => setDeliverySettings(initialDeliverySettings)}
                className="px-4 py-2.5 rounded-xl border border-foreground/15 text-xs font-bold uppercase tracking-wider hover:bg-foreground/5 transition-all text-foreground/70"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              disabled={savingDeliverySettings || !hasDeliveryChanges}
              onClick={() => handleSaveDeliverySettings()}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-button-bg text-button-fg rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingDeliverySettings ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
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
                    In Side Dhaka Delivery
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                    Default Standard Area
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Delivery Charge (Taka / BDT) *
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
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <p className="text-[10px] opacity-50 font-medium">
                  Amount added to customer order when Inside Dhaka is chosen
                  (e.g. 60 tk).
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Estimated Delivery Timeframe
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
                  className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Outside Dhaka Config */}
            <div className="p-6 rounded-3xl bg-primary/5 dark:bg-primary/30 border border-foreground/10 space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-black text-sm text-foreground">
                    Out Side Dhaka Delivery
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Nationwide / Regional Area
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Delivery Charge (Taka / BDT) *
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
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <p className="text-[10px] opacity-50 font-medium">
                  Amount added to customer order when Outside Dhaka is chosen
                  (e.g. 130 tk).
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Estimated Delivery Timeframe
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
                  className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Section Divider */}
        <div className="pt-8 border-t border-foreground/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                <span>Free & Delivery Offers</span>
                <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[10px] font-bold">
                  {deliveryRulesList.length} Rules
                </span>
              </h3>
              <p className="text-xs opacity-60 font-medium mt-0.5">
                Set Free Delivery (৳0) or Reduced Shipping fees for specific
                products or entire collections.
              </p>
            </div>
          </div>

          {/* Delivery Rules Form + Rules List Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Create / Edit Rule Form */}
            <div className="lg:col-span-5 bg-primary/5 dark:bg-primary/20 border border-foreground/10 p-6 rounded-3xl space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-foreground/10">
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                  {editingDeliveryRuleId
                    ? "Edit Delivery Rule"
                    : "Create Delivery Rule"}
                </h4>
                {editingDeliveryRuleId && (
                  <button
                    type="button"
                    onClick={handleCancelEditDeliveryRule}
                    className="text-[10px] font-bold text-accent hover:underline uppercase"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveDeliveryRule} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 opacity-70">
                    Rule Title *
                  </label>
                  <input
                    type="text"
                    value={deliveryRuleTitle}
                    onChange={(e) => setDeliveryRuleTitle(e.target.value)}
                    placeholder="e.g. Free Delivery on Winter Jacket"
                    required
                    className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Target Scope Switcher */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                    Apply Offer To *
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-primary/5 dark:bg-primary/20 rounded-xl border border-foreground/10">
                    <button
                      type="button"
                      onClick={() => setDeliveryRuleTargetType("product")}
                      className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        deliveryRuleTargetType === "product"
                          ? "bg-secondary text-foreground shadow-sm"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      Specific Products
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryRuleTargetType("collection")}
                      className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        deliveryRuleTargetType === "collection"
                          ? "bg-secondary text-foreground shadow-sm"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      Collection
                    </button>
                  </div>
                </div>

                {/* Target = Product */}
                {deliveryRuleTargetType === "product" && (
                  <div className="relative">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                        Select Products
                      </label>
                      {deliveryRuleSelectedProductIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeliveryRuleSelectedProductIds([]);
                            setDeliveryRuleSearchInput("");
                          }}
                          className="text-[9px] font-bold text-red-500 hover:underline uppercase"
                        >
                          Clear All ({deliveryRuleSelectedProductIds.length})
                        </button>
                      )}
                    </div>

                    {/* Selected Chips */}
                    {selectedDeliveryRuleProducts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 rounded-xl bg-secondary border border-foreground/10 max-h-32 overflow-y-auto">
                        {selectedDeliveryRuleProducts.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-background text-foreground border border-foreground/15 text-[10px] font-bold"
                          >
                            <span className="truncate max-w-[120px]">
                              #{p.id} {p.title}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setDeliveryRuleSelectedProductIds((prev) =>
                                  prev.filter((id) => id !== p.id)
                                )
                              }
                              className="text-foreground/50 hover:text-red-500 font-black ml-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <input
                      type="text"
                      value={deliveryRuleSearchInput}
                      onFocus={() => setIsDeliveryRuleDropdownOpen(true)}
                      onChange={(e) => {
                        setDeliveryRuleSearchInput(e.target.value);
                        setIsDeliveryRuleDropdownOpen(true);
                      }}
                      placeholder="Search products for delivery offer..."
                      className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                    />

                    {/* Suggestions Dropdown */}
                    {isDeliveryRuleDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setIsDeliveryRuleDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-secondary border border-foreground/15 rounded-2xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-foreground/10 p-1.5 backdrop-blur-md">
                          {(() => {
                            const query = deliveryRuleSearchInput
                              .toLowerCase()
                              .trim();
                            const matches = promoProductsCatalog.filter(
                              (prod) =>
                                !query ||
                                prod.title.toLowerCase().includes(query) ||
                                String(prod.id).includes(query)
                            );

                            if (matches.length === 0) {
                              return (
                                <div className="p-3 text-center text-xs font-bold opacity-50">
                                  No products found matching &ldquo;
                                  {deliveryRuleSearchInput}&rdquo;
                                </div>
                              );
                            }

                            return (
                              <>
                                <div className="p-2 flex justify-between items-center text-[10px] font-bold text-foreground/60">
                                  <span>
                                    {matches.length} matching products
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const matchIds = matches.map((m) => m.id);
                                      setDeliveryRuleSelectedProductIds(
                                        (prev) =>
                                          Array.from(
                                            new Set([...prev, ...matchIds])
                                          )
                                      );
                                    }}
                                    className="text-accent hover:underline uppercase"
                                  >
                                    + Select All ({matches.length})
                                  </button>
                                </div>
                                {matches.map((prod) => {
                                  const isSelected =
                                    deliveryRuleSelectedProductIds.includes(
                                      prod.id
                                    );
                                  return (
                                    <div
                                      key={prod.id}
                                      onClick={() => {
                                        setDeliveryRuleSelectedProductIds(
                                          (prev) =>
                                            prev.includes(prod.id)
                                              ? prev.filter(
                                                  (id) => id !== prod.id
                                                )
                                              : [...prev, prod.id]
                                        );
                                      }}
                                      className={`p-2 rounded-xl cursor-pointer flex items-center justify-between gap-2.5 transition-all ${
                                        isSelected
                                          ? "bg-accent/20 border border-accent/40"
                                          : "hover:bg-primary/5 dark:hover:bg-primary/30"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {}}
                                          className="w-3.5 h-3.5 rounded accent-accent shrink-0 cursor-pointer pointer-events-none"
                                        />
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-foreground truncate">
                                            #{prod.id} {prod.title}
                                          </p>
                                        </div>
                                      </div>
                                      <span
                                        className={`text-[10px] font-bold shrink-0 ${
                                          isSelected
                                            ? "text-accent"
                                            : "text-foreground/40"
                                        }`}
                                      >
                                        {isSelected ? "Selected" : "+ Add"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Target = Collection */}
                {deliveryRuleTargetType === "collection" && (
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 opacity-70">
                      Select Collection *
                    </label>
                    <select
                      value={deliveryRuleCollectionId}
                      onChange={(e) =>
                        setDeliveryRuleCollectionId(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      required
                      className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">-- Choose Collection --</option>
                      {collections.map((col) => (
                        <option key={col.id} value={col.id}>
                          #{col.id} {col.title} ({col.product_count || 0}{" "}
                          products)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Benefit Type */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                    Offer Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-primary/5 dark:bg-primary/20 rounded-xl border border-foreground/10">
                    <button
                      type="button"
                      onClick={() => setDeliveryRuleType("free")}
                      className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        deliveryRuleType === "free"
                          ? "bg-secondary text-foreground shadow-sm"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      Free Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryRuleType("reduced")}
                      className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        deliveryRuleType === "reduced"
                          ? "bg-secondary text-foreground shadow-sm"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      Custom Charge
                    </button>
                  </div>
                </div>

                {/* Reduced Charges Inputs */}
                {deliveryRuleType === "reduced" && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/80 rounded-2xl border border-foreground/10">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider mb-1 opacity-70">
                        Inside Dhaka (৳) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-foreground/50">
                          ৳
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          required
                          value={deliveryRuleInsideCharge}
                          onChange={(e) =>
                            setDeliveryRuleInsideCharge(e.target.value)
                          }
                          placeholder="e.g. 30"
                          className="w-full pl-7 pr-3 py-2 bg-background border border-foreground/15 rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider mb-1 opacity-70">
                        Outside Dhaka (৳) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-foreground/50">
                          ৳
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          required
                          value={deliveryRuleOutsideCharge}
                          onChange={(e) =>
                            setDeliveryRuleOutsideCharge(e.target.value)
                          }
                          placeholder="e.g. 60"
                          className="w-full pl-7 pr-3 py-2 bg-background border border-foreground/15 rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Minimum Quantity Requirement */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 opacity-70">
                    Minimum Quantity Required *
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={deliveryRuleMinQuantity}
                    onChange={(e) =>
                      setDeliveryRuleMinQuantity(e.target.value)
                    }
                    placeholder="e.g. 3"
                    className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                  />
                  <p className="text-[10px] opacity-60 mt-1">
                    Set to 1 for unconditional offer, or e.g. 3 to require &quot;Buy
                    3 items to get offer&quot;.
                  </p>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary border border-foreground/10">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Rule Active
                    </p>
                    <p className="text-[10px] opacity-60">
                      {deliveryRuleIsActive
                        ? "Offer is active for checkout"
                        : "Rule is disabled"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDeliveryRuleIsActive(!deliveryRuleIsActive)
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      deliveryRuleIsActive
                        ? "bg-accent"
                        : "bg-foreground/20"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        deliveryRuleIsActive
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={
                    deliveryRuleCreating ||
                    !deliveryRuleTitle.trim() ||
                    (deliveryRuleTargetType === "product" &&
                      deliveryRuleSelectedProductIds.length === 0) ||
                    (deliveryRuleTargetType === "collection" &&
                      !deliveryRuleCollectionId)
                  }
                  className="w-full py-3 bg-button-bg text-button-fg rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                >
                  {editingDeliveryRuleId
                    ? deliveryRuleCreating
                      ? "Updating Rule..."
                      : "Update Delivery Rule"
                    : deliveryRuleCreating
                      ? "Creating Rule..."
                      : "Create Delivery Rule"}
                </button>
              </form>
            </div>

            {/* Right: Active Delivery Rules List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-foreground/10">
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Existing Delivery Offers ({deliveryRulesList.length})
                </h4>
                <input
                  type="text"
                  value={deliveryRuleFilterSearch}
                  onChange={(e) =>
                    setDeliveryRuleFilterSearch(e.target.value)
                  }
                  placeholder="Search rules..."
                  className="px-3 py-1.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full sm:w-48 focus:ring-2 focus:ring-accent"
                />
              </div>

              {(() => {
                const filtered = deliveryRulesList.filter((r) => {
                  const q = deliveryRuleFilterSearch.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    r.title.toLowerCase().includes(q) ||
                    (r.collection_title &&
                      r.collection_title.toLowerCase().includes(q))
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center rounded-3xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 text-xs opacity-50 font-bold">
                      {deliveryRuleFilterSearch
                        ? `No delivery rules found matching "${deliveryRuleFilterSearch}".`
                        : "No custom delivery rules configured yet. Create a free or reduced delivery rule above."}
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                    {filtered.map((rule) => {
                      const isFree = rule.rule_type === "free";
                      const isBeingEdited = editingDeliveryRuleId === rule.id;

                      return (
                        <div
                          key={rule.id}
                          onClick={() => handleStartEditDeliveryRule(rule)}
                          className={`p-5 rounded-2xl border-2 flex flex-col justify-between gap-4 shadow-xs relative overflow-hidden group cursor-pointer transition-all ${
                            isBeingEdited
                              ? "border-accent shadow-md bg-accent/5"
                              : rule.is_active
                                ? "bg-secondary border-foreground/10 hover:border-accent/40"
                                : "bg-secondary/40 border-foreground/10 opacity-60 hover:opacity-90 hover:border-accent/40"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-black text-sm uppercase px-3 py-1 rounded-lg bg-accent/15 text-accent border border-accent/30 tracking-wider">
                                    {isFree
                                      ? "FREE DELIVERY"
                                      : "CUSTOM CHARGE"}
                                  </span>
                                  {Number(rule.min_quantity || 1) > 1 && (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-accent/20 text-accent border border-accent/30">
                                      Min {rule.min_quantity} Qty
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleDeliveryRule(rule);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all flex items-center gap-1 ${
                                      rule.is_active
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                                        : "bg-foreground/15 text-foreground/60 hover:bg-foreground/25"
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        rule.is_active
                                          ? "bg-emerald-500"
                                          : "bg-foreground/50"
                                      }`}
                                    />
                                    {rule.is_active ? "Active" : "Disabled"}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-secondary/80 border border-foreground/5 text-xs space-y-1">
                              <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">
                                SCOPE:{" "}
                                {rule.target_type === "product"
                                  ? "SPECIFIC PRODUCTS"
                                  : "COLLECTION"}
                              </p>
                              {rule.target_type === "product" ? (
                                <div>
                                  <p className="font-bold text-foreground">
                                    {rule.product_count ||
                                      (rule.products_details
                                        ? rule.products_details.length
                                        : 0)}{" "}
                                    Product(s) Selected
                                  </p>
                                  {rule.products_details &&
                                    rule.products_details.length > 0 && (
                                      <p className="text-[11px] opacity-70 font-normal truncate mt-0.5">
                                        {rule.products_details
                                          .map((p) => p.title)
                                          .join(", ")}
                                      </p>
                                    )}
                                </div>
                              ) : (
                                <p className="font-bold text-foreground">
                                  Collection:{" "}
                                  {rule.collection_title ||
                                    `#${rule.collection}`}
                                </p>
                              )}
                            </div>

                            <div className="flex justify-between items-center text-[10px] opacity-70 font-semibold pt-1">
                              <span>
                                Rule:{" "}
                                <strong className="text-foreground">
                                  {rule.title}
                                </strong>
                              </span>
                              {!isFree && (
                                <span>
                                  Inside:{" "}
                                  <strong className="text-accent">
                                    ৳{rule.inside_dhaka_charge}
                                  </strong>{" "}
                                  | Outside:{" "}
                                  <strong className="text-accent">
                                    ৳{rule.outside_dhaka_charge}
                                  </strong>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-foreground/10 flex justify-end items-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDeliveryRule(rule.id, rule.title);
                              }}
                              className="text-[10px] font-extrabold text-red-500 hover:underline uppercase tracking-wider"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
