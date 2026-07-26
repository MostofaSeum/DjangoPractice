"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

interface Product {
  id: number;
  title: string;
  unit_price: number;
  inventory: number;
  slug: string;
  collection: number;
}

interface Collection {
  id: number;
  title: string;
  product_count: number;
}

interface Order {
  id: number;
  customer: number;
  payment_status: string;
}

export default function AdminDashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"products" | "collections" | "orders">("products");

  // State data
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Select Product to populate left form for editing
  const handleSelectProduct = (prod: Product) => {
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

  // New Collection Form
  const [newCollectionTitle, setNewCollectionTitle] = useState("");

  // Check Staff Permission & Fetch Initial Data
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

    fetchAdminData();
  }, [user, token, authLoading, router]);

  const fetchAdminData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Fetch Products
      const prodRes = await fetch(`${API_BASE}/store/products/?page_size=1000`, { cache: "no-store" });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : prodData.results || []);
      }

      // Fetch Collections
      const colRes = await fetch(`${API_BASE}/store/collections/`, { cache: "no-store" });
      if (colRes.ok) {
        const colData = await colRes.json();
        setCollections(Array.isArray(colData) ? colData : colData.results || []);
      }

      // Fetch Orders
      const orderRes = await fetch(`${API_BASE}/store/orders/`, {
        headers: { Authorization: `JWT ${token}` },
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(Array.isArray(orderData) ? orderData : orderData.results || []);
      }
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form to Add mode
  const handleCancelEdit = () => {
    setEditingProductId(null);
    setProductForm({ title: "", slug: "", unit_price: "", inventory: "10", collection: "1", description: "" });
  };

  // Create or Update Product (POST or PUT)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const payload = {
        title: productForm.title,
        slug: productForm.slug || productForm.title.toLowerCase().replace(/\s+/g, "-"),
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
          title: isEditing ? "Product updated successfully!" : "Product added successfully!",
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
          title: isEditing ? "Failed to update product" : "Failed to add product",
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
          Swal.fire({ icon: "error", title: "Cannot delete product (may be linked to orders)." });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Add Collection (POST /store/collections/)
  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCollectionTitle.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/store/collections/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ title: newCollectionTitle }),
      });

      if (res.ok) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Collection created!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
        setNewCollectionTitle("");
        fetchAdminData();
      } else {
        Swal.fire({ icon: "error", title: "Failed to create collection" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] flex items-center justify-center font-bold text-xs uppercase tracking-widest">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e6e0d4] text-[#3a3532] font-sans pb-24 selection:bg-[#3a3532] selection:text-[#e6e0d4]">
      {/* Top Banner */}
      <div className="bg-[#3a3532] text-[#e6e0d4] py-10 px-8 md:px-12 border-b border-white/10 shadow-md">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="bg-[#8b7a66] text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest rounded-md mb-2 inline-block">
              Staff Portal
            </span>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Admin Dashboard
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 bg-[#252220] p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "products"
                  ? "bg-[#e6e0d4] text-[#3a3532] shadow-md"
                  : "text-[#e6e0d4]/70 hover:text-white"
              }`}
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("collections")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "collections"
                  ? "bg-[#e6e0d4] text-[#3a3532] shadow-md"
                  : "text-[#e6e0d4]/70 hover:text-white"
              }`}
            >
              Collections ({collections.length})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "orders"
                  ? "bg-[#e6e0d4] text-[#3a3532] shadow-md"
                  : "text-[#e6e0d4]/70 hover:text-white"
              }`}
            >
              Orders ({orders.length})
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
            <div className="bg-white p-8 rounded-3xl border border-[#3a3532]/5 shadow-sm h-fit">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-[#3a3532]/10">
                <h2 className="text-xs font-black uppercase tracking-widest text-[#3a3532]">
                  {editingProductId ? `Edit Product #${editingProductId}` : "Add New Product"}
                </h2>
                {editingProductId && (
                  <button
                    onClick={handleCancelEdit}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#cc5555] hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleSaveProduct} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    placeholder="e.g. Neon Void Hoodie"
                    className="px-4 py-2.5 border border-[#3a3532]/10 rounded-xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
                      Unit Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.unit_price}
                      onChange={(e) => setProductForm({ ...productForm, unit_price: e.target.value })}
                      placeholder="99.99"
                      className="px-4 py-2.5 border border-[#3a3532]/10 rounded-xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
                      Inventory Stock *
                    </label>
                    <input
                      type="number"
                      required
                      value={productForm.inventory}
                      onChange={(e) => setProductForm({ ...productForm, inventory: e.target.value })}
                      placeholder="10"
                      className="px-4 py-2.5 border border-[#3a3532]/10 rounded-xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
                    Collection *
                  </label>
                  <select
                    value={productForm.collection}
                    onChange={(e) => setProductForm({ ...productForm, collection: e.target.value })}
                    className="px-4 py-2.5 border border-[#3a3532]/10 rounded-xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] outline-none cursor-pointer"
                  >
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title} (ID: {col.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Short product description..."
                    className="px-4 py-2.5 border border-[#3a3532]/10 rounded-xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-[#3a3532] text-[#e6e0d4] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#252220] transition-colors"
                >
                  {editingProductId ? "Update Product" : "Create Product"}
                </button>
              </form>
            </div>

            {/* Products Table (2 Columns) */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-[#3a3532]/5 shadow-sm overflow-x-auto">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#3a3532] mb-6 pb-2 border-b border-[#3a3532]/10">
                All Products ({products.length}) - <span className="text-[#8b7a66] font-semibold lowercase">click any row to edit</span>
              </h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#3a3532]/10 text-[10px] font-black uppercase tracking-wider text-[#3a3532]/60">
                    <th className="py-3 px-2">ID</th>
                    <th className="py-3 px-2">Title</th>
                    <th className="py-3 px-2">Price</th>
                    <th className="py-3 px-2">Stock</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a3532]/5 text-xs font-bold">
                  {products.map((prod) => (
                    <tr
                      key={prod.id}
                      onClick={() => handleSelectProduct(prod)}
                      className={`cursor-pointer transition-colors ${
                        editingProductId === prod.id ? "bg-[#8b7a66]/15" : "hover:bg-[#f4f1eb]"
                      }`}
                    >
                      <td className="py-3.5 px-2 text-[#3a3532]/50">#{prod.id}</td>
                      <td className="py-3.5 px-2 font-black">{prod.title}</td>
                      <td className="py-3.5 px-2 text-[#8b7a66]">${Number(prod.unit_price).toFixed(2)}</td>
                      <td className="py-3.5 px-2">{prod.inventory}</td>
                      <td className="py-3.5 px-2 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleSelectProduct(prod)}
                          className="px-3 py-1.5 bg-[#3a3532] text-[#e6e0d4] hover:bg-[#252220] rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COLLECTIONS TAB */}
        {activeTab === "collections" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Create Collection Form */}
            <div className="bg-white p-8 rounded-3xl border border-[#3a3532]/5 shadow-sm h-fit">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#3a3532] mb-6 pb-2 border-b border-[#3a3532]/10">
                Create Collection
              </h2>
              <form onSubmit={handleAddCollection} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
                    Collection Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCollectionTitle}
                    onChange={(e) => setNewCollectionTitle(e.target.value)}
                    placeholder="e.g. Summer Drop"
                    className="px-4 py-2.5 border border-[#3a3532]/10 rounded-xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#3a3532] text-[#e6e0d4] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#252220] transition-colors"
                >
                  Save Collection
                </button>
              </form>
            </div>

            {/* Collections List */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-[#3a3532]/5 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#3a3532] mb-6 pb-2 border-b border-[#3a3532]/10">
                Existing Collections ({collections.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {collections.map((col) => (
                  <div key={col.id} className="p-4 rounded-2xl bg-[#f4f1eb] border border-[#3a3532]/5 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm text-[#3a3532]">{col.title}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/50">
                        ID: #{col.id} • {col.product_count || 0} Products
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="bg-white p-8 rounded-3xl border border-[#3a3532]/5 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#3a3532] mb-6 pb-2 border-b border-[#3a3532]/10">
              Customer Orders ({orders.length})
            </h2>
            {orders.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#3a3532]/10 text-[10px] font-black uppercase tracking-wider text-[#3a3532]/60">
                    <th className="py-3 px-2">Order ID</th>
                    <th className="py-3 px-2">Customer ID</th>
                    <th className="py-3 px-2">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a3532]/5 text-xs font-bold">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#f4f1eb]/50 transition-colors">
                      <td className="py-3.5 px-2">Order #{order.id}</td>
                      <td className="py-3.5 px-2">Customer #{order.customer}</td>
                      <td className="py-3.5 px-2">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-[10px] uppercase font-black tracking-wider">
                          {order.payment_status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-xs font-bold uppercase tracking-wider text-[#3a3532]/50">
                No orders found.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
