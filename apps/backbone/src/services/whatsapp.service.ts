export async function sendWhatsAppMessage(
  instanceUrl: string,
  apiKey: string,
  phone: string,
  message: string
): Promise<void> {
  // Extract instance name from URL (last path segment) or use default
  const url = new URL(instanceUrl);
  const instanceName =
    url.pathname.split("/").filter(Boolean).pop() || "evolution";

  const endpoint = `${url.origin}/message/sendText/${instanceName}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: phone,
      text: message,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `WhatsApp send failed (${response.status}): ${body || response.statusText}`
    );
  }
}
