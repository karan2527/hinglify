import { MESSAGES } from "../utils/constants.js";
import { translateBatch } from "./translator.js";
import {
  getTabState,
  setTabState,
  clearTabState
} from "../utils/storage.js";

const restrictedPage = (url = "") =>
  /^(chrome|edge|about|view-source):|chromewebstore\.google\.com|chrome\.google\.com\/webstore/.test(url);

async function sendToTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    if (!/Receiving end does not exist|Extension context invalidated/.test(String(error?.message))) throw error;
    return null;
  }
}

async function injectContentScript(tab) {
  if (!tab?.id || restrictedPage(tab.url)) {
    throw new Error("This page does not allow extensions to modify its content.");
  }
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/content.js"] });
}

async function setEnabled(tab, enabled) {
  if (!tab?.id) throw new Error("No active tab was found.");
  if (restrictedPage(tab.url)) throw new Error("This page does not allow Hinglify.");
  await setTabState(tab.id, enabled);
  if (enabled) {
    await injectContentScript(tab);
    await sendToTab(tab.id, { type: MESSAGES.SET_ENABLED, enabled: true });
  } else {
    await sendToTab(tab.id, { type: MESSAGES.SET_ENABLED, enabled: false });
  }
  return { enabled };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === MESSAGES.GET_STATE) {
      const tabId = message.tabId ?? sender.tab?.id;
      const tab = tabId ? await chrome.tabs.get(tabId) : null;
      return { enabled: tabId ? await getTabState(tabId) : false, supported: !restrictedPage(tab?.url) };
    }
    if (message.type === MESSAGES.SET_ENABLED) {
      const tab = await chrome.tabs.get(message.tabId);
      return await setEnabled(tab, Boolean(message.enabled));
    }
    if (message.type === MESSAGES.ENSURE_CONTENT) {
      const tab = await chrome.tabs.get(message.tabId);
      if (restrictedPage(tab.url)) return { supported: false };
      await injectContentScript(tab);
      return { supported: true };
    }
    if (message.type === MESSAGES.TRANSLATE) {
      return { texts: await translateBatch(message.texts) };
    }
    if (message.type === MESSAGES.CONTENT_READY) {
      const enabled = sender.tab?.id ? await getTabState(sender.tab.id) : false;
      return { enabled };
    }
    if (message.type === MESSAGES.STATUS) {
      if (sender.tab?.id && (message.status === "error" || message.status === "done")) {
        await chrome.tabs.sendMessage(sender.tab.id, {
          type: MESSAGES.STATUS,
          status: message.status,
          message: message.message
        }).catch(() => {});
      }
      return { received: true };
    }
    throw new Error("Unknown Hinglify message.");
  })().then(sendResponse).catch((error) => sendResponse({ error: error.message }));
  return true;
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== "toggle-hinglify" || !tab?.id) return;
  const enabled = await getTabState(tab.id);
  try {
    await setEnabled(tab, !enabled);
  } catch (error) {
    console.warn("Hinglify shortcut failed:", error.message);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearTabState(tabId).catch((error) => console.warn("Could not clear tab state:", error.message));
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab?.url || restrictedPage(tab.url)) return;
  if (!(await getTabState(tabId))) return;
  try {
    await injectContentScript(tab);
    await sendToTab(tabId, { type: MESSAGES.SET_ENABLED, enabled: true });
  } catch (error) {
    console.warn("Could not restore Hinglify after navigation:", error.message);
  }
});
