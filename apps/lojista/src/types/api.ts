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
