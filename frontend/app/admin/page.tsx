"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";
import ImageUploadModal from "@/components/ui/ImageUploadModal";
import ProductImage from "@/components/ui/ProductImage";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ProductSearchBar from "@/features/products/components/ProductSearchBar";
import CollectionSearchBar from "@/features/collections/components/CollectionSearchBar";
import CustomerSearchBar from "@/features/customers/components/CustomerSearchBar";
import ProductVariantsManager from "@/features/products/components/ProductVariantsManager";

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
  delivery_area?: string;
  delivery_charge?: number | string;
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

interface DeliveryRuleItem {
  id: number;
  title: string;
  target_type: "product" | "collection";
  rule_type: "free" | "reduced";
  inside_dhaka_charge: number | string;
  outside_dhaka_charge: number | string;
  collection?: number | null;
  collection_title?: string | null;
  product_count?: number;
  products_details?: { id: number; title: string; unit_price: number }[];
  min_quantity?: number;
  is_active: boolean;
  created_at: string;
}

type Tab =
  | "products"
  | "collections"
  | "orders"
  | "customers"
  | "promotions"
  | "coupons"
  | "payments"
  | "delivery";

export default function AdminDashboardPage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    logout();
    router.push("/login");
  };

  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // State data
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedPhotos, setHasUnsavedPhotos] = useState(false);

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    bkash_number: "01711111111",
    bkash_active: true,
    nagad_number: "01711111111",
    nagad_active: true,
    cod_active: true,
    vibecoin_active: true,
  });
  const [initialPaymentSettings, setInitialPaymentSettings] = useState({
    bkash_number: "01711111111",
    bkash_active: true,
    nagad_number: "01711111111",
    nagad_active: true,
    cod_active: true,
    vibecoin_active: true,
  });
  const [savingPaymentSettings, setSavingPaymentSettings] = useState(false);

  // Delivery Settings State
  const [deliverySettings, setDeliverySettings] = useState({
    inside_dhaka_charge: "60",
    outside_dhaka_charge: "130",
    estimated_days_inside: "1-2 Days",
    estimated_days_outside: "3-5 Days",
    is_active: true,
  });
  const [initialDeliverySettings, setInitialDeliverySettings] = useState({
    inside_dhaka_charge: "60",
    outside_dhaka_charge: "130",
    estimated_days_inside: "1-2 Days",
    estimated_days_outside: "3-5 Days",
    is_active: true,
  });
  const [savingDeliverySettings, setSavingDeliverySettings] = useState(false);

  // Delivery Rules State (Free Delivery / Reduced Delivery for Products or Collections)
  const [deliveryRulesList, setDeliveryRulesList] = useState<
    DeliveryRuleItem[]
  >([]);
  const [editingDeliveryRuleId, setEditingDeliveryRuleId] = useState<
    number | null
  >(null);
  const [deliveryRuleTitle, setDeliveryRuleTitle] = useState("");
  const [deliveryRuleTargetType, setDeliveryRuleTargetType] = useState<
    "product" | "collection"
  >("product");
  const [deliveryRuleType, setDeliveryRuleType] = useState<"free" | "reduced">(
    "free",
  );
  const [deliveryRuleInsideCharge, setDeliveryRuleInsideCharge] = useState("0");
  const [deliveryRuleOutsideCharge, setDeliveryRuleOutsideCharge] =
    useState("0");
  const [deliveryRuleSelectedProductIds, setDeliveryRuleSelectedProductIds] =
    useState<number[]>([]);
  const [deliveryRuleCollectionId, setDeliveryRuleCollectionId] = useState<
    number | ""
  >("");
  const [deliveryRuleMinQuantity, setDeliveryRuleMinQuantity] = useState("1");
  const [deliveryRuleIsActive, setDeliveryRuleIsActive] = useState(true);
  const [deliveryRuleSearchInput, setDeliveryRuleSearchInput] = useState("");
  const [isDeliveryRuleDropdownOpen, setIsDeliveryRuleDropdownOpen] =
    useState(false);
  const [deliveryRuleCreating, setDeliveryRuleCreating] = useState(false);
  const [deliveryRuleFilterSearch, setDeliveryRuleFilterSearch] = useState("");

  // Promotion states
  const [allProductsForPromo, setAllProductsForPromo] = useState<Product[]>([]);
  const [promoSelectedProductIds, setPromoSelectedProductIds] = useState<
    number[]
  >([]);
  const [promoSearchInput, setPromoSearchInput] = useState<string>("");
  const [isPromoDropdownOpen, setIsPromoDropdownOpen] =
    useState<boolean>(false);
  const [promoDiscountPercent, setPromoDiscountPercent] =
    useState<string>("20");
  const [promoApplying, setPromoApplying] = useState<boolean>(false);
  const [promoSearch, setPromoSearch] = useState("");
  const [activePromoSearch, setActivePromoSearch] = useState("");
  const [promoPage, setPromoPage] = useState(1);

  // Coupon states
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);
  const [couponsList, setCouponsList] = useState<CouponItem[]>([]);
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponDiscountPercent, setCouponDiscountPercent] =
    useState<string>("20");
  const [couponValidTo, setCouponValidTo] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 16);
  });
  const [couponTargetType, setCouponTargetType] = useState<
    "product" | "collection"
  >("product");
  const [couponSelectedProductIds, setCouponSelectedProductIds] = useState<
    number[]
  >([]);
  const [couponCollectionId, setCouponCollectionId] = useState<number | "">("");
  const [couponIsActive, setCouponIsActive] = useState<boolean>(true);
  const [couponSearchInput, setCouponSearchInput] = useState<string>("");
  const [isCouponDropdownOpen, setIsCouponDropdownOpen] =
    useState<boolean>(false);
  const [couponCreating, setCouponCreating] = useState<boolean>(false);
  const [couponFilterSearch, setCouponFilterSearch] = useState<string>("");

  // Search states
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    "ALL" | "P" | "F" | "C"
  >("ALL");

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

  // Pending Photos & Variants for Creation Mode
  const [newProductPhotos, setNewProductPhotos] = useState<File[]>([]);
  const [newProductPhotoPreviews, setNewProductPhotoPreviews] = useState<
    string[]
  >([]);
  const newProductFileInputRef = useRef<HTMLInputElement>(null);

  const [newProductVariants, setNewProductVariants] = useState<
    Array<{
      id?: string;
      name: string;
      color_name: string;
      color_code: string;
      size: string;
      price_override: string;
      inventory: string;
      is_active: boolean;
    }>
  >([]);
  const [isNewVariantModalOpen, setIsNewVariantModalOpen] = useState(false);
  const [newVariantForm, setNewVariantForm] = useState({
    name: "",
    color_name: "",
    color_code: "",
    size: "",
    price_override: "",
    inventory: "10",
    is_active: true,
  });
  const [editingNewVariantIndex, setEditingNewVariantIndex] = useState<
    number | null
  >(null);

  // New Collection Form
  const [newCollectionTitle, setNewCollectionTitle] = useState("");

  const [prodPage, setProdPage] = useState(1);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  const fetchAdminData = async (
    pageNumber = prodPage,
    searchQuery = activeProductQuery,
    showFullLoading = false,
  ) => {
    if (!token) return;
    if (showFullLoading) setLoading(true);
    try {
      const searchParam = searchQuery
        ? `&search=${encodeURIComponent(searchQuery)}`
        : "";
      const prodRes = await fetch(
        `${API_BASE}/store/products/?page=${pageNumber}${searchParam}`,
        { cache: "no-store" },
      );
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(
          Array.isArray(prodData) ? prodData : prodData.results || [],
        );
        setTotalProductsCount(
          prodData.count || (Array.isArray(prodData) ? prodData.length : 0),
        );
      }

      // Fetch Collections
      const colRes = await fetch(`${API_BASE}/store/collections/`, {
        cache: "no-store",
      });
      if (colRes.ok) {
        const colData = await colRes.json();
        const fetchedCols = Array.isArray(colData)
          ? colData
          : colData.results || [];
        setCollections(fetchedCols);
        setProductForm((prev) => ({
          ...prev,
          collection:
            prev.collection &&
            fetchedCols.some(
              (c: any) => String(c.id) === String(prev.collection),
            )
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
      fetchPaymentSettings();
      fetchDeliverySettings();
      fetchDeliveryRules();
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliverySettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/store/delivery-settings/`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const settingsObj = {
          inside_dhaka_charge: String(data.inside_dhaka_charge ?? "60"),
          outside_dhaka_charge: String(data.outside_dhaka_charge ?? "130"),
          estimated_days_inside: data.estimated_days_inside || "1-2 Days",
          estimated_days_outside: data.estimated_days_outside || "3-5 Days",
          is_active: data.is_active ?? true,
        };
        setDeliverySettings(settingsObj);
        setInitialDeliverySettings(settingsObj);
      }
    } catch (err) {
      console.error("Failed to fetch delivery settings:", err);
    }
  };

  const handleSaveDeliverySettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    const insideCharge = parseFloat(deliverySettings.inside_dhaka_charge);
    const outsideCharge = parseFloat(deliverySettings.outside_dhaka_charge);

    if (isNaN(insideCharge) || insideCharge < 0) {
      Swal.fire(
        "Error",
        "Please enter a valid Inside Dhaka delivery charge.",
        "error",
      );
      return;
    }
    if (isNaN(outsideCharge) || outsideCharge < 0) {
      Swal.fire(
        "Error",
        "Please enter a valid Outside Dhaka delivery charge.",
        "error",
      );
      return;
    }

    try {
      setSavingDeliverySettings(true);
      const res = await fetch(`${API_BASE}/store/delivery-settings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          inside_dhaka_charge: insideCharge,
          outside_dhaka_charge: outsideCharge,
          estimated_days_inside: deliverySettings.estimated_days_inside,
          estimated_days_outside: deliverySettings.estimated_days_outside,
          is_active: deliverySettings.is_active,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedObj = {
          inside_dhaka_charge: String(data.inside_dhaka_charge),
          outside_dhaka_charge: String(data.outside_dhaka_charge),
          estimated_days_inside: data.estimated_days_inside || "1-2 Days",
          estimated_days_outside: data.estimated_days_outside || "3-5 Days",
          is_active: data.is_active ?? true,
        };
        setDeliverySettings(updatedObj);
        setInitialDeliverySettings(updatedObj);
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Delivery settings updated!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to update",
          text: "Could not save delivery settings. Please try again.",
        });
      }
    } catch (err) {
      console.error("Error saving delivery settings:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to connect to the server.",
      });
    } finally {
      setSavingDeliverySettings(false);
    }
  };

  const fetchDeliveryRules = async () => {
    try {
      const res = await fetch(`${API_BASE}/store/delivery-rules/`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setDeliveryRulesList(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error("Failed to fetch delivery rules:", err);
    }
  };

  const handleStartEditDeliveryRule = (rule: DeliveryRuleItem) => {
    setEditingDeliveryRuleId(rule.id);
    setDeliveryRuleTitle(rule.title);
    setDeliveryRuleTargetType(rule.target_type);
    setDeliveryRuleType(rule.rule_type);
    setDeliveryRuleInsideCharge(String(rule.inside_dhaka_charge));
    setDeliveryRuleOutsideCharge(String(rule.outside_dhaka_charge));
    setDeliveryRuleCollectionId(rule.collection || "");
    setDeliveryRuleSelectedProductIds(
      rule.products_details ? rule.products_details.map((p) => p.id) : [],
    );
    setDeliveryRuleMinQuantity(String(rule.min_quantity || 1));
    setDeliveryRuleIsActive(rule.is_active);
    setDeliveryRuleSearchInput("");
  };

  const handleCancelEditDeliveryRule = () => {
    setEditingDeliveryRuleId(null);
    setDeliveryRuleTitle("");
    setDeliveryRuleTargetType("product");
    setDeliveryRuleType("free");
    setDeliveryRuleInsideCharge("0");
    setDeliveryRuleOutsideCharge("0");
    setDeliveryRuleCollectionId("");
    setDeliveryRuleSelectedProductIds([]);
    setDeliveryRuleMinQuantity("1");
    setDeliveryRuleIsActive(true);
    setDeliveryRuleSearchInput("");
  };

  const handleSaveDeliveryRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const title = deliveryRuleTitle.trim();
    if (!title) {
      Swal.fire(
        "Error",
        "Please provide a title for this delivery rule.",
        "error",
      );
      return;
    }

    if (
      deliveryRuleTargetType === "product" &&
      deliveryRuleSelectedProductIds.length === 0
    ) {
      Swal.fire(
        "Error",
        "Please select at least one product for this delivery rule.",
        "error",
      );
      return;
    }

    if (deliveryRuleTargetType === "collection" && !deliveryRuleCollectionId) {
      Swal.fire(
        "Error",
        "Please select a collection for this delivery rule.",
        "error",
      );
      return;
    }

    let insideCharge = 0;
    let outsideCharge = 0;
    if (deliveryRuleType === "reduced") {
      insideCharge = parseFloat(deliveryRuleInsideCharge);
      outsideCharge = parseFloat(deliveryRuleOutsideCharge);
      if (isNaN(insideCharge) || insideCharge < 0) {
        Swal.fire(
          "Error",
          "Please enter a valid reduced Inside Dhaka delivery charge.",
          "error",
        );
        return;
      }
      if (isNaN(outsideCharge) || outsideCharge < 0) {
        Swal.fire(
          "Error",
          "Please enter a valid reduced Outside Dhaka delivery charge.",
          "error",
        );
        return;
      }
    }

    const isEdit = editingDeliveryRuleId !== null;
    const targetDesc =
      deliveryRuleTargetType === "product"
        ? `${deliveryRuleSelectedProductIds.length} product(s)`
        : `Collection "${collections.find((c) => c.id === Number(deliveryRuleCollectionId))?.title || deliveryRuleCollectionId}"`;

    const benefitDesc =
      deliveryRuleType === "free"
        ? "Free Delivery (৳0)"
        : `Custom Charge (Inside: ৳${insideCharge}, Outside: ৳${outsideCharge})`;

    const confirm = await Swal.fire({
      title: isEdit ? `Update Delivery Rule?` : `Create Delivery Rule?`,
      text: `Are you sure you want to ${isEdit ? "update" : "create"} "${title}" (${benefitDesc}) for ${targetDesc}? Status: ${deliveryRuleIsActive ? "ACTIVE" : "DISABLED"}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--accent)",
      cancelButtonColor: "var(--button-bg)",
      confirmButtonText: isEdit ? "Yes, Update Rule" : "Yes, Create Rule",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    const minQty = parseInt(deliveryRuleMinQuantity, 10);
    if (isNaN(minQty) || minQty < 1) {
      Swal.fire(
        "Error",
        "Please enter a valid minimum quantity (1 or greater).",
        "error",
      );
      return;
    }

    try {
      setDeliveryRuleCreating(true);
      const url = isEdit
        ? `${API_BASE}/store/delivery-rules/${editingDeliveryRuleId}/`
        : `${API_BASE}/store/delivery-rules/`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          title,
          target_type: deliveryRuleTargetType,
          rule_type: deliveryRuleType,
          inside_dhaka_charge: insideCharge,
          outside_dhaka_charge: outsideCharge,
          products:
            deliveryRuleTargetType === "product"
              ? deliveryRuleSelectedProductIds
              : [],
          collection:
            deliveryRuleTargetType === "collection"
              ? Number(deliveryRuleCollectionId)
              : null,
          min_quantity: minQty,
          is_active: deliveryRuleIsActive,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isEdit ? `Delivery rule updated!` : `Delivery rule created!`,
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        handleCancelEditDeliveryRule();
        fetchDeliveryRules();
      } else {
        const errorMsg =
          data.error || data.title
            ? Object.values(data).flat().join(" ")
            : `Failed to ${isEdit ? "update" : "create"} delivery rule.`;
        Swal.fire("Error", errorMsg, "error");
      }
    } catch (err) {
      Swal.fire("Error", "Network error while saving delivery rule.", "error");
    } finally {
      setDeliveryRuleCreating(false);
    }
  };

  const handleDeleteDeliveryRule = async (ruleId: number, title: string) => {
    if (!token) return;
    const confirm = await Swal.fire({
      title: "Delete Delivery Rule?",
      text: `Are you sure you want to delete delivery rule "${title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent)",
      cancelButtonColor: "var(--button-bg)",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/store/delivery-rules/${ruleId}/`, {
        method: "DELETE",
        headers: { Authorization: `JWT ${token}` },
      });
      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: `Delivery rule "${title}" deleted.`,
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        if (editingDeliveryRuleId === ruleId) {
          handleCancelEditDeliveryRule();
        }
        fetchDeliveryRules();
      } else {
        Swal.fire("Error", "Failed to delete delivery rule.", "error");
      }
    } catch (err) {
      Swal.fire(
        "Error",
        "Network error while deleting delivery rule.",
        "error",
      );
    }
  };

  const handleToggleDeliveryRule = async (rule: DeliveryRuleItem) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/store/delivery-rules/${rule.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ is_active: !rule.is_active }),
      });
      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: `Rule "${rule.title}" ${!rule.is_active ? "activated" : "disabled"}!`,
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        fetchDeliveryRules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/store/payment-settings/`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const settingsObj = {
          bkash_number: data.bkash_number || "01711111111",
          bkash_active: data.bkash_active ?? true,
          nagad_number: data.nagad_number || "01711111111",
          nagad_active: data.nagad_active ?? true,
          cod_active: data.cod_active ?? true,
          vibecoin_active: data.vibecoin_active ?? true,
        };
        setPaymentSettings(settingsObj);
        setInitialPaymentSettings(settingsObj);
      }
    } catch (err) {
      console.error("Failed to fetch payment settings:", err);
    }
  };

  const handleSavePaymentSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    try {
      setSavingPaymentSettings(true);
      const res = await fetch(`${API_BASE}/store/payment-settings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify(paymentSettings),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedObj = {
          bkash_number: data.bkash_number,
          bkash_active: data.bkash_active,
          nagad_number: data.nagad_number,
          nagad_active: data.nagad_active,
          cod_active: data.cod_active,
          vibecoin_active: data.vibecoin_active,
        };
        setPaymentSettings(updatedObj);
        setInitialPaymentSettings(updatedObj);
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Payment settings updated!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to update",
          text: "Could not save payment settings. Please try again.",
        });
      }
    } catch (err) {
      console.error("Error saving payment settings:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to connect to the server.",
      });
    } finally {
      setSavingPaymentSettings(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${API_BASE}/store/coupons/`, {
        cache: "no-store",
      });
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
        : "",
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

  const handleToggleCouponActive = async (
    coupon: CouponItem,
    e?: React.MouseEvent,
  ) => {
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
      Swal.fire(
        "Error",
        "Please enter a valid discount percentage (1-100).",
        "error",
      );
      return;
    }
    if (!couponValidTo) {
      Swal.fire("Error", "Please select an expiration date and time.", "error");
      return;
    }
    if (
      couponTargetType === "product" &&
      couponSelectedProductIds.length === 0
    ) {
      Swal.fire(
        "Error",
        "Please select at least one product for this coupon.",
        "error",
      );
      return;
    }
    if (couponTargetType === "collection" && !couponCollectionId) {
      Swal.fire(
        "Error",
        "Please select a collection for this coupon.",
        "error",
      );
      return;
    }

    const targetDesc =
      couponTargetType === "product"
        ? `${couponSelectedProductIds.length} product(s)`
        : `Collection "${collections.find((c) => c.id === Number(couponCollectionId))?.title || couponCollectionId}"`;

    const isEdit = editingCouponId !== null;
    const confirm = await Swal.fire({
      title: isEdit
        ? `Update Coupon ${cleanCode}?`
        : `Create Coupon ${cleanCode}?`,
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
      const url = isEdit
        ? `${API_BASE}/store/coupons/${editingCouponId}/`
        : `${API_BASE}/store/coupons/`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          discount_percent: pct,
          valid_to: new Date(couponValidTo).toISOString(),
          target_type: couponTargetType,
          product_ids:
            couponTargetType === "product" ? couponSelectedProductIds : [],
          collection:
            couponTargetType === "collection"
              ? Number(couponCollectionId)
              : null,
          is_active: couponIsActive,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isEdit
            ? `Coupon "${cleanCode}" updated!`
            : `Coupon "${cleanCode}" created!`,
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
        handleCancelEditCoupon();
        fetchCoupons();
      } else {
        const errorMsg = data.code
          ? `Code Error: ${data.code.join(" ")}`
          : data.error || `Failed to ${isEdit ? "update" : "create"} coupon.`;
        Swal.fire("Error", errorMsg, "error");
      }
    } catch (err) {
      Swal.fire(
        "Error",
        `Network error while ${isEdit ? "updating" : "creating"} coupon.`,
        "error",
      );
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
      const res = await fetch(`${API_BASE}/store/products/all/`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setAllProductsForPromo(Array.isArray(data) ? data : data.results || []);
      } else {
        const fallbackRes = await fetch(
          `${API_BASE}/store/products/?page_size=1000`,
          { cache: "no-store" },
        );
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setAllProductsForPromo(
            Array.isArray(fallbackData)
              ? fallbackData
              : fallbackData.results || [],
          );
        }
      }
    } catch (err) {
      console.error("Failed to fetch all products for promo:", err);
    }
  };

  const promoProductsCatalog =
    allProductsForPromo.length > 0 ? allProductsForPromo : products;
  const selectedPromoProducts = promoProductsCatalog.filter((p) =>
    promoSelectedProductIds.includes(p.id),
  );
  const selectedCouponProducts = promoProductsCatalog.filter((p) =>
    couponSelectedProductIds.includes(p.id),
  );
  const selectedDeliveryRuleProducts = promoProductsCatalog.filter((p) =>
    deliveryRuleSelectedProductIds.includes(p.id),
  );

  const handleApplyPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (promoSelectedProductIds.length === 0) {
      Swal.fire("Error", "Please select at least one product.", "error");
      return;
    }
    const pct = parseFloat(promoDiscountPercent);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      Swal.fire(
        "Error",
        "Please enter a valid discount percentage (0-100).",
        "error",
      );
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
        Swal.fire(
          "Success!",
          data.message || "Promotion applied successfully!",
          "success",
        );
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

  const handleRemovePromotion = async (
    targetType: "product" | "collection" | "all",
    targetId?: number,
  ) => {
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
        Swal.fire(
          "Error",
          data.error || "Failed to remove promotion.",
          "error",
        );
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

    fetchAdminData(prodPage, activeProductQuery, products.length === 0);
  }, [user, token, authLoading, router, prodPage, activeProductQuery]);

  const filteredCollections = collections.filter(
    (c) =>
      c.title.toLowerCase().includes(activeCollectionQuery.toLowerCase()) ||
      String(c.id).includes(activeCollectionQuery),
  );

  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      orderStatusFilter === "ALL" || o.payment_status === orderStatusFilter;
    if (!matchesStatus) return false;

    if (!activeOrderQuery) return true;
    return (
      String(o.id).includes(activeOrderQuery) ||
      (o.customer_name &&
        o.customer_name
          .toLowerCase()
          .includes(activeOrderQuery.toLowerCase())) ||
      String(o.customer).includes(activeOrderQuery) ||
      (o.phone && o.phone.includes(activeOrderQuery)) ||
      (o.shipping_address &&
        o.shipping_address
          .toLowerCase()
          .includes(activeOrderQuery.toLowerCase()))
    );
  });

  const filteredCustomers = customers.filter(
    (c) =>
      String(c.id).includes(activeCustomerQuery) ||
      (c.customer_name &&
        c.customer_name
          .toLowerCase()
          .includes(activeCustomerQuery.toLowerCase())) ||
      (c.first_name &&
        c.first_name
          .toLowerCase()
          .includes(activeCustomerQuery.toLowerCase())) ||
      (c.last_name &&
        c.last_name
          .toLowerCase()
          .includes(activeCustomerQuery.toLowerCase())) ||
      `${c.first_name || ""} ${c.last_name || ""}`
        .toLowerCase()
        .includes(activeCustomerQuery.toLowerCase()) ||
      (c.email &&
        c.email.toLowerCase().includes(activeCustomerQuery.toLowerCase())) ||
      (c.phone && c.phone.includes(activeCustomerQuery)) ||
      (c.membership &&
        c.membership.toLowerCase().includes(activeCustomerQuery.toLowerCase())),
  );

  const handleViewCustomerHistory = async (customerPk: number) => {
    if (!token) return;

    try {
      const res = await fetch(
        `${API_BASE}/store/customers/${customerPk}/history/`,
        {
          headers: { Authorization: `JWT ${token}` },
        },
      );

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
    // Clear new product photos & variants
    newProductPhotoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewProductPhotos([]);
    setNewProductPhotoPreviews([]);
    setNewProductVariants([]);
    if (newProductFileInputRef.current) {
      newProductFileInputRef.current.value = "";
    }
  };

  // Create or Update Product (POST or PUT)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (
      !productForm.short_description.trim() ||
      !productForm.description.trim()
    ) {
      Swal.fire({
        icon: "warning",
        title: "Descriptions Required",
        text: "Please enter both a Short Description and a Details Description for the product.",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    const shortWordCount = productForm.short_description.trim()
      ? productForm.short_description.trim().split(/\s+/).length
      : 0;
    const detailWordCount = productForm.description.trim()
      ? productForm.description.trim().split(/\s+/).length
      : 0;

    if (shortWordCount > 150) {
      Swal.fire({
        icon: "warning",
        title: "Short Description Limit Exceeded",
        text: `Short description cannot exceed 150 words (currently ${shortWordCount} words).`,
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    if (detailWordCount > 500) {
      Swal.fire({
        icon: "warning",
        title: "Details Description Limit Exceeded",
        text: `Details description cannot exceed 500 words (currently ${detailWordCount} words).`,
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
        const createdOrUpdatedProd = await res.json().catch(() => null);
        const newProdId = createdOrUpdatedProd?.id;

        // If creating a brand new product, upload any pending photos & variants
        if (!isEditing && newProdId) {
          // 1. Upload Pending Photos
          if (newProductPhotos.length > 0) {
            for (const file of newProductPhotos) {
              const formData = new FormData();
              formData.append("image", file);
              await fetch(`${API_BASE}/store/products/${newProdId}/images/`, {
                method: "POST",
                headers: {
                  Authorization: `JWT ${token}`,
                },
                body: formData,
              }).catch((e) => console.error("Error uploading photo:", e));
            }
          }

          // 2. Create Pending Variants
          if (newProductVariants.length > 0) {
            for (const v of newProductVariants) {
              const variantPayload = {
                name: v.name.trim(),
                color_name: v.color_name.trim() || undefined,
                color_code: v.color_code.trim() || undefined,
                size: v.size.trim() || undefined,
                price_override: v.price_override
                  ? parseFloat(v.price_override)
                  : null,
                inventory: parseInt(v.inventory) || 0,
                is_active: v.is_active,
              };
              await fetch(`${API_BASE}/store/products/${newProdId}/variants/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `JWT ${token}`,
                },
                body: JSON.stringify(variantPayload),
              }).catch((e) => console.error("Error creating variant:", e));
            }
          }
        }

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: isEditing
            ? "Product updated successfully!"
            : "Product and details added successfully!",
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
      prev.map((p) =>
        p.id === product.id ? { ...p, is_trending: newStatus } : p,
      ),
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
          title: newStatus
            ? "Added to Trending Now!"
            : "Removed from Trending Now",
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
      } else {
        // Revert on error
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, is_trending: !newStatus } : p,
          ),
        );
      }
    } catch (err) {
      console.error(err);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_trending: !newStatus } : p,
        ),
      );
    }
  };

  const handleToggleCollectionFeatured = async (col: Collection) => {
    if (!token) return;
    const newStatus = !col.is_featured;

    // Optimistic UI
    setCollections((prev) =>
      prev.map((c) => (c.id === col.id ? { ...c, is_featured: newStatus } : c)),
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
          title: newStatus
            ? "Set as Featured Category!"
            : "Removed from Featured Categories",
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
      } else {
        // Revert on error
        setCollections((prev) =>
          prev.map((c) =>
            c.id === col.id ? { ...c, is_featured: !newStatus } : c,
          ),
        );
      }
    } catch (err) {
      console.error(err);
      setCollections((prev) =>
        prev.map((c) =>
          c.id === col.id ? { ...c, is_featured: !newStatus } : c,
        ),
      );
    }
  };

  // Collection Edit State & Handlers
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(
    null,
  );
  const [collectionImageFile, setCollectionImageFile] = useState<File | null>(
    null,
  );
  const [collectionImagePreview, setCollectionImagePreview] = useState<
    string | null
  >(null);
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
              return prev.map((c) =>
                c.id === createdOrUpdatedCol.id
                  ? { ...c, ...createdOrUpdatedCol }
                  : c,
              );
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
            .map(
              ([key, val]) =>
                `${key}: ${Array.isArray(val) ? val.join(", ") : JSON.stringify(val)}`,
            )
            .join("\n");
        } else if (res.statusText) {
          errMsg = `Server error ${res.status}: ${res.statusText}`;
        }
        Swal.fire({
          icon: "error",
          title: isEditing
            ? "Failed to update collection"
            : "Failed to create collection",
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
      const res = await fetch(
        `${API_BASE}/store/collections/${editingCollectionId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${token}`,
          },
          body: JSON.stringify({ image: null }),
        },
      );

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
  const [selectedOrderDetails, setSelectedOrderDetails] =
    useState<Order | null>(null);

  // Update Order Payment Status (PATCH /store/orders/{id}/)
  const handleUpdateOrderStatus = async (
    orderId: number,
    newStatus: string,
  ) => {
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

  const navTabs = [
    {
      id: "products" as Tab,
      label: "Products",
      icon: "/admin/products.png",
      count: totalProductsCount,
    },
    {
      id: "collections" as Tab,
      label: "Categories",
      icon: "/admin/collections.png",
      count: collections.length,
    },
    {
      id: "orders" as Tab,
      label: "Orders",
      icon: "/admin/orders.png",
      count: orders.length,
    },
    {
      id: "customers" as Tab,
      label: "Customers",
      icon: "/admin/customers.png",
      count: customers.length,
    },
    {
      id: "promotions" as Tab,
      label: "Sales",
      icon: "/admin/sales.png",
      count: promoProductsCatalog.filter(
        (p) => Number(p.discount_percent || 0) > 0,
      ).length,
    },
    {
      id: "coupons" as Tab,
      label: "Coupons",
      icon: "/admin/coupons.png",
      count: couponsList.length,
    },
    {
      id: "payments" as Tab,
      label: "Payment Settings",
      icon: "/admin/payment_settings.png",
    },
    {
      id: "delivery" as Tab,
      label: "Manage Delivery",
      icon: "/admin/manage_delivery.png",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 flex flex-col">
      {/* Top Banner Header */}
      <header className="bg-primary text-background dark:text-foreground py-4 px-6 md:px-10 border-b border-white/10 shadow-sm transition-colors duration-300 sticky top-0 z-40">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-accent text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-widest rounded-md">
                  Staff Portal
                </span>
                <h1 className="text-lg md:text-xl font-black uppercase tracking-tight">
                  Admin Dashboard
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="bg-accent/20 text-accent hover:bg-accent/30 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-accent/20 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Body: Left Sidebar + Right Content Area */}
      <div className="flex flex-1 relative min-h-[calc(100vh-65px)]">
        {/* Left Sidebar Navigation */}
        <aside
          className={`bg-primary/95 dark:bg-black/40 border-r border-foreground/10 flex flex-col py-4 transition-all duration-300 ease-in-out shrink-0 sticky top-[65px] h-[calc(100vh-65px)] z-30 select-none ${
            isSidebarCollapsed ? "w-20 px-2" : "w-64 md:w-72 px-4"
          }`}
        >
          {/* Top of Sidebar: Toggle Collapse/Expand Button */}
          <div
            className={`flex items-center mb-5 pb-3 border-b border-white/10 ${
              isSidebarCollapsed ? "justify-center" : "justify-between px-1"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-background dark:text-foreground transition-all flex items-center justify-center cursor-pointer shadow-xs"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  isSidebarCollapsed ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          {/* Nav Tab Items */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-0.5 scrollbar-thin">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  title={isSidebarCollapsed ? tab.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer group ${
                    isSidebarCollapsed ? "justify-center" : "justify-between"
                  } ${
                    isActive
                      ? "bg-secondary text-foreground shadow-md scale-[1.02]"
                      : "text-background/70 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`relative w-6 h-6 rounded-lg flex items-center justify-center shrink-0 p-0.5 transition-transform group-hover:scale-110 ${
                        isActive
                          ? "opacity-100"
                          : "opacity-80 group-hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={tab.icon}
                        alt={tab.label}
                        width={24}
                        height={24}
                        className={`object-contain w-full h-full brightness-0 ${
                          isActive ? "" : "invert"
                        }`}
                      />
                    </div>

                    {/* Tab Label (Smooth text transition on collapse) */}
                    {!isSidebarCollapsed && (
                      <span className="truncate text-left transition-opacity duration-200">
                        {tab.label}
                      </span>
                    )}
                  </div>

                  {/* Count Badge */}
                  {!isSidebarCollapsed && typeof tab.count !== "undefined" && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 transition-colors ${
                        isActive
                          ? "bg-accent/20 text-accent"
                          : "bg-white/10 text-background/80 dark:text-foreground/80"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 p-6 md:p-10 max-w-[1600px] w-full overflow-x-hidden transition-all duration-300">
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
                      Unit Price (৳) *
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
                    value={
                      productForm.collection ||
                      (collections.length > 0 ? String(collections[0].id) : "")
                    }
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        collection: e.target.value,
                      })
                    }
                    className="px-4 py-2.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-accent transition-all"
                  >
                    {collections.map((col) => (
                      <option
                        key={col.id}
                        value={col.id}
                        className="bg-secondary text-foreground"
                      >
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const shortWords = productForm.short_description.trim()
                    ? productForm.short_description.trim().split(/\s+/).length
                    : 0;
                  const detailWords = productForm.description.trim()
                    ? productForm.description.trim().split(/\s+/).length
                    : 0;
                  return (
                    <>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                            Short Description{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <span
                            className={`text-[10px] font-bold ${
                              shortWords > 150 ? "text-red-500" : "opacity-60"
                            }`}
                          >
                            {shortWords}/150 words
                          </span>
                        </div>
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
                          className={`px-4 py-2.5 border rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none transition-all ${
                            shortWords > 150
                              ? "border-red-500 ring-1 ring-red-500"
                              : "border-foreground/15 focus:ring-2 focus:ring-accent"
                          }`}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                            Details Description{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <span
                            className={`text-[10px] font-bold ${
                              detailWords > 500 ? "text-red-500" : "opacity-60"
                            }`}
                          >
                            {detailWords}/500 words
                          </span>
                        </div>
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
                          className={`px-4 py-2.5 border rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none transition-all ${
                            detailWords > 500
                              ? "border-red-500 ring-1 ring-red-500"
                              : "border-foreground/15 focus:ring-2 focus:ring-accent"
                          }`}
                        />
                      </div>
                    </>
                  );
                })()}

                {/* In Creation Mode: Add Photos & Variants directly */}
                {!editingProductId && (
                  <div className="space-y-4 pt-4 border-t border-foreground/10">
                    {/* 1. Photos Section */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                          Product Photos ({newProductPhotos.length}/5)
                        </label>
                        {newProductPhotos.length < 5 && (
                          <button
                            type="button"
                            onClick={() =>
                              newProductFileInputRef.current?.click()
                            }
                            className="text-[10px] font-bold text-accent hover:underline uppercase tracking-wider cursor-pointer"
                          >
                            + Add Photos
                          </button>
                        )}
                      </div>

                      <input
                        type="file"
                        ref={newProductFileInputRef}
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          const remainingSlots = 5 - newProductPhotos.length;
                          const addedFiles = Array.from(files).slice(
                            0,
                            remainingSlots,
                          );
                          const addedPreviews = addedFiles.map((file) =>
                            URL.createObjectURL(file),
                          );
                          setNewProductPhotos((prev) => [
                            ...prev,
                            ...addedFiles,
                          ]);
                          setNewProductPhotoPreviews((prev) => [
                            ...prev,
                            ...addedPreviews,
                          ]);
                          if (newProductFileInputRef.current) {
                            newProductFileInputRef.current.value = "";
                          }
                        }}
                      />

                      {newProductPhotos.length > 0 ? (
                        <div className="grid grid-cols-5 gap-2 p-2 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-foreground/10">
                          {newProductPhotoPreviews.map((url, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-square rounded-xl overflow-hidden border border-foreground/15 group bg-background"
                            >
                              <img
                                src={url}
                                alt={`New photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  URL.revokeObjectURL(
                                    newProductPhotoPreviews[idx],
                                  );
                                  setNewProductPhotos((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  );
                                  setNewProductPhotoPreviews((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  );
                                }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black shadow-md hover:bg-red-600 cursor-pointer"
                                title="Remove photo"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {newProductPhotos.length < 5 && (
                            <button
                              type="button"
                              onClick={() =>
                                newProductFileInputRef.current?.click()
                              }
                              className="aspect-square rounded-xl border-2 border-dashed border-foreground/20 hover:border-accent/50 flex flex-col items-center justify-center text-[10px] font-bold opacity-60 hover:opacity-100 transition-all cursor-pointer"
                            >
                              <span>+</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div
                          onClick={() =>
                            newProductFileInputRef.current?.click()
                          }
                          className="border-2 border-dashed border-foreground/20 hover:border-accent/40 rounded-2xl p-4 text-center cursor-pointer transition-colors"
                        >
                          <p className="text-xs font-bold text-foreground opacity-80">
                            Upload Photos
                          </p>
                          <p className="text-[10px] opacity-50 mt-0.5">
                            Upload up to 5 photos for this product
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 2. Variants Section */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                          Product Variants ({newProductVariants.length})
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNewVariantIndex(null);
                            setNewVariantForm({
                              name: "",
                              color_name: "",
                              color_code: "",
                              size: "",
                              price_override: "",
                              inventory: "10",
                              is_active: true,
                            });
                            setIsNewVariantModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-accent hover:underline uppercase tracking-wider cursor-pointer"
                        >
                          + Add Variant
                        </button>
                      </div>

                      {newProductVariants.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {newProductVariants.map((v, vIdx) => (
                            <div
                              key={vIdx}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-foreground/10 shadow-2xs text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {v.color_code && (
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-foreground/20 shrink-0"
                                    style={{ backgroundColor: v.color_code }}
                                  />
                                )}
                                <span className="font-bold truncate">
                                  {v.name}
                                </span>
                                {v.size && (
                                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[9px] font-extrabold uppercase">
                                    {v.size}
                                  </span>
                                )}
                                <span className="text-[10px] opacity-60">
                                  Stock: {v.inventory}
                                </span>
                                {v.price_override && (
                                  <span className="text-accent text-[10px] font-mono">
                                    ৳{parseFloat(v.price_override).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNewVariantIndex(vIdx);
                                    setNewVariantForm({ ...v });
                                    setIsNewVariantModalOpen(true);
                                  }}
                                  className="text-[10px] font-bold text-accent hover:underline uppercase px-1 cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNewProductVariants((prev) =>
                                      prev.filter((_, i) => i !== vIdx),
                                    )
                                  }
                                  className="text-[10px] font-bold text-red-500 hover:underline uppercase px-1 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingNewVariantIndex(null);
                            setNewVariantForm({
                              name: "",
                              color_name: "",
                              color_code: "",
                              size: "",
                              price_override: "",
                              inventory: "10",
                              is_active: true,
                            });
                            setIsNewVariantModalOpen(true);
                          }}
                          className="border border-foreground/15 rounded-xl p-3 text-center cursor-pointer hover:bg-primary/5 transition-colors"
                        >
                          <p className="text-[11px] font-bold opacity-70">
                            + Add Color, Size, or Style Variants (Optional)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-button-bg text-button-fg rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors shadow-md cursor-pointer"
                >
                  {editingProductId ? "Update Product" : "Create Product"}
                </button>
              </form>

              {/* Modal for adding/editing variant during creation */}
              {isNewVariantModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                  <div className="bg-secondary text-foreground p-6 rounded-3xl border border-foreground/15 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center pb-2 border-b border-foreground/10">
                      <h3 className="text-xs font-black uppercase tracking-wider">
                        {editingNewVariantIndex !== null
                          ? "Edit Variant"
                          : "Add Variant"}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsNewVariantModalOpen(false)}
                        className="text-foreground/50 hover:text-foreground font-black text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newVariantForm.name.trim()) return;

                        if (editingNewVariantIndex !== null) {
                          setNewProductVariants((prev) =>
                            prev.map((item, idx) =>
                              idx === editingNewVariantIndex
                                ? { ...newVariantForm }
                                : item,
                            ),
                          );
                        } else {
                          setNewProductVariants((prev) => [
                            ...prev,
                            { ...newVariantForm },
                          ]);
                        }
                        setIsNewVariantModalOpen(false);
                      }}
                      className="space-y-3 text-xs"
                    >
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                          Variant Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newVariantForm.name}
                          onChange={(e) =>
                            setNewVariantForm({
                              ...newVariantForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g. Midnight Black - L"
                          className="w-full bg-background border border-foreground/15 rounded-xl px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                            Color Name
                          </label>
                          <input
                            type="text"
                            value={newVariantForm.color_name}
                            onChange={(e) =>
                              setNewVariantForm({
                                ...newVariantForm,
                                color_name: e.target.value,
                              })
                            }
                            placeholder="e.g. Midnight Black"
                            className="w-full bg-background border border-foreground/15 rounded-xl px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                            Color Code / Hex
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={newVariantForm.color_code || "#000000"}
                              onChange={(e) =>
                                setNewVariantForm({
                                  ...newVariantForm,
                                  color_code: e.target.value,
                                })
                              }
                              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                            />
                            <input
                              type="text"
                              value={newVariantForm.color_code}
                              onChange={(e) =>
                                setNewVariantForm({
                                  ...newVariantForm,
                                  color_code: e.target.value,
                                })
                              }
                              placeholder="#000000"
                              className="flex-1 bg-background border border-foreground/15 rounded-xl px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-accent"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                            Size
                          </label>
                          <input
                            type="text"
                            value={newVariantForm.size}
                            onChange={(e) =>
                              setNewVariantForm({
                                ...newVariantForm,
                                size: e.target.value,
                              })
                            }
                            placeholder="e.g. XL, 42, 250ml"
                            className="w-full bg-background border border-foreground/15 rounded-xl px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                            Price (Optional)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={newVariantForm.price_override}
                            onChange={(e) =>
                              setNewVariantForm({
                                ...newVariantForm,
                                price_override: e.target.value,
                              })
                            }
                            placeholder="Override ৳"
                            className="w-full bg-background border border-foreground/15 rounded-xl px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                            Inventory *
                          </label>
                          <input
                            type="number"
                            required
                            value={newVariantForm.inventory}
                            onChange={(e) =>
                              setNewVariantForm({
                                ...newVariantForm,
                                inventory: e.target.value,
                              })
                            }
                            placeholder="10"
                            className="w-full bg-background border border-foreground/15 rounded-xl px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-foreground/10">
                        <button
                          type="button"
                          onClick={() => setIsNewVariantModalOpen(false)}
                          className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-foreground/10"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-button-bg text-button-fg text-[10px] font-bold uppercase tracking-wider shadow-md hover:opacity-90"
                        >
                          {editingNewVariantIndex !== null
                            ? "Save Changes"
                            : "Add Variant"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Photo Upload & Variants Section when editing an existing product */}
              {editingProductId && (
                <>
                  <div className="mt-4 pt-4 border-t border-foreground/10">
                    <ImageUploadModal
                      productId={editingProductId}
                      onSuccess={fetchAdminData}
                      onUnsavedChange={setHasUnsavedPhotos}
                    />
                  </div>

                  <ProductVariantsManager
                    productId={editingProductId}
                    productTitle={productForm.title}
                    basePrice={parseFloat(productForm.unit_price) || 0}
                    token={token}
                    onVariantsUpdated={fetchAdminData}
                  />
                </>
              )}
            </div>

            {/* Products Table (2 Columns) */}
            <div className="lg:col-span-2 bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm overflow-x-auto transition-colors duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                  All Products ({totalProductsCount || products.length})
                </h2>
                <ProductSearchBar
                  mode="admin"
                  initialSearch={activeProductQuery}
                  onSelectProduct={(prod) => handleSelectProduct(prod as any)}
                  onSearchSubmit={(q) => {
                    setActiveProductQuery(q);
                    setProdPage(1);
                  }}
                  onClear={() => {
                    setActiveProductQuery("");
                    setProdPage(1);
                  }}
                />
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
                            <ProductImage
                              title={prod.title}
                              images={prod.images}
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[180px] sm:max-w-xs">
                              {prod.title}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-accent font-extrabold align-middle">
                        ৳{Number(prod.unit_price).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 align-middle">
                        {prod.inventory}
                      </td>
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
                        Math.min(prev + 1, Math.ceil(totalProductsCount / 9)),
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
                          src={
                            collectionImagePreview.startsWith("http") ||
                            collectionImagePreview.startsWith("blob")
                              ? collectionImagePreview
                              : `${API_BASE}${collectionImagePreview}`
                          }
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
                  {editingCollectionId
                    ? "Update Collection"
                    : "Save Collection"}
                </button>
              </form>
            </div>

            {/* Collections List */}
            <div className="lg:col-span-2 bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-foreground/10">
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                  Existing Collections ({filteredCollections.length})
                </h2>
                <CollectionSearchBar
                  initialSearch={activeCollectionQuery}
                  onSelectCollection={(col) => {
                    handleSelectCollection(col as any);
                  }}
                  onSearchSubmit={(q) => {
                    setActiveCollectionQuery(q);
                  }}
                  onClear={() => {
                    setActiveCollectionQuery("");
                  }}
                />
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
                          <img
                            src={
                              col.image.startsWith("http")
                                ? col.image
                                : `${API_BASE}${col.image}`
                            }
                            alt={col.title}
                            className="w-full h-full object-cover"
                          />
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
                    <div
                      className="flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
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
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-foreground/10">
              <div className="flex flex-wrap items-center gap-4">
                {/* Status Filter Buttons (All, Pending, Complete, Failed) */}
                <div className="flex items-center gap-1.5 p-1 bg-primary/5 dark:bg-primary/30 rounded-xl border border-foreground/10">
                  {[
                    {
                      id: "ALL" as const,
                      label: "All Orders",
                      count: orders.length,
                    },
                    {
                      id: "P" as const,
                      label: "Pending",
                      count: orders.filter((o) => o.payment_status === "P")
                        .length,
                      color: "text-amber-500",
                    },
                    {
                      id: "C" as const,
                      label: "Complete",
                      count: orders.filter((o) => o.payment_status === "C")
                        .length,
                      color: "text-emerald-500",
                    },
                    {
                      id: "F" as const,
                      label: "Failed",
                      count: orders.filter((o) => o.payment_status === "F")
                        .length,
                      color: "text-red-500",
                    },
                  ].map((statusBtn) => {
                    const isSelected = orderStatusFilter === statusBtn.id;
                    return (
                      <button
                        key={statusBtn.id}
                        type="button"
                        onClick={() => setOrderStatusFilter(statusBtn.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-button-bg text-button-fg shadow-xs scale-102"
                            : "hover:bg-primary/10 text-foreground/70 hover:text-foreground"
                        }`}
                      >
                        <span>{statusBtn.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                            isSelected
                              ? "bg-white/20 text-button-fg"
                              : "bg-foreground/10 text-foreground/80"
                          }`}
                        >
                          {statusBtn.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

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
                  placeholder="Search orders..."
                  className="px-3.5 py-1.5 border border-foreground/15 rounded-xl bg-primary/5 dark:bg-primary/30 text-xs font-bold text-foreground outline-none w-full sm:w-48 focus:ring-2 focus:ring-accent"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-button-bg text-button-fg hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Search
                </button>
                {(activeOrderQuery || orderSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderSearch("");
                      setActiveOrderQuery("");
                    }}
                    className="text-[10px] font-bold text-red-500 hover:underline uppercase cursor-pointer"
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
                      const itemCount = order.items
                        ? order.items.reduce((sum, i) => sum + i.quantity, 0)
                        : 0;

                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-primary/5 dark:hover:bg-primary/30 transition-colors"
                        >
                          <td className="py-3.5 px-2 font-black">
                            Order #{order.id}
                          </td>
                          <td className="py-3.5 px-2 opacity-90 font-bold">
                            {order.customer_name ||
                              `Customer #${order.customer}`}
                          </td>
                          <td className="py-3.5 px-2 opacity-60 text-[11px]">
                            {order.placed_at
                              ? new Date(order.placed_at).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="py-3.5 px-2">
                            {order.payment_method === "V" ? (
                              <span className="text-accent font-black uppercase inline-flex items-center gap-1 text-[11px]">
                                <img
                                  src="/VibeCoin/VibeCoin.png"
                                  alt="VibeCoin"
                                  className="w-3.5 h-3.5 object-contain"
                                />{" "}
                                VibeCoin
                              </span>
                            ) : order.payment_method === "B" ||
                              order.payment_method === "O" ? (
                              <span className="text-bkash font-black uppercase text-[11px]">
                                bKash
                              </span>
                            ) : order.payment_method === "N" ? (
                              <span className="text-nagad font-black uppercase text-[11px]">
                                Nagad
                              </span>
                            ) : (
                              <span className="opacity-80 font-bold uppercase text-[11px]">
                                COD
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-2">{itemCount} item(s)</td>
                          <td className="py-3.5 px-2">
                            <select
                              value={order.payment_status || "P"}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  e.target.value,
                                )
                              }
                              className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider outline-none cursor-pointer border ${
                                order.payment_status === "C"
                                  ? "bg-green-500/20 text-green-500 border-green-500/30"
                                  : order.payment_status === "F"
                                    ? "bg-red-500/20 text-red-500 border-red-500/30"
                                    : "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                              }`}
                            >
                              <option
                                value="P"
                                className="bg-secondary text-foreground"
                              >
                                Pending (P)
                              </option>
                              <option
                                value="C"
                                className="bg-secondary text-foreground"
                              >
                                Complete (C)
                              </option>
                              <option
                                value="F"
                                className="bg-secondary text-foreground"
                              >
                                Failed (F)
                              </option>
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
                    Customer #{selectedOrderDetails.customer} •{" "}
                    {selectedOrderDetails.placed_at
                      ? new Date(
                          selectedOrderDetails.placed_at,
                        ).toLocaleString()
                      : ""}
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
              <div className="bg-primary/5 dark:bg-primary/30 p-4 rounded-2xl mb-6 text-xs space-y-1.5">
                <p>
                  <strong>Phone:</strong> {selectedOrderDetails.phone || "N/A"}
                </p>
                <p>
                  <strong>Shipping Address:</strong>{" "}
                  {selectedOrderDetails.shipping_address || "N/A"}
                </p>
                <p>
                  <strong>Delivery Zone:</strong>{" "}
                  <span className="font-black text-accent uppercase">
                    {selectedOrderDetails.delivery_area === "outside_dhaka"
                      ? "Outside Dhaka"
                      : "Inside Dhaka"}
                  </span>
                  {selectedOrderDetails.delivery_charge !== undefined && (
                    <span className="ml-2 px-2 py-0.5 rounded-md bg-secondary border border-foreground/10 text-[10px] font-bold">
                      Delivery Fee: ৳
                      {Number(selectedOrderDetails.delivery_charge).toFixed(2)}
                    </span>
                  )}
                </p>
                <p>
                  <strong>Payment Method:</strong>{" "}
                  {selectedOrderDetails.payment_method === "V" ? (
                    <span className="text-accent font-black uppercase inline-flex items-center gap-1">
                      <img
                        src="/VibeCoin/VibeCoin.png"
                        alt="VibeCoin"
                        className="w-3.5 h-3.5 object-contain"
                      />{" "}
                      VibeCoin Payment
                    </span>
                  ) : selectedOrderDetails.payment_method === "O" ||
                    selectedOrderDetails.payment_method === "B" ? (
                    <span className="text-bkash font-black uppercase">
                      Online / bKash Payment
                    </span>
                  ) : selectedOrderDetails.payment_method === "N" ? (
                    <span className="text-nagad font-black uppercase">
                      Nagad Payment
                    </span>
                  ) : (
                    <span className="font-black uppercase">
                      Cash on Delivery (COD)
                    </span>
                  )}
                </p>
                {(selectedOrderDetails.payment_method === "O" ||
                  selectedOrderDetails.payment_method === "B") && (
                  <p>
                    <strong>bKash TrxID:</strong>{" "}
                    <code className="bg-secondary px-2 py-0.5 rounded font-mono font-bold text-bkash">
                      {selectedOrderDetails.transaction_id || "N/A"}
                    </code>{" "}
                    {selectedOrderDetails.transaction_phone_no
                      ? `[Sender: ${selectedOrderDetails.transaction_phone_no}]`
                      : ""}
                  </p>
                )}
                {selectedOrderDetails.payment_method === "N" && (
                  <p>
                    <strong>Nagad TrxID:</strong>{" "}
                    <code className="bg-secondary px-2 py-0.5 rounded font-mono font-bold text-nagad">
                      {selectedOrderDetails.transaction_id || "N/A"}
                    </code>{" "}
                    {selectedOrderDetails.transaction_phone_no
                      ? `[Sender: ${selectedOrderDetails.transaction_phone_no}]`
                      : ""}
                  </p>
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
                    {selectedOrderDetails.items &&
                    selectedOrderDetails.items.length > 0 ? (
                      selectedOrderDetails.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 px-1 font-bold">
                            <div>
                              {item.product?.title ||
                                `Product #${item.product}`}
                            </div>
                            {((item as any).variant ||
                              (item as any).variant_title) && (
                              <div className="text-[10px] text-accent font-semibold flex items-center gap-1 mt-0.5">
                                {(item as any).variant?.color_code && (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-black/20 inline-block shrink-0"
                                    style={{
                                      backgroundColor: (item as any).variant
                                        .color_code,
                                    }}
                                  />
                                )}
                                <span>
                                  Option:{" "}
                                  {(item as any).variant?.name ||
                                    (item as any).variant_title}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-1">{item.quantity}</td>
                          <td className="py-2 px-1">
                            ৳{Number(item.unit_price).toFixed(2)}
                          </td>
                          <td className="py-2 px-1 text-right font-black text-accent">
                            ৳
                            {(item.quantity * Number(item.unit_price)).toFixed(
                              2,
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-4 text-center text-xs opacity-50"
                        >
                          No item breakdown available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-foreground/10 space-y-2">
                <div className="flex justify-between text-xs opacity-75">
                  <span>Items Subtotal:</span>
                  <span>
                    ৳
                    {selectedOrderDetails.items
                      ? selectedOrderDetails.items
                          .reduce(
                            (sum, i) => sum + i.quantity * Number(i.unit_price),
                            0,
                          )
                          .toFixed(2)
                      : "0.00"}
                  </span>
                </div>
                {selectedOrderDetails.delivery_charge !== undefined && (
                  <div className="flex justify-between text-xs opacity-75">
                    <span>
                      Delivery Charge (
                      {selectedOrderDetails.delivery_area === "outside_dhaka"
                        ? "Outside Dhaka"
                        : "Inside Dhaka"}
                      ):
                    </span>
                    <span className="font-bold">
                      ৳{Number(selectedOrderDetails.delivery_charge).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-foreground/10">
                  <span className="text-xs font-bold opacity-70 uppercase">
                    Payment Status:{" "}
                    <strong className="uppercase font-black text-foreground">
                      {selectedOrderDetails.payment_status === "C"
                        ? "Complete"
                        : selectedOrderDetails.payment_status === "F"
                          ? "Failed"
                          : "Pending"}
                    </strong>
                  </span>
                  <span className="text-base font-black text-foreground">
                    Grand Total: ৳
                    {(
                      (selectedOrderDetails.items
                        ? selectedOrderDetails.items.reduce(
                            (sum, i) => sum + i.quantity * Number(i.unit_price),
                            0,
                          )
                        : 0) + Number(selectedOrderDetails.delivery_charge || 0)
                    ).toFixed(2)}
                  </span>
                </div>
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
              <CustomerSearchBar
                token={token}
                initialSearch={activeCustomerQuery}
                onSelectCustomer={(cust) => {
                  handleViewCustomerHistory(cust.id);
                }}
                onSearchSubmit={(q) => {
                  setActiveCustomerQuery(q);
                }}
                onClear={() => {
                  setActiveCustomerQuery("");
                }}
              />
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
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent font-black text-xs flex items-center justify-center flex-shrink-0 border border-accent/20">
                              {(
                                (cust.first_name ? cust.first_name[0] : "") +
                                  (cust.last_name ? cust.last_name[0] : "") ||
                                cust.customer_name?.[0] ||
                                "U"
                              ).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-black text-foreground">
                                {cust.first_name || cust.last_name
                                  ? `${cust.first_name || ""} ${cust.last_name || ""}`.trim()
                                  : cust.customer_name ||
                                    `Customer #${cust.id}`}
                              </div>
                              <div className="text-[10px] opacity-60 flex items-center gap-1.5 font-medium">
                                <span>@{cust.customer_name}</span>
                                {cust.email && <span>• {cust.email}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 opacity-80">
                          {cust.phone || "No Phone Registered"}
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-[10px] uppercase font-black tracking-wider">
                            {cust.membership === "G"
                              ? "Gold (G)"
                              : cust.membership === "S"
                                ? "Silver (S)"
                                : "Bronze (B)"}
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
                        <span className="font-black text-sm">
                          Order #{ord.id}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black ${
                            ord.payment_status === "C"
                              ? "bg-green-500/20 text-green-500"
                              : ord.payment_status === "F"
                                ? "bg-red-500/20 text-red-500"
                                : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {ord.payment_status === "C"
                            ? "Complete"
                            : ord.payment_status === "F"
                              ? "Failed"
                              : "Pending"}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-70">
                        <strong>Placed At:</strong>{" "}
                        {ord.placed_at
                          ? new Date(ord.placed_at).toLocaleString()
                          : "N/A"}
                      </p>
                      <p className="text-[11px] opacity-70">
                        <strong>Shipping:</strong>{" "}
                        {ord.shipping_address || "N/A"} |{" "}
                        <strong>Phone:</strong> {ord.phone || "N/A"}
                      </p>
                      <p className="text-[11px] opacity-70">
                        <strong>Payment Method:</strong>{" "}
                        {ord.payment_method === "V" ? (
                          <span className="inline-flex items-center gap-1 align-middle">
                            <img
                              src="/VibeCoin/VibeCoin.png"
                              alt="VibeCoin"
                              className="w-3.5 h-3.5 object-contain inline"
                            />{" "}
                            VibeCoin Payment
                          </span>
                        ) : ord.payment_method === "O" ||
                          ord.payment_method === "B" ? (
                          `bKash (TrxID: ${ord.transaction_id || "N/A"})`
                        ) : ord.payment_method === "N" ? (
                          `Nagad (TrxID: ${ord.transaction_id || "N/A"})`
                        ) : (
                          "Cash on Delivery (COD)"
                        )}
                      </p>

                      {ord.items && ord.items.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-foreground/10 space-y-1">
                          <p className="text-[10px] font-black uppercase opacity-60">
                            Items:
                          </p>
                          {ord.items.map((it) => (
                            <div
                              key={it.id}
                              className="flex justify-between text-[11px]"
                            >
                              <span>
                                {it.product?.title || `Product #${it.product}`}{" "}
                                x {it.quantity}
                              </span>
                              <span className="font-bold">
                                ৳
                                {(it.quantity * Number(it.unit_price)).toFixed(
                                  2,
                                )}
                              </span>
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
        {activeTab === "promotions" &&
          (() => {
            const onSaleProducts = promoProductsCatalog.filter(
              (p) => Number(p.discount_percent || 0) > 0,
            );
            const filteredOnSaleProducts = onSaleProducts.filter(
              (p) =>
                !activePromoSearch ||
                p.title
                  .toLowerCase()
                  .includes(activePromoSearch.toLowerCase()) ||
                String(p.id).includes(activePromoSearch),
            );
            const promoItemsPerPage = 8;
            const totalPromoPages = Math.ceil(
              filteredOnSaleProducts.length / promoItemsPerPage,
            );
            const paginatedOnSaleProducts = filteredOnSaleProducts.slice(
              (promoPage - 1) * promoItemsPerPage,
              promoPage * promoItemsPerPage,
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
                          Select Products ({promoProductsCatalog.length}{" "}
                          available)
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
                              <span className="truncate max-w-[130px]">
                                #{p.id} {p.title}
                              </span>
                              <span className="text-accent text-[10px] font-mono">
                                ৳{Number(p.unit_price).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setPromoSelectedProductIds((prev) =>
                                    prev.filter((id) => id !== p.id),
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
                              const query = promoSearchInput
                                .toLowerCase()
                                .trim();
                              const matches = promoProductsCatalog.filter(
                                (prod) =>
                                  !query ||
                                  prod.title.toLowerCase().includes(query) ||
                                  String(prod.id).includes(query),
                              );

                              if (matches.length === 0) {
                                return (
                                  <div className="p-4 text-center text-xs font-bold opacity-50">
                                    No products found matching &ldquo;
                                    {promoSearchInput}&rdquo;
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
                                        const matchIds = matches.map(
                                          (m) => m.id,
                                        );
                                        setPromoSelectedProductIds((prev) =>
                                          Array.from(
                                            new Set([...prev, ...matchIds]),
                                          ),
                                        );
                                      }}
                                      className="text-accent hover:underline uppercase"
                                    >
                                      + Select All ({matches.length})
                                    </button>
                                  </div>
                                  {matches.map((prod) => {
                                    const isSelected =
                                      promoSelectedProductIds.includes(prod.id);
                                    const isOnSale =
                                      Number(prod.discount_percent || 0) > 0;
                                    return (
                                      <div
                                        key={prod.id}
                                        onClick={() => {
                                          setPromoSelectedProductIds((prev) =>
                                            prev.includes(prod.id)
                                              ? prev.filter(
                                                  (id) => id !== prod.id,
                                                )
                                              : [...prev, prod.id],
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
                                            <ProductImage
                                              title={prod.title}
                                              images={prod.images}
                                            />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate">
                                              #{prod.id} {prod.title}
                                            </p>
                                            <p className="text-[10px] text-foreground/60 font-semibold">
                                              Original: ৳
                                              {Number(prod.unit_price).toFixed(
                                                2,
                                              )}
                                            </p>
                                          </div>
                                        </div>

                                        {isOnSale ? (
                                          <span className="px-2 py-0.5 rounded bg-accent/15 text-accent font-black text-[9px] uppercase shrink-0">
                                            -
                                            {Math.round(
                                              Number(
                                                prod.discount_percent || 0,
                                              ),
                                            )}
                                            %
                                          </span>
                                        ) : (
                                          <span
                                            className={`text-[10px] font-bold shrink-0 ${
                                              isSelected
                                                ? "text-accent"
                                                : "text-foreground/40"
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
                          onChange={(e) =>
                            setPromoDiscountPercent(e.target.value)
                          }
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
                      disabled={
                        promoApplying || promoSelectedProductIds.length === 0
                      }
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
                          Products Currently On Sale
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
                                    <ProductImage
                                      title={prod.title}
                                      images={prod.images}
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-xs text-foreground line-clamp-1">
                                      {prod.title}
                                    </h4>
                                    <div className="flex items-baseline gap-2 mt-1">
                                      <span className="text-accent font-extrabold text-xs">
                                        ৳{discounted.toFixed(2)}
                                      </span>
                                      <span className="line-through text-[10px] opacity-50 font-bold">
                                        ৳{original.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemovePromotion("product", prod.id)
                                  }
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
                              onClick={() =>
                                setPromoPage((prev) => Math.max(prev - 1, 1))
                              }
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
                                  Math.min(prev + 1, totalPromoPages),
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
                  {editingCouponId
                    ? `Edit Coupon #${editingCouponId}`
                    : "Create New Coupon"}
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
                    maxLength={20}
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase().slice(0, 20))
                    }
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
                        Select Eligible Products ({promoProductsCatalog.length}{" "}
                        available)
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
                            <span className="truncate max-w-[130px]">
                              #{p.id} {p.title}
                            </span>
                            <span className="text-accent text-[10px] font-mono">
                              ৳{Number(p.unit_price).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setCouponSelectedProductIds((prev) =>
                                  prev.filter((id) => id !== p.id),
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
                            const query = couponSearchInput
                              .toLowerCase()
                              .trim();
                            const matches = promoProductsCatalog.filter(
                              (prod) =>
                                !query ||
                                prod.title.toLowerCase().includes(query) ||
                                String(prod.id).includes(query),
                            );

                            if (matches.length === 0) {
                              return (
                                <div className="p-4 text-center text-xs font-bold opacity-50">
                                  No products found matching &ldquo;
                                  {couponSearchInput}&rdquo;
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
                                      setCouponSelectedProductIds((prev) =>
                                        Array.from(
                                          new Set([...prev, ...matchIds]),
                                        ),
                                      );
                                    }}
                                    className="text-accent hover:underline uppercase"
                                  >
                                    + Select All ({matches.length})
                                  </button>
                                </div>
                                {matches.map((prod) => {
                                  const isSelected =
                                    couponSelectedProductIds.includes(prod.id);
                                  return (
                                    <div
                                      key={prod.id}
                                      onClick={() => {
                                        setCouponSelectedProductIds((prev) =>
                                          prev.includes(prod.id)
                                            ? prev.filter(
                                                (id) => id !== prod.id,
                                              )
                                            : [...prev, prod.id],
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
                                          <ProductImage
                                            title={prod.title}
                                            images={prod.images}
                                          />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-foreground truncate">
                                            #{prod.id} {prod.title}
                                          </p>
                                          <p className="text-[10px] text-foreground/60 font-semibold">
                                            Price: ৳
                                            {Number(prod.unit_price).toFixed(2)}
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

                {/* If Target is Collection: Collection Dropdown */}
                {couponTargetType === "collection" && (
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-70">
                      Select Collection *
                    </label>
                    <select
                      value={couponCollectionId}
                      onChange={(e) =>
                        setCouponCollectionId(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      required
                      className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
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

                <button
                  type="submit"
                  disabled={
                    couponCreating ||
                    !couponCode.trim() ||
                    (couponTargetType === "product" &&
                      couponSelectedProductIds.length === 0) ||
                    (couponTargetType === "collection" && !couponCollectionId)
                  }
                  className="w-full py-4 bg-button-bg text-button-fg rounded-xl font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                >
                  {editingCouponId
                    ? couponCreating
                      ? "Updating Coupon..."
                      : "Update Coupon"
                    : couponCreating
                      ? "Creating Coupon..."
                      : "Create Coupon Now"}
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
                      c.code
                        .toLowerCase()
                        .includes(couponFilterSearch.toLowerCase().trim()) ||
                      (c.collection_title &&
                        c.collection_title
                          .toLowerCase()
                          .includes(couponFilterSearch.toLowerCase().trim())),
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
                        const isExpired =
                          coupon.valid_to &&
                          new Date(coupon.valid_to) < new Date();
                        const formattedExpiry = coupon.valid_to
                          ? new Date(coupon.valid_to).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "No Expiry";
                        const isBeingEdited = editingCouponId === coupon.id;

                        return (
                          <div
                            key={coupon.id}
                            onClick={() => handleEditCoupon(coupon)}
                            className={`p-5 rounded-2xl border-2 flex flex-col justify-between gap-4 shadow-xs relative overflow-hidden group cursor-pointer transition-all ${
                              isBeingEdited
                                ? "border-accent shadow-md bg-accent/5"
                                : coupon.is_active
                                  ? "bg-background border-foreground/10 hover:border-accent/40"
                                  : "bg-background/40 border-foreground/10 opacity-60 hover:opacity-90 hover:border-accent/40"
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
                                      onClick={(e) =>
                                        handleToggleCouponActive(coupon, e)
                                      }
                                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all flex items-center gap-1 ${
                                        coupon.is_active
                                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                                          : "bg-foreground/15 text-foreground/60 hover:bg-foreground/25"
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          coupon.is_active
                                            ? "bg-emerald-500"
                                            : "bg-foreground/50"
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
                                  Scope:{" "}
                                  {coupon.target_type === "product"
                                    ? "Specific Products"
                                    : "Collection"}
                                </p>
                                {coupon.target_type === "product" ? (
                                  <p className="font-bold text-foreground truncate">
                                    {coupon.product_count ||
                                      (coupon.products_details
                                        ? coupon.products_details.length
                                        : 0)}{" "}
                                    Product(s) Selected
                                    {coupon.products_details &&
                                      coupon.products_details.length > 0 && (
                                        <span className="block text-[10px] opacity-70 font-normal truncate mt-0.5">
                                          {coupon.products_details
                                            .map((p) => p.title)
                                            .join(", ")}
                                        </span>
                                      )}
                                  </p>
                                ) : (
                                  <p className="font-bold text-foreground">
                                    Collection:{" "}
                                    {coupon.collection_title ||
                                      `#${coupon.collection}`}
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
                              ></button>
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

        {/* PAYMENT SETTINGS TAB */}
        {activeTab === "payments" &&
          (() => {
            const hasPaymentChanges =
              paymentSettings.bkash_number !==
                initialPaymentSettings.bkash_number ||
              paymentSettings.bkash_active !==
                initialPaymentSettings.bkash_active ||
              paymentSettings.nagad_number !==
                initialPaymentSettings.nagad_number ||
              paymentSettings.nagad_active !==
                initialPaymentSettings.nagad_active ||
              paymentSettings.cod_active !==
                initialPaymentSettings.cod_active ||
              paymentSettings.vibecoin_active !==
                initialPaymentSettings.vibecoin_active;

            return (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-foreground/10">
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                        Payment Gateway & Merchant Settings
                      </h2>
                      <p className="text-xs opacity-60 mt-1">
                        Manage receiver mobile numbers and enable or disable
                        payment options across checkout and gift cards in real
                        time.
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
                        ? "Saving..."
                        : hasPaymentChanges
                          ? "Save Changes"
                          : "No Changes"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1. bKash Settings */}
                    <div className="p-6 rounded-3xl bg-primary/5 dark:bg-primary/30 border border-foreground/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-secondary border border-foreground/10 p-1 flex items-center justify-center shadow-xs">
                            <img
                              src="/bKash.png"
                              alt="bKash"
                              className="h-6 w-auto object-contain"
                            />
                          </div>
                          <div>
                            <h3 className="font-black text-sm text-foreground">
                              bKash Payment
                            </h3>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider ${paymentSettings.bkash_active ? "text-accent" : "text-foreground/50"}`}
                            >
                              {paymentSettings.bkash_active
                                ? "Active"
                                : "Disabled"}
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
                          bKash Receiver / Merchant Number
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
                          placeholder="e.g. 01700000000"
                          className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                        />
                        <p className="text-[10px] opacity-50 font-medium">
                          This number is displayed to customers to send money
                          during bKash checkout.
                        </p>
                      </div>
                    </div>

                    {/* 2. Nagad Settings */}
                    <div className="p-6 rounded-3xl bg-primary/5 dark:bg-primary/30 border border-foreground/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-secondary border border-foreground/10 p-1 flex items-center justify-center shadow-xs">
                            <img
                              src="/nagad.webp"
                              alt="Nagad"
                              className="h-6 w-auto object-contain"
                            />
                          </div>
                          <div>
                            <h3 className="font-black text-sm text-foreground">
                              Nagad Payment
                            </h3>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider ${paymentSettings.nagad_active ? "text-accent" : "text-foreground/50"}`}
                            >
                              {paymentSettings.nagad_active
                                ? "Active"
                                : "Disabled"}
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
                          Nagad Receiver / Merchant Number
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
                          placeholder="e.g. 01800000000"
                          className="w-full px-4 py-2.5 rounded-xl border border-foreground/15 bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-accent"
                        />
                        <p className="text-[10px] opacity-50 font-medium">
                          This number is displayed to customers to send money
                          during Nagad checkout.
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
                            Cash On Delivery (COD)
                          </h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${paymentSettings.cod_active ? "text-accent" : "text-foreground/50"}`}
                          >
                            {paymentSettings.cod_active ? "Active" : "Disabled"}
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
                          <img
                            src="/VibeCoin/VibeCoin.png"
                            alt="VibeCoin"
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-foreground">
                            VibeCoin Balance Payment
                          </h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${paymentSettings.vibecoin_active ? "text-accent" : "text-foreground/50"}`}
                          >
                            {paymentSettings.vibecoin_active
                              ? "Active"
                              : "Disabled"}
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
          })()}

        {/* 8. MANAGE DELIVERY TAB */}
        {activeTab === "delivery" &&
          (() => {
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
                        Configure delivery fees and estimated timeframes for
                        Inside Dhaka and Outside Dhaka. Customers will select
                        these during checkout.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {hasDeliveryChanges && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeliverySettings(initialDeliverySettings)
                          }
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
                          <>
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Edit Form Fields */}
                  <form
                    onSubmit={handleSaveDeliverySettings}
                    className="space-y-6"
                  >
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
                            Amount added to customer order when Inside Dhaka is
                            chosen (e.g. 60 tk).
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
                            Amount added to customer order when Outside Dhaka is
                            chosen (e.g. 130 tk).
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
                          Set Free Delivery (৳0) or Reduced Shipping fees for
                          specific products or entire collections.
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

                        <form
                          onSubmit={handleSaveDeliveryRule}
                          className="space-y-4"
                        >
                          {/* Title */}
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 opacity-70">
                              Rule Title *
                            </label>
                            <input
                              type="text"
                              value={deliveryRuleTitle}
                              onChange={(e) =>
                                setDeliveryRuleTitle(e.target.value)
                              }
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
                                onClick={() =>
                                  setDeliveryRuleTargetType("product")
                                }
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
                                onClick={() =>
                                  setDeliveryRuleTargetType("collection")
                                }
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
                                    Clear All (
                                    {deliveryRuleSelectedProductIds.length})
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
                                          setDeliveryRuleSelectedProductIds(
                                            (prev) =>
                                              prev.filter((id) => id !== p.id),
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
                                onFocus={() =>
                                  setIsDeliveryRuleDropdownOpen(true)
                                }
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
                                    onClick={() =>
                                      setIsDeliveryRuleDropdownOpen(false)
                                    }
                                  />
                                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-secondary border border-foreground/15 rounded-2xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-foreground/10 p-1.5 backdrop-blur-md">
                                    {(() => {
                                      const query = deliveryRuleSearchInput
                                        .toLowerCase()
                                        .trim();
                                      const matches =
                                        promoProductsCatalog.filter(
                                          (prod) =>
                                            !query ||
                                            prod.title
                                              .toLowerCase()
                                              .includes(query) ||
                                            String(prod.id).includes(query),
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
                                                const matchIds = matches.map(
                                                  (m) => m.id,
                                                );
                                                setDeliveryRuleSelectedProductIds(
                                                  (prev) =>
                                                    Array.from(
                                                      new Set([
                                                        ...prev,
                                                        ...matchIds,
                                                      ]),
                                                    ),
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
                                                prod.id,
                                              );
                                            return (
                                              <div
                                                key={prod.id}
                                                onClick={() => {
                                                  setDeliveryRuleSelectedProductIds(
                                                    (prev) =>
                                                      prev.includes(prod.id)
                                                        ? prev.filter(
                                                            (id) =>
                                                              id !== prod.id,
                                                          )
                                                        : [...prev, prod.id],
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
                                                  className={`text-[10px] font-bold shrink-0 ${isSelected ? "text-accent" : "text-foreground/40"}`}
                                                >
                                                  {isSelected
                                                    ? "Selected"
                                                    : "+ Add"}
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
                                    e.target.value
                                      ? Number(e.target.value)
                                      : "",
                                  )
                                }
                                required
                                className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                              >
                                <option value="">
                                  -- Choose Collection --
                                </option>
                                {collections.map((col) => (
                                  <option key={col.id} value={col.id}>
                                    #{col.id} {col.title} (
                                    {col.product_count || 0} products)
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Benefit Type: Free Delivery vs Reduced */}
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
                                      setDeliveryRuleInsideCharge(
                                        e.target.value,
                                      )
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
                                      setDeliveryRuleOutsideCharge(
                                        e.target.value,
                                      )
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
                              placeholder="e.g. 1 (Always applies) or 3 (Buy 3 to get offer)"
                              className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent"
                            />
                            <p className="text-[10px] opacity-60 mt-1">
                              Set to 1 for unconditional offer, or e.g. 3 to
                              require &quot;Buy 3 items to get offer&quot;.
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
                            Existing Delivery Offers ({deliveryRulesList.length}
                            )
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
                            const q = deliveryRuleFilterSearch
                              .toLowerCase()
                              .trim();
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
                                const isBeingEdited =
                                  editingDeliveryRuleId === rule.id;

                                return (
                                  <div
                                    key={rule.id}
                                    onClick={() =>
                                      handleStartEditDeliveryRule(rule)
                                    }
                                    className={`p-5 rounded-2xl border-2 flex flex-col justify-between gap-4 shadow-xs relative overflow-hidden group cursor-pointer transition-all ${
                                      isBeingEdited
                                        ? "border-accent shadow-md bg-accent/5"
                                        : rule.is_active
                                          ? "bg-secondary border-foreground/10 hover:border-accent/40"
                                          : "bg-secondary/40 border-foreground/10 opacity-60 hover:opacity-90 hover:border-accent/40"
                                    }`}
                                  >
                                    <div className="space-y-3">
                                      {/* Header: Delivery Badge, Active Status, and Benefit */}
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono font-black text-sm uppercase px-3 py-1 rounded-lg bg-accent/15 text-accent border border-accent/30 tracking-wider">
                                              {isFree
                                                ? "FREE DELIVERY "
                                                : "CUSTOM CHARGE"}
                                            </span>
                                            {Number(rule.min_quantity || 1) >
                                              1 && (
                                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-accent/20 text-accent border border-accent/30">
                                                Min {rule.min_quantity} Qty
                                              </span>
                                            )}
                                            {/* On/Off Toggle Button */}
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
                                              {rule.is_active
                                                ? "Active"
                                                : "Disabled"}
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Scope Container Box */}
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
                                              rule.products_details.length >
                                                0 && (
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

                                      {/* Rule Name & Charges Info */}
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

                                    {/* Card Footer Actions */}
                                    <div className="pt-2 border-t border-foreground/10 flex justify-end items-center">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteDeliveryRule(
                                            rule.id,
                                            rule.title,
                                          );
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
          })()}
        </main>
      </div>
    </div>
  );
}
