import { useCart as useCartFromStore } from "@/store/CartContext";

export function useCart() {
  return useCartFromStore();
}
