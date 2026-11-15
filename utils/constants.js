export const MESSAGES = Object.freeze({
  GET_STATE: "get-state",
  SET_ENABLED: "set-enabled",
  TRANSLATE: "translate",
  CONTENT_READY: "content-ready",
  STATUS: "status",
  ENSURE_CONTENT: "ensure-content"
});

export const DEFAULTS = Object.freeze({
  batchMaxItems: 8,
  batchMaxCharacters: 2000,
  minimumWords: 4,
  apiUrl: "https://englishtohinglish.com/api/v1/translate",
  apiMode: "en-to-hinglish",
  maxRetries: 2,
  maxRequestsPerMinute: 28
});
