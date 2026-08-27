"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import AdminHeader from "@/features/admin/components/AdminHeader";
import AdminSidebar from "@/features/admin/components/AdminSidebar";
import ProductsTab from "@/features/admin/components/tabs/ProductsTab";
import CollectionsTab from "@/features/admin/components/tabs/CollectionsTab";
import OrdersTab from "@/features/admin/components/tabs/OrdersTab";
import CustomersTab from "@/features/admin/components/tabs/CustomersTab";
import PromotionsTab from "@/features/admin/components/tabs/PromotionsTab";
import CouponsTab from "@/features/admin/components/tabs/CouponsTab";
import PaymentsTab from "@/features/admin/components/tabs/PaymentsTab";
import DeliveryTab from "@/features/admin/components/tabs/DeliveryTab";
import AnalyticsTab from "@/features/admin/components/tabs/AnalyticsTab";
import { useLanguage } from "@/store/LanguageContext";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

import {
  Product,
  Collection,
  OrderItem,
  Order,
  CustomerItem,
  CouponItem,
  DeliveryRuleItem,
  AdminTab,
  ProductSubTab,
  CollectionSubTab,
  AnalyticsSubTab,
} from "@/features/admin/types";

export default function AdminDashboardPage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const { locale, formatCurrency } = useLanguage();
  const isBn = locale === "bn";

  const handleLogout = async () => {
    logout();
    router.push("/login");
  };

  const [activeTab, setActiveTab] = useState<AdminTab>("products");
  const [productSubTab, setProductSubTab] = useState<ProductSubTab>("all");
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(true);
  const [collectionSubTab, setCollectionSubTab] = useState<CollectionSubTab>("all");
  const [isCollectionsDropdownOpen, setIsCollectionsDropdownOpen] = useState(true);
  const [analyticsSubTab, setAnalyticsSubTab] = useState<AnalyticsSubTab>("sales");
  const [isAnalyticsDropdownOpen, setIsAnalyticsDropdownOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleCollectionSubTabSwitch = (subTab: CollectionSubTab) => {
    setActiveTab("collections");
    setIsCollectionsDropdownOpen(true);
    setCollectionSubTab(subTab);
    if (subTab === "add") {
      setEditingCollectionId(null);
      setNewCollectionTitle("");
      setCollectionImageFile(null);
      setCollectionImagePreview(null);
      if (collectionFileInputRef.current) {
        collectionFileInputRef.current.value = "";
      }
    }
  };

  const handleAnalyticsSubTabSwitch = (subTab: AnalyticsSubTab) => {
    setActiveTab("analytics");
    setAnalyticsSubTab(subTab);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // State data
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedPhotos, setHasUnsavedPhotos] = useState(false);
  const [isRefreshingTab, setIsRefreshingTab] = useState(false);

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
    "product" | "collection" | "order_total"
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
  const [deliveryRuleMinOrderAmount, setDeliveryRuleMinOrderAmount] =
    useState("1000");
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
  const [promoValidUntil, setPromoValidUntil] = useState<string>("");
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
  const [selectedNotificationOrderId, setSelectedNotificationOrderId] = useState<string | null>(null);

  const [customerHistoryModal, setCustomerHistoryModal] = useState<{
    customerId: number;
    orders: Order[];
  } | null>(null);

  // Selected Product for Edit
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductSearch, setEditProductSearch] = useState("");
  const [adminDataVersion, setAdminDataVersion] = useState(0);

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
  const [initialProductForm, setInitialProductForm] = useState({
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
      setAdminDataVersion((v) => v + 1);
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
    setDeliveryRuleMinOrderAmount(
      rule.min_order_amount !== undefined && rule.min_order_amount !== null
        ? String(rule.min_order_amount)
        : "1000",
    );
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
    setDeliveryRuleMinOrderAmount("1000");
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

    let minOrderAmountNum = 0;
    if (deliveryRuleMinOrderAmount && !isNaN(parseFloat(deliveryRuleMinOrderAmount))) {
      minOrderAmountNum = parseFloat(deliveryRuleMinOrderAmount);
    }
    if (deliveryRuleTargetType === "order_total" && minOrderAmountNum <= 0) {
      Swal.fire(
        "Error",
        "Please enter a valid minimum order amount (৳0 or greater).",
        "error",
      );
      return;
    }

    const isEdit = editingDeliveryRuleId !== null;
    const targetDesc =
      deliveryRuleTargetType === "product"
        ? `${deliveryRuleSelectedProductIds.length} product(s)`
        : deliveryRuleTargetType === "collection"
        ? `Collection "${collections.find((c) => c.id === Number(deliveryRuleCollectionId))?.title || deliveryRuleCollectionId}"`
        : `Cart Total >= ৳${minOrderAmountNum}`;

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
    if (
      deliveryRuleTargetType !== "order_total" &&
      minOrderAmountNum <= 0 &&
      (isNaN(minQty) || minQty < 1)
    ) {
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
          min_quantity: minOrderAmountNum > 0 ? 1 : minQty,
          min_order_amount: minOrderAmountNum > 0 ? minOrderAmountNum : 0,
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
          valid_until: promoValidUntil ? new Date(promoValidUntil).toISOString() : null,
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
        setPromoValidUntil("");
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
  const handleSelectProduct = async (prod: Product | any) => {
    if (editingProductId === prod.id) {
      setProductSubTab("edit");
      return;
    }
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
    setProductSubTab("edit");
    const baselineData = {
      title: prod.title || "",
      slug: prod.slug || "",
      unit_price: String(prod.unit_price || ""),
      inventory: String(prod.inventory ?? 0),
      collection: String(prod.collection || 1),
      short_description: prod.short_description || "",
      description: prod.description || "",
    };
    setProductForm(baselineData);
    setInitialProductForm(baselineData);

    // If full details might not be present (e.g. from compact list), fetch single product details
    try {
      const res = await fetch(`${API_BASE}/store/products/${prod.id}/`, {
        cache: "no-store",
      });
      if (res.ok) {
        const fullProd = await res.json();
        const freshData = {
          title: fullProd.title || "",
          slug: fullProd.slug || "",
          unit_price: String(fullProd.unit_price || ""),
          inventory: String(fullProd.inventory ?? 0),
          collection: String(fullProd.collection || 1),
          short_description: fullProd.short_description || "",
          description: fullProd.description || "",
        };
        setProductForm(freshData);
        setInitialProductForm(freshData);
      }
    } catch (e) {
      console.error("Error fetching single product details:", e);
    }
  };

  // Reset/clear product form and selection without prompt
  const clearProductSelection = () => {
    setEditingProductId(null);
    setProductSubTab("all");
    const emptyForm = {
      title: "",
      slug: "",
      unit_price: "",
      inventory: "10",
      collection: collections.length > 0 ? String(collections[0].id) : "",
      short_description: "",
      description: "",
    };
    setProductForm(emptyForm);
    setInitialProductForm(emptyForm);
    setHasUnsavedPhotos(false);
    // Clear new product photos & variants
    newProductPhotoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewProductPhotos([]);
    setNewProductPhotoPreviews([]);
    setNewProductVariants([]);
    if (newProductFileInputRef.current) {
      newProductFileInputRef.current.value = "";
    }
  };

  // Reset form to Add mode or exit selection with prompt if unsaved changes exist
  const handleCancelEdit = async () => {
    // Check if form has modified fields
    const hasFormChanges =
      editingProductId !== null &&
      (productForm.title !== initialProductForm.title ||
        productForm.unit_price !== initialProductForm.unit_price ||
        productForm.inventory !== initialProductForm.inventory ||
        productForm.collection !== initialProductForm.collection ||
        productForm.short_description !== initialProductForm.short_description ||
        productForm.description !== initialProductForm.description);

    if (hasFormChanges || hasUnsavedPhotos) {
      const result = await Swal.fire({
        title: isBn ? "পরিবর্তনগুলো সংরক্ষণ করবেন?" : "Save Changes?",
        text: isBn
          ? "আপনি পণ্যের তথ্যে পরিবর্তন এনেছেন। এডিট মোড ছাড়ার আগে পরিবর্তনগুলো সংরক্ষণ করতে চান?"
          : "You have modified product details. Do you want to save your changes before leaving edit mode?",
        icon: "question",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonColor: "var(--accent)",
        denyButtonColor: "#ef4444",
        cancelButtonColor: "var(--button-bg)",
        confirmButtonText: isBn ? "সংরক্ষণ করুন" : "Save Changes",
        denyButtonText: isBn ? "সংরক্ষণ না করে ছাড়ুন" : "Don't Save",
        cancelButtonText: isBn ? "এডিটেই থাকুন" : "Stay in Edit Mode",
      });

      if (result.isConfirmed) {
        // Trigger save and exit
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        await handleSaveProduct(fakeEvent);
        return;
      } else if (result.isDenied) {
        // Discard and clear selection
        clearProductSelection();
        return;
      } else {
        // Stay in edit mode
        return;
      }
    }

    clearProductSelection();
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
        title: isBn ? "বিবরণ আবশ্যক" : "Descriptions Required",
        text: isBn
          ? "অনুগ্রহ করে পণ্যের সংক্ষিপ্ত এবং বিস্তারিত উভয় বিবরণই প্রদান করুন।"
          : "Please enter both a Short Description and a Details Description for the product.",
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
        title: isBn ? "সংক্ষিপ্ত বিবরণের সীমা অতিক্রম করেছে" : "Short Description Limit Exceeded",
        text: isBn
          ? `সংক্ষিপ্ত বিবরণ ১৫০ শব্দের বেশি হতে পারবে না (বর্তমানে ${shortWordCount.toLocaleString("bn-BD")} শব্দ)।`
          : `Short description cannot exceed 150 words (currently ${shortWordCount} words).`,
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    if (detailWordCount > 500) {
      Swal.fire({
        icon: "warning",
        title: isBn ? "বিস্তারিত বিবরণের সীমা অতিক্রম করেছে" : "Details Description Limit Exceeded",
        text: isBn
          ? `বিস্তারিত বিবরণ ৫০০ শব্দের বেশি হতে পারবে না (বর্তমানে ${detailWordCount.toLocaleString("bn-BD")} শব্দ)।`
          : `Details description cannot exceed 500 words (currently ${detailWordCount} words).`,
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
        title: isBn ? "কালেকশন আবশ্যক" : "Collection Required",
        text: isBn
          ? "অনুগ্রহ করে পণ্যের জন্য একটি সঠিক কালেকশন নির্বাচন করুন।"
          : "Please select a valid collection for the product.",
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

        await Swal.fire({
          icon: "success",
          title: isEditing
            ? (isBn ? "পণ্য সফলভাবে আপডেট হয়েছে!" : "Product Updated!")
            : (isBn ? "পণ্য সফলভাবে তৈরি হয়েছে!" : "Product Created!"),
          text: isEditing
            ? (isBn
                ? `"${productForm.title}" সফলভাবে আপডেট করা হয়েছে।`
                : `"${productForm.title}" has been updated successfully.`)
            : (isBn
                ? `"${productForm.title}" সফলভাবে তৈরি করা হয়েছে।`
                : `"${productForm.title}" has been created successfully.`),
          confirmButtonColor: "var(--accent)",
          confirmButtonText: isBn ? "সকল পণ্য দেখুন" : "View All Products",
          timer: 2500,
          timerProgressBar: true,
        });

        clearProductSelection();
        fetchAdminData();
      } else {
        const err = await res.json();
        Swal.fire({
          icon: "error",
          title: isEditing
            ? (isBn ? "পণ্য আপডেট ব্যর্থ হয়েছে" : "Failed to update product")
            : (isBn ? "পণ্য যোগ করা ব্যর্থ হয়েছে" : "Failed to add product"),
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
      title: isBn ? "পণ্যটি মুছে ফেলতে চান?" : "Delete Product?",
      text: isBn ? "এই কাজটি স্থায়ী এবং বাতিল করা যাবে না।" : "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent)",
      cancelButtonColor: "var(--button-bg)",
      confirmButtonText: isBn ? "হ্যাঁ, মুছে ফেলুন" : "Yes, Delete",
      cancelButtonText: isBn ? "বাতিল" : "Cancel",
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
            title: isBn ? "পণ্য মুছে ফেলা হয়েছে!" : "Product deleted!",
            showConfirmButton: false,
            timer: 1500,
            toast: true,
          });
          fetchAdminData();
        } else {
          Swal.fire({
            icon: "error",
            title: isBn
              ? "পণ্য মোছা সম্ভব হয়নি (অর্ডারের সাথে যুক্ত থাকতে পারে)।"
              : "Cannot delete product (may be linked to orders).",
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
            ? (isBn ? "ট্রেন্ডিং তালিকায় যোগ করা হয়েছে!" : "Added to Trending Now!")
            : (isBn ? "ট্রেন্ডিং তালিকা থেকে সরানো হয়েছে" : "Removed from Trending Now"),
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

  const handleToggleProductVisibility = async (product: Product) => {
    if (!token) return;
    const currentStatus = product.is_visible !== false;
    const newStatus = !currentStatus;

    // Optimistic UI
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_visible: newStatus } : p,
      ),
    );
    setPromoProductsCatalog((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_visible: newStatus } : p,
      ),
    );

    try {
      const res = await fetch(`${API_BASE}/store/products/${product.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ is_visible: newStatus }),
      });

      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: newStatus
            ? (isBn ? "পণ্যটি পাবলিকলি প্রদর্শিত হচ্ছে" : "Product is now visible to public")
            : (isBn ? "পণ্যটি পাবলিক থেকে লুকানো হয়েছে" : "Product is now hidden from public"),
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
      } else {
        // Revert on error
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, is_visible: currentStatus } : p,
          ),
        );
        setPromoProductsCatalog((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, is_visible: currentStatus } : p,
          ),
        );
      }
    } catch (err) {
      console.error(err);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_visible: currentStatus } : p,
        ),
      );
      setPromoProductsCatalog((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_visible: currentStatus } : p,
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
            ? (isBn ? "ফিচার্ড ক্যাটাগরি হিসেবে যুক্ত!" : "Set as Featured Category!")
            : (isBn ? "ফিচার্ড তালিকা থেকে সরানো হয়েছে" : "Removed from Featured Categories"),
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

  const handleToggleCollectionVisibility = async (col: Collection) => {
    if (!token) return;
    const currentStatus = col.is_visible !== false;
    const newStatus = !currentStatus;

    // Optimistic UI
    setCollections((prev) =>
      prev.map((c) => (c.id === col.id ? { ...c, is_visible: newStatus } : c)),
    );

    try {
      const res = await fetch(`${API_BASE}/store/collections/${col.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ is_visible: newStatus }),
      });

      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: newStatus
            ? (isBn ? "কালেকশনটি পাবলিকলি প্রদর্শিত হচ্ছে" : "Collection is now visible to public")
            : (isBn ? "কালেকশনটি পাবলিক থেকে লুকানো হয়েছে" : "Collection is now hidden from public"),
          showConfirmButton: false,
          timer: 1500,
          toast: true,
        });
      } else {
        // Revert on error
        setCollections((prev) =>
          prev.map((c) =>
            c.id === col.id ? { ...c, is_visible: currentStatus } : c,
          ),
        );
      }
    } catch (err) {
      console.error(err);
      setCollections((prev) =>
        prev.map((c) =>
          c.id === col.id ? { ...c, is_visible: currentStatus } : c,
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
    setCollectionSubTab("edit");
    setNewCollectionTitle(col.title);
    setCollectionImageFile(null);
    setCollectionImagePreview(col.image || null);
    if (collectionFileInputRef.current) {
      collectionFileInputRef.current.value = "";
    }
  };

  const handleCancelCollectionEdit = () => {
    setEditingCollectionId(null);
    setCollectionSubTab("all");
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
      const isEditing = editingCollectionId !== null;
      const url = isEditing
        ? `${API_BASE}/store/collections/${editingCollectionId}/`
        : `${API_BASE}/store/collections/`;
      const method = isEditing ? "PATCH" : "POST";

      const currentCollection = isEditing
        ? collections.find((c) => c.id === editingCollectionId)
        : null;

      const formData = new FormData();
      formData.append("title", newCollectionTitle.trim());
      if (collectionImageFile) {
        formData.append("image", collectionImageFile);
      }
      if (isEditing && currentCollection) {
        formData.append("is_featured", String(Boolean(currentCollection.is_featured)));
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

  // Edit COD Order (PATCH /store/orders/{id}/)
  const handleSaveEditedOrder = async (
    orderId: number,
    payload: {
      shipping_address?: string;
      phone?: string;
      delivery_area?: string;
      delivery_charge?: number;
      payment_status?: string;
      items: Array<{
        id?: number;
        product_id: number;
        variant_id?: number | null;
        quantity: number;
        unit_price?: number;
      }>;
    },
  ): Promise<boolean> => {
    if (!token) return false;

    try {
      const res = await fetch(`${API_BASE}/store/orders/${orderId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: isBn ? "অর্ডার আপডেট হয়েছে!" : "Order Updated!",
          text: isBn
            ? `অর্ডার #${orderId.toLocaleString("bn-BD")} সফলভাবে সংশোধন করা হয়েছে। গ্রাহক তার প্রোফাইলে আপডেট দেখতে পাবেন।`
            : `Order #${orderId} has been successfully updated. The customer will see the updated details.`,
          confirmButtonColor: "var(--accent)",
          confirmButtonText: isBn ? "ঠিক আছে" : "OK",
          timer: 2500,
          timerProgressBar: true,
        });
        fetchAdminData();
        return true;
      } else {
        const errData = await res.json().catch(() => null);
        const errMsg =
          errData?.error ||
          errData?.detail ||
          (errData?.items ? JSON.stringify(errData.items) : "Failed to update order.");
        Swal.fire({
          icon: "error",
          title: isBn ? "অর্ডার আপডেট ব্যর্থ হয়েছে" : "Failed to update order",
          text: errMsg,
        });
        return false;
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: isBn ? "নেটওয়ার্ক ত্রুটি" : "Network Error",
        text: err?.message || "Failed to reach the server.",
      });
      return false;
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

  const handleTabSwitch = async (targetTab: AdminTab) => {
    if (activeTab === targetTab) {
      if (targetTab === "products") {
        setIsProductsDropdownOpen((prev) => !prev);
      }
      return;
    }

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
    if (targetTab === "products") {
      setIsProductsDropdownOpen(true);
    } else if (targetTab === "orders" && token) {
      // Automatically refresh orders so admin always sees latest orders without manual refresh
      try {
        const orderRes = await fetch(`${API_BASE}/store/orders/`, {
          headers: { Authorization: `JWT ${token}` },
          cache: "no-store",
        });
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrders(Array.isArray(orderData) ? orderData : orderData.results || []);
        }
      } catch (err) {
        console.error("Failed to auto-refresh orders on tab switch:", err);
      }
    }
  };

  const handleProductSubTabSwitch = async (subTab: ProductSubTab) => {
    if (activeTab === "products" && productSubTab === subTab) return;

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

      if (!confirm.isConfirmed) return;
      setHasUnsavedPhotos(false);
    }

    setActiveTab("products");
    setIsProductsDropdownOpen(true);
    setProductSubTab(subTab);

    if (subTab === "add") {
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
      newProductPhotoPreviews.forEach((url) => URL.revokeObjectURL(url));
      setNewProductPhotos([]);
      setNewProductPhotoPreviews([]);
      setNewProductVariants([]);
      if (newProductFileInputRef.current) {
        newProductFileInputRef.current.value = "";
      }
    }
  };

  const handleRefreshCurrentTab = async () => {
    if (!token) return;
    try {
      setIsRefreshingTab(true);
      if (activeTab === "products") {
        await fetchAdminData(prodPage, activeProductQuery, false);
      } else if (activeTab === "collections") {
        const colRes = await fetch(`${API_BASE}/store/collections/`, {
          cache: "no-store",
        });
        if (colRes.ok) {
          const colData = await colRes.json();
          setCollections(Array.isArray(colData) ? colData : colData.results || []);
        }
      } else if (activeTab === "orders") {
        const orderRes = await fetch(`${API_BASE}/store/orders/`, {
          headers: { Authorization: `JWT ${token}` },
        });
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrders(Array.isArray(orderData) ? orderData : orderData.results || []);
        }
      } else if (activeTab === "customers") {
        const custRes = await fetch(`${API_BASE}/store/customers/`, {
          headers: { Authorization: `JWT ${token}` },
        });
        if (custRes.ok) {
          const custData = await custRes.json();
          setCustomers(Array.isArray(custData) ? custData : custData.results || []);
        }
      } else if (activeTab === "promotions") {
        await fetchAllProductsForPromo();
        await fetchDeliveryRules();
      } else if (activeTab === "coupons") {
        await fetchCoupons();
      } else if (activeTab === "payments") {
        await fetchPaymentSettings();
      } else if (activeTab === "delivery") {
        await fetchDeliverySettings();
        await fetchDeliveryRules();
      } else if (activeTab === "analytics") {
        // Refresh orders, products, and coupons for analytics
        const [prodRes, orderRes, couponRes] = await Promise.all([
          fetch(`${API_BASE}/store/products/?page=1`, { cache: "no-store" }),
          fetch(`${API_BASE}/store/orders/`, {
            headers: { Authorization: `JWT ${token}` },
          }),
          fetch(`${API_BASE}/store/coupons/`, {
            headers: { Authorization: `JWT ${token}` },
            cache: "no-store",
          }),
        ]);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(Array.isArray(prodData) ? prodData : prodData.results || []);
        }
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrders(Array.isArray(orderData) ? orderData : orderData.results || []);
        }
        if (couponRes.ok) {
          const couponData = await couponRes.json();
          setCouponsList(Array.isArray(couponData) ? couponData : couponData.results || []);
        }
      }
    } catch (err) {
      console.error("Error refreshing tab:", err);
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Refresh failed",
        showConfirmButton: false,
        timer: 1500,
        toast: true,
      });
    } finally {
      setIsRefreshingTab(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 flex flex-col">
      {/* Modular Header */}
      <AdminHeader
        onLogout={handleLogout}
        activeTab={activeTab}
        onRefresh={handleRefreshCurrentTab}
        isRefreshing={isRefreshingTab}
        apiBase={API_BASE}
        token={token}
        onNavigateToOrder={(orderId) => {
          setSelectedNotificationOrderId(orderId);
          handleTabSwitch("orders");
        }}
        onNavigateToTab={(tab) => {
          handleTabSwitch(tab);
        }}
      />

      {/* Main Layout Body: Left Sidebar + Right Content Area */}
      <div className="flex flex-1 relative min-h-[calc(100vh-65px)]">
        {/* Modular Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={(t) => handleTabSwitch(t)}
          productSubTab={productSubTab}
          handleProductSubTabSwitch={handleProductSubTabSwitch}
          isProductsDropdownOpen={isProductsDropdownOpen}
          setIsProductsDropdownOpen={setIsProductsDropdownOpen}
          collectionSubTab={collectionSubTab}
          handleCollectionSubTabSwitch={handleCollectionSubTabSwitch}
          isCollectionsDropdownOpen={isCollectionsDropdownOpen}
          setIsCollectionsDropdownOpen={setIsCollectionsDropdownOpen}
          analyticsSubTab={analyticsSubTab}
          handleAnalyticsSubTabSwitch={handleAnalyticsSubTabSwitch}
          isAnalyticsDropdownOpen={isAnalyticsDropdownOpen}
          setIsAnalyticsDropdownOpen={setIsAnalyticsDropdownOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          productsCount={totalProductsCount}
          collectionsCount={collections.length}
          ordersCount={orders.length}
          customersCount={customers.length}
          promosCount={
            promoProductsCatalog.filter(
              (p) => Number(p.discount_percent || 0) > 0
            ).length
          }
          couponsCount={couponsList.length}
          deliveryRulesCount={deliveryRulesList.length}
        />

        {/* Right Main Content Area */}
        <main className="flex-1 p-6 md:p-10 max-w-[1600px] w-full overflow-x-hidden transition-all duration-300">
          {/* 1. PRODUCTS TAB */}
          {activeTab === "products" && (
            <ProductsTab
              productSubTab={productSubTab}
              mounted={mounted}
              products={products}
              collections={collections}
              totalProductsCount={totalProductsCount}
              prodPage={prodPage}
              setProdPage={setProdPage}
              activeProductQuery={activeProductQuery}
              setActiveProductQuery={setActiveProductQuery}
              editingProductId={editingProductId}
              productForm={productForm}
              setProductForm={setProductForm}
              handleSaveProduct={handleSaveProduct}
              handleDeleteProduct={handleDeleteProduct}
              handleToggleProductTrending={handleToggleProductTrending}
              handleToggleProductVisibility={handleToggleProductVisibility}
              handleSelectProduct={handleSelectProduct}
              handleCancelEdit={handleCancelEdit}
              editProductSearch={editProductSearch}
              setEditProductSearch={setEditProductSearch}
              promoProductsCatalog={promoProductsCatalog}
              newProductPhotos={newProductPhotos}
              setNewProductPhotos={setNewProductPhotos}
              newProductPhotoPreviews={newProductPhotoPreviews}
              setNewProductPhotoPreviews={setNewProductPhotoPreviews}
              newProductFileInputRef={newProductFileInputRef}
              newProductVariants={newProductVariants}
              setNewProductVariants={setNewProductVariants}
              isNewVariantModalOpen={isNewVariantModalOpen}
              setIsNewVariantModalOpen={setIsNewVariantModalOpen}
              editingNewVariantIndex={editingNewVariantIndex}
              setEditingNewVariantIndex={setEditingNewVariantIndex}
              newVariantForm={newVariantForm}
              setNewVariantForm={setNewVariantForm}
              fetchAdminData={fetchAdminData}
              setHasUnsavedPhotos={setHasUnsavedPhotos}
              token={token}
              adminDataVersion={adminDataVersion}
            />
          )}

          {/* 2. COLLECTIONS TAB */}
          {activeTab === "collections" && (
            <CollectionsTab
              collectionSubTab={collectionSubTab}
              collections={collections}
              apiBase={API_BASE}
              token={token}
              fetchAdminData={fetchAdminData}
              handleSaveCollection={handleSaveCollection}
              handleDeleteCollection={handleDeleteCollection}
              handleToggleCollectionFeatured={handleToggleCollectionFeatured}
              handleToggleCollectionVisibility={handleToggleCollectionVisibility}
              newCollectionTitle={newCollectionTitle}
              setNewCollectionTitle={setNewCollectionTitle}
              editingCollectionId={editingCollectionId}
              setEditingCollectionId={setEditingCollectionId}
              collectionImageFile={collectionImageFile}
              setCollectionImageFile={setCollectionImageFile}
              collectionImagePreview={collectionImagePreview}
              setCollectionImagePreview={setCollectionImagePreview}
              collectionFileInputRef={collectionFileInputRef}
              handleSelectCollection={handleSelectCollection}
              handleCancelCollectionEdit={handleCancelCollectionEdit}
              handleDeleteCollectionPhoto={handleDeleteCollectionPhoto}
            />
          )}

          {/* 3. ORDERS TAB */}
          {activeTab === "orders" && (
            <OrdersTab
              orders={orders}
              productsCatalog={promoProductsCatalog && promoProductsCatalog.length > 0 ? promoProductsCatalog : products}
              handleUpdateOrderStatus={handleUpdateOrderStatus}
              handleSaveEditedOrder={handleSaveEditedOrder}
              handleDeleteOrder={handleDeleteOrder}
              targetOrderId={selectedNotificationOrderId}
            />
          )}

          {/* 4. CUSTOMERS TAB */}
          {activeTab === "customers" && (
            <CustomersTab
              customers={customers}
              token={token}
              handleViewCustomerHistory={handleViewCustomerHistory}
              customerHistoryModal={customerHistoryModal}
              setCustomerHistoryModal={setCustomerHistoryModal}
            />
          )}

          {/* 5. PROMOTIONS TAB */}
          {activeTab === "promotions" && (
            <PromotionsTab
              promoProductsCatalog={promoProductsCatalog}
              promoSelectedProductIds={promoSelectedProductIds}
              setPromoSelectedProductIds={setPromoSelectedProductIds}
              promoSearchInput={promoSearchInput}
              setPromoSearchInput={setPromoSearchInput}
              isPromoDropdownOpen={isPromoDropdownOpen}
              setIsPromoDropdownOpen={setIsPromoDropdownOpen}
              promoDiscountPercent={promoDiscountPercent}
              setPromoDiscountPercent={setPromoDiscountPercent}
              promoValidUntil={promoValidUntil}
              setPromoValidUntil={setPromoValidUntil}
              promoApplying={promoApplying}
              handleApplyPromotion={handleApplyPromotion}
              handleRemovePromotion={handleRemovePromotion}
              selectedPromoProducts={selectedPromoProducts}
              deliveryRulesList={deliveryRulesList}
              editingDeliveryRuleId={editingDeliveryRuleId}
              deliveryRuleTitle={deliveryRuleTitle}
              setDeliveryRuleTitle={setDeliveryRuleTitle}
              deliveryRuleTargetType={deliveryRuleTargetType}
              setDeliveryRuleTargetType={setDeliveryRuleTargetType}
              deliveryRuleType={deliveryRuleType}
              setDeliveryRuleType={setDeliveryRuleType}
              deliveryRuleInsideCharge={deliveryRuleInsideCharge}
              setDeliveryRuleInsideCharge={setDeliveryRuleInsideCharge}
              deliveryRuleOutsideCharge={deliveryRuleOutsideCharge}
              setDeliveryRuleOutsideCharge={setDeliveryRuleOutsideCharge}
              deliveryRuleSelectedProductIds={deliveryRuleSelectedProductIds}
              setDeliveryRuleSelectedProductIds={
                setDeliveryRuleSelectedProductIds
              }
              deliveryRuleCollectionId={deliveryRuleCollectionId}
              setDeliveryRuleCollectionId={setDeliveryRuleCollectionId}
              deliveryRuleMinQuantity={deliveryRuleMinQuantity}
              setDeliveryRuleMinQuantity={setDeliveryRuleMinQuantity}
              deliveryRuleMinOrderAmount={deliveryRuleMinOrderAmount}
              setDeliveryRuleMinOrderAmount={setDeliveryRuleMinOrderAmount}
              deliveryRuleIsActive={deliveryRuleIsActive}
              setDeliveryRuleIsActive={setDeliveryRuleIsActive}
              deliveryRuleSearchInput={deliveryRuleSearchInput}
              setDeliveryRuleSearchInput={setDeliveryRuleSearchInput}
              isDeliveryRuleDropdownOpen={isDeliveryRuleDropdownOpen}
              setIsDeliveryRuleDropdownOpen={setIsDeliveryRuleDropdownOpen}
              deliveryRuleCreating={deliveryRuleCreating}
              deliveryRuleFilterSearch={deliveryRuleFilterSearch}
              setDeliveryRuleFilterSearch={setDeliveryRuleFilterSearch}
              selectedDeliveryRuleProducts={selectedDeliveryRuleProducts}
              collections={collections}
              handleSaveDeliveryRule={handleSaveDeliveryRule}
              handleCancelEditDeliveryRule={handleCancelEditDeliveryRule}
              handleStartEditDeliveryRule={handleStartEditDeliveryRule}
              handleToggleDeliveryRule={handleToggleDeliveryRule}
              handleDeleteDeliveryRule={handleDeleteDeliveryRule}
            />
          )}

          {/* 6. COUPONS TAB */}
          {activeTab === "coupons" && (
            <CouponsTab
              couponsList={couponsList}
              editingCouponId={editingCouponId}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              couponDiscountPercent={couponDiscountPercent}
              setCouponDiscountPercent={setCouponDiscountPercent}
              couponValidTo={couponValidTo}
              setCouponValidTo={setCouponValidTo}
              couponIsActive={couponIsActive}
              setCouponIsActive={setCouponIsActive}
              couponTargetType={couponTargetType}
              setCouponTargetType={setCouponTargetType}
              couponSelectedProductIds={couponSelectedProductIds}
              setCouponSelectedProductIds={setCouponSelectedProductIds}
              couponCollectionId={couponCollectionId}
              setCouponCollectionId={setCouponCollectionId}
              couponSearchInput={couponSearchInput}
              setCouponSearchInput={setCouponSearchInput}
              isCouponDropdownOpen={isCouponDropdownOpen}
              setIsCouponDropdownOpen={setIsCouponDropdownOpen}
              couponCreating={couponCreating}
              handleSaveCoupon={handleSaveCoupon}
              handleEditCoupon={handleEditCoupon}
              handleCancelEditCoupon={handleCancelEditCoupon}
              handleToggleCouponActive={handleToggleCouponActive}
              handleDeleteCoupon={handleDeleteCoupon}
              selectedCouponProducts={selectedCouponProducts}
              promoProductsCatalog={promoProductsCatalog}
              collections={collections}
            />
          )}

          {/* 7. PAYMENT SETTINGS TAB */}
          {activeTab === "payments" && (
            <PaymentsTab
              paymentSettings={paymentSettings}
              initialPaymentSettings={initialPaymentSettings}
              setPaymentSettings={setPaymentSettings}
              savingPaymentSettings={savingPaymentSettings}
              handleSavePaymentSettings={handleSavePaymentSettings}
            />
          )}

          {/* 8. MANAGE DELIVERY TAB */}
          {activeTab === "delivery" && (
            <DeliveryTab
              deliverySettings={deliverySettings}
              initialDeliverySettings={initialDeliverySettings}
              setDeliverySettings={setDeliverySettings}
              savingDeliverySettings={savingDeliverySettings}
              handleSaveDeliverySettings={handleSaveDeliverySettings}
            />
          )}

          {/* 9. ANALYTICS TAB */}
          {activeTab === "analytics" && (
            <AnalyticsTab
              orders={orders}
              products={products}
              customers={customers}
              coupons={couponsList}
              analyticsSubTab={analyticsSubTab}
              onSubTabChange={setAnalyticsSubTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}
