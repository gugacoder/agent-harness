"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColetivosApi = void 0;

/**
 * Coletivos API Credentials for n8n.
 * Uses API Key authentication (X-API-Key header).
 */
class ColetivosApi {
  constructor() {
    this.name = 'coletivosApi';
    this.displayName = 'Coletivos API';
    this.documentationUrl = '';
    this.properties = [
      {
        displayName: 'Base URL',
        name: 'baseUrl',
        type: 'string',
        default: 'http://localhost:3000/api',
        description: 'The base URL of the Coletivos API (e.g. http://localhost:3000/api)',
        required: true,
      },
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        description: 'API Key generated in Coletivos Hub > Admin > API Keys',
        required: true,
      },
    ];
  }
}

exports.ColetivosApi = ColetivosApi;
