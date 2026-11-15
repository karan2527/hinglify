import { MESSAGES } from "../utils/constants.js";
import { applyTheme, getTheme, setTheme } from "../utils/theme.js";

const toggle = document.querySelector("#toggle");
const status = document.querySelector("#status");
const warning = document.querySelector("#warning");
const settings = document.querySelector("#settings");
const themeToggle = document.querySelector("#theme-toggle");
const toggleLabel = document.querySelector("#toggle-label");
const headerStatus = document.querySelector("#header-status");
let tabId;

function showStatus(text) {
  status.textContent = text;
  headerStatus.textContent = text;
  headerStatus.classList.toggle("active", text === "On" || text === "Done");
}
function showError(error) { showStatus(`Error: ${error}`); toggle.checked = false; }

async function init() {
  const theme = await getTheme();
  applyTheme(theme);
  themeToggle.textContent = theme === "dark" ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id;
  const response = await chrome.runtime.sendMessage({ type: MESSAGES.GET_STATE, tabId });
  await chrome.runtime.sendMessage({ type: MESSAGES.ENSURE_CONTENT, tabId });
  toggle.checked = Boolean(response?.enabled);
  toggleLabel.textContent = toggle.checked ? "On" : "Off";
  if (response?.supported === false) {
    toggle.disabled = true;
    showStatus("This page is not supported.");
  } else showStatus(toggle.checked ? "On" : "Idle");
  warning.hidden = false;
}

toggle.addEventListener("change", async () => {
  toggleLabel.textContent = toggle.checked ? "On" : "Off";
  toggle.disabled = true;
  showStatus(toggle.checked ? "Please wait a few seconds…" : "Restoring…");
  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGES.SET_ENABLED, tabId, enabled: toggle.checked });
    if (response?.error) return showError(response.error);
    showStatus(toggle.checked ? "Done" : "Idle");
  } catch (error) {
    showError(error.message);
  } finally {
    toggle.disabled = false;
  }
});
themeToggle.addEventListener("click", async () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  await setTheme(next);
  applyTheme(next);
  themeToggle.textContent = next === "dark" ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", next === "dark" ? "Switch to light mode" : "Switch to dark mode");
});
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === MESSAGES.STATUS) {
    if (message.status === "error") showStatus(`Error: ${message.message}`);
    if (message.status === "done") showStatus("Done");
  }
});
settings.addEventListener("click", () => chrome.runtime.openOptionsPage());
init().catch((error) => showError(error.message));
