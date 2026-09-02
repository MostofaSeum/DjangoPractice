export interface Product {
  id: number;
  title: string;
  unit_price: number;
  discount_percent?: number;
  discount_valid_until?: string | null;
  is_discount_active?: boolean;
  discounted_price?: number;
  inventory: number;
  slug: string;
  collection: number;
  short_description?: string;
  description?: string;
  images?: { id?: number; image: string }[];
  is_trending?: boolean;
  is_visible?: boolean;
  units_sold?: number;
  average_rating?: number;
  review_count?: number;
}

export interface Collection {
  id: number;
  title: string;
  product_count: number;
  image?: string | null;
  is_featured?: boolean;
  is_visible?: boolean;
}

export interface OrderItem {
  id: number;
  product?: {
    id: number;
    title: string;
    unit_price: number;
    images?: { id?: number; image: string }[];
    discount_percent?: number;
    discounted_price?: number;
    inventory?: number;
  };
  variant?: {
    id: number;
    name: string;
    color_name?: string;
    color_code?: string;
    size?: string;
    price_override?: number;
    inventory?: number;
  } | null;
  variant_title?: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  customer: number;
  customer_name?: string;
  payment_status: string;
  placed_at?: string;
  shipping_address?: string;
  phone?: string;
  payment_method?: string;
  transaction_id?: string;
  transaction_phone_no?: string;
  delivery_area?: string;
  delivery_charge?: number | string;
  coupon_code?: string;
  is_edited_by_admin?: boolean;
  edited_at?: string | null;
  items?: OrderItem[];
  courier_partner?: number | null;
  courier_partner_details?: CourierProvider | null;
  tracking_code?: string;
  tracking_status?:
    | "pending"
    | "packed"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "returned";
  tracking_status_display?: string;
  courier_consignment_id?: string;
  courier_response?: any;
  return_requests?: {
    id: number;
    status: string;
    status_display: string;
    reason: string;
    reason_display: string;
    customer_note?: string;
    refund_method: string;
    refund_method_display?: string;
    refund_account_number?: string;
    refund_amount: string;
    created_at?: string | null;
    admin_note?: string;
    refund_transaction_id?: string;
    proof_image_1?: string | null;
    proof_image_2?: string | null;
    proof_image_3?: string | null;
    items?: {
      id: number;
      order_item_id: number;
      product_title: string;
      variant_name: string;
      product_image?: string | null;
      quantity: number;
      unit_price: string;
      refund_amount: string;
    }[];
  }[];
}

export interface ReturnRequestItem {
  id: number;
  order: number;
  order_id: number;
  customer: number;
  customer_name: string;
  customer_phone: string;
  status: "pending" | "approved" | "rejected" | "picked_up" | "refunded" | "cancelled";
  status_display: string;
  reason: string;
  reason_display: string;
  customer_note: string;
  refund_method: "vibecoin" | "bkash" | "nagad";
  refund_method_display: string;
  refund_account_number: string;
  proof_image_1?: string | null;
  proof_image_2?: string | null;
  proof_image_3?: string | null;
  admin_note: string;
  refund_transaction_id: string;
  refund_amount: number | string;
  refunded_at?: string | null;
  items: {
    id: number;
    order_item: number;
    product_title: string;
    variant_name: string;
    product_image?: string | null;
    quantity: number;
    unit_price: number | string;
    refund_amount: number | string;
  }[];
  created_at: string;
  updated_at: string;
}




export interface CustomerItem {
  id: number;
  phone: string;
  birth_date?: string | null;
  membership: string;
  user_id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  customer_name?: string;
}

export interface ReviewItem {
  id: number;
  user_id?: number;
  product?: number;
  product_title?: string;
  name: string;
  rating: number;
  description: string;
  image?: string | null;
  images?: { id: number; image: string }[];
  date: string;
}

export interface CouponItem {
  id: number;
  code: string;
  discount_percent: number;
  valid_from: string;
  valid_to: string;
  target_type: "product" | "collection";
  collection?: number | null;
  collection_title?: string | null;
  product_count?: number;
  products_details?: { id: number; title: string; unit_price: number }[];
  is_active: boolean;
  created_at: string;
}

export interface DeliveryRuleItem {
  id: number;
  title: string;
  target_type: "product" | "collection" | "order_total";
  rule_type: "free" | "reduced";
  inside_dhaka_charge: number | string;
  outside_dhaka_charge: number | string;
  collection?: number | null;
  collection_title?: string | null;
  product_count?: number;
  products_details?: { id: number; title: string; unit_price: number }[];
  min_quantity?: number;
  min_order_amount?: number | string | null;
  is_active: boolean;
  created_at: string;
}

export interface PaymentSettingsState {
  bkash_number: string;
  bkash_active: boolean;
  nagad_number: string;
  nagad_active: boolean;
  cod_active: boolean;
  vibecoin_active: boolean;
}

export interface DeliverySettingsState {
  inside_dhaka_charge: string;
  outside_dhaka_charge: string;
  estimated_days_inside: string;
  estimated_days_outside: string;
  is_active: boolean;
}

export type DeliveryProviderCode =
  | "steadfast"
  | "pathao"
  | "redx"
  | "paperfly";


export interface CourierProvider {
  id: number;
  name: string;
  provider_code: DeliveryProviderCode;
  provider_code_display?: string;
  api_key?: string | null;
  secret_key?: string | null;
  client_id?: string | null;
  base_url?: string | null;
  tracking_url_template?: string | null;
  is_active: boolean;
  is_default_inside_dhaka: boolean;
  is_default_outside_dhaka: boolean;
  is_sandbox: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type DeliverySubTab = "rates" | "couriers";

export type AdminTab =
  | "dashboard"
  | "products"
  | "collections"
  | "orders"
  | "customers"
  | "promotions"
  | "coupons"
  | "payments"
  | "delivery"
  | "analytics"
  | "settings";

export type ProductSubTab =
  | "all"
  | "add"
  | "edit"
  | "reviews"
  | "stock-health"
  | "sheets-sync";
export type CollectionSubTab = "all" | "add" | "edit";
export type OrderSubTab = "all" | "returns";
export type AnalyticsSubTab = "sales" | "coupons" | "payments" | "top-products" | "delivery-orders";



