import { API_BASE } from "./api";
import { Cart } from "@/types";

export const cartService = {
  async createCart(): Promise<Cart> {
    const res = await fetch(`${API_BASE}/store/carts/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return res.json();
  },

  async getCart(cartId: string, token?: string | null): Promise<Cart> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `JWT ${token}`;
    const res = await fetch(`${API_BASE}/store/carts/${cartId}/`, { headers });
    if (!res.ok) throw new Error("Failed to fetch cart");
    return res.json();
  },

  async addItem(cartId: string, productId: number, quantity: number = 1): Promise<void> {
    const res = await fetch(`${API_BASE}/store/carts/${cartId}/items/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (!res.ok) throw new Error("Failed to add item to cart");
  },

  async updateItem(cartId: string, itemId: number, quantity: number): Promise<void> {
    const res = await fetch(`${API_BASE}/store/carts/${cartId}/items/${itemId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) throw new Error("Failed to update item quantity");
  },

  async removeItem(cartId: string, itemId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/store/carts/${cartId}/items/${itemId}/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to remove item from cart");
  },
};
