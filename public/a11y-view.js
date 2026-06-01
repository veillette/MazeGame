/**
 * a11y-view.js
 *
 * Side-by-side accessibility development view for Maze Game (SceneryStack/Vite).
 * Adapted from PhET chipper/wrappers/a11y-view — PDOM mirror + activity log.
 */

const ACTIVITY_LOG_LENGTH = 40;

const RESPONSE_TYPE_STYLES = {
  object: { className: "alert-log-item--object", badge: "OBJ" },
  context: { className: "alert-log-item--context", badge: "CTX" },
  help: { className: "alert-log-item--help", badge: "HLP" },
  other: { className: "alert-log-item--other", badge: "OTH" },
};

const IMPORTANT_ARIA_ATTRIBUTES = [
  "aria-valuetext",
  "aria-checked",
  "aria-disabled",
  "aria-expanded",
  "aria-selected",
  "aria-pressed",
  "aria-describedby",
  "aria-labelledby",
  "role",
];

const MUTATION_CONFIG = {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
};

const FOCUS_HIGHLIGHT_CLASS = "a11y-view-focus-highlight";

/** @type {HTMLElement | null} */
let relationshipLookupRoot = null;

/** @type {boolean} */
let a11yViewInitialized = false;

/**
 * Cross-frame-safe element check (iframe nodes fail parent `instanceof HTMLElement`).
 * @param {unknown} value
 * @returns {value is HTMLElement}
 */
function isDomElement(value) {
  return typeof value === "object" && value !== null && /** @type {{ nodeType?: number }} */ (value).nodeType === 1;
}

/**
 * @returns {string}
 */
function buildSimUrl() {
  const params = new URLSearchParams(window.location.search);
  params.delete("liveReload");
  if (!params.has("ea")) {
    params.set("ea", "");
  }
  params.set("postMessageOnLoad", "");
  params.set("supportsInteractiveDescription", "true");
  const simUrl = new URL("./", window.location.href);
  simUrl.search = params.toString();
  return simUrl.href;
}

/**
 * @param {ParentNode} ancestor
 * @returns {HTMLElement[]}
 */
function getAllElements(ancestor) {
  /** @type {HTMLElement[]} */
  const elements = [];
  if (isDomElement(ancestor)) {
    elements.push(ancestor);
  }
  const descendants = ancestor.querySelectorAll("*");
  for (const element of descendants) {
    if (isDomElement(element)) {
      elements.push(element);
    }
  }
  return elements;
}

/**
 * @param {HTMLElement} root
 */
function styleCopy(root) {
  for (const element of getAllElements(root)) {
    element.tabIndex = -1;
    if (element.className !== "pdom-style") {
      element.removeAttribute("style");
    }
  }
}

/**
 * @param {string} value
 * @param {HTMLElement} element
 * @returns {string}
 */
function formatRelationshipValue(value, element) {
  const doc = relationshipLookupRoot ?? element.ownerDocument;
  return value
    .split(/\s+/)
    .map((idref) => {
      if (!idref) {
        return "...";
      }
      const target = doc.getElementById(idref);
      if (!target) {
        return "Missing!";
      }
      const tag = target.tagName.toLowerCase();
      if (tag === "p" || /^h[1-6]$/.test(tag)) {
        return `(${tag}) ${(target.textContent ?? "").trim()}`;
      }
      return "...";
    })
    .join(", ");
}

/**
 * @param {string} attributeName
 * @param {string} value
 * @param {HTMLElement} element
 * @returns {string}
 */
function formatAriaValue(attributeName, value, element) {
  if (attributeName === "aria-describedby" || attributeName === "aria-labelledby") {
    return formatRelationshipValue(value, element);
  }
  return value;
}

/**
 * @param {HTMLElement} rootNode
 */
function addInlineAttributes(rootNode) {
  for (const element of getAllElements(rootNode)) {
    if (element.hidden) {
      continue;
    }

    if (element.hasAttribute("aria-label") && element.innerHTML === "") {
      const ariaLabel = element.getAttribute("aria-label") ?? "";
      element.removeAttribute("style");

      if (element.tagName.toLowerCase() === "input") {
        if (element.getAttribute("type") === "button") {
          element.setAttribute("value", ariaLabel);
        } else {
          const labelElement = document.createElement("label");
          labelElement.textContent = ariaLabel;
          const parentElement = element.parentNode;
          if (parentElement) {
            parentElement.insertBefore(labelElement, parentElement.firstChild);
          }
        }
      } else {
        element.innerHTML = ariaLabel + element.innerHTML;
      }
    }

    for (const attributeName of IMPORTANT_ARIA_ATTRIBUTES) {
      if (!element.hasAttribute(attributeName)) {
        continue;
      }
      const value = element.getAttribute(attributeName) ?? "";
      const displayValue = formatAriaValue(attributeName, value, element);
      const valueElement = document.createElement("p");
      valueElement.className = "pdom-style";
      valueElement.textContent = `(${attributeName}: ${displayValue})`;
      element.parentNode?.insertBefore(valueElement, element.nextSibling);
    }
  }
}

