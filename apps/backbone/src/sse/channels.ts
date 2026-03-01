/**
 * SSE channel definitions for Chega.la real-time events.
 *
 * Three channel types (OSD120):
 * - company/{companyId} — Central receives: order_created, order_status, courier_location, courier_status
 * - courier/{courierId} — Motoboy receives: delivery_assigned, delivery_cancelled
 * - order/{orderId}     — Lojista receives (per order): order_status, courier_location
 */

export type ChannelType = "company" | "courier" | "order";

export function companyChannel(companyId: string): string {
  return `company/${companyId}`;
}

export function courierChannel(courierId: string): string {
  return `courier/${courierId}`;
}

export function orderChannel(orderId: string): string {
  return `order/${orderId}`;
}
