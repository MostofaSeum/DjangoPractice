export interface ProductVariant {
  id: number;
  product?: number;
  name: string;
  color_name?: string | null;
  color_code?: string | null;
  size?: string | null;
  price_override?: number | string | null;
  effective_price?: number;
  discounted_price?: number;
  inventory: number;
  image?: string | null;
  is_active?: boolean;
}

export interface ProductImage {
  id: number;
  image: string;
}

export interface Collection {
  id: number;
  title: string;
  products_count?: number;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  short_description?: string;
  description: string;
  unit_price: number;
  discount_percent?: number;
  discounted_price?: number;
  inventory: number;
  collection: number | Collection;
  images?: ProductImage[];
  variants?: ProductVariant[];
  is_photos_published?: boolean;
  is_trending?: boolean;
}
