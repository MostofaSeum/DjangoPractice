import { API_BASE } from "./api";
import { Product, Collection } from "@/types";

export const productService = {
  async getProducts(params: Record<string, string> = {}): Promise<Product[]> {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE}/store/products/${query ? `?${query}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch products");
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  },

  async getProductById(id: string | number): Promise<Product> {
    const res = await fetch(`${API_BASE}/store/products/${id}/`);
    if (!res.ok) throw new Error("Failed to fetch product details");
    return res.json();
  },

  async getCollections(): Promise<Collection[]> {
    const res = await fetch(`${API_BASE}/store/collections/`);
    if (!res.ok) throw new Error("Failed to fetch collections");
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  },
};
