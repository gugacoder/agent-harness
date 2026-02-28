/**
 * Evolution API Initialization Script
 * - Verifica se instancia existe, cria se nao
 * - Configura webhook
 * Zero dependencias (usa fetch nativo do Node 20)
 *
 * Env vars: EVOLUTION_HOST, EVOLUTION_PORT, EVOLUTION_API_KEY,
 *           EVOLUTION_INSTANCE_NAME, EVOLUTION_INSTANCE_TOKEN, BACKBONE_WEBHOOK_URL
 */

const {
  EVOLUTION_HOST,
  EVOLUTION_PORT,
  EVOLUTION_API_KEY,
  EVOLUTION_INSTANCE_NAME,
  EVOLUTION_INSTANCE_TOKEN,
  BACKBONE_WEBHOOK_URL,
} = process.env;

const BASE_URL = `http://${EVOLUTION_HOST}:${EVOLUTION_PORT}`;
const HEADERS = {
  "Content-Type": "application/json",
  apikey: EVOLUTION_API_KEY,
};

async function request(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const opts = { method, headers: HEADERS };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok && res.status !== 404) {
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  }

  return { status: res.status, data };
}

async function instanceExists() {
  const { status, data } = await request("GET", `/instance/fetchInstances`);
  if (status === 404) return false;

  if (Array.isArray(data)) {
    return data.some(
      (i) => i.instance?.instanceName === EVOLUTION_INSTANCE_NAME
    );
  }
  return false;
}

async function createInstance() {
  console.log(`Creating instance '${EVOLUTION_INSTANCE_NAME}'...`);
  await request("POST", "/instance/create", {
    instanceName: EVOLUTION_INSTANCE_NAME,
    token: EVOLUTION_INSTANCE_TOKEN,
    integration: "WHATSAPP-BAILEYS",
    qrcode: true,
  });
  console.log("Instance created.");
}

async function configureWebhook() {
  if (!BACKBONE_WEBHOOK_URL) {
    console.log("BACKBONE_WEBHOOK_URL not set, skipping webhook configuration.");
    return;
  }

  console.log(`Configuring webhook -> ${BACKBONE_WEBHOOK_URL}`);
  await request("POST", `/webhook/set/${EVOLUTION_INSTANCE_NAME}`, {
    webhook: {
      enabled: true,
      url: BACKBONE_WEBHOOK_URL,
      webhookByEvents: false,
      webhookBase64: true,
      events: [
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "CONNECTION_UPDATE",
        "QRCODE_UPDATED",
      ],
    },
  });
  console.log("Webhook configured.");
}

async function main() {
  console.log("evolution-init: starting...");

  const exists = await instanceExists();
  if (exists) {
    console.log(`Instance '${EVOLUTION_INSTANCE_NAME}' already exists.`);
  } else {
    await createInstance();
  }

  await configureWebhook();

  console.log("evolution-init: done.");
}

main().catch((err) => {
  console.error("evolution-init: FAILED", err);
  process.exit(1);
});
