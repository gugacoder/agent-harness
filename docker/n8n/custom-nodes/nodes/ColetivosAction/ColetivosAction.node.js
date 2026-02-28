"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColetivosAction = void 0;

/**
 * Coletivos Action Node for n8n.
 *
 * Executes operations on Coletivos via the Operations API (POST /api/ops/execute).
 * Available actions:
 *   - Create Thread
 *   - Add Comment
 *   - Close Thread
 *   - Search KB
 */
class ColetivosAction {
  constructor() {
    this.description = {
      displayName: 'Coletivos',
      name: 'coletivosAction',
      icon: 'file:coletivos.svg',
      group: ['transform'],
      version: 1,
      subtitle: '={{$parameter["action"]}}',
      description: 'Execute operations on Coletivos (create threads, add comments, search KB)',
      defaults: {
        name: 'Coletivos',
      },
      inputs: ['main'],
      outputs: ['main'],
      credentials: [
        {
          name: 'coletivosApi',
          required: true,
        },
      ],
      properties: [
        {
          displayName: 'Action',
          name: 'action',
          type: 'options',
          noDataExpression: true,
          options: [
            {
              name: 'Create Thread',
              value: 'thread.create',
              description: 'Create a new thread',
            },
            {
              name: 'Add Comment',
              value: 'comment.create',
              description: 'Add a comment to an existing thread',
            },
            {
              name: 'Close Thread',
              value: 'thread.close',
              description: 'Close/resolve a thread',
            },
            {
              name: 'Search KB',
              value: 'kb.search',
              description: 'Search knowledge base articles',
            },
          ],
          default: 'thread.create',
          description: 'The operation to execute',
        },
        // ── Create Thread fields ──
        {
          displayName: 'Subject',
          name: 'subject',
          type: 'string',
          default: '',
          required: true,
          displayOptions: { show: { action: ['thread.create'] } },
          description: 'The subject/title of the thread',
        },
        {
          displayName: 'Body',
          name: 'body',
          type: 'string',
          typeOptions: { rows: 4 },
          default: '',
          displayOptions: { show: { action: ['thread.create'] } },
          description: 'The initial message body',
        },
        {
          displayName: 'Customer Email',
          name: 'customerEmail',
          type: 'string',
          default: '',
          displayOptions: { show: { action: ['thread.create'] } },
          description: 'Email of the customer (optional)',
        },
        {
          displayName: 'Channel',
          name: 'channel',
          type: 'options',
          options: [
            { name: 'n8n', value: 'n8n' },
            { name: 'Email', value: 'email' },
            { name: 'Chat', value: 'chat' },
            { name: 'API', value: 'api' },
          ],
          default: 'n8n',
          displayOptions: { show: { action: ['thread.create'] } },
          description: 'The channel source',
        },
        // ── Add Comment fields ──
        {
          displayName: 'Thread ID',
          name: 'threadId',
          type: 'string',
          default: '',
          required: true,
          displayOptions: { show: { action: ['comment.create', 'thread.close'] } },
          description: 'The UUID of the thread',
        },
        {
          displayName: 'Comment Text',
          name: 'commentText',
          type: 'string',
          typeOptions: { rows: 4 },
          default: '',
          required: true,
          displayOptions: { show: { action: ['comment.create'] } },
          description: 'The comment text to add',
        },
        {
          displayName: 'Visibility',
          name: 'visibility',
          type: 'options',
          options: [
            { name: 'Public', value: 'public' },
            { name: 'Internal', value: 'internal' },
          ],
          default: 'internal',
          displayOptions: { show: { action: ['comment.create'] } },
          description: 'Comment visibility',
        },
        // ── Close Thread fields ──
        {
          displayName: 'Resolution Note',
          name: 'resolutionNote',
          type: 'string',
          typeOptions: { rows: 2 },
          default: '',
          displayOptions: { show: { action: ['thread.close'] } },
          description: 'Optional resolution note',
        },
        // ── Search KB fields ──
        {
          displayName: 'Search Query',
          name: 'searchQuery',
          type: 'string',
          default: '',
          required: true,
          displayOptions: { show: { action: ['kb.search'] } },
          description: 'Search query for knowledge base',
        },
        {
          displayName: 'Limit',
          name: 'searchLimit',
          type: 'number',
          default: 5,
          displayOptions: { show: { action: ['kb.search'] } },
          description: 'Maximum number of results',
        },
      ],
    };
  }

  async execute() {
    const items = this.getInputData();
    const returnData = [];
    const credentials = await this.getCredentials('coletivosApi');
    const baseUrl = credentials.baseUrl;
    const apiKey = credentials.apiKey;

    for (let i = 0; i < items.length; i++) {
      const action = this.getNodeParameter('action', i);
      let operation = '';
      let params = {};

      switch (action) {
        case 'thread.create': {
          operation = 'thread.create';
          params = {
            subject: this.getNodeParameter('subject', i),
            body: this.getNodeParameter('body', i, ''),
            customerEmail: this.getNodeParameter('customerEmail', i, ''),
            channel: this.getNodeParameter('channel', i, 'n8n'),
          };
          break;
        }
        case 'comment.create': {
          operation = 'comment.create';
          params = {
            threadId: this.getNodeParameter('threadId', i),
            body: this.getNodeParameter('commentText', i),
            visibility: this.getNodeParameter('visibility', i, 'internal'),
          };
          break;
        }
        case 'thread.close': {
          operation = 'thread.close';
          params = {
            threadId: this.getNodeParameter('threadId', i),
            resolutionNote: this.getNodeParameter('resolutionNote', i, ''),
          };
          break;
        }
        case 'kb.search': {
          // KB search uses the v1 REST API, not ops/execute
          const query = this.getNodeParameter('searchQuery', i);
          const limit = this.getNodeParameter('searchLimit', i, 5);

          const response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${baseUrl}/v1/kb/search?q=${encodeURIComponent(query)}&limit=${limit}`,
            headers: {
              'X-API-Key': apiKey,
            },
            json: true,
          });

          returnData.push({ json: response });
          continue;
        }
      }

      // Execute operation via ops/execute
      if (operation) {
        const response = await this.helpers.httpRequest({
          method: 'POST',
          url: `${baseUrl}/ops/execute`,
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
            'X-Operation-Source': 'n8n',
          },
          body: {
            operation,
            params,
          },
          json: true,
        });

        returnData.push({ json: response });
      }
    }

    return [returnData];
  }
}

exports.ColetivosAction = ColetivosAction;
