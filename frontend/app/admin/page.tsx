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

  // New Product Form
  const [newProduct, setNewProduct] = useState({
    title: "",
    slug: "",
    unit_price: "",
    inventory: "10",
    collection: "1",
    description: "",
  });

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
  }, [user, token, router]);

  const fetchAdminData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Fetch Products
      const prodRes = await fetch(`${API_BASE}/store/products/`, { cache: "no-store" });
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

  // Add Product (POST /store/products/)
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const payload = {
        title: newProduct.title,
        slug: newProduct.slug || newProduct.title.toLowerCase().replace(/\s+/g, "-"),
        unit_price: parseFloat(newProduct.unit_price),
        inventory: parseInt(newProduct.inventory),
        collection: parseInt(newProduct.collection),
        description: newProduct.description,
      };

      const res = await fetch(`${API_BASE}/store/products/`, {
        method: "POST",
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
          title: "Product added successfully!",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
        });
        setNewProduct({ title: "", slug: "", unit_price: "", inventory: "10", collection: "1", description: "" });
        fetchAdminData();
      } else {
        const err = await res.json();
        Swal.fire({
          icon: "error",
          title: "Failed to add product",
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
            {/* Add Product Form (1 Column) */}
            <div className="bg-white p-8 rounded-3xl border border-[#3a3532]/5 shadow-sm h-fit">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#3a3532] mb-6 pb-2 border-b border-[#3a3532]/10">
                Add New Product
              </h2>
              <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
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
                      value={newProduct.unit_price}
                      onChange={(e) => setNewProduct({ ...newProduct, unit_price: e.target.value })}
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
                      value={newProduct.inventory}
                      onChange={(e) => setNewProduct({ ...newProduct, inventory: e.target.value })}
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
                    value={newProduct.collection}
                    onChange={(e) => setNewProduct({ ...newProduct, collection: e.target.value })}
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
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Short product description..."
                    className="px-4 py-2.5 border border-[#3a3532]/10 rounded-xl bg-[#f4f1eb] text-xs font-bold text-[#3a3532] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-[#3a3532] text-[#e6e0d4] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#252220] transition-colors"
                >
                  Create Product
                </button>
              </form>
            </div>

            {/* Products Table (2 Columns) */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-[#3a3532]/5 shadow-sm overflow-x-auto">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#3a3532] mb-6 pb-2 border-b border-[#3a3532]/10">
                All Products ({products.length})
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
                    <tr key={prod.id} className="hover:bg-[#f4f1eb]/50 transition-colors">
                      <td className="py-3.5 px-2 text-[#3a3532]/50">#{prod.id}</td>
                      <td className="py-3.5 px-2">{prod.title}</td>
                      <td className="py-3.5 px-2 text-[#8b7a66]">${Number(prod.unit_price).toFixed(2)}</td>
                      <td className="py-3.5 px-2">{prod.inventory}</td>
                      <td className="py-3.5 px-2 text-right">
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
