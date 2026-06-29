import { env } from "./config.js";

const TELEGRAM_LIMIT = 3900;

function apiUrl(method) {
  return `https://api.telegram.org/bot${env("TELEGRAM_BOT_TOKEN")}/${method}`;
}

export function isAllowedChat(chatId) {
  const allowedChatIds = new Set(
    [env("TELEGRAM_CHAT_ID"), ...(process.env.TELEGRAM_ALLOWED_CHAT_IDS || "").split(",")]
      .map((value) => String(value).trim())
      .filter(Boolean)
  );

  return allowedChatIds.has(String(chatId));
}

export function splitTelegramText(text, limit = TELEGRAM_LIMIT) {
  const chunks = [];
  let current = "";

  for (const paragraph of text.split("\n\n")) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length <= limit) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    if (paragraph.length <= limit) {
      current = paragraph;
    } else {
      for (let index = 0; index < paragraph.length; index += limit) {
        chunks.push(paragraph.slice(index, index + limit));
      }
      current = "";
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

export async function sendMessage(chatId, text, options = {}) {
  const chunks = splitTelegramText(text);

  for (const [index, chunk] of chunks.entries()) {
    const payload = {
      chat_id: chatId,
      text: chunk,
      link_preview_options: { is_disabled: true }
    };

    if (options.replyToMessageId) {
      payload.reply_to_message_id = options.replyToMessageId;
    }

    // 버튼은 메시지가 여러 조각으로 나뉠 경우 마지막 메시지에만 붙입니다.
    if (options.replyMarkup && index === chunks.length - 1) {
      payload.reply_markup = options.replyMarkup;
    }

    await telegramPostJson("sendMessage", payload);
  }
}

export async function sendInlineKeyboardMessage(chatId, text, buttons, options = {}) {
  const inlineKeyboard = buttons
    .filter((button) => button?.text && button?.url)
    .map((button) => [{ text: button.text.slice(0, 64), url: button.url }]);

  if (!inlineKeyboard.length) {
    return;
  }

  await sendMessage(chatId, text, {
    ...options,
    replyMarkup: {
      inline_keyboard: inlineKeyboard
    }
  });
}

export async function sendChatAction(chatId, action) {
  await telegramPostJson("sendChatAction", {
    chat_id: chatId,
    action
  });
}

export async function sendPhoto(chatId, imageBuffer, options = {}) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("photo", new Blob([imageBuffer], { type: "image/png" }), "cardnews.png");

  if (options.caption) {
    form.append("caption", options.caption.slice(0, 1024));
  }

  if (options.replyToMessageId) {
    form.append("reply_to_message_id", String(options.replyToMessageId));
  }

  const response = await fetch(apiUrl("sendPhoto"), {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendPhoto error ${response.status}: ${body}`);
  }

  return response.json();
}

export async function setWebhook(webhookUrl, secretToken) {
  return telegramPostJson("setWebhook", {
    url: webhookUrl,
    secret_token: secretToken,
    allowed_updates: ["message", "channel_post"]
  });
}

export async function getWebhookInfo() {
  return telegramPostJson("getWebhookInfo", {});
}

async function telegramPostJson(method, payload) {
  const response = await fetch(apiUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram ${method} error ${response.status}: ${body}`);
  }

  return response.json();
}