/**
 * @param {HTMLElement} pdomRoot
 * @param {HTMLElement | null} container
 */
function renderPdomCopy(pdomRoot, container) {
  if (!container) {
    return;
  }
  container.replaceChildren();
  const pdomCopy = /** @type {HTMLElement} */ (pdomRoot.cloneNode(true));
  pdomCopy.removeAttribute("style");
  container.appendChild(pdomCopy);
  addInlineAttributes(pdomCopy);
  styleCopy(pdomCopy);
}

/**
 * @param {HTMLElement} pdomRoot
 * @param {HTMLElement | null} container
 * @returns {() => void}
 */
function addPdomObserver(pdomRoot, container) {
  let dirty = true;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let renderTimeoutId = null;

  const scheduleRender = () => {
    if (renderTimeoutId !== null) {
      return;
    }
    renderTimeoutId = setTimeout(() => {
      renderPdomCopy(pdomRoot, container);
      dirty = false;
      renderTimeoutId = null;
    }, 10);
  };

  setInterval(() => {
    if (dirty) {
      scheduleRender();
    }
  }, 300);

  const domObserver = new MutationObserver(() => {
    dirty = true;
  });
  domObserver.observe(pdomRoot, MUTATION_CONFIG);
  scheduleRender();

  const invalidateView = () => {
    dirty = true;
  };

  for (const eventType of ["input", "change"]) {
    pdomRoot.addEventListener(eventType, invalidateView);
  }

  return invalidateView;
}

/**
 * @param {HTMLElement} originalElement
 * @param {HTMLElement} listElement
 * @param {HTMLElement} alertContainer
 */
function addLiveObserver(originalElement, listElement, alertContainer) {
  /** @type {string} */
  let lastLoggedText = "";

  const liveObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const alertText = (mutation.target.textContent ?? "").trim();
      if (alertText.length === 0) {
        lastLoggedText = "";
        continue;
      }

      if (alertText === lastLoggedText) {
        continue;
      }
      lastLoggedText = alertText;

      const target = /** @type {HTMLElement} */ (mutation.target);
      const responseCategory = target.dataset.responseCategory?.toLowerCase() ?? "other";
      const responseStyle =
        RESPONSE_TYPE_STYLES[/** @type {keyof typeof RESPONSE_TYPE_STYLES} */ (responseCategory)] ??
        RESPONSE_TYPE_STYLES.other;

      const listItem = document.createElement("li");
      listItem.classList.add("alert-log-item", responseStyle.className);

      const badge = document.createElement("span");
      badge.classList.add("alert-log-badge");
      badge.textContent = responseStyle.badge;

      const message = document.createElement("span");
      message.classList.add("alert-log-message");
      message.textContent = alertText;

      listItem.appendChild(badge);
      listItem.appendChild(message);

      if (target.id.includes("assertive")) {
        listItem.classList.add("assertive");
      }

      listElement.appendChild(listItem);
      alertContainer.scrollTop = alertContainer.scrollHeight;

      const overflow = listElement.children.length - ACTIVITY_LOG_LENGTH;
      for (let i = 0; i < overflow; i++) {
        listElement.firstChild?.remove();
      }
    }
  });

  liveObserver.observe(originalElement, MUTATION_CONFIG);
}

/**
 * @param {Window} frameWindow
 * @param {() => void} invalidateView
 */
function patchCheckboxSetter(frameWindow, invalidateView) {
  if (frameWindow.__a11yViewCheckedPatched) {
    return;
  }

  const descriptor = Object.getOwnPropertyDescriptor(frameWindow.HTMLInputElement.prototype, "checked");
  if (!(descriptor?.set && descriptor.get)) {
    return;
  }

  const originalGet = descriptor.get;
  const originalSet = descriptor.set;

  Object.defineProperty(frameWindow.HTMLInputElement.prototype, "checked", {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    get() {
      return originalGet.call(this);
    },
    set(value) {
      const previous = originalGet.call(this);
      originalSet.call(this, value);
      if (previous !== value) {
        invalidateView();
      }
    },
  });

  frameWindow.__a11yViewCheckedPatched = true;
}

