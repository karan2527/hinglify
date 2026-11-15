# Hinglify

Hinglify is a Manifest V3 Chrome extension that converts English text on a webpage into Hinglish without replacing HTML or breaking links, buttons, forms, or scripts.

## Current status

The extension uses the documented free API at `https://englishtohinglish.com/api/v1/translate`. It sends one text at a time with mode `en-to-hinglish` and displays the `data.roman` response. The API does not require an API key.

## Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this folder.
4. Open `tests/test-page.html` in Chrome (use a local web server if direct file access is restricted).
5. Click the Hinglify icon and turn on **Convert to Hinglish**.

## Usage and settings

The toggle is stored per tab. Turn it off to restore exact original text without reloading. New DOM content is scanned while conversion is enabled. Only sentence-like text and paragraph-sized content are sent to the API; standalone words and short fragments are skipped. The API endpoint is permanently configured; no API key or setup is required. The Settings page provides a real connection test.

## Privacy and security

When translation is enabled, text from converted pages is sent to `englishtohinglish.com`. Password fields, inputs, textareas, code, scripts, and other non-content elements are excluded.

## Manual checklist

- [ ] Extension loads with no manifest errors.
- [ ] Popup opens and remembers the tab toggle.
- [ ] Test page headings and paragraphs convert.
- [ ] Link, button, form controls, code, numbers, URLs, and existing Hindi remain safe.
- [ ] Turning the toggle off restores original text exactly.
- [ ] Dynamically added text converts while the toggle is on.
- [ ] Restricted pages show a friendly unsupported-page status.
- [ ] Settings can test the permanent API connection.

## Live API integration

The request is `POST https://englishtohinglish.com/api/v1/translate` with JSON `{ "text": "...", "mode": "en-to-hinglish" }`. The free tier allows one string up to 2,000 characters and 30 requests per minute, with full CORS support. The extension retries transient network, server, and rate-limit failures.
