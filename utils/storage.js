export async function getTabState(tabId) {
  const result = await chrome.storage.local.get("tabStates");
  return Boolean(result.tabStates?.[String(tabId)]);
}

export async function setTabState(tabId, enabled) {
  const result = await chrome.storage.local.get("tabStates");
  const tabStates = { ...(result.tabStates || {}), [String(tabId)]: Boolean(enabled) };
  await chrome.storage.local.set({ tabStates });
}

export async function clearTabState(tabId) {
  const result = await chrome.storage.local.get("tabStates");
  const tabStates = { ...(result.tabStates || {}) };
  delete tabStates[String(tabId)];
  await chrome.storage.local.set({ tabStates });
}
