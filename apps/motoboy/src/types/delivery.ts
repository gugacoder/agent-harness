export type DeliveryStatus =
  | "assigned"
  | "accepted"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed";

export interface Delivery {
  id: string;
  order_id: string;
  courier_id: string;
  company_id: string;
  status: DeliveryStatus;
  assigned_at: string;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  actual_distance_km: string | null;
  actual_duration_min: number | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  company_id: string;
  shop_id: string | null;
  order_number: number;
  status: string;
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

export interface DeliveryEvent {
  id: string;
  delivery_id: string;
  event_type: "status_change" | "location_update" | "note";
  old_status: string | null;
  new_status: string | null;
  description: string;
  actor_id: string;
  lat: string | null;
  lng: string | null;
  created_at: string;
}

/** Enriched delivery with order data for display */
export interface ActiveDeliveryData {
  delivery: Delivery;
  order: Order;
}

/** Pending notification from SSE (delivery not yet accepted/rejected) */
export interface PendingDelivery {
  delivery_id: string;
  order_id: string;
}

/** Valid next status transitions for the courier */
export const NEXT_STATUS: Record<string, { status: string; label: string } | null> = {
  accepted: { status: "picked_up", label: "Coletei" },
  picked_up: { status: "in_transit", label: "A caminho" },
  in_transit: { status: "delivered", label: "Entreguei" },
};
