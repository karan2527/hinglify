const THEME_KEY = "theme";

export async function getTheme() {
  const result = await chrome.storage.local.get(THEME_KEY);
  return result[THEME_KEY] === "light" ? "light" : "dark";
}

export async function setTheme(theme) {
  const value = theme === "dark" ? "dark" : "light";
  await chrome.storage.local.set({ [THEME_KEY]: value });
  return value;
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}
