import { baseUrlFromRequest, env } from "../lib/config.js";
import { setWebhook } from "../lib/telegram.js";

export async function GET(request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== env("SETUP_SECRET")) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const webhookUrl = `${baseUrlFromRequest(request)}/api/telegram-webhook`;
  const result = await setWebhook(webhookUrl, env("TELEGRAM_WEBHOOK_SECRET"));

  return Response.json({
    ok: true,
    webhookUrl,
    telegram: result
  });
}
