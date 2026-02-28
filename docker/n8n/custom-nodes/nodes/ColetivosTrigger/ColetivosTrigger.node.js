"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColetivosTrigger = void 0;

/**
 * Coletivos Trigger Node for n8n.
 *
 * Registers a webhook with the Coletivos backbone to receive real-time events.
 * When activated, it calls POST /api/n8n/triggers to register.
 * When deactivated, it calls DELETE /api/n8n/triggers/:id to unregister.
 */
class ColetivosTrigger {
  constructor() {
    this.description = {
      displayName: 'Coletivos Trigger',
      name: 'coletivosTrigger',
      icon: 'file:coletivos.svg',
      group: ['trigger'],
      version: 1,
      subtitle: '={{$parameter["events"].join(", ")}}',
      description: 'Receives events from Coletivos (threads, comments, SLA)',
      defaults: {
        name: 'Coletivos Trigger',
      },
      inputs: [],
      outputs: ['main'],
      credentials: [
        {
          name: 'coletivosApi',
          required: true,
        },
      ],
      webhooks: [
        {
          name: 'default',
          httpMethod: 'POST',
          responseMode: 'onReceived',
          path: 'webhook',
        },
      ],
      properties: [
        {
          displayName: 'Events',
          name: 'events',
          type: 'multiOptions',
          options: [
            { name: 'Thread Created', value: 'thread.created' },
            { name: 'Thread Closed', value: 'thread.closed' },
            { name: 'Comment Created', value: 'comment.created' },
            { name: 'SLA Warning', value: 'sla.warning' },
            { name: 'SLA Expired', value: 'sla.expired' },
          ],
          default: ['thread.created', 'comment.created'],
          required: true,
          description: 'Which events to listen for',
        },
      ],
    };
  }

  async webhookMethods() {
    return {
      default: {
        async checkExists() {
          const webhookData = this.getWorkflowStaticData('node');
          return !!webhookData.triggerId;
        },
        async create() {
          const webhookUrl = this.getNodeWebhookUrl('default');
          const credentials = await this.getCredentials('coletivosApi');
          const events = this.getNodeParameter('events', []);

          const baseUrl = credentials.baseUrl;
          const apiKey = credentials.apiKey;

          const response = await this.helpers.httpRequest({
            method: 'POST',
            url: `${baseUrl}/n8n/triggers`,
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': apiKey,
            },
            body: {
              webhook_url: webhookUrl,
              events: events,
              workflow_id: this.getWorkflow().id?.toString() || '',
              node_id: this.getNode().id || '',
            },
            json: true,
          });

          const webhookData = this.getWorkflowStaticData('node');
          webhookData.triggerId = response.id;
          return true;
        },
        async delete() {
          const webhookData = this.getWorkflowStaticData('node');
          const triggerId = webhookData.triggerId;
          if (!triggerId) return true;

          const credentials = await this.getCredentials('coletivosApi');
          const baseUrl = credentials.baseUrl;
          const apiKey = credentials.apiKey;

          try {
            await this.helpers.httpRequest({
              method: 'DELETE',
              url: `${baseUrl}/n8n/triggers/${triggerId}`,
              headers: {
                'X-API-Key': apiKey,
              },
            });
          } catch {
            // Trigger may already be deleted, ignore
          }

          delete webhookData.triggerId;
          return true;
        },
      },
    };
  }

  async webhook() {
    const bodyData = this.getBodyData();
    return {
      workflowData: [this.helpers.returnJsonArray(bodyData)],
    };
  }
}

exports.ColetivosTrigger = ColetivosTrigger;
