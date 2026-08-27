"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/store/LanguageContext";
import { getApiBaseUrl } from "@/config/siteConfig";
import Swal from "sweetalert2";

export interface WishlistProduct {
  id: number;
  title: string;
  unit_price: number;
  inventory: number;
  description?: string;
  images?: { id: number; image: string }[];
  discount_percent?: number;
  discounted_price?: number;
  discount_valid_until?: string | null;
  is_discount_active?: boolean;
  variants?: {
    id: number;
    name: string;
    price_override?: number | string | null;
    discounted_price?: number;
    inventory: number;
    is_active?: boolean;
  }[];
}

export interface WishlistItem {
  id: number;
  product: WishlistProduct;
  created_at: string;
}

export interface WishlistContextType {
  wishlistItems: WishlistItem[];
  wishlistProductIds: Set<number>;
  loading: boolean;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (productId: number) => Promise<boolean>;
  removeFromWishlist: (productId: number) => Promise<void>;
  fetchWishlist: () => Promise<void>;
}

export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistProductIds, setWishlistProductIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);

  const fetchWishlist = useCallback(async () => {
    if (!token || !user) {
      setWishlistItems([]);
      setWishlistProductIds(new Set());
      return;
    }

    try {
      setLoading(true);
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/store/wishlist/`, {
        headers: { Authorization: `JWT ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const items: WishlistItem[] = Array.isArray(data) ? data : data.results || [];
        setWishlistItems(items);
        const ids = new Set<number>(items.map((i) => i.product.id));
        setWishlistProductIds(ids);
      }
    } catch (err) {
      console.error("Failed to load wishlist:", err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = useCallback(
    (productId: number): boolean => {
      return wishlistProductIds.has(productId);
    },
    [wishlistProductIds]
  );

  const toggleWishlist = async (productId: number): Promise<boolean> => {
    if (!token || !user) {
      Swal.fire({
        position: "top-end",
        icon: "warning",
        title: t("swal.signInWishlist") || "Please sign in to add items to your wishlist.",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });
      return false;
    }

    try {
      const apiBaseUrl = getApiBaseUrl();
      const isSaved = wishlistProductIds.has(productId);

      if (isSaved) {
        // Toggle OFF 
        const res = await fetch(`${apiBaseUrl}/store/wishlist/toggle/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${token}`,
          },
          body: JSON.stringify({ product_id: productId }),
        });

        if (res.ok) {
          Swal.fire({
            position: "top-end",
            icon: "info",
            title: t("swal.removedFromWishlist") || "Removed from wishlist.",
            showConfirmButton: false,
            timer: 1800,
            toast: true,
          });
          await fetchWishlist();
          return false;
        }
      } else {
        // Toggle ON
        const res = await fetch(`${apiBaseUrl}/store/wishlist/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${token}`,
          },
          body: JSON.stringify({ product_id: productId }),
        });

        if (res.ok) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: t("swal.savedToWishlist") || "Saved to your wishlist!",
            showConfirmButton: false,
            timer: 1800,
            toast: true,
          });
          await fetchWishlist();
          return true;
        }
      }
    } catch (err) {
      console.error("Wishlist toggle error:", err);
    }
    return false;
  };

  const removeFromWishlist = async (productId: number) => {
    if (!token) return;
    try {
      const apiBaseUrl = getApiBaseUrl();
      await fetch(`${apiBaseUrl}/store/wishlist/toggle/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ product_id: productId }),
      });
      await fetchWishlist();
    } catch (err) {
      console.error("Failed to remove wishlist item:", err);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistProductIds,
        loading,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

const defaultWishlistContext: WishlistContextType = {
  wishlistItems: [],
  wishlistProductIds: new Set(),
  loading: false,
  isInWishlist: () => false,
  toggleWishlist: async () => false,
  removeFromWishlist: async () => {},
  fetchWishlist: async () => {},
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  return context || defaultWishlistContext;
};
