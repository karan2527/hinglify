import { DEFAULTS } from "../utils/constants.js";

const cache = new Map();
const requestTimes = [];

/**
 * Translate strings in order through the documented public API.
 */
export async function translateBatch(texts) {
  if (!Array.isArray(texts) || texts.some((text) => typeof text !== "string")) {
    throw new TypeError("Translation input must be an array of strings.");
  }

  const uniqueTexts = [...new Set(texts)];
  const translated = new Map();
  for (let index = 0; index < uniqueTexts.length; index += 8) {
    const group = uniqueTexts.slice(index, index + 8);
    const results = await Promise.all(group.map((text) => translateOne(text)));
    group.forEach((text, resultIndex) => translated.set(text, results[resultIndex]));
  }
  const results = texts.map((text) => translated.get(text));
  return results;
}

async function translateOne(text) {
  if (cache.has(text)) return cache.get(text);
  if (text.length > DEFAULTS.batchMaxCharacters) {
    throw new Error("A text block is longer than the API's 2,000-character limit.");
  }

  for (let attempt = 0; attempt <= DEFAULTS.maxRetries; attempt += 1) {
    await waitForRateLimit();
    let response;
    try {
      response = await fetch(DEFAULTS.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode: DEFAULTS.apiMode })
      });
    } catch {
      if (attempt === DEFAULTS.maxRetries) throw new Error("Could not reach the translation service.");
      await delay(500 * 2 ** attempt);
      continue;
    }

    const body = await response.json().catch(() => null);
    if (response.ok && body?.success && typeof body.data?.roman === "string") {
      cache.set(text, body.data.roman);
      return body.data.roman;
    }

    if (response.status === 429 && attempt < DEFAULTS.maxRetries) {
      const seconds = Number(body?.retryAfterSeconds || body?.meta?.rateLimitResetSeconds || 2);
      await delay(Math.min(seconds * 1000, 65000));
      continue;
    }
    if (response.status === 400) throw new Error(body?.message || "The translation request was invalid.");
    if (response.status >= 500 && attempt < DEFAULTS.maxRetries) {
      await delay(1000 * 2 ** attempt);
      continue;
    }
    if (response.status >= 500) throw new Error("The translation service is temporarily unavailable.");
    throw new Error(body?.message || body?.error || "The translation service returned an unexpected response.");
  }
  throw new Error("Translation failed after retries.");
}

async function waitForRateLimit() {
  const now = Date.now();
  while (requestTimes[0] && requestTimes[0] <= now - 60000) requestTimes.shift();
  const windowWait = requestTimes.length >= DEFAULTS.maxRequestsPerMinute
    ? Math.max(0, requestTimes[0] + 60000 - now)
    : 0;
  await delay(windowWait);
  const requestStartedAt = Date.now();
  requestTimes.push(requestStartedAt);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
