import { env } from "../lib/config.js";
import { safeErrorMessage } from "../lib/errors.js";
import { sendMorningBriefing } from "../lib/handlers.js";

export async function GET(request) {
  try {
    const chatId = env("TELEGRAM_CHAT_ID");

    if (!isCronOrManualRequest(request)) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    await sendMorningBriefing(chatId);
    return Response.json({ ok: true, message: "morning briefing sent" });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        ok: false,
        error: "morning_briefing_failed",
        message: safeErrorMessage(error)
      },
      { status: 500 }
    );
  }
}

function isCronOrManualRequest(request) {
  const url = new URL(request.url);
  const manualSecret = url.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && manualSecret === cronSecret) {
    return true;
  }

  const authorization = request.headers.get("authorization") || "";
  if (cronSecret && authorization === `Bearer ${cronSecret}`) {
    return true;
  }

  if (request.headers.get("x-vercel-cron-schedule")) {
    return true;
  }

  const userAgent = request.headers.get("user-agent") || "";
  return userAgent.toLowerCase().includes("vercel-cron");
}
