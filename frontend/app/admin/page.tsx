"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import ImageUploadModal from "@/components/ui/ImageUploadModal";
import ProductImage from "@/components/ui/ProductImage";
import ThemeToggle from "@/components/ui/ThemeToggle";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

interface Product {
  id: number;
  title: string;
  unit_price: number;
  discount_percent?: number;
  discounted_price?: number;
  inventory: number;
  slug: string;
  collection: number;
  short_description?: string;
  description?: string;
  images?: { id?: number; image: string }[];
  is_trending?: boolean;
}

interface Collection {
  id: number;
  title: string;
  product_count: number;
  image?: string | null;
  is_featured?: boolean;
}

interface OrderItem {
  id: number;
  product: { id: number; title: string; unit_price: number };
  quantity: number;
  unit_price: number;
}

interface Order {
  id: number;
  customer: number;
  customer_name?: string;
  payment_status: string;
  placed_at?: string;
  shipping_address?: string;
  phone?: string;
  payment_method?: string;
  transaction_id?: string;
  transaction_phone_no?: string;
  items?: OrderItem[];
}
interface CustomerItem {
  id: number;
  phone: string;
  birth_date: string | null;
  membership: string;
  user_id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  customer_name?: string;
}

interface CouponItem {
  id: number;
  code: string;
  discount_percent: number;
  valid_from: string;
  valid_to: string;
  target_type: "product" | "collection";
  collection?: number | null;
  collection_title?: string | null;
  product_count?: number;
  products_details?: { id: number; title: string; unit_price: number }[];
  is_active: boolean;
  created_at: string;
}

type Tab = "products" | "collections" | "orders" | "customers" | "promotions" | "coupons";

