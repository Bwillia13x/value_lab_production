export interface Webhook {
  url: string;
  event: string;
}

export async function sendWebhook(
  webhook: Webhook,
  payload: any
): Promise<void> {
  try {
    await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: webhook.event, payload }),
    });
  } catch (error) {
    console.error(`Error sending webhook to ${webhook.url}:`, error);
  }
}