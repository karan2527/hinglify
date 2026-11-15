import { applyTheme, getTheme, setTheme } from "../utils/theme.js";

const status = document.querySelector("#status");
const setStatus = (message) => { status.textContent = message; };
const themeToggle = document.querySelector("#theme-toggle");

async function initializeTheme() {
  const theme = await getTheme();
  applyTheme(theme);
  themeToggle.textContent = theme === "dark" ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

themeToggle.addEventListener("click", async () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  await setTheme(next);
  applyTheme(next);
  themeToggle.textContent = next === "dark" ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", next === "dark" ? "Switch to light mode" : "Switch to dark mode");
});

document.querySelector("#test").addEventListener("click", async () => {
  setStatus("Testing…");
  try {
    const response = await chrome.runtime.sendMessage({ type: "translate", texts: ["Hello, how are you?"] });
    if (response?.error) throw new Error(response.error);
    setStatus(`Result: ${response.texts[0]}`);
  } catch (error) { setStatus(`Error: ${error.message}`); }
});

initializeTheme().catch((error) => setStatus(`Theme error: ${error.message}`));
