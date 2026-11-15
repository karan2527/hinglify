(function () {
  if (typeof window.__hinglifyCleanup === "function") window.__hinglifyCleanup();
  window.__hinglifyLoaded = true;

  const minimumWords = 4;
  const skippedTags = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT",
    "SELECT", "OPTION", "SVG", "CANVAS", "IFRAME"
  ]);
  const originals = new Map();
  let enabled = false;
  let observer = null;
  let scanTimer = null;
  let translating = false;
  let pendingScan = false;
  let runtimeMessageListener = null;

  function extensionContextAvailable() {
    try {
      return Boolean(chrome?.runtime?.id);
    } catch {
      return false;
    }
  }

  async function sendMessage(message) {
    if (!extensionContextAvailable()) {
      enabled = false;
      observer?.disconnect();
      return null;
    }
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      if (String(error?.message).includes("Extension context invalidated")) {
        enabled = false;
        observer?.disconnect();
        return null;
      }
      throw error;
    }
  }

  const isSkippable = (node) => {
    const parent = node.parentElement;
    if (!parent || skippedTags.has(parent.tagName) ||
      parent.closest("[contenteditable], [translate='no'], .notranslate")) return true;
    const text = node.nodeValue || "";
    if (!/[A-Za-z]{2,}/.test(text) || /^[\s\d\W_]+$/.test(text) ||
      /^(https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.)/.test(text.trim())) return true;
    const style = window.getComputedStyle(parent);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return true;
    const words = text.trim().match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
    if (words.length < 2) return true;
    const hasSentencePunctuation = /[.!?。！？]/.test(text.trim());
    return words.length < minimumWords && !hasSentencePunctuation;
  };

  const findNodes = () => {
    const nodes = [];
    if (!document.body) return nodes;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) if (!isSkippable(node)) nodes.push(node);
    return nodes.sort((a, b) => {
      const aRect = a.parentElement.getBoundingClientRect();
      const bRect = b.parentElement.getBoundingClientRect();
      const aVisible = aRect.bottom >= 0 && aRect.top <= window.innerHeight;
      const bVisible = bRect.bottom >= 0 && bRect.top <= window.innerHeight;
      return Number(bVisible) - Number(aVisible);
    });
  };

  const batches = (nodes) => {
    const result = [];
    let batch = [];
    let characters = 0;
    for (const node of nodes) {
      const size = node.nodeValue.length;
      if (batch.length && (batch.length >= 8 || characters + size > 2000)) {
        result.push(batch);
        batch = [];
        characters = 0;
      }
      batch.push(node);
      characters += size;
    }
    if (batch.length) result.push(batch);
    return result;
  };

  async function translateNodes(nodes) {
    if (!enabled || translating) return;
    translating = true;
    try {
      for (const batch of batches(nodes)) {
        if (!enabled) break;
        const texts = batch.map((node) => node.nodeValue);
        const response = await sendMessage({ type: "translate", texts });
        if (!response) return;
        if (response?.error) throw new Error(response.error);
        if (!Array.isArray(response?.texts) || response.texts.length !== batch.length) {
          throw new Error("The translation service returned an invalid response.");
        }
        batch.forEach((node, index) => {
          if (!originals.has(node)) originals.set(node, node.nodeValue);
          const original = originals.get(node);
          const leading = original.match(/^\s*/)[0];
          const trailing = original.match(/\s*$/)[0];
          node.nodeValue = `${leading}${response.texts[index].trim()}${trailing}`;
        });
      }
      sendMessage({ type: "status", status: "done" }).catch(() => {});
    } catch (error) {
      sendMessage({
        type: "status",
        status: "error",
        message: error.message
      }).catch(() => {});
    } finally {
      translating = false;
      if (pendingScan) {
        pendingScan = false;
        scheduleScan();
      }
    }
  }

  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      if (translating) {
        pendingScan = true;
        return;
      }
      translateNodes(findNodes().filter((node) => !originals.has(node)));
    }, 150);
  }

  function restore() {
    for (const [node, original] of originals) if (node.isConnected) node.nodeValue = original;
    originals.clear();
    observer?.disconnect();
    observer = null;
  }

  function setEnabled(next) {
    enabled = Boolean(next);
    if (!enabled) {
      restore();
      window.getSelection()?.removeAllRanges();
      return;
    }
    observer ||= new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length)) scheduleScan();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleScan();
  }

  window.__hinglifyCleanup = () => {
    enabled = false;
    clearTimeout(scanTimer);
    observer?.disconnect();
    removeMeaningUi();
    if (runtimeMessageListener) chrome.runtime.onMessage.removeListener(runtimeMessageListener);
    runtimeMessageListener = null;
  };

  if (extensionContextAvailable()) {
    chrome.runtime.sendMessage({ type: "content-ready" })
      .then((response) => setEnabled(response?.enabled))
      .catch(() => {});
    runtimeMessageListener = (message) => {
      if (message.type === "set-enabled") setEnabled(message.enabled);
    };
    chrome.runtime.onMessage.addListener(runtimeMessageListener);
  }
})();
