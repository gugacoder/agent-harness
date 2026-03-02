// API response types matching backbone schema

export interface Shop {
  id: string;
  company_id: string;
  profile_id: string;
  trade_name: string;
  phone: string;
  address: string;
  lat: string;
  lng: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  company_id: string;
  shop_id: string | null;
  order_number: number;
  status: OrderStatus;
  pickup_address: string;
  pickup_lat: string;
  pickup_lng: string;
  delivery_address: string;
  delivery_lat: string;
  delivery_lng: string;
  recipient_name: string;
  recipient_phone: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  courier_id: string;
  company_id: string;
  status: string;
  assigned_at: string;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  actual_distance_km: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryProof {
  id: string;
  delivery_id: string;
  photo_url: string;
  signature_url: string;
  lat: string;
  lng: string;
  captured_at: string;
  created_at: string;
}

// --- Saved Addresses ---

export interface SavedAddress {
  id: string;
  company_id: string;
  profile_id: string;
  label: string | null;
  address: string;
  lat: string;
  lng: string;
  complement: string | null;
  reference: string | null;
  is_favorite: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Invoice types ---

export type InvoiceStatus = "draft" | "sent" | "paid";

export interface Invoice {
  id: string;
  company_id: string;
  shop_id: string;
  invoice_number: number;
  period_start: string;
  period_end: string;
  total_deliveries: number;
  total_distance_km: string;
  total_amount: string;
  status: InvoiceStatus;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  delivery_id: string;
  order_number: number;
  pickup_address: string;
  delivery_address: string;
  distance_km: string;
  price: string;
  delivered_at: string;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}
