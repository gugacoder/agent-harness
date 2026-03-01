import { pgEnum } from "drizzle-orm/pg-core";

export const companyStatusEnum = pgEnum("company_status", [
  "active",
  "suspended",
]);

export const userRoleEnum = pgEnum("user_role", [
  "operator",
  "shop",
  "courier",
]);

export const courierStatusEnum = pgEnum("courier_status", [
  "available",
  "busy",
  "offline",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "assigned",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "assigned",
  "accepted",
  "picked_up",
  "in_transit",
  "delivered",
  "failed",
]);

export const deliveryEventTypeEnum = pgEnum("delivery_event_type", [
  "status_change",
  "location_update",
  "note",
]);

export const pricingRuleTypeEnum = pgEnum("pricing_rule_type", [
  "per_km",
  "distance_range",
  "neighborhood",
  "flat_rate",
  "surcharge",
]);

export const surchargeTypeEnum = pgEnum("surcharge_type", [
  "rain",
  "night",
  "weekend",
]);

export const surchargeModeEnum = pgEnum("surcharge_mode", [
  "percentage",
  "fixed",
]);

export const closingStatusEnum = pgEnum("closing_status", [
  "draft",
  "confirmed",
  "paid",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
]);

export const closingPeriodEnum = pgEnum("closing_period", [
  "daily",
  "weekly",
  "monthly",
]);
