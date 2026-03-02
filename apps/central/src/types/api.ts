// API response types matching backbone schema

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

export type CourierStatus = "available" | "busy" | "offline";

export interface Courier {
  id: string;
  company_id: string;
  profile_id: string;
  full_name: string;
  phone: string;
  photo_url: string | null;
  status: CourierStatus;
  total_deliveries: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

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

// --- Pricing ---

export type RuleType =
  | "per_km"
  | "distance_range"
  | "neighborhood"
  | "flat_rate"
  | "surcharge";

export type SurchargeType = "rain" | "night" | "weekend";
export type SurchargeMode = "percentage" | "fixed";

export interface PricingTable {
  id: string;
  company_id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  pricing_table_id: string;
  rule_type: RuleType;
  base_value: string;
  per_km_value: string | null;
  min_distance_km: string | null;
  max_distance_km: string | null;
  neighborhood: string | null;
  surcharge_type: SurchargeType | null;
  surcharge_mode: SurchargeMode | null;
  surcharge_value: string | null;
  priority: number;
  created_at: string;
}

export interface SimulationResult {
  basePrice: string;
  surchargeAmount: string;
  totalPrice: string;
  appliedRuleId: string;
}

export interface ShopPricingOverride {
  id: string;
  shop_id: string;
  pricing_table_id: string;
  company_id: string;
  created_at: string;
}

// --- Financial Closings ---

export type ClosingStatus = "draft" | "confirmed" | "paid";

export interface FinancialClosing {
  id: string;
  company_id: string;
  courier_id: string;
  period_start: string;
  period_end: string;
  total_deliveries: number;
  total_distance_km: string;
  total_amount: string;
  status: ClosingStatus;
  confirmed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialClosingItem {
  id: string;
  closing_id: string;
  delivery_id: string;
  delivery_price: string;
  distance_km: string;
  delivered_at: string;
}

export interface FinancialClosingWithItems extends FinancialClosing {
  items: FinancialClosingItem[];
}

// --- Invoices ---

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

// --- Analytics ---

export type AnalyticsPeriod = "day" | "week" | "month" | "custom";

export interface AnalyticsOverview {
  total_deliveries: number;
  completed: number;
  cancelled: number;
  completion_rate: number;
  avg_delivery_time_minutes: number;
}

export interface CourierPerformance {
  courier_id: string;
  courier_name: string;
  total_deliveries: number;
  avg_delivery_time_minutes: number;
  avg_distance_km: number;
}

export interface NeighborhoodVolume {
  neighborhood: string;
  total_deliveries: number;
}

export interface AnalyticsRevenue {
  total_revenue: string;
  avg_per_delivery: string;
  total_deliveries: number;
}

export interface TrendDataPoint {
  date: string;
  total_deliveries: number;
}

// --- Admin ---

export type CompanyStatus = "active" | "suspended";

export interface AdminCompany {
  id: string;
  name: string;
  cnpj: string | null;
  status: CompanyStatus;
  created_at: string;
  total_users: number;
  total_deliveries: number;
  total_orders: number;
}

export interface AdminCompanyDetail {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string;
  email: string;
  address: string;
  lat: string;
  lng: string;
  logo_url: string | null;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}

export interface AdminMetrics {
  total_companies: number;
  total_deliveries_today: number;
  total_deliveries_week: number;
  total_deliveries_month: number;
  total_users: number;
  deliveries_per_day: { date: string; count: number }[];
}

// --- Users ---

export type UserRole = "operator" | "shop" | "courier";

export interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Company Config ---

export interface CompanyConfig {
  id: string;
  company_id: string;
  pod_required: boolean;
  default_closing_period: string;
  default_invoice_period: string;
  otp_whatsapp_enabled: boolean;
  otp_whatsapp_url: string | null;
  otp_whatsapp_api_key_set: boolean;
  otp_smtp_enabled: boolean;
  otp_smtp_host: string | null;
  otp_smtp_port: number | null;
  otp_smtp_user: string | null;
  otp_smtp_pass_set: boolean;
  otp_smtp_from: string | null;
  otp_smtp_tls: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateCompanyConfigData {
  pod_required?: boolean;
  default_closing_period?: string;
  default_invoice_period?: string;
  otp_whatsapp_enabled?: boolean;
  otp_whatsapp_url?: string;
  otp_whatsapp_api_key?: string;
  otp_smtp_enabled?: boolean;
  otp_smtp_host?: string;
  otp_smtp_port?: number;
  otp_smtp_user?: string;
  otp_smtp_pass?: string;
  otp_smtp_from?: string;
  otp_smtp_tls?: boolean;
}
