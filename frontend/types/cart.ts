import { Product } from "./product";

export interface CartItem {
  id: number;
  product: {
    id: number;
    title: string;
    unit_price: number;
    discount_percent?: number;
    discounted_price?: number;
    images?: { id: number; image: string }[];
  } | Product;
  quantity: number;
  total_price: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total_price: number;
}
