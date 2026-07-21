"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);

  // Helper: Get or Create Cart ID from API & localStorage
  const getOrCreateCartId = async (): Promise<string> => {
    let cartId = localStorage.getItem("cart_id");
    if (!cartId) {
      const res = await fetch(`${API_BASE}/store/carts/`, { method: "POST" });
      const data = await res.json();
      cartId = data.id;
      localStorage.setItem("cart_id", cartId!);
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
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  };

  useEffect(() => {
    const initCart = async () => {
      const cartId = await getOrCreateCartId();
      await refreshCart(cartId);
    };
    initCart();
  }, []);

  // Add Item to Cart 
  const addToCart = async (productId: number, quantity = 1) => {
    const cartId = await getOrCreateCartId();
    const res = await fetch(`${API_BASE}/store/carts/${cartId}/items/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (res.ok) {
      await refreshCart(cartId);
    }
  };

  // Update Item Quantity)
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

  // Remove Item from Cart (DELETE /store/carts/<cart_id>/items/<item_id>/)
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
    <CartContext.Provider value={{ cart, itemCount, addToCart, updateQuantity, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}