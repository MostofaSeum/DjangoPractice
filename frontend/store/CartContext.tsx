"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { siteConfig } from "@/config/siteConfig";

interface CartItem {
  id: number;
  product: { id: number; title: string; unit_price: number };
  quantity: number;
  total_price: number;
}

interface Cart {
  id: string;
  items: CartItem[];
  total_price: number;
}

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCart: (authToken?: string) => Promise<any>;
}

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const { token } = useAuth();

  // Create a new Cart ID from API
  const createNewCart = async (): Promise<string> => {
    const res = await fetch(`${API_BASE}/store/carts/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    const cartId = data.id;
    if (cartId) {
      localStorage.setItem("cart_id", cartId);
    }
    return cartId;
  };

  // Get or Create Cart ID from API & localStorage
  const getOrCreateCartId = async (): Promise<string> => {
    let cartId = localStorage.getItem("cart_id");
    if (!cartId) {
      cartId = await createNewCart();
    }
    return cartId!;
  };

  // Fetch Cart Details
  const refreshCart = async (cartId: string) => {
    try {
      const res = await fetch(`${API_BASE}/store/carts/${cartId}/`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      } else if (res.status === 404) {
        localStorage.removeItem("cart_id");
        const newCartId = await createNewCart();
        await refreshCart(newCartId);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  };

  // Clear state and reset cart
  const clearCart = async () => {
    localStorage.removeItem("cart_id");
    const newCartId = await createNewCart();
    await refreshCart(newCartId);
  };

  // Sync Guest Cart to User Cart
  const syncCart = async (authToken?: string) => {
    const activeToken = authToken || token || localStorage.getItem("access_token");
    const currentCartId = localStorage.getItem("cart_id");
    if (activeToken) {
      try {
        const res = await fetch(`${API_BASE}/store/carts/sync/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${activeToken}`,
          },
          body: JSON.stringify({ cart_id: currentCartId }),
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("cart_id", data.id);
          setCart(data);
          return data;
        }
      } catch (err) {
        console.error("Cart sync failed:", err);
      }
    } else {
      if (currentCartId) {
        await refreshCart(currentCartId);
      } else {
        setCart(null);
      }
    }
  };

  useEffect(() => {
    syncCart();
  }, [token]);

  // Add Item to Cart 
  const addToCart = async (productId: number, quantity = 1) => {
    let cartId = await getOrCreateCartId();
    let res = await fetch(`${API_BASE}/store/carts/${cartId}/items/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity }),
    });

    if (res.status === 404) {
      localStorage.removeItem("cart_id");
      cartId = await createNewCart();
      res = await fetch(`${API_BASE}/store/carts/${cartId}/items/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity }),
      });
    }

    if (res.ok) {
      await refreshCart(cartId);
    }
  };

  // Update Item Quantity
  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!cart) return;
    const res = await fetch(`${API_BASE}/store/carts/${cart.id}/items/${itemId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (res.ok) {
      await refreshCart(cart.id);
    }
  };

  // Remove Item from Cart
  const removeFromCart = async (itemId: number) => {
    if (!cart) return;
    const res = await fetch(`${API_BASE}/store/carts/${cart.id}/items/${itemId}/`, {
      method: "DELETE",
    });
    if (res.ok) {
      await refreshCart(cart.id);
    }
  };

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, itemCount, addToCart, updateQuantity, removeFromCart, clearCart, syncCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    return {
      cart: null,
      itemCount: 0,
      addToCart: async () => {},
      updateQuantity: async () => {},
      removeFromCart: async () => {},
      clearCart: async () => {},
      syncCart: async () => {},
    };
  }
  return context;
}