/**
 * @param {Document} iframeDocument
 */
function injectFocusHighlightStyle(iframeDocument) {
  if (iframeDocument.getElementById("a11y-view-focus-style")) {
    return;
  }
  const style = iframeDocument.createElement("style");
  style.id = "a11y-view-focus-style";
  style.textContent = `
    .${FOCUS_HIGHLIGHT_CLASS} {
      outline: 3px solid #ff9800 !important;
      outline-offset: 2px;
    }
  `;
  iframeDocument.head?.appendChild(style);
}

/**
 * @param {HTMLIFrameElement} iframe
 */
function wireFocusHighlight(iframe) {
  const iframeDocument = iframe.contentWindow?.document;
  if (!iframeDocument) {
    return;
  }

  injectFocusHighlightStyle(iframeDocument);

  /** @type {Element | null} */
  let previousElement = null;

  const handleIframeFocus = () => {
    previousElement?.classList.remove(FOCUS_HIGHLIGHT_CLASS);
    const activeElement = iframeDocument.activeElement;
    previousElement = activeElement;
    const isDocumentBody = activeElement === iframeDocument.body;
    if (activeElement && !isDocumentBody && isDomElement(activeElement)) {
      activeElement.classList.add(FOCUS_HIGHLIGHT_CLASS);
    }
  };

  iframeDocument.addEventListener("focusin", handleIframeFocus);
}

/**
 * @param {Window} innerWindow
 * @param {number} maxAttempts
 * @returns {Promise<HTMLElement | null>}
 */
function waitForPdomRoot(innerWindow, maxAttempts = 200) {
  return new Promise((resolve) => {
    let attempts = 0;

    const check = () => {
      const pdomRoot = innerWindow.phet?.joist?.display?.pdomRootElement;
      if (isDomElement(pdomRoot)) {
        resolve(pdomRoot);
        return;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        resolve(null);
        return;
      }

      setTimeout(check, 50);
    };

    check();
  });
}

/**
 * @param {MessageEvent} event
 */
async function handleSimLoadMessage(event) {
  if (!event.data) {
    return;
  }

  /** @type {{ type?: string }} */
  let data;
  try {
    data = JSON.parse(String(event.data));
  } catch {
    return;
  }

  if (data.type !== "load") {
    return;
  }

  if (a11yViewInitialized) {
    return;
  }

  const iframe = document.getElementById("iframe");
  if (!(iframe instanceof HTMLIFrameElement)) {
    return;
  }

  const innerWindow = iframe.contentWindow;
  if (!innerWindow) {
    return;
  }

  const pdomRoot = await waitForPdomRoot(innerWindow);
  if (!isDomElement(pdomRoot)) {
    return;
  }

  a11yViewInitialized = true;

  relationshipLookupRoot = pdomRoot;

  const pdomCopyContainer = document.getElementById("pdom-copy");
  const alertList = document.getElementById("alert-list");
  const alertContainer = document.getElementById("polite-element-container");

  const invalidateView = addPdomObserver(pdomRoot, pdomCopyContainer);
  patchCheckboxSetter(innerWindow, invalidateView);

  const ariaLiveContainer = innerWindow.phet?.joist?.display?.descriptionUtteranceQueue?.announcer?.ariaLiveContainer;

  if (alertList instanceof HTMLElement && alertContainer instanceof HTMLElement && isDomElement(ariaLiveContainer)) {
    for (const liveElement of ariaLiveContainer.querySelectorAll("[aria-live]")) {
      if (isDomElement(liveElement)) {
        addLiveObserver(liveElement, alertList, alertContainer);
      }
    }
  }

  wireFocusHighlight(iframe);
  iframe.focus();
}

function initialize() {
  const iframe = document.getElementById("iframe");
  if (!(iframe instanceof HTMLIFrameElement)) {
    return;
  }

  iframe.src = buildSimUrl();

  const clearButton = document.getElementById("clear-activity-log-button");
  const alertList = document.getElementById("alert-list");
  if (clearButton instanceof HTMLButtonElement && alertList instanceof HTMLElement) {
    clearButton.addEventListener("click", () => {
      alertList.replaceChildren();
    });
  }

  window.addEventListener("message", handleSimLoadMessage);
}

initialize();
