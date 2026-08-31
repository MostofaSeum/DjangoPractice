"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { siteConfig } from "@/config/siteConfig";

export interface CartVariant {
  id: number;
  name: string;
  color_name?: string | null;
  color_code?: string | null;
  size?: string | null;
  price_override?: number | string | null;
  effective_price?: number;
  discounted_price?: number;
  inventory?: number;
  image?: string | null;
}

export interface CartItem {
  id: number;
  product: {
    id: number;
    title: string;
    unit_price: number;
    discount_percent?: number;
    discounted_price?: number;
    images?: { id?: number; image: string }[];
    collection?: number | { id: number; title: string };
  };
  variant?: CartVariant | null;
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
  loading: boolean;
  addToCart: (productId: number, quantity?: number, variantId?: number | null) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCart: (authToken?: string) => Promise<any>;
}

const API_BASE = siteConfig.apiBaseUrl.replace(/\/+$/, "");

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { user, loading: authLoading } = useAuth();

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
    } finally {
      setLoading(false);
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
    const currentCartId = localStorage.getItem("cart_id");
    if (authLoading) return;

    try {
      if (user) {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (authToken) {
          headers["Authorization"] = `JWT ${authToken}`;
        }

        const res = await fetch(`${API_BASE}/store/carts/sync/`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ cart_id: currentCartId }),
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("cart_id", data.id);
          setCart(data);
          setLoading(false);
          return data;
        }
      } else {
        if (currentCartId) {
          await refreshCart(currentCartId);
        } else {
          setCart(null);
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Cart sync failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncCart();
  }, [user?.id, authLoading]);

  // Helper to recompute cart total price optimistically
  const calculateOptimisticCart = (items: CartItem[], cartId: string): Cart => {
    const total_price = items.reduce((sum, item) => sum + item.total_price, 0);
    return {
      id: cartId,
      items,
      total_price,
    };
  };

  // Add Item to Cart (with Optimistic UI)
  const addToCart = async (productId: number, quantity = 1, variantId?: number | null) => {
    let cartId = await getOrCreateCartId();
    const payload: any = { product_id: productId, quantity };
    if (variantId) {
      payload.variant_id = variantId;
    }

    try {
      let res = await fetch(`${API_BASE}/store/carts/${cartId}/items/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.status === 404) {
        localStorage.removeItem("cart_id");
        cartId = await createNewCart();
        res = await fetch(`${API_BASE}/store/carts/${cartId}/items/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const updatedCart = await res.json();
        setCart(updatedCart);
      }
    } catch (err) {
      console.error("Add to cart error:", err);
    }
  };

  // Update Item Quantity (with Instant Optimistic UI)
  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!cart) return;

    // ⚡ Optimistic Update: Instantly update UI without waiting for network response
    const previousCart = cart;
    const updatedItems = cart.items.map((item) => {
      if (item.id === itemId) {
        const unitPrice = item.variant
          ? Number(item.variant.discounted_price || item.variant.effective_price || item.product.discounted_price || item.product.unit_price)
          : Number(item.product.discounted_price || item.product.unit_price);
        return {
          ...item,
          quantity,
          total_price: quantity * unitPrice,
        };
      }
      return item;
    });

    setCart(calculateOptimisticCart(updatedItems, cart.id));

    try {
      const res = await fetch(`${API_BASE}/store/carts/${cart.id}/items/${itemId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        const updatedCart = await res.json();
        setCart(updatedCart);
      } else {
        setCart(previousCart);
      }
    } catch (err) {
      setCart(previousCart);
      console.error("Update quantity error:", err);
    }
  };

  // Remove Item from Cart (with Instant Optimistic UI)
  const removeFromCart = async (itemId: number) => {
    if (!cart) return;

    // ⚡ Optimistic Update: Instantly remove item from UI
    const previousCart = cart;
    const updatedItems = cart.items.filter((item) => item.id !== itemId);
    setCart(calculateOptimisticCart(updatedItems, cart.id));

    try {
      const res = await fetch(`${API_BASE}/store/carts/${cart.id}/items/${itemId}/`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        const updatedCart = await res.json();
        setCart(updatedCart);
      } else {
        setCart(previousCart);
      }
    } catch (err) {
      setCart(previousCart);
      console.error("Remove from cart error:", err);
    }
  };

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, itemCount, loading, addToCart, updateQuantity, removeFromCart, clearCart, syncCart }}>
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
      loading: false,
      addToCart: async () => {},
      updateQuantity: async () => {},
      removeFromCart: async () => {},
      clearCart: async () => {},
      syncCart: async () => {},
    };
  }
  return context;
}