export default function AdminDashboardPage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    logout();
    router.push("/login");
  };

  const [activeTab, setActiveTab] = useState<Tab>("products");

  // State data
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedPhotos, setHasUnsavedPhotos] = useState(false);

  // Promotion states
  const [allProductsForPromo, setAllProductsForPromo] = useState<Product[]>([]);
  const [promoSelectedProductIds, setPromoSelectedProductIds] = useState<number[]>([]);
  const [promoSearchInput, setPromoSearchInput] = useState<string>("");
  const [isPromoDropdownOpen, setIsPromoDropdownOpen] = useState<boolean>(false);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<string>("20");
  const [promoApplying, setPromoApplying] = useState<boolean>(false);
  const [promoSearch, setPromoSearch] = useState("");
  const [activePromoSearch, setActivePromoSearch] = useState("");
  const [promoPage, setPromoPage] = useState(1);

  // Coupon states
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);
  const [couponsList, setCouponsList] = useState<CouponItem[]>([]);
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponDiscountPercent, setCouponDiscountPercent] = useState<string>("20");
  const [couponValidTo, setCouponValidTo] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 16);
  });
  const [couponTargetType, setCouponTargetType] = useState<"product" | "collection">("product");
  const [couponSelectedProductIds, setCouponSelectedProductIds] = useState<number[]>([]);
  const [couponCollectionId, setCouponCollectionId] = useState<number | "">("");
  const [couponIsActive, setCouponIsActive] = useState<boolean>(true);
  const [couponSearchInput, setCouponSearchInput] = useState<string>("");
  const [isCouponDropdownOpen, setIsCouponDropdownOpen] = useState<boolean>(false);
  const [couponCreating, setCouponCreating] = useState<boolean>(false);
  const [couponFilterSearch, setCouponFilterSearch] = useState<string>("");

  // Search states
  const [productSearch, setProductSearch] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const [activeProductQuery, setActiveProductQuery] = useState("");
  const [activeCollectionQuery, setActiveCollectionQuery] = useState("");
  const [activeOrderQuery, setActiveOrderQuery] = useState("");
  const [activeCustomerQuery, setActiveCustomerQuery] = useState("");

  const [customerHistoryModal, setCustomerHistoryModal] = useState<{
    customerId: number;
    orders: Order[];
  } | null>(null);

  // Selected Product for Edit
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  // Product Form State
  const [productForm, setProductForm] = useState({
    title: "",
    slug: "",
    unit_price: "",
    inventory: "10",
    collection: "",
    short_description: "",
    description: "",
  });

  // New Collection Form
  const [newCollectionTitle, setNewCollectionTitle] = useState("");

  const [prodPage, setProdPage] = useState(1);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  const fetchAdminData = async (pageNumber = prodPage, searchQuery = activeProductQuery) => {
    if (!token) return;
    setLoading(true);
    try {
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const prodRes = await fetch(
        `${API_BASE}/store/products/?page=${pageNumber}${searchParam}`,
        { cache: "no-store" }
      );
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : prodData.results || []);
        setTotalProductsCount(prodData.count || (Array.isArray(prodData) ? prodData.length : 0));
      }

      // Fetch Collections
      const colRes = await fetch(`${API_BASE}/store/collections/`, {
        cache: "no-store",
      });
      if (colRes.ok) {
        const colData = await colRes.json();
        const fetchedCols = Array.isArray(colData) ? colData : colData.results || [];
        setCollections(fetchedCols);
        setProductForm((prev) => ({
          ...prev,
          collection:
            prev.collection && fetchedCols.some((c: any) => String(c.id) === String(prev.collection))
              ? prev.collection
              : fetchedCols.length > 0
              ? String(fetchedCols[0].id)
              : "",
        }));
      }

      // Fetch Orders
      const orderRes = await fetch(`${API_BASE}/store/orders/`, {
        headers: { Authorization: `JWT ${token}` },
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(
          Array.isArray(orderData) ? orderData : orderData.results || [],
        );
      }

      // Fetch Customers
      const custRes = await fetch(`${API_BASE}/store/customers/`, {
        headers: { Authorization: `JWT ${token}` },
      });
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(
          Array.isArray(custData) ? custData : custData.results || [],
        );
      }
      // Fetch All Products For Promo & Coupons
      fetchAllProductsForPromo();
      fetchCoupons();
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${API_BASE}/store/coupons/`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCouponsList(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
    }
  };

  const handleEditCoupon = (coupon: CouponItem) => {
    setEditingCouponId(coupon.id);
    setCouponCode(coupon.code);
    setCouponDiscountPercent(String(coupon.discount_percent));
    setCouponValidTo(
      coupon.valid_to
        ? new Date(coupon.valid_to).toISOString().slice(0, 16)
        : ""
    );
    setCouponTargetType(coupon.target_type);
    setCouponCollectionId(coupon.collection || "");
    setCouponIsActive(coupon.is_active);
    if (coupon.target_type === "product" && coupon.products_details) {
      setCouponSelectedProductIds(coupon.products_details.map((p) => p.id));
    } else {
      setCouponSelectedProductIds([]);
    }
    setCouponSearchInput("");
  };

  const handleCancelEditCoupon = () => {
    setEditingCouponId(null);
    setCouponCode("");
    setCouponDiscountPercent("20");
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setCouponValidTo(d.toISOString().slice(0, 16));
    setCouponTargetType("product");
    setCouponSelectedProductIds([]);
    setCouponCollectionId("");
    setCouponIsActive(true);
    setCouponSearchInput("");
  };

  const handleToggleCouponActive = async (coupon: CouponItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextStatus = !coupon.is_active;
    try {
      const res = await fetch(`${API_BASE}/store/coupons/${coupon.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextStatus }),
      });
      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: `Coupon "${coupon.code}" is now ${nextStatus ? "Active" : "Disabled"}`,
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        fetchCoupons();
        if (editingCouponId === coupon.id) {
          setCouponIsActive(nextStatus);
        }
      } else {
        Swal.fire("Error", "Failed to update coupon status.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Network error while updating status.", "error");
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) {
      Swal.fire("Error", "Please enter a coupon code.", "error");
      return;
    }
    const pct = parseFloat(couponDiscountPercent);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      Swal.fire("Error", "Please enter a valid discount percentage (1-100).", "error");
      return;
    }
    if (!couponValidTo) {
      Swal.fire("Error", "Please select an expiration date and time.", "error");
      return;
    }
    if (couponTargetType === "product" && couponSelectedProductIds.length === 0) {
      Swal.fire("Error", "Please select at least one product for this coupon.", "error");
      return;
    }
    if (couponTargetType === "collection" && !couponCollectionId) {
      Swal.fire("Error", "Please select a collection for this coupon.", "error");
      return;
    }

    const targetDesc = couponTargetType === "product"
      ? `${couponSelectedProductIds.length} product(s)`
      : `Collection "${collections.find((c) => c.id === Number(couponCollectionId))?.title || couponCollectionId}"`;

    const isEdit = editingCouponId !== null;
    const confirm = await Swal.fire({
      title: isEdit ? `Update Coupon ${cleanCode}?` : `Create Coupon ${cleanCode}?`,
      text: `Are you sure you want to ${isEdit ? "update" : "create"} coupon "${cleanCode}" with a ${pct}% discount for ${targetDesc}? Status: ${couponIsActive ? "ACTIVE" : "DISABLED"}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--accent)",
      cancelButtonColor: "var(--button-bg)",
      confirmButtonText: isEdit ? "Yes, Update Coupon" : "Yes, Create Coupon",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      setCouponCreating(true);
      const url = isEdit ? `${API_BASE}/store/coupons/${editingCouponId}/` : `${API_BASE}/store/coupons/`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          discount_percent: pct,
          valid_to: new Date(couponValidTo).toISOString(),
          target_type: couponTargetType,
          product_ids: couponTargetType === "product" ? couponSelectedProductIds : [],
          collection: couponTargetType === "collection" ? Number(couponCollectionId) : null,
          is_active: couponIsActive,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isEdit ? `Coupon "${cleanCode}" updated!` : `Coupon "${cleanCode}" created!`,
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        handleCancelEditCoupon();
        fetchCoupons();
      } else {
        const errorMsg = data.code ? `Code Error: ${data.code.join(" ")}` : data.error || `Failed to ${isEdit ? "update" : "create"} coupon.`;
        Swal.fire("Error", errorMsg, "error");
      }
    } catch (err) {
      Swal.fire("Error", `Network error while ${isEdit ? "updating" : "creating"} coupon.`, "error");
    } finally {
      setCouponCreating(false);
    }
  };

  const handleDeleteCoupon = async (couponId: number, code: string) => {
    const confirm = await Swal.fire({
      title: "Delete Coupon?",
      text: `Are you sure you want to permanently delete coupon "${code}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent)",
      cancelButtonColor: "var(--button-bg)",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/store/coupons/${couponId}/`, {
        method: "DELETE",
      });
      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: `Coupon "${code}" deleted.`,
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        if (editingCouponId === couponId) {
          handleCancelEditCoupon();
        }
        fetchCoupons();
      } else {
        Swal.fire("Error", "Failed to delete coupon.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Network error while deleting coupon.", "error");
    }
  };

  const fetchAllProductsForPromo = async () => {
    try {
      const res = await fetch(`${API_BASE}/store/products/all/`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAllProductsForPromo(Array.isArray(data) ? data : data.results || []);
      } else {
        const fallbackRes = await fetch(`${API_BASE}/store/products/?page_size=1000`, { cache: "no-store" });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setAllProductsForPromo(Array.isArray(fallbackData) ? fallbackData : fallbackData.results || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch all products for promo:", err);
    }
  };

  const promoProductsCatalog = allProductsForPromo.length > 0 ? allProductsForPromo : products;
  const selectedPromoProducts = promoProductsCatalog.filter((p) => promoSelectedProductIds.includes(p.id));
  const selectedCouponProducts = promoProductsCatalog.filter((p) => couponSelectedProductIds.includes(p.id));

  const handleApplyPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (promoSelectedProductIds.length === 0) {
      Swal.fire("Error", "Please select at least one product.", "error");
      return;
    }
    const pct = parseFloat(promoDiscountPercent);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      Swal.fire("Error", "Please enter a valid discount percentage (0-100).", "error");
      return;
    }

    const confirm = await Swal.fire({
      title: "Apply Discount?",
      text: `Are you sure you want to apply a ${pct}% discount to ${promoSelectedProductIds.length} selected product(s)?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--accent)",
      cancelButtonColor: "var(--button-bg)",
      confirmButtonText: `Yes, Apply ${pct}% OFF`,
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) {
      return;
    }

    try {
      setPromoApplying(true);
      const res = await fetch(`${API_BASE}/store/promotions/apply/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "product",
          product_ids: promoSelectedProductIds,
          discount_percent: pct,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire("Success!", data.message || "Promotion applied successfully!", "success");
        setPromoSelectedProductIds([]);
        setPromoSearchInput("");
        fetchAdminData();
        fetchAllProductsForPromo();
      } else {
        Swal.fire("Error", data.error || "Failed to apply promotion.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Network error.", "error");
    } finally {
      setPromoApplying(false);
    }
  };

  const handleRemovePromotion = async (targetType: "product" | "collection" | "all", targetId?: number) => {
    const isAll = targetType === "all";
    const confirm = await Swal.fire({
      title: isAll ? "Remove All Discounts?" : "Remove Promotion?",
      text: isAll
        ? "Are you sure you want to remove discounts from ALL products across the entire store?"
        : "Are you sure you want to remove this promotion discount?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent)",
      cancelButtonColor: "var(--button-bg)",
      confirmButtonText: isAll ? "Yes, Remove All" : "Yes, Remove",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/store/promotions/remove/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: targetType,
          product_id: targetType === "product" ? targetId : undefined,
          collection_id: targetType === "collection" ? targetId : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: data.message || "Promotion removed.",
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        fetchAdminData();
        fetchAllProductsForPromo();
      } else {
        Swal.fire("Error", data.error || "Failed to remove promotion.", "error");
      }
    } catch (err) {
      console.error("Failed to remove promotion", err);
      Swal.fire("Error", "Network error while removing promotion.", "error");
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    if (user && !user.is_staff) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You must be an admin/staff member to view this page.",
      });
      router.push("/");
      return;
    }

    fetchAdminData(prodPage, activeProductQuery);
  }, [user, token, authLoading, router, prodPage, activeProductQuery]);

  const filteredCollections = collections.filter(
    (c) =>
      c.title.toLowerCase().includes(activeCollectionQuery.toLowerCase()) ||
      String(c.id).includes(activeCollectionQuery)
  );

  const filteredOrders = orders.filter(
    (o) =>
      String(o.id).includes(activeOrderQuery) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(activeOrderQuery.toLowerCase())) ||
      String(o.customer).includes(activeOrderQuery) ||
      (o.payment_status && o.payment_status.toLowerCase().includes(activeOrderQuery.toLowerCase()))
  );

  const filteredCustomers = customers.filter(
    (c) =>
      String(c.id).includes(activeCustomerQuery) ||
      (c.customer_name && c.customer_name.toLowerCase().includes(activeCustomerQuery.toLowerCase())) ||
      (c.phone && c.phone.includes(activeCustomerQuery)) ||
      (c.membership && c.membership.toLowerCase().includes(activeCustomerQuery.toLowerCase()))
  );

  const handleViewCustomerHistory = async (customerPk: number) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/store/customers/${customerPk}/history/`, {
        headers: { Authorization: `JWT ${token}` },
      });

      if (res.ok) {
        const historyOrders = await res.json();
        setCustomerHistoryModal({
          customerId: customerPk,
          orders: Array.isArray(historyOrders) ? historyOrders : [],
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to load history",
          text: "Could not fetch customer order history.",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Select Product to populate left form for editing
  const handleSelectProduct = async (prod: Product) => {
    if (editingProductId === prod.id) return;
    if (hasUnsavedPhotos) {
      const confirm = await Swal.fire({
        title: "Photos Not Uploaded!",
        text: "You have selected photo(s) that are not uploaded yet. Switching products will discard these un-uploaded photos.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "var(--accent)",
        cancelButtonColor: "var(--button-bg)",
        confirmButtonText: "Discard & Switch Product",
        cancelButtonText: "Stay Here",
      });

      if (!confirm.isConfirmed) return;
      setHasUnsavedPhotos(false);
    }

    setEditingProductId(prod.id);
    setProductForm({
      title: prod.title || "",
      slug: prod.slug || "",
      unit_price: String(prod.unit_price || ""),
      inventory: String(prod.inventory || 0),
      collection: String(prod.collection || 1),
      short_description: (prod as any).short_description || "",
      description: (prod as any).description || "",
    });
  };

  // Reset form to Add mode
  const handleCancelEdit = async () => {
    if (hasUnsavedPhotos) {
      const confirm = await Swal.fire({
        title: "Photos Not Uploaded!",
        text: "You have selected photo(s) that are not uploaded yet. Canceling edit will discard these un-uploaded photos.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "var(--accent)",
        cancelButtonColor: "var(--button-bg)",
        confirmButtonText: "Discard & Cancel",
        cancelButtonText: "Stay Here",
      });

      if (!confirm.isConfirmed) return;
      setHasUnsavedPhotos(false);
    }

    setEditingProductId(null);
    setProductForm({
      title: "",
      slug: "",
      unit_price: "",
      inventory: "10",
      collection: collections.length > 0 ? String(collections[0].id) : "",
      short_description: "",
      description: "",
    });
  };

  // Create or Update Product (POST or PUT)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!productForm.short_description.trim() || !productForm.description.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Descriptions Required",
        text: "Please enter both a Short Description and a Details Description for the product.",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    const selectedCollectionId =
      parseInt(productForm.collection) ||
      (collections.length > 0 ? collections[0].id : null);

    if (!selectedCollectionId) {
      Swal.fire({
        icon: "warning",
        title: "Collection Required",
        text: "Please select a valid collection for the product.",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    try {
      const payload = {
        title: productForm.title,
        slug:
          productForm.slug ||
          productForm.title.toLowerCase().replace(/\s+/g, "-"),
        unit_price: parseFloat(productForm.unit_price),
        inventory: parseInt(productForm.inventory),
        collection: selectedCollectionId,
        short_description: productForm.short_description,
        description: productForm.description,
      };

      const isEditing = editingProductId !== null;
      const url = isEditing
        ? `${API_BASE}/store/products/${editingProductId}/`
        : `${API_BASE}/store/products/`;
      const method = isEditing ? "PUT" : "POST";

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
          title: isEditing
            ? "Product updated successfully!"
            : "Product added successfully!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
        handleCancelEdit();
        fetchAdminData();
      } else {
        const err = await res.json();
        Swal.fire({
          icon: "error",
          title: isEditing
            ? "Failed to update product"
            : "Failed to add product",
          text: JSON.stringify(err),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Product (DELETE /store/products/{id}/)
  const handleDeleteProduct = async (productId: number) => {
    if (!token) return;

    const confirm = await Swal.fire({
      title: "Delete Product?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent)",
      cancelButtonColor: "var(--button-bg)",
      confirmButtonText: "Yes, Delete",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE}/store/products/${productId}/`, {
          method: "DELETE",
          headers: { Authorization: `JWT ${token}` },
        });

        if (res.ok || res.status === 204) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: "Product deleted!",
            showConfirmButton: false,
            timer: 1500,
            toast: true,
          });
          fetchAdminData();
        } else {
          Swal.fire({
            icon: "error",
            title: "Cannot delete product (may be linked to orders).",
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleProductTrending = async (product: Product) => {
    if (!token) return;
    const newStatus = !product.is_trending;

    // Optimistic UI Update: change state immediately
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_trending: newStatus } : p))
    );

    try {
      const res = await fetch(`${API_BASE}/store/products/${product.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ is_trending: newStatus }),
      });

      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: newStatus ? "Added to Trending Now!" : "Removed from Trending Now",
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
      } else {
        // Revert on error
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_trending: !newStatus } : p))
        );
      }
    } catch (err) {
      console.error(err);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_trending: !newStatus } : p))
      );
    }
  };

  const handleToggleCollectionFeatured = async (col: Collection) => {
    if (!token) return;
    const newStatus = !col.is_featured;

    // Optimistic UI 
    setCollections((prev) =>
      prev.map((c) => (c.id === col.id ? { ...c, is_featured: newStatus } : c))
    );

    try {
      const res = await fetch(`${API_BASE}/store/collections/${col.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ is_featured: newStatus }),
      });

      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: newStatus ? "Set as Featured Category!" : "Removed from Featured Categories",
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
      } else {
        // Revert on error
        setCollections((prev) =>
          prev.map((c) => (c.id === col.id ? { ...c, is_featured: !newStatus } : c))
        );
      }
    } catch (err) {
      console.error(err);
      setCollections((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, is_featured: !newStatus } : c))
      );
    }
  };

  // Collection Edit State & Handlers
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
  const [collectionImageFile, setCollectionImageFile] = useState<File | null>(null);
  const [collectionImagePreview, setCollectionImagePreview] = useState<string | null>(null);
  const collectionFileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectCollection = (col: Collection) => {
    setEditingCollectionId(col.id);
    setNewCollectionTitle(col.title);
    setCollectionImageFile(null);
    setCollectionImagePreview(col.image || null);
    if (collectionFileInputRef.current) {
      collectionFileInputRef.current.value = "";
    }
  };

  const handleCancelCollectionEdit = () => {
    setEditingCollectionId(null);
    setNewCollectionTitle("");
    setCollectionImageFile(null);
    setCollectionImagePreview(null);
    if (collectionFileInputRef.current) {
      collectionFileInputRef.current.value = "";
    }
  };

  // Create or Update Collection (POST or PUT /store/collections/)
  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCollectionTitle.trim()) return;

    const isEditing = editingCollectionId !== null;

    // Require an image when creating a new collection
    if (!isEditing && !collectionImageFile) {
      Swal.fire({
        icon: "warning",
        title: "Cover Image Required",
        text: "Please select a cover image to create a new collection.",
      });
      return;
    }

    try {
      const url = isEditing
        ? `${API_BASE}/store/collections/${editingCollectionId}/`
        : `${API_BASE}/store/collections/`;
      const method = isEditing ? "PUT" : "POST";

      const formData = new FormData();
      formData.append("title", newCollectionTitle.trim());
      if (collectionImageFile) {
        formData.append("image", collectionImageFile);
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `JWT ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const createdOrUpdatedCol = await res.json().catch(() => null);
        if (createdOrUpdatedCol && createdOrUpdatedCol.id) {
          setCollections((prev) => {
            const exists = prev.some((c) => c.id === createdOrUpdatedCol.id);
            if (exists) {
              return prev.map((c) => (c.id === createdOrUpdatedCol.id ? { ...c, ...createdOrUpdatedCol } : c));
            }
            return [createdOrUpdatedCol, ...prev];
          });
        }

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isEditing
            ? "Collection updated successfully!"
            : "Collection created successfully!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
        setEditingCollectionId(null);
        setNewCollectionTitle("");
        setCollectionImageFile(null);
        setCollectionImagePreview(null);
        if (collectionFileInputRef.current) {
          collectionFileInputRef.current.value = "";
        }
        fetchAdminData();
      } else {
        const errData = await res.json().catch(() => null);
        let errMsg = "Something went wrong.";
        if (typeof errData === "object" && errData !== null) {
          errMsg = Object.entries(errData)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : JSON.stringify(val)}`)
            .join("\n");
        } else if (res.statusText) {
          errMsg = `Server error ${res.status}: ${res.statusText}`;
        }
        Swal.fire({
          icon: "error",
          title: isEditing ? "Failed to update collection" : "Failed to create collection",
          text: errMsg,
        });
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: err?.message || "Failed to reach the server.",
      });
    }
  };

  // Delete Collection Photo
  const handleDeleteCollectionPhoto = async () => {
    if (!token) return;

    if (!editingCollectionId && collectionImagePreview) {
      setCollectionImageFile(null);
      setCollectionImagePreview(null);
      return;
    }

    const confirm = await Swal.fire({
      title: "Delete Collection Photo?",
      text: "Are you sure you want to remove the cover photo from this collection?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent)",
      cancelButtonColor: "var(--button-bg)",
      confirmButtonText: "Yes, Delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/store/collections/${editingCollectionId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ image: null }),
      });

      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Collection photo removed!",
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        setCollectionImageFile(null);
        setCollectionImagePreview(null);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Collection 
  const handleDeleteCollection = async (col: Collection) => {
    if (!token) return;

    if (col.product_count > 0) {
      Swal.fire({
        icon: "error",
        title: "Cannot Delete Collection",
        text: `Collection "${col.title}" cannot be deleted because it contains ${col.product_count} product(s). Please delete or reassign its products first.`,
      });
      return;
    }

    const confirm = await Swal.fire({
      title: `Delete Collection "${col.title}"?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent)",
      cancelButtonColor: "var(--button-bg)",
      confirmButtonText: "Yes, Delete",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE}/store/collections/${col.id}/`, {
          method: "DELETE",
          headers: { Authorization: `JWT ${token}` },
        });

        if (res.ok || res.status === 204) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: "Collection deleted!",
            showConfirmButton: false,
            timer: 1500,
            toast: true,
          });
          if (editingCollectionId === col.id) {
            handleCancelCollectionEdit();
          }
          fetchAdminData();
        } else {
          const errData = await res.json();
          Swal.fire({
            icon: "error",
            title: "Cannot delete collection",
            text: errData.error || "Collection includes one or more products.",
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Order State & Handlers
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Update Order Payment Status (PATCH /store/orders/{id}/)
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/store/orders/${orderId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ payment_status: newStatus }),
      });

      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Order status updated!",
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        fetchAdminData();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to update order status",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Order (DELETE /store/orders/{id}/)
  const handleDeleteOrder = async (orderId: number) => {
    if (!token) return;

    const confirm = await Swal.fire({
      title: `Delete Order #${orderId}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent)",
      cancelButtonColor: "var(--button-bg)",
      confirmButtonText: "Yes, Delete",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE}/store/orders/${orderId}/`, {
          method: "DELETE",
          headers: { Authorization: `JWT ${token}` },
        });

        if (res.ok || res.status === 204) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: "Order deleted!",
            showConfirmButton: false,
            timer: 1500,
            toast: true,
          });
          if (selectedOrderDetails?.id === orderId) {
            setSelectedOrderDetails(null);
          }
          fetchAdminData();
        } else {
          Swal.fire({
            icon: "error",
            title: "Failed to delete order.",
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-bold text-xs uppercase tracking-widest">
        Loading Admin Dashboard...
      </div>
    );
  }

  const handleTabSwitch = async (targetTab: Tab) => {
    if (activeTab === targetTab) return;

    if (hasUnsavedPhotos) {
      const confirm = await Swal.fire({
        title: "Photos Not Uploaded!",
        text: "You have selected photo(s) that are not uploaded yet. If you switch section now, these photos won't be saved.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "var(--accent)",
        cancelButtonColor: "var(--button-bg)",
        confirmButtonText: "Leave Without Uploading",
        cancelButtonText: "Stay Here",
      });

      if (!confirm.isConfirmed) {
        return;
      }
      setHasUnsavedPhotos(false);
    }

    setActiveTab(targetTab);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-24 transition-colors duration-300">
      {/* Top Banner */}
      <div className="bg-primary text-background dark:text-foreground pt-8 pb-6 px-6 md:px-12 border-b border-white/10 shadow-md transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Header Top Row: Title, Staff Badge, Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-accent text-white text-[9px] font-black px-2.5 py-0.5 uppercase tracking-widest rounded-md">
                  Staff Portal
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                Admin Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="bg-accent/20 text-accent hover:bg-accent/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-accent/20 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Scrollable Segmented Control with Clean Count Pills) */}
          <div className="flex items-center gap-1.5 p-1.5 bg-primary/60 dark:bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 overflow-x-auto">
            {[
              { id: "products" as Tab, label: "Products", count: totalProductsCount },
              { id: "collections" as Tab, label: "Collections", count: collections.length },
              { id: "orders" as Tab, label: "Orders", count: orders.length },
              { id: "customers" as Tab, label: "Customers", count: customers.length },
              {
                id: "promotions" as Tab,
                label: "Promotions",
                count: promoProductsCatalog.filter((p) => Number(p.discount_percent || 0) > 0).length,
              },
              { id: "coupons" as Tab, label: "Coupons", count: couponsList.length },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-secondary text-foreground shadow-sm scale-[1.02]"
                      : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                      isActive
                        ? "bg-accent/20 text-accent"
                        : "bg-white/10 text-background/80 dark:text-foreground/80"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-12">
        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Add/Edit Product Form (1 Column) */}
            <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm h-fit lg:sticky lg:top-24 transition-colors duration-300">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-foreground/10">
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                  {editingProductId
                    ? `Edit Product #${editingProductId}`
                    : "Add New Product"}
                </h2>
                {editingProductId && (
                  <button
                    onClick={handleCancelEdit}
                    className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <form
                onSubmit={handleSaveProduct}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.title}
                    onChange={(e) =>
                      setProductForm({ ...productForm, title: e.target.value })
                    }
                    placeholder="e.g. Neon Void Hoodie"
                    className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                      Unit Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.unit_price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          unit_price: e.target.value,
                        })
                      }
                      placeholder="99.99"
                      className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                      Inventory Stock *
                    </label>
                    <input
                      type="number"
                      required
                      value={productForm.inventory}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          inventory: e.target.value,
                        })
                      }
                      placeholder="10"
                      className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Collection *
                  </label>
                  <select
                    value={productForm.collection || (collections.length > 0 ? String(collections[0].id) : "")}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        collection: e.target.value,
                      })
                    }
                    className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-accent transition-all"
                  >
                    {collections.map((col) => (
                      <option key={col.id} value={col.id} className="bg-secondary text-foreground">
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={productForm.short_description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        short_description: e.target.value,
                      })
                    }
                    placeholder="Brief summarize your product"
                    className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Details Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Full product details, materials, sizing, specifications"
                    className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors shadow-md"
                >
                  {editingProductId ? "Update Product" : "Create Product"}
                </button>
              </form>

              {/* Photo Upload Section when editing a product */}
              {editingProductId && (
                <div className="mt-4 pt-4 border-t border-foreground/10">
                  <ImageUploadModal
                    productId={editingProductId}
                    onSuccess={fetchAdminData}
                    onUnsavedChange={setHasUnsavedPhotos}
                  />
                </div>
              )}
            </div>

            {/* Products Table (2 Columns) */}
            <div className="lg:col-span-2 bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm overflow-x-auto transition-colors duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                  All Products ({totalProductsCount || products.length})
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setActiveProductQuery(productSearch);
                    setProdPage(1);
                  }}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product..."
                    className="px-3.5 py-1.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full sm:w-48 focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Search
                  </button>
                  {activeProductQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearch("");
                        setActiveProductQuery("");
                        setProdPage(1);
                      }}
                      className="text-[10px] font-bold text-red-500 hover:underline uppercase"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-foreground/10 text-[10px] font-black uppercase tracking-wider opacity-60">
                    <th className="py-3 px-2">ID</th>
                    <th className="py-3 px-2">Title</th>
                    <th className="py-3 px-2">Price</th>
                    <th className="py-3 px-2">Stock</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10 text-xs font-bold">
                  {products.map((prod) => (
                    <tr
                      key={prod.id}
                      onClick={() => handleSelectProduct(prod)}
                      className={`cursor-pointer transition-all ${
                        prod.is_trending
                          ? editingProductId === prod.id
                            ? "bg-amber-500/25 border-l-4 border-amber-500 font-extrabold"
                            : "bg-amber-500/15 dark:bg-amber-500/25 border-l-4 border-amber-500 hover:bg-amber-500/20"
                          : editingProductId === prod.id
                          ? "bg-accent/20"
                          : "hover:bg-primary/5 dark:hover:bg-primary/30"
                      }`}
                    >
                      <td className="py-2.5 px-2 opacity-50 align-middle">
                        #{prod.id}
                      </td>
                      <td className="py-2.5 px-2 font-black align-middle">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden border border-foreground/10 bg-primary/5 dark:bg-primary/30 shadow-sm">
                            <ProductImage title={prod.title} images={prod.images} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[180px] sm:max-w-xs">{prod.title}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-accent font-extrabold align-middle">
                        ${Number(prod.unit_price).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 align-middle">{prod.inventory}</td>
                      <td
                        className="py-3.5 px-2 text-right flex justify-end items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleToggleProductTrending(prod)}
                          className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all shadow-sm ${
                            prod.is_trending
                              ? "bg-amber-500 text-black border border-amber-600 shadow-amber-500/20"
                              : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                          }`}
                        >
                          {prod.is_trending ? " Trending" : "+ Trending"}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="px-3 py-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls (Matching Shop Page) */}
              {Math.ceil(totalProductsCount / 9) > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-foreground/10 text-xs font-bold">
                  <button
                    onClick={() => setProdPage((prev) => Math.max(prev - 1, 1))}
                    disabled={prodPage === 1}
                    className="px-5 py-2.5 border border-foreground/15 bg-primary/5 dark:bg-primary/30 text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-button-bg hover:text-button-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                    Page {prodPage} of {Math.ceil(totalProductsCount / 9)}
                  </span>

                  <button
                    onClick={() =>
                      setProdPage((prev) =>
                        Math.min(prev + 1, Math.ceil(totalProductsCount / 9))
                      )
                    }
                    disabled={prodPage >= Math.ceil(totalProductsCount / 9)}
                    className="px-5 py-2.5 border border-foreground/15 bg-primary/5 dark:bg-primary/30 text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-button-bg hover:text-button-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COLLECTIONS TAB */}
        {activeTab === "collections" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Create Collection Form */}
            <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm h-fit lg:sticky lg:top-24 transition-colors duration-300">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-foreground/10">
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                  {editingCollectionId
                    ? `Edit Collection #${editingCollectionId}`
                    : "Create Collection"}
                </h2>
                {editingCollectionId && (
                  <button
                    onClick={handleCancelCollectionEdit}
                    className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <form
                onSubmit={handleSaveCollection}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Collection Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCollectionTitle}
                    onChange={(e) => setNewCollectionTitle(e.target.value)}
                    placeholder="e.g. Summer Drop"
                    className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Collection Cover Photo {!editingCollectionId && "*"}
                  </label>
                  <input
                    ref={collectionFileInputRef}
                    type="file"
                    accept="image/*"
                    required={!editingCollectionId && !collectionImagePreview}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCollectionImageFile(file);
                        setCollectionImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="block w-full text-xs text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-button-bg file:text-button-fg hover:file:opacity-90 cursor-pointer"
                  />
                  {collectionImagePreview && (
                    <div className="mt-3 flex justify-center w-full">
                      <div className="relative group w-36 h-36 rounded-2xl overflow-hidden border border-foreground/10 shadow-md bg-primary/5 dark:bg-primary/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={collectionImagePreview.startsWith("http") || collectionImagePreview.startsWith("blob") ? collectionImagePreview : `${API_BASE}${collectionImagePreview}`}
                          alt="Cover preview"
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={handleDeleteCollectionPhoto}
                          title="Delete Photo"
                          className="absolute inset-0 bg-black/60 text-white text-xs font-bold uppercase opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          Delete Photo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors shadow-md"
                >
                  {editingCollectionId ? "Update Collection" : "Save Collection"}
                </button>
              </form>
            </div>

            {/* Collections List */}
            <div className="lg:col-span-2 bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                  Existing Collections ({filteredCollections.length})
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setActiveCollectionQuery(collectionSearch);
                  }}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <input
                    type="text"
                    value={collectionSearch}
                    onChange={(e) => setCollectionSearch(e.target.value)}
                    placeholder="Search collection..."
                    className="px-3.5 py-1.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full sm:w-48 focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Search
                  </button>
                  {activeCollectionQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setCollectionSearch("");
                        setActiveCollectionQuery("");
                      }}
                      className="text-[10px] font-bold text-red-500 hover:underline uppercase"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCollections.map((col) => (
                  <div
                    key={col.id}
                    onClick={() => handleSelectCollection(col)}
                    className={`p-4 rounded-2xl border transition-all flex justify-between items-center cursor-pointer ${
                      col.is_featured
                        ? editingCollectionId === col.id
                          ? "bg-amber-500/25 border-l-4 border-amber-500 font-extrabold"
                          : "bg-amber-500/15 dark:bg-amber-500/25 border-l-4 border-amber-500 hover:bg-amber-500/20"
                        : editingCollectionId === col.id
                        ? "bg-accent/20 border-accent"
                        : "bg-primary/5 dark:bg-primary/30 border-foreground/10 hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {col.image && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-foreground/10 flex-shrink-0 bg-secondary">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={col.image.startsWith("http") ? col.image : `${API_BASE}${col.image}`} alt={col.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          {col.title}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                          ID: #{col.id} • {col.product_count || 0} Products
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleCollectionFeatured(col)}
                        className={`px-2.5 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all shadow-sm ${
                          col.is_featured
                            ? "bg-amber-500 text-black border border-amber-600 shadow-amber-500/20"
                            : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                        }`}
                      >
                        {col.is_featured ? " Featured" : "+ Feature"}
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(col)}
                        className="px-3 py-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                Customer Orders ({filteredOrders.length})
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setActiveOrderQuery(orderSearch);
                }}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order ID..."
                  className="px-3.5 py-1.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full sm:w-48 focus:ring-2 focus:ring-accent"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  Search
                </button>
                {activeOrderQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderSearch("");
                      setActiveOrderQuery("");
                    }}
                    className="text-[10px] font-bold text-red-500 hover:underline uppercase"
                  >
                    Clear
                  </button>
                )}
              </form>
            </div>
            {filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-foreground/10 text-[10px] font-black uppercase tracking-wider opacity-60">
                      <th className="py-3 px-2">Order ID</th>
                      <th className="py-3 px-2">Customer</th>
                      <th className="py-3 px-2">Date Placed</th>
                      <th className="py-3 px-2">Method</th>
                      <th className="py-3 px-2">Items Count</th>
                      <th className="py-3 px-2">Payment Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/10 text-xs font-bold">
                    {filteredOrders.map((order) => {
                      const itemCount = order.items ? order.items.reduce((sum, i) => sum + i.quantity, 0) : 0;

                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-primary/5 dark:hover:bg-primary/30 transition-colors"
                        >
                          <td className="py-3.5 px-2 font-black">Order #{order.id}</td>
                          <td className="py-3.5 px-2 opacity-90 font-bold">
                            {order.customer_name || `Customer #${order.customer}`}
                          </td>
                          <td className="py-3.5 px-2 opacity-60 text-[11px]">
                            {order.placed_at ? new Date(order.placed_at).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="py-3.5 px-2">
                            {order.payment_method === "V" ? (
                              <span className="text-accent font-black uppercase inline-flex items-center gap-1 text-[11px]">
                                <img src="/VibeCoin/VibeCoin.png" alt="VibeCoin" className="w-3.5 h-3.5 object-contain" /> VibeCoin
                              </span>
                            ) : order.payment_method === "B" || order.payment_method === "O" ? (
                              <span className="text-bkash font-black uppercase text-[11px]">bKash</span>
                            ) : order.payment_method === "N" ? (
                              <span className="text-nagad font-black uppercase text-[11px]">Nagad</span>
                            ) : (
                              <span className="opacity-80 font-bold uppercase text-[11px]">COD</span>
                            )}
                          </td>
                          <td className="py-3.5 px-2">
                            {itemCount} item(s)
                          </td>
                          <td className="py-3.5 px-2">
                            <select
                              value={order.payment_status || "P"}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider outline-none cursor-pointer border ${
                                order.payment_status === "C"
                                  ? "bg-green-500/20 text-green-500 border-green-500/30"
                                  : order.payment_status === "F"
                                  ? "bg-red-500/20 text-red-500 border-red-500/30"
                                  : "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                              }`}
                            >
                              <option value="P" className="bg-secondary text-foreground">Pending (P)</option>
                              <option value="C" className="bg-secondary text-foreground">Complete (C)</option>
                              <option value="F" className="bg-secondary text-foreground">Failed (F)</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-2 text-right flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedOrderDetails(order)}
                              className="px-3 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="px-3 py-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-bold uppercase tracking-wider opacity-50">
                No orders found.
              </div>
            )}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-secondary text-foreground rounded-3xl p-8 max-w-xl w-full shadow-2xl border border-foreground/10 relative">
              <div className="flex justify-between items-center pb-4 border-b border-foreground/10 mb-6">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">
                    Order #{selectedOrderDetails.id}
                  </h3>
                  <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">
                    Customer #{selectedOrderDetails.customer} • {selectedOrderDetails.placed_at ? new Date(selectedOrderDetails.placed_at).toLocaleString() : ""}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="text-xs font-bold bg-primary/5 dark:bg-primary/30 hover:bg-button-bg hover:text-button-fg px-3 py-1.5 rounded-xl transition-colors uppercase"
                >
                  Close
                </button>
              </div>

              {/* Customer Contact & Address Info */}
              <div className="bg-primary/5 dark:bg-primary/30 p-4 rounded-2xl mb-6 text-xs space-y-1">
                <p><strong>Phone:</strong> {selectedOrderDetails.phone || "N/A"}</p>
                <p><strong>Shipping Address:</strong> {selectedOrderDetails.shipping_address || "N/A"}</p>
                <p>
                  <strong>Payment Method:</strong>{" "}
                  {selectedOrderDetails.payment_method === "V" ? (
                    <span className="text-accent font-black uppercase inline-flex items-center gap-1">
                      <img src="/VibeCoin/VibeCoin.png" alt="VibeCoin" className="w-3.5 h-3.5 object-contain" /> VibeCoin Payment
                    </span>
                  ) : selectedOrderDetails.payment_method === "O" || selectedOrderDetails.payment_method === "B" ? (
                    <span className="text-bkash font-black uppercase">Online / bKash Payment</span>
                  ) : selectedOrderDetails.payment_method === "N" ? (
                    <span className="text-nagad font-black uppercase">Nagad Payment</span>
                  ) : (
                    <span className="font-black uppercase">Cash on Delivery (COD)</span>
                  )}
                </p>
                {(selectedOrderDetails.payment_method === "O" || selectedOrderDetails.payment_method === "B") && (
                  <p><strong>bKash TrxID:</strong> <code className="bg-secondary px-2 py-0.5 rounded font-mono font-bold text-bkash">{selectedOrderDetails.transaction_id || "N/A"}</code> {selectedOrderDetails.transaction_phone_no ? `[Sender: ${selectedOrderDetails.transaction_phone_no}]` : ""}</p>
                )}
                {selectedOrderDetails.payment_method === "N" && (
                  <p><strong>Nagad TrxID:</strong> <code className="bg-secondary px-2 py-0.5 rounded font-mono font-bold text-nagad">{selectedOrderDetails.transaction_id || "N/A"}</code> {selectedOrderDetails.transaction_phone_no ? `[Sender: ${selectedOrderDetails.transaction_phone_no}]` : ""}</p>
                )}
              </div>

              {/* Order Items Table */}
              <div className="max-h-60 overflow-y-auto mb-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-foreground/10 text-[10px] font-black uppercase opacity-60">
                      <th className="py-2 px-1">Product</th>
                      <th className="py-2 px-1">Qty</th>
                      <th className="py-2 px-1">Unit Price</th>
                      <th className="py-2 px-1 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/10">
                    {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                      selectedOrderDetails.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 px-1 font-bold">{item.product?.title || `Product #${item.product}`}</td>
                          <td className="py-2 px-1">{item.quantity}</td>
                          <td className="py-2 px-1">${Number(item.unit_price).toFixed(2)}</td>
                          <td className="py-2 px-1 text-right font-black text-accent">
                            ${(item.quantity * Number(item.unit_price)).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-xs opacity-50">
                          No item breakdown available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-foreground/10">
                <span className="text-xs font-bold opacity-70 uppercase">
                  Payment Status: <strong className="uppercase font-black text-foreground">{selectedOrderDetails.payment_status === "C" ? "Complete" : selectedOrderDetails.payment_status === "F" ? "Failed" : "Pending"}</strong>
                </span>
                <span className="text-base font-black text-foreground">
                  Total: ${selectedOrderDetails.items ? selectedOrderDetails.items.reduce((sum, i) => sum + (i.quantity * Number(i.unit_price)), 0).toFixed(2) : "0.00"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === "customers" && (
          <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                Registered Customers ({filteredCustomers.length})
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setActiveCustomerQuery(customerSearch);
                }}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer..."
                  className="px-3.5 py-1.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full sm:w-48 focus:ring-2 focus:ring-accent"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  Search
                </button>
                {activeCustomerQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerSearch("");
                      setActiveCustomerQuery("");
                    }}
                    className="text-[10px] font-bold text-red-500 hover:underline uppercase"
                  >
                    Clear
                  </button>
                )}
              </form>
            </div>
            {filteredCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-foreground/10 text-[10px] font-black uppercase tracking-wider opacity-60">
                      <th className="py-3 px-2">Customer Name</th>
                      <th className="py-3 px-2">Phone</th>
                      <th className="py-3 px-2">Membership</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/10 text-xs font-bold">
                    {filteredCustomers.map((cust) => (
                      <tr
                        key={cust.id}
                        className="hover:bg-primary/5 dark:hover:bg-primary/30 transition-colors"
                      >
                        <td className="py-3.5 px-2 font-black">
                          {cust.customer_name || `Customer #${cust.id}`}
                        </td>
                        <td className="py-3.5 px-2 opacity-80">
                          {cust.phone || "No Phone Registered"}
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-[10px] uppercase font-black tracking-wider">
                            {cust.membership === "G" ? "Gold (G)" : cust.membership === "S" ? "Silver (S)" : "Bronze (B)"}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <button
                            onClick={() => handleViewCustomerHistory(cust.id)}
                            className="px-3.5 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm"
                          >
                            View Order History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-bold uppercase tracking-wider opacity-50">
                No customers found.
              </div>
            )}
          </div>
        )}

        {/* Customer Order History Modal */}
        {customerHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-secondary text-foreground rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-foreground/10 relative max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-foreground/10 mb-6">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">
                    Order History - Customer #{customerHistoryModal.customerId}
                  </h3>
                  <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">
                    Total Orders: {customerHistoryModal.orders.length}
                  </span>
                </div>
                <button
                  onClick={() => setCustomerHistoryModal(null)}
                  className="text-xs font-bold bg-primary/5 dark:bg-primary/30 hover:bg-button-bg hover:text-button-fg px-3 py-1.5 rounded-xl transition-colors uppercase"
                >
                  Close
                </button>
              </div>

              {customerHistoryModal.orders.length > 0 ? (
                <div className="space-y-4">
                  {customerHistoryModal.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/30 border border-foreground/10 space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span className="font-black text-sm">Order #{ord.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black ${
                          ord.payment_status === "C" ? "bg-green-500/20 text-green-500" : ord.payment_status === "F" ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"
                        }`}>
                          {ord.payment_status === "C" ? "Complete" : ord.payment_status === "F" ? "Failed" : "Pending"}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-70">
                        <strong>Placed At:</strong> {ord.placed_at ? new Date(ord.placed_at).toLocaleString() : "N/A"}
                      </p>
                      <p className="text-[11px] opacity-70">
                        <strong>Shipping:</strong> {ord.shipping_address || "N/A"} | <strong>Phone:</strong> {ord.phone || "N/A"}
                      </p>
                      <p className="text-[11px] opacity-70">
                        <strong>Payment Method:</strong> {
                          ord.payment_method === "V" ? (
                            <span className="inline-flex items-center gap-1 align-middle">
                              <img src="/VibeCoin/VibeCoin.png" alt="VibeCoin" className="w-3.5 h-3.5 object-contain inline" /> VibeCoin Payment
                            </span>
                          ) :
                          ord.payment_method === "O" || ord.payment_method === "B" ? `bKash (TrxID: ${ord.transaction_id || "N/A"})` :
                          ord.payment_method === "N" ? `Nagad (TrxID: ${ord.transaction_id || "N/A"})` :
                          "Cash on Delivery (COD)"
                        }
                      </p>
                      
                      {ord.items && ord.items.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-foreground/10 space-y-1">
                          <p className="text-[10px] font-black uppercase opacity-60">Items:</p>
                          {ord.items.map((it) => (
                            <div key={it.id} className="flex justify-between text-[11px]">
                              <span>{it.product?.title || `Product #${it.product}`} x {it.quantity}</span>
                              <span className="font-bold">${(it.quantity * Number(it.unit_price)).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs font-bold uppercase tracking-wider opacity-50">
                  This customer has not placed any orders yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* MANAGE PROMOTIONS TAB */}
        {activeTab === "promotions" && (() => {
          const onSaleProducts = promoProductsCatalog.filter(
            (p) => Number(p.discount_percent || 0) > 0
          );
          const filteredOnSaleProducts = onSaleProducts.filter(
            (p) =>
              !activePromoSearch ||
              p.title.toLowerCase().includes(activePromoSearch.toLowerCase()) ||
              String(p.id).includes(activePromoSearch)
          );
          const promoItemsPerPage = 8;
          const totalPromoPages = Math.ceil(filteredOnSaleProducts.length / promoItemsPerPage);
          const paginatedOnSaleProducts = filteredOnSaleProducts.slice(
            (promoPage - 1) * promoItemsPerPage,
            promoPage * promoItemsPerPage
          );

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
              {/* Create & Apply Promotion Form */}
              <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm h-fit lg:sticky lg:top-24 transition-colors duration-300">
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-foreground/10">
                  <h2 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    Apply New Promotion
                  </h2>
                </div>

                <form onSubmit={handleApplyPromotion} className="space-y-5">
                  {/* Multi-Product Live Search & Selector */}
                  <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                        Select Products ({promoProductsCatalog.length} available)
                      </label>
                      {promoSelectedProductIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setPromoSelectedProductIds([]);
                            setPromoSearchInput("");
                          }}
                          className="text-[9px] font-bold text-red-500 hover:underline uppercase"
                        >
                          Clear All ({promoSelectedProductIds.length})
                        </button>
                      )}
                    </div>

                    {/* Selected Products Chips */}
                    {selectedPromoProducts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 max-h-36 overflow-y-auto">
                        {selectedPromoProducts.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-foreground border border-foreground/15 text-[11px] font-bold shadow-2xs"
                          >
                            <span className="truncate max-w-[130px]">#{p.id} {p.title}</span>
                            <span className="text-accent text-[10px] font-mono">${Number(p.unit_price).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setPromoSelectedProductIds((prev) =>
                                  prev.filter((id) => id !== p.id)
                                )
                              }
                              className="text-foreground/50 hover:text-red-500 font-black ml-0.5 text-xs"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type="text"
                        value={promoSearchInput}
                        onFocus={() => setIsPromoDropdownOpen(true)}
                        onChange={(e) => {
                          setPromoSearchInput(e.target.value);
                          setIsPromoDropdownOpen(true);
                        }}
                        placeholder="Search product to add to selection..."
                        className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent placeholder:font-normal shadow-inner"
                      />
                      {promoSelectedProductIds.length > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-accent/20 text-accent font-black text-[10px] uppercase">
                          {promoSelectedProductIds.length} Selected
                        </span>
                      )}
                    </div>

                    {/* Floating Suggestions List */}
                    {isPromoDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setIsPromoDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-secondary border border-foreground/15 rounded-2xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-foreground/10 p-1.5 backdrop-blur-md">
                          {(() => {
                            const query = promoSearchInput.toLowerCase().trim();
                            const matches = promoProductsCatalog.filter(
                              (prod) =>
                                !query ||
                                prod.title.toLowerCase().includes(query) ||
                                String(prod.id).includes(query)
                            );

                            if (matches.length === 0) {
                              return (
                                <div className="p-4 text-center text-xs font-bold opacity-50">
                                  No products found matching &ldquo;{promoSearchInput}&rdquo;
                                </div>
                              );
                            }

                            return (
                              <>
                                <div className="p-2 flex justify-between items-center text-[10px] font-bold text-foreground/60">
                                  <span>{matches.length} matching products</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const matchIds = matches.map((m) => m.id);
                                      setPromoSelectedProductIds((prev) =>
                                        Array.from(new Set([...prev, ...matchIds]))
                                      );
                                    }}
                                    className="text-accent hover:underline uppercase"
                                  >
                                    + Select All ({matches.length})
                                  </button>
                                </div>
                                {matches.map((prod) => {
                                  const isSelected = promoSelectedProductIds.includes(prod.id);
                                  const isOnSale = Number(prod.discount_percent || 0) > 0;
                                  return (
                                    <div
                                      key={prod.id}
                                      onClick={() => {
                                        setPromoSelectedProductIds((prev) =>
                                          prev.includes(prod.id)
                                            ? prev.filter((id) => id !== prod.id)
                                            : [...prev, prod.id]
                                        );
                                      }}
                                      className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-all ${
                                        isSelected
                                          ? "bg-accent/20 border border-accent/40"
                                          : "hover:bg-primary/5 dark:hover:bg-primary/30"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {}}
                                          className="w-4 h-4 rounded accent-accent shrink-0 cursor-pointer pointer-events-none"
                                        />
                                        <div className="relative w-9 h-9 rounded-lg bg-background border border-foreground/10 flex items-center justify-center overflow-hidden shrink-0">
                                          <ProductImage title={prod.title} images={prod.images} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-foreground truncate">
                                            #{prod.id} {prod.title}
                                          </p>
                                          <p className="text-[10px] text-foreground/60 font-semibold">
                                            Original: ${Number(prod.unit_price).toFixed(2)}
                                          </p>
                                        </div>
                                      </div>

                                      {isOnSale ? (
                                        <span className="px-2 py-0.5 rounded bg-accent/15 text-accent font-black text-[9px] uppercase shrink-0">
                                          -{Math.round(Number(prod.discount_percent || 0))}%
                                        </span>
                                      ) : (
                                        <span
                                          className={`text-[10px] font-bold shrink-0 ${
                                            isSelected ? "text-accent" : "text-foreground/40"
                                          }`}
                                        >
                                          {isSelected ? "Selected" : "+ Add"}
                                        </span>
                                      )}
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

                  {/* Input for Discount % */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                      Discount Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="100"
                        value={promoDiscountPercent}
                        onChange={(e) => setPromoDiscountPercent(e.target.value)}
                        placeholder="e.g. 20"
                        className="w-full bg-background border border-foreground/15 rounded-xl px-4 pr-20 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                        required
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none px-2 py-1 rounded-lg bg-accent/20 text-accent font-extrabold text-[10px] uppercase tracking-wider">
                        % OFF
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={promoApplying || promoSelectedProductIds.length === 0}
                    className="w-full py-4 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                  >
                    {promoApplying
                      ? "Applying Promotion..."
                      : promoSelectedProductIds.length > 0
                      ? `Apply ${promoDiscountPercent}% Discount (${promoSelectedProductIds.length} Products)`
                      : "Select Products to Apply Discount"}
                  </button>
                </form>
              </div>

              {/* Right Column: Currently On-Sale Products with Search & Pagination (2 Columns) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                        Products Currently On Sale ({filteredOnSaleProducts.length})
                      </h2>
                      {onSaleProducts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePromotion("all")}
                          className="px-3 py-1 bg-red-500/15 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-xs"
                        >
                          Remove All Discounts
                        </button>
                      )}
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setActivePromoSearch(promoSearch);
                        setPromoPage(1);
                      }}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <input
                        type="text"
                        value={promoSearch}
                        onChange={(e) => setPromoSearch(e.target.value)}
                        placeholder="Search on-sale products..."
                        className="px-3.5 py-1.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full sm:w-48 focus:ring-2 focus:ring-accent"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                      >
                        Search
                      </button>
                      {activePromoSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setPromoSearch("");
                            setActivePromoSearch("");
                            setPromoPage(1);
                          }}
                          className="text-[10px] font-bold text-red-500 hover:underline uppercase"
                        >
                          Clear
                        </button>
                      )}
                    </form>
                  </div>

                  {filteredOnSaleProducts.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {paginatedOnSaleProducts.map((prod) => {
                          const original = Number(prod.unit_price);
                          const pct = Number(prod.discount_percent);
                          const discounted =
                            prod.discounted_price !== undefined
                              ? Number(prod.discounted_price)
                              : original * (1 - pct / 100);

                          return (
                            <div
                              key={prod.id}
                              className="p-4 rounded-2xl bg-background border border-foreground/10 flex items-center justify-between gap-4 shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative w-14 h-14 rounded-xl bg-secondary flex items-center justify-center overflow-hidden border border-foreground/10 shrink-0">
                                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-accent text-button-fg font-black text-[8px] uppercase">
                                    -{Math.round(pct)}%
                                  </span>
                                  <ProductImage title={prod.title} images={prod.images} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-xs text-foreground line-clamp-1">
                                    {prod.title}
                                  </h4>
                                  <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-accent font-extrabold text-xs">
                                      ${discounted.toFixed(2)}
                                    </span>
                                    <span className="line-through text-[10px] opacity-50 font-bold">
                                      ${original.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemovePromotion("product", prod.id)}
                                className="px-3 py-2 bg-accent/15 text-accent hover:bg-accent hover:text-button-fg rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls (Matching Product List Table) */}
                      {totalPromoPages > 1 && (
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-foreground/10 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setPromoPage((prev) => Math.max(prev - 1, 1))}
                            disabled={promoPage === 1}
                            className="px-5 py-2.5 border border-foreground/15 bg-primary/5 dark:bg-primary/30 text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-button-bg hover:text-button-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>

                          <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                            Page {promoPage} of {totalPromoPages}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setPromoPage((prev) =>
                                Math.min(prev + 1, totalPromoPages)
                              )
                            }
                            disabled={promoPage >= totalPromoPages}
                            className="px-5 py-2.5 border border-foreground/15 bg-primary/5 dark:bg-primary/30 text-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-button-bg hover:text-button-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-12 text-center text-xs font-bold uppercase tracking-wider opacity-50">
                      {activePromoSearch
                        ? `No on-sale products found matching "${activePromoSearch}".`
                        : "No products currently have active promotions. Use the form on the left to add discounts!"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* MANAGE COUPONS TAB */}
        {activeTab === "coupons" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Left Column: Create/Edit Coupon Form (1 Column) */}
            <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm h-fit lg:sticky lg:top-24 transition-colors duration-300">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-foreground/10">
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                  {editingCouponId ? `Edit Coupon #${editingCouponId}` : "Create New Coupon"}
                </h2>
                {editingCouponId && (
                  <button
                    type="button"
                    onClick={handleCancelEditCoupon}
                    className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveCoupon} className="space-y-5">
                {/* Coupon Code Input */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER25, VIP50"
                    className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider text-foreground outline-none focus:ring-2 focus:ring-accent shadow-inner"
                  />
                </div>

                {/* Discount Percentage */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                    Discount Percentage (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="100"
                      required
                      value={couponDiscountPercent}
                      onChange={(e) => setCouponDiscountPercent(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full bg-background border border-foreground/15 rounded-xl px-4 pr-20 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none px-2 py-1 rounded-lg bg-accent/20 text-accent font-extrabold text-[10px] uppercase tracking-wider">
                      % OFF
                    </div>
                  </div>
                </div>

                {/* Expiry Date & Time */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                    Valid Until (Expiration Date & Time) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={couponValidTo}
                    onChange={(e) => setCouponValidTo(e.target.value)}
                    className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent shadow-inner"
                  />
                </div>

                {/* Status On/Off Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-foreground/15">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-foreground">
                      Status: {couponIsActive ? "Active" : "Disabled"}
                    </p>
                    <p className="text-[10px] opacity-60 font-medium">
                      {couponIsActive
                        ? "Customers can redeem this coupon."
                        : "Coupon is disabled and cannot be redeemed."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCouponIsActive(!couponIsActive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      couponIsActive ? "bg-accent" : "bg-foreground/20"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        couponIsActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Target Scope Switcher */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                    Apply Coupon To *
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-primary/5 dark:bg-primary/20 rounded-xl border border-foreground/10">
                    <button
                      type="button"
                      onClick={() => setCouponTargetType("product")}
                      className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        couponTargetType === "product"
                          ? "bg-secondary text-foreground shadow-sm"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      Specific Products
                    </button>
                    <button
                      type="button"
                      onClick={() => setCouponTargetType("collection")}
                      className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        couponTargetType === "collection"
                          ? "bg-secondary text-foreground shadow-sm"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      Collection
                    </button>
                  </div>
                </div>

                {/* If Target is Products: Live Search & Multi-Selector */}
                {couponTargetType === "product" && (
                  <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                        Select Eligible Products ({promoProductsCatalog.length} available)
                      </label>
                      {couponSelectedProductIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCouponSelectedProductIds([]);
                            setCouponSearchInput("");
                          }}
                          className="text-[9px] font-bold text-red-500 hover:underline uppercase"
                        >
                          Clear All ({couponSelectedProductIds.length})
                        </button>
                      )}
                    </div>

                    {/* Selected Products Chips */}
                    {selectedCouponProducts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10 max-h-36 overflow-y-auto">
                        {selectedCouponProducts.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-foreground border border-foreground/15 text-[11px] font-bold shadow-2xs"
                          >
                            <span className="truncate max-w-[130px]">#{p.id} {p.title}</span>
                            <span className="text-accent text-[10px] font-mono">${Number(p.unit_price).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setCouponSelectedProductIds((prev) =>
                                  prev.filter((id) => id !== p.id)
                                )
                              }
                              className="text-foreground/50 hover:text-red-500 font-black ml-0.5 text-xs"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type="text"
                        value={couponSearchInput}
                        onFocus={() => setIsCouponDropdownOpen(true)}
                        onChange={(e) => {
                          setCouponSearchInput(e.target.value);
                          setIsCouponDropdownOpen(true);
                        }}
                        placeholder="Search product to add to coupon..."
                        className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent placeholder:font-normal shadow-inner"
                      />
                      {couponSelectedProductIds.length > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-accent/20 text-accent font-black text-[10px] uppercase">
                          {couponSelectedProductIds.length} Selected
                        </span>
                      )}
                    </div>

                    {/* Floating Suggestions List */}
                    {isCouponDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setIsCouponDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-secondary border border-foreground/15 rounded-2xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-foreground/10 p-1.5 backdrop-blur-md">
                          {(() => {
                            const query = couponSearchInput.toLowerCase().trim();
                            const matches = promoProductsCatalog.filter(
                              (prod) =>
                                !query ||
                                prod.title.toLowerCase().includes(query) ||
                                String(prod.id).includes(query)
                            );

                            if (matches.length === 0) {
                              return (
                                <div className="p-4 text-center text-xs font-bold opacity-50">
                                  No products found matching &ldquo;{couponSearchInput}&rdquo;
                                </div>
                              );
                            }

                            return (
                              <>
                                <div className="p-2 flex justify-between items-center text-[10px] font-bold text-foreground/60">
                                  <span>{matches.length} matching products</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const matchIds = matches.map((m) => m.id);
                                      setCouponSelectedProductIds((prev) =>
                                        Array.from(new Set([...prev, ...matchIds]))
                                      );
                                    }}
                                    className="text-accent hover:underline uppercase"
                                  >
                                    + Select All ({matches.length})
                                  </button>
                                </div>
                                {matches.map((prod) => {
                                  const isSelected = couponSelectedProductIds.includes(prod.id);
                                  return (
                                    <div
                                      key={prod.id}
                                      onClick={() => {
                                        setCouponSelectedProductIds((prev) =>
                                          prev.includes(prod.id)
                                            ? prev.filter((id) => id !== prod.id)
                                            : [...prev, prod.id]
                                        );
                                      }}
                                      className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-all ${
                                        isSelected
                                          ? "bg-accent/20 border border-accent/40"
                                          : "hover:bg-primary/5 dark:hover:bg-primary/30"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {}}
                                          className="w-4 h-4 rounded accent-accent shrink-0 cursor-pointer pointer-events-none"
                                        />
                                        <div className="relative w-9 h-9 rounded-lg bg-background border border-foreground/10 flex items-center justify-center overflow-hidden shrink-0">
                                          <ProductImage title={prod.title} images={prod.images} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-foreground truncate">
                                            #{prod.id} {prod.title}
                                          </p>
                                          <p className="text-[10px] text-foreground/60 font-semibold">
                                            Price: ${Number(prod.unit_price).toFixed(2)}
                                          </p>
                                        </div>
                                      </div>

                                      <span
                                        className={`text-[10px] font-bold shrink-0 ${
                                          isSelected ? "text-accent" : "text-foreground/40"
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

                {/* If Target is Collection: Collection Dropdown */}
                {couponTargetType === "collection" && (
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                      Select Collection *
                    </label>
                    <select
                      value={couponCollectionId}
                      onChange={(e) => setCouponCollectionId(e.target.value ? Number(e.target.value) : "")}
                      required
                      className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">-- Choose Collection --</option>
                      {collections.map((col) => (
                        <option key={col.id} value={col.id}>
                          #{col.id} {col.title} ({col.product_count || 0} products)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    couponCreating ||
                    !couponCode.trim() ||
                    (couponTargetType === "product" && couponSelectedProductIds.length === 0) ||
                    (couponTargetType === "collection" && !couponCollectionId)
                  }
                  className="w-full py-4 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                >
                  {editingCouponId
                    ? (couponCreating ? "Updating Coupon..." : "Update Coupon")
                    : (couponCreating ? "Creating Coupon..." : "Create Coupon Now")}
                </button>
              </form>
            </div>

            {/* Right Column: Existing Coupons List (2 Columns) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
                  <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                    Store Coupons ({couponsList.length})
                  </h2>
                  <input
                    type="text"
                    value={couponFilterSearch}
                    onChange={(e) => setCouponFilterSearch(e.target.value)}
                    placeholder="Search coupons by code..."
                    className="px-3.5 py-1.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full sm:w-56 focus:ring-2 focus:ring-accent"
                  />
                </div>

                {(() => {
                  const filteredCoupons = couponsList.filter(
                    (c) =>
                      !couponFilterSearch.trim() ||
                      c.code.toLowerCase().includes(couponFilterSearch.toLowerCase().trim()) ||
                      (c.collection_title && c.collection_title.toLowerCase().includes(couponFilterSearch.toLowerCase().trim()))
                  );

                  if (filteredCoupons.length === 0) {
                    return (
                      <div className="py-12 text-center text-xs font-bold uppercase tracking-wider opacity-50">
                        {couponFilterSearch
                          ? `No coupons found matching "${couponFilterSearch}".`
                          : "No coupons created yet. Use the form on the left to create your first coupon!"}
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredCoupons.map((coupon) => {
                        const isExpired = coupon.valid_to && new Date(coupon.valid_to) < new Date();
                        const formattedExpiry = coupon.valid_to
                          ? new Date(coupon.valid_to).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "No Expiry";
                        const isBeingEdited = editingCouponId === coupon.id;

                        return (
                          <div
                            key={coupon.id}
                            onClick={() => handleEditCoupon(coupon)}
                            className={`p-5 rounded-2xl bg-background border flex flex-col justify-between gap-4 shadow-xs relative overflow-hidden group cursor-pointer transition-all ${
                              isBeingEdited
                                ? "border-accent ring-2 ring-accent shadow-md bg-accent/5"
                                : "border-foreground/10 hover:border-accent/40"
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Header: Code, Active Toggle, & Discount Badge */}
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-black text-sm uppercase px-3 py-1 rounded-lg bg-accent/15 text-accent border border-accent/30 tracking-wider">
                                      {coupon.code}
                                    </span>
                                    {/* On/Off Toggle Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleCouponActive(coupon, e)}
                                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all flex items-center gap-1 ${
                                        coupon.is_active
                                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                                          : "bg-foreground/15 text-foreground/60 hover:bg-foreground/25"
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          coupon.is_active ? "bg-emerald-500" : "bg-foreground/50"
                                        }`}
                                      />
                                      {coupon.is_active ? "Active" : "Disabled"}
                                    </button>
                                    {isExpired && (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-500/15 text-red-500">
                                        Expired
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="font-black text-lg text-accent">
                                  {Number(coupon.discount_percent)}% OFF
                                </span>
                              </div>

                              {/* Target Details */}
                              <div className="p-3 rounded-xl bg-secondary/80 border border-foreground/5 text-xs space-y-1">
                                <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">
                                  Scope: {coupon.target_type === "product" ? "Specific Products" : "Collection"}
                                </p>
                                {coupon.target_type === "product" ? (
                                  <p className="font-bold text-foreground truncate">
                                    {coupon.product_count || (coupon.products_details ? coupon.products_details.length : 0)} Product(s) Selected
                                    {coupon.products_details && coupon.products_details.length > 0 && (
                                      <span className="block text-[10px] opacity-70 font-normal truncate mt-0.5">
                                        {coupon.products_details.map((p) => p.title).join(", ")}
                                      </span>
                                    )}
                                  </p>
                                ) : (
                                  <p className="font-bold text-foreground">
                                    Collection: {coupon.collection_title || `#${coupon.collection}`}
                                  </p>
                                )}
                              </div>

                              {/* Expiry Timestamp */}
                              <div className="flex justify-between items-center text-[10px] opacity-60 font-semibold pt-1">
                                <span>Expires: {formattedExpiry}</span>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="pt-2 border-t border-foreground/10 flex justify-between items-center">
                              <button
                                type="button"
                                onClick={() => handleEditCoupon(coupon)}
                                className="text-[10px] font-extrabold text-accent hover:underline uppercase tracking-wider"
                              >
                                {isBeingEdited ? "Editing Now..." : "Edit"}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCoupon(coupon.id, coupon.code);
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
        )}
      </main>
    </div>
  );
}
