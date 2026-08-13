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
  description: string;
  unit_price: number;
  discount_percent?: number;
  discounted_price?: number;
  inventory: number;
  collection: number | Collection;
  images?: ProductImage[];
}
