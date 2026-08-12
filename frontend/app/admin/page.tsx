"use client";

import { useState, useEffect } from "react";
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
  inventory: number;
  slug: string;
  collection: number;
  description?: string;
  images?: { id?: number; image: string }[];
}

interface Collection {
  id: number;
  title: string;
  product_count: number;
  image?: string | null;
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

export default function AdminDashboardPage() {
  const { user, token, logout, loading: authLoading } = useAuth();

  const handleLogout = async () => {
    logout();
    router.push("/login");
  };
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "products" | "collections" | "orders" | "customers"
  >("products");

  // State data
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedPhotos, setHasUnsavedPhotos] = useState(false);

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

  // Pagination State for Admin Products Table
  const itemsPerPage = 8;

  // Selected Product for Edit
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  // Product Form State
  const [productForm, setProductForm] = useState({
    title: "",
    slug: "",
    unit_price: "",
    inventory: "10",
    collection: "1",
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
        setCollections(
          Array.isArray(colData) ? colData : colData.results || [],
        );
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
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
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
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
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
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
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
      collection: "1",
      description: "",
    });
  };

  // Create or Update Product (POST or PUT)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const payload = {
        title: productForm.title,
        slug:
          productForm.slug ||
          productForm.title.toLowerCase().replace(/\s+/g, "-"),
        unit_price: parseFloat(productForm.unit_price),
        inventory: parseInt(productForm.inventory),
        collection: parseInt(productForm.collection),
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
      confirmButtonColor: "#cc5555",
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

  // Collection Edit State & Handlers
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
  const [collectionImageFile, setCollectionImageFile] = useState<File | null>(null);
  const [collectionImagePreview, setCollectionImagePreview] = useState<string | null>(null);

  const handleSelectCollection = (col: Collection) => {
    setEditingCollectionId(col.id);
    setNewCollectionTitle(col.title);
    setCollectionImageFile(null);
    setCollectionImagePreview(col.image || null);
  };

  const handleCancelCollectionEdit = () => {
    setEditingCollectionId(null);
    setNewCollectionTitle("");
    setCollectionImageFile(null);
    setCollectionImagePreview(null);
  };

  // Create or Update Collection (POST or PUT /store/collections/)
  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCollectionTitle.trim()) return;

    try {
      const isEditing = editingCollectionId !== null;
      const url = isEditing
        ? `${API_BASE}/store/collections/${editingCollectionId}/`
        : `${API_BASE}/store/collections/`;
      const method = isEditing ? "PUT" : "POST";

      const formData = new FormData();
      formData.append("title", newCollectionTitle);
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
        handleCancelCollectionEdit();
        fetchAdminData();
      } else {
        const errData = await res.json();
        Swal.fire({
          icon: "error",
          title: isEditing ? "Failed to update collection" : "Failed to create collection",
          text: JSON.stringify(errData),
        });
      }
    } catch (err) {
      console.error(err);
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
      confirmButtonColor: "#cc5555",
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
      confirmButtonColor: "#cc5555",
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
      confirmButtonColor: "#cc5555",
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

  const handleTabSwitch = async (targetTab: "products" | "collections" | "orders" | "customers") => {
    if (activeTab === targetTab) return;

    if (hasUnsavedPhotos) {
      const confirm = await Swal.fire({
        title: "Photos Not Uploaded!",
        text: "You have selected photo(s) that are not uploaded yet. If you switch section now, these photos won't be saved.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
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
      <div className="bg-primary text-background dark:text-foreground py-10 px-8 md:px-12 border-b border-white/10 shadow-md transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="bg-accent text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest rounded-md mb-2 inline-block">
              Staff Portal
            </span>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black uppercase tracking-tighter">
                Admin Dashboard
              </h1>
              <button
                onClick={handleLogout}
                className="bg-red-500/20 text-red-300 hover:bg-red-500/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-red-500/20 transition-colors"
              >
                Logout
              </button>
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 bg-primary/40 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => handleTabSwitch("products")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "products"
                  ? "bg-secondary text-foreground shadow-md"
                  : "text-background/70 dark:text-foreground/70 hover:text-white"
              }`}
            >
              Products ({totalProductsCount})
            </button>
            <button
              onClick={() => handleTabSwitch("collections")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "collections"
                  ? "bg-secondary text-foreground shadow-md"
                  : "text-background/70 dark:text-foreground/70 hover:text-white"
              }`}
            >
              Collections ({collections.length})
            </button>
            <button
              onClick={() => handleTabSwitch("orders")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "orders"
                  ? "bg-secondary text-foreground shadow-md"
                  : "text-background/70 dark:text-foreground/70 hover:text-white"
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => handleTabSwitch("customers")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "customers"
                  ? "bg-secondary text-foreground shadow-md"
                  : "text-background/70 dark:text-foreground/70 hover:text-white"
              }`}
            >
              Customers ({customers.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-8 md:px-12 mt-12">
        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Add/Edit Product Form (1 Column) */}
            <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm h-fit transition-colors duration-300">
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
                    value={productForm.collection}
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
                        {col.title} (ID: {col.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Short product description..."
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
                      className={`cursor-pointer transition-colors ${
                        editingProductId === prod.id
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
                          <span className="truncate max-w-[220px] sm:max-w-xs">{prod.title}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-accent font-extrabold align-middle">
                        ${Number(prod.unit_price).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 align-middle">{prod.inventory}</td>
                      <td
                        className="py-3.5 px-2 text-right flex justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Create Collection Form */}
            <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm h-fit transition-colors duration-300">
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
                    Collection Cover Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
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
                      editingCollectionId === col.id
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
                        <h3 className="font-bold text-sm text-foreground">
                          {col.title}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                          ID: #{col.id} • {col.product_count || 0} Products
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
                  Close ✕
                </button>
              </div>

              {/* Customer Contact & Address Info */}
              <div className="bg-primary/5 dark:bg-primary/30 p-4 rounded-2xl mb-6 text-xs space-y-1">
                <p><strong>Phone:</strong> {selectedOrderDetails.phone || "N/A"}</p>
                <p><strong>Shipping Address:</strong> {selectedOrderDetails.shipping_address || "N/A"}</p>
                <p>
                  <strong>Payment Method:</strong>{" "}
                  {selectedOrderDetails.payment_method === "O" ? (
                    <span className="text-[#e2136e] font-black uppercase">Online / bKash</span>
                  ) : (
                    <span className="font-black uppercase">Cash on Delivery (COD)</span>
                  )}
                </p>
                {selectedOrderDetails.payment_method === "O" && (
                  <p><strong>bKash TrxID:</strong> <code className="bg-secondary px-2 py-0.5 rounded font-mono font-bold text-[#e2136e]">{selectedOrderDetails.transaction_id || "N/A"}</code></p>
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
                  Close ✕
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
      </main>
    </div>
  );
}
