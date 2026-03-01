import type { SSEStreamingApi } from "hono/streaming";

/**
 * SSEManager — manages SSE client connections grouped by channel.
 *
 * Maintains a Map<channel, Set<SSEStreamingApi>> for broadcasting typed events.
 * Heartbeat is sent every 30 seconds per OSD126.
 */

interface SSEClient {
  stream: SSEStreamingApi;
  channel: string;
}

class SSEManager {
  private clients = new Map<string, Set<SSEClient>>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startHeartbeat();
  }

  /** Register a client stream on a channel */
  subscribe(channel: string, stream: SSEStreamingApi): SSEClient {
    const client: SSEClient = { stream, channel };

    if (!this.clients.has(channel)) {
      this.clients.set(channel, new Set());
    }
    this.clients.get(channel)!.add(client);

    return client;
  }

  /** Remove a client from its channel */
  unsubscribe(client: SSEClient): void {
    const channelClients = this.clients.get(client.channel);
    if (channelClients) {
      channelClients.delete(client);
      if (channelClients.size === 0) {
        this.clients.delete(client.channel);
      }
    }
  }

  /** Broadcast a typed event to all clients on a channel */
  async broadcast(channel: string, event: { type: string; [key: string]: unknown }): Promise<void> {
    const channelClients = this.clients.get(channel);
    if (!channelClients || channelClients.size === 0) return;

    const deadClients: SSEClient[] = [];

    for (const client of channelClients) {
      try {
        await client.stream.writeSSE({
          event: event.type,
          data: JSON.stringify(event),
        });
      } catch {
        deadClients.push(client);
      }
    }

    // Clean up disconnected clients
    for (const dead of deadClients) {
      this.unsubscribe(dead);
    }
  }

  /** Get active client count for a channel */
  getClientCount(channel: string): number {
    return this.clients.get(channel)?.size ?? 0;
  }

  /** Send heartbeat to all connected clients (OSD126) */
  private async sendHeartbeat(): Promise<void> {
    for (const [, channelClients] of this.clients) {
      const deadClients: SSEClient[] = [];
      for (const client of channelClients) {
        try {
          await client.stream.writeSSE({
            event: "heartbeat",
            data: JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() }),
          });
        } catch {
          deadClients.push(client);
        }
      }
      for (const dead of deadClients) {
        this.unsubscribe(dead);
      }
    }
  }

  /** Start heartbeat interval — every 30s per OSD126 */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat().catch(console.error);
    }, 30_000);
  }

  /** Stop heartbeat (for graceful shutdown) */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

/** Singleton SSE manager instance */
export const sseManager = new SSEManager();
