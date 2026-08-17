"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { ProductVariant } from "@/types/product";

interface ProductVariantsManagerProps {
  productId: number;
  productTitle: string;
  basePrice: number;
  token: string | null;
  onVariantsUpdated?: () => void;
}

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export default function ProductVariantsManager({
  productId,
  productTitle,
  basePrice,
  token,
  onVariantsUpdated,
}: ProductVariantsManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);

  // Form State
  const [variantForm, setVariantForm] = useState({
    name: "",
    color_name: "",
    color_code: "#C84248",
    size: "",
    price_override: "",
    inventory: "10",
    is_active: true,
  });

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/store/products/${productId}/variants/`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.results || [];
        setVariants(items);
      }
    } catch (err) {
      console.error("Failed to fetch product variants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchVariants();
    }
  }, [productId]);

  const handleOpenAddModal = () => {
    setEditingVariant(null);
    setVariantForm({
      name: "",
      color_name: "",
      color_code: "#C84248",
      size: "",
      price_override: "",
      inventory: "10",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (v: ProductVariant) => {
    setEditingVariant(v);
    setVariantForm({
      name: v.name || "",
      color_name: v.color_name || "",
      color_code: v.color_code || "#C84248",
      size: v.size || "",
      price_override: v.price_override ? String(v.price_override) : "",
      inventory: String(v.inventory ?? 0),
      is_active: v.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!variantForm.name.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please enter a variant name.",
      });
      return;
    }

    try {
      const payload: any = {
        name: variantForm.name.trim(),
        color_name: variantForm.color_name.trim() || null,
        color_code: variantForm.color_code.trim() || null,
        size: variantForm.size.trim() || null,
        inventory: parseInt(variantForm.inventory, 10) || 0,
        is_active: variantForm.is_active,
        price_override: variantForm.price_override.trim()
          ? parseFloat(variantForm.price_override)
          : null,
      };

      const url = editingVariant
        ? `${API_BASE}/store/products/${productId}/variants/${editingVariant.id}/`
        : `${API_BASE}/store/products/${productId}/variants/`;

      const method = editingVariant ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: editingVariant ? "Variant updated successfully!" : "Variant created successfully!",
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        setIsModalOpen(false);
        fetchVariants();
        if (onVariantsUpdated) onVariantsUpdated();
      } else {
        const errorData = await res.json();
        Swal.fire({
          icon: "error",
          title: "Failed to save variant",
          text: JSON.stringify(errorData),
        });
      }
    } catch (err) {
      console.error("Save variant error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not save variant.",
      });
    }
  };

  const handleDeleteVariant = async (v: ProductVariant) => {
    if (!token) return;

    const confirm = await Swal.fire({
      title: `Delete variant "${v.name}"?`,
      text: "This will remove the shade/size variant from this product.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/store/products/${productId}/variants/${v.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `JWT ${token}`,
        },
      });

      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Variant deleted!",
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        fetchVariants();
        if (onVariantsUpdated) onVariantsUpdated();
      }
    } catch (err) {
      console.error("Delete variant error:", err);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-foreground/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            <span>Product Variants ({variants.length})</span>
          </h3>
          <p className="text-[10px] opacity-60">
            Add colors, shades, sizes, or custom pricing options for this cosmetic product.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-3 py-1.5 bg-accent text-button-fg rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1 cursor-pointer"
        >
          <span>+ Add Variant</span>
        </button>
      </div>

      {/* Variants List */}
      {loading ? (
        <div className="py-4 text-center text-xs opacity-50">Loading variants...</div>
      ) : variants.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {variants.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 hover:border-foreground/20 transition-all text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Color Swatch Circle */}
                {v.color_code ? (
                  <div
                    className="w-6 h-6 rounded-full border border-white/30 shadow-xs flex-shrink-0"
                    style={{ backgroundColor: v.color_code }}
                    title={v.color_name || v.color_code}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-foreground/10 flex items-center justify-center text-[9px] font-bold opacity-60 flex-shrink-0">
                    N/A
                  </div>
                )}

                <div className="truncate">
                  <div className="font-bold text-foreground truncate flex items-center gap-1.5">
                    <span>{v.name}</span>
                    {v.size && (
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[9px] font-black uppercase text-foreground/80">
                        {v.size}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] opacity-60 flex items-center gap-2">
                    {v.color_name && <span>Color: {v.color_name}</span>}
                    <span>Stock: {v.inventory}</span>
                    <span className="text-accent font-bold">
                      ${Number(v.effective_price || basePrice).toFixed(2)}
                      {v.price_override && " (Override)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(v)}
                  className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-[10px] font-bold uppercase transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteVariant(v)}
                  className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-500 text-[10px] font-bold uppercase transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-dashed border-foreground/20 text-center text-xs opacity-60 bg-primary/5">
          No variants added yet. This product currently uses its base price (${Number(basePrice).toFixed(2)}) and default inventory.
        </div>
      )}

      {/* Add / Edit Variant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-secondary text-foreground rounded-3xl p-6 max-w-md w-full shadow-2xl border border-foreground/10 relative max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-foreground/10 mb-4">
              <h4 className="text-sm font-black uppercase tracking-tight">
                {editingVariant ? "Edit Product Variant" : "Add New Product Variant"}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVariant} className="space-y-3.5">
              {/* Variant Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Variant Title / Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={variantForm.name}
                  onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  placeholder="e.g. 01 Velvet Rose, 50ml, Medium Beige"
                  className="w-full px-3.5 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Color Settings (Shades) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Shade / Color Name
                  </label>
                  <input
                    type="text"
                    value={variantForm.color_name}
                    onChange={(e) => setVariantForm({ ...variantForm, color_name: e.target.value })}
                    placeholder="e.g. Velvet Rose"
                    className="w-full px-3.5 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Color Swatch Hex
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={variantForm.color_code || "#C84248"}
                      onChange={(e) => setVariantForm({ ...variantForm, color_code: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-foreground/15 bg-transparent p-0 flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={variantForm.color_code}
                      onChange={(e) => setVariantForm({ ...variantForm, color_code: e.target.value })}
                      placeholder="#C84248"
                      className="w-full px-2.5 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Size / Volume */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Size / Volume
                  </label>
                  <input
                    type="text"
                    value={variantForm.size}
                    onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                    placeholder="e.g. 30ml, 50ml"
                    className="w-full px-3.5 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Inventory */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={variantForm.inventory}
                    onChange={(e) => setVariantForm({ ...variantForm, inventory: e.target.value })}
                    className="w-full px-3.5 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Price Override */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Custom Price Override ($) <span className="opacity-50 lowercase">(leave blank to use base price ${Number(basePrice).toFixed(2)})</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={variantForm.price_override}
                  onChange={(e) => setVariantForm({ ...variantForm, price_override: e.target.value })}
                  placeholder={`Base Price: $${Number(basePrice).toFixed(2)}`}
                  className="w-full px-3.5 py-2 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-foreground/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-primary/10 text-xs font-bold uppercase hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-button-bg text-button-fg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                >
                  {editingVariant ? "Save Changes" : "Create Variant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
