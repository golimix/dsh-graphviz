window.__ModuleLoader__.load({id:"@local/dsh-graphviz",factory:require=>{var module={exports:{}};var exports=module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/styles.css
var styles_default = "/* Host-theme-aware chrome for the Graphviz fence panel. All colors come from\n   DSH theme tokens so light, dark, and third-party palettes inherit correctly. */\n\n.dsh-gv {\n  --dsh-gv-accent: var(--dsw-alias-brand-primary-new-colorprimary-new-color, #3b82f6);\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  border: 0.5px solid var(--dsw-alias-border-l2);\n  border-radius: 12px;\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-primary);\n  font-family: var(--dsh-font-family-text, system-ui, sans-serif);\n}\n\n.dsh-gv-toolbar {\n  display: flex;\n  flex: 0 0 auto;\n  align-items: center;\n  gap: 6px;\n  padding: 8px 12px;\n  border-bottom: 0.5px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-2);\n  font-size: 12px;\n  user-select: none;\n}\n\n.dsh-gv-brand {\n  color: var(--dsh-gv-accent);\n  font-size: 13px;\n  font-weight: 700;\n  letter-spacing: 0.02em;\n}\n\n.dsh-gv-spacer {\n  flex: 1;\n}\n\n.dsh-gv-button {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 4px 10px;\n  border: 0.5px solid var(--dsw-alias-border-l2);\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  font: inherit;\n  font-size: 12px;\n  transition: background-color 120ms ease, color 120ms ease;\n}\n\n.dsh-gv-button:hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n  color: var(--dsw-alias-label-primary);\n}\n\n.dsh-gv-button[data-active='true'] {\n  border-color: var(--dsh-gv-accent);\n  background: var(--dsw-alias-interactive-bg-hover-accent);\n  color: var(--dsh-gv-accent);\n  font-weight: 600;\n}\n\n.dsh-gv-button:focus-visible,\n.dsh-gv-splitter:focus-visible {\n  outline: 2px solid var(--dsh-gv-accent);\n  outline-offset: 2px;\n}\n\n.dsh-gv-body {\n  display: flex;\n  flex: 1 1 auto;\n  min-height: 260px;\n}\n\n.dsh-gv[data-layout='lr'] .dsh-gv-body {\n  flex-direction: row;\n}\n\n.dsh-gv[data-layout='tb'] .dsh-gv-body {\n  flex-direction: column;\n}\n\n.dsh-gv-editor-pane {\n  display: flex;\n  overflow: hidden;\n  flex-shrink: 0;\n  min-width: 0;\n}\n\n.dsh-gv[data-layout='tb'] .dsh-gv-editor-pane {\n  border-bottom: 0.5px solid var(--dsw-alias-border-l2);\n  min-height: 80px;\n}\n\n.dsh-gv[data-layout='lr'] .dsh-gv-editor-pane {\n  min-width: 150px;\n}\n\n.dsh-gv-graph {\n  display: flex;\n  flex: 1 1 0;\n  flex-direction: column;\n  min-width: 0;\n  min-height: 0;\n  overflow: auto;\n}\n\n.dsh-gv-splitter {\n  flex: 0 0 auto;\n  background: var(--dsw-alias-border-l2);\n  cursor: col-resize;\n  touch-action: none;\n}\n\n.dsh-gv[data-layout='lr'] .dsh-gv-splitter {\n  width: 3px;\n  cursor: col-resize;\n}\n\n.dsh-gv[data-layout='tb'] .dsh-gv-splitter {\n  height: 3px;\n  cursor: row-resize;\n}\n\n.dsh-gv-editor {\n  display: flex;\n  flex: 1;\n  flex-direction: column;\n  min-height: 0;\n  width: 100%;\n  background: var(--dsw-alias-bg-layer-1);\n}\n\n.dsh-gv-monaco {\n  flex: 1;\n  min-height: 0;\n  width: 100%;\n}\n\n.dsh-gv-editor-notice {\n  padding: 6px 10px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n}\n\n.dsh-gv-textarea {\n  flex: 1;\n  width: 100%;\n  min-height: 0;\n  padding: 10px 12px;\n  border: 0;\n  outline: none;\n  resize: none;\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-primary);\n  font-family: var(--dsh-font-family-code, ui-monospace, SFMono-Regular, monospace);\n  font-size: 13px;\n  line-height: 1.5;\n  tab-size: 2;\n}\n\n.dsh-gv-status,\n.dsh-gv-empty {\n  display: flex;\n  flex: 1;\n  align-items: center;\n  justify-content: center;\n  gap: 10px;\n  padding: 32px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 13px;\n}\n\n.dsh-gv-spinner {\n  display: inline-block;\n  width: 16px;\n  height: 16px;\n  border: 2px solid var(--dsh-gv-accent);\n  border-top-color: transparent;\n  border-radius: 50%;\n  animation: dsh-gv-spin 0.6s linear infinite;\n}\n\n@keyframes dsh-gv-spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n\n.dsh-gv-error {\n  display: flex;\n  flex: 1;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 8px;\n  padding: 14px 16px;\n  color: var(--dsw-alias-label-primary);\n  background: var(--dsw-alias-bg-layer-2);\n  font-size: 12px;\n}\n\n.dsh-gv-error-title {\n  color: var(--dsw-alias-label-error);\n  font-weight: 600;\n}\n\n.dsh-gv-error-body {\n  max-width: 100%;\n  overflow-wrap: anywhere;\n  color: var(--dsw-alias-label-secondary);\n  font-family: var(--dsh-font-family-code, ui-monospace, SFMono-Regular, monospace);\n  white-space: pre-wrap;\n}\n\n.dsh-gv-canvas {\n  display: flex;\n  flex: 1;\n  justify-content: center;\n  padding: 16px;\n  background: var(--dsw-alias-bg-layer-1);\n}\n\n.dsh-gv-canvas svg {\n  display: block;\n  max-width: 100%;\n  height: auto;\n}\n";

// src/shared/contract.ts
var PACKAGE_ID = "@local/dsh-graphviz";
var FENCE_SLOT = "conversation.chat.markdown.fence";
var FENCE_KEYS = ["dot", "graphviz", "gv"];
var LOCALE_NS = "graphviz";
var ENGINE_CHUNK = "./client.engine.js";

// src/client/fence/GraphvizFence.tsx
var import_react2 = require("react");

// src/client/engine-loader.ts
function injectedLoader() {
  if (typeof require !== "function") return void 0;
  const candidate = require;
  if (typeof candidate.async !== "function") return void 0;
  return (specifier) => candidate.async(specifier);
}
function isEngineChunk(value) {
  if (typeof value !== "object" || value === null) return false;
  return typeof value.renderSvg === "function";
}
var pending;
function loadEngine(loader = injectedLoader()) {
  if (pending !== void 0) return pending;
  if (loader === void 0) {
    return Promise.reject(new Error("dsh-graphviz: the DSH client module loader is unavailable"));
  }
  pending = loader(ENGINE_CHUNK).then((chunk) => {
    if (!isEngineChunk(chunk)) {
      throw new Error("dsh-graphviz: client.engine.js did not export renderSvg");
    }
    return chunk;
  }).catch((error) => {
    pending = void 0;
    throw error instanceof Error ? error : new Error(String(error));
  });
  return pending;
}

// src/client/locales.ts
var en = {
  "toolbar.label": "DOT",
  "toolbar.tb": "TB",
  "toolbar.lr": "LR",
  "toolbar.graph": "Graph",
  "splitter.label": "Resize editor and graph",
  "status.rendering": "Rendering\u2026",
  "status.engine": "Loading Graphviz engine\u2026",
  empty: "No diagram",
  "error.title": "Render failed",
  "error.retry": "Retry",
  "editor.aria": "DOT source",
  "editor.loading": "Loading editor\u2026",
  "editor.fallback": "Editor unavailable; using plain text.",
  "graph.aria": "Graphviz diagram"
};
var zh = {
  "toolbar.label": "DOT",
  "toolbar.tb": "\u4E0A\u56FE\u4E0B\u6587",
  "toolbar.lr": "\u5DE6\u53F3\u5206\u680F",
  "toolbar.graph": "\u4EC5\u56FE\u5F62",
  "splitter.label": "\u8C03\u6574\u6E90\u7801\u4E0E\u56FE\u5F62\u533A\u57DF\u5927\u5C0F",
  "status.rendering": "\u6B63\u5728\u6E32\u67D3\u2026",
  "status.engine": "\u6B63\u5728\u52A0\u8F7D Graphviz \u5F15\u64CE\u2026",
  empty: "\u6682\u65E0\u56FE\u5F62",
  "error.title": "\u6E32\u67D3\u5931\u8D25",
  "error.retry": "\u91CD\u8BD5",
  "editor.aria": "DOT \u6E90\u7801",
  "editor.loading": "\u6B63\u5728\u52A0\u8F7D\u7F16\u8F91\u5668\u2026",
  "editor.fallback": "\u7F16\u8F91\u5668\u4E0D\u53EF\u7528\uFF0C\u5DF2\u5207\u6362\u4E3A\u7EAF\u6587\u672C\u7F16\u8F91\u3002",
  "graph.aria": "Graphviz \u56FE\u5F62"
};
var dictionaries = { en, zh };
function translate(t, key, locale = "en") {
  if (t !== void 0) {
    const value = t(key);
    if (value !== key) return value;
  }
  return dictionaries[locale][key];
}

// src/client/svg.ts
var SVG_NS = "http://www.w3.org/2000/svg";
var ALLOWED_ELEMENTS = /* @__PURE__ */ new Set([
  "svg",
  "g",
  "a",
  "title",
  "desc",
  "text",
  "tspan",
  "textPath",
  "path",
  "polygon",
  "polyline",
  "ellipse",
  "rect",
  "line",
  "circle",
  "image",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "mask",
  "marker",
  "pattern",
  "use",
  "symbol"
]);
var NAMED_COLORS = {
  black: "#000000",
  white: "#ffffff",
  lightgray: "#d3d3d3",
  lightgrey: "#d3d3d3",
  gray: "#808080",
  grey: "#808080",
  whitesmoke: "#f5f5f5",
  ivory: "#fffff0",
  beige: "#f5f5dc"
};
function sanitizeSvg(raw, options) {
  if (typeof DOMParser === "undefined") throw new Error("SVG sanitizing needs a DOM");
  const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
  const parserError = doc.getElementsByTagName("parsererror")[0];
  if (parserError !== void 0) throw new Error("Graphviz returned malformed SVG");
  const root = doc.documentElement;
  if (root.namespaceURI !== SVG_NS || root.localName !== "svg") {
    throw new Error("Graphviz did not return an SVG root");
  }
  cleanChildren(root);
  prefixIds(root, options.idPrefix);
  prepareRoot(root);
  applyThemeColors(root);
  return new XMLSerializer().serializeToString(root);
}
function cleanChildren(parent) {
  for (const node of [...parent.childNodes]) {
    if (node.nodeType !== 1) {
      if (node.nodeType === 8 || node.nodeType === 7) node.remove();
      continue;
    }
    const element = node;
    if (!ALLOWED_ELEMENTS.has(element.localName)) {
      element.remove();
      continue;
    }
    cleanAttributes(element);
    cleanChildren(element);
  }
}
function cleanAttributes(element) {
  for (const attribute of [...element.attributes]) {
    const name = attribute.name.toLowerCase();
    const value = attribute.value;
    if (name.startsWith("on")) {
      element.removeAttribute(attribute.name);
      continue;
    }
    if (name === "style" && isUnsafeStyle(value)) {
      element.removeAttribute(attribute.name);
      continue;
    }
    if (name === "href" || name === "src" || name.endsWith(":href")) {
      if (!isSafeUrl(value)) element.removeAttribute(attribute.name);
    }
  }
  if (element.localName === "a") {
    element.setAttribute("rel", "noopener noreferrer");
  }
}
function isUnsafeStyle(style) {
  return /expression\s*\(|javascript\s*:|vbscript\s*:|behavior\s*:|@import|url\s*\(\s*['"]?\s*(?:javascript|vbscript|file|data)\s*:/i.test(
    style
  );
}
function isSafeUrl(url) {
  const compact = url.replace(/[\u0000-\u0020]/g, "").toLowerCase();
  if (/^(?:javascript|vbscript|file|about):/.test(compact)) return false;
  if (compact.startsWith("data:")) {
    return /^data:image\/(?:png|jpe?g|gif|webp|svg\+xml)[;,]/i.test(compact);
  }
  return true;
}
function prefixIds(root, prefix) {
  const elements = [root, ...root.querySelectorAll("*")];
  const renamed = /* @__PURE__ */ new Map();
  for (const element of elements) {
    const id = element.getAttribute("id");
    if (id === null || id === "") continue;
    const next = `${prefix}${id}`;
    renamed.set(id, next);
    element.setAttribute("id", next);
  }
  if (renamed.size === 0) return;
  for (const element of elements) {
    for (const attribute of [...element.attributes]) {
      const rewritten = rewriteReferences(attribute.value, renamed);
      if (rewritten !== attribute.value) element.setAttribute(attribute.name, rewritten);
    }
  }
}
function rewriteReferences(value, renamed) {
  const withUrls = value.replace(/url\(\s*(['"]?)#([^'")\s]+)\1\s*\)/g, (match, quote, id) => {
    const next = renamed.get(id);
    return next === void 0 ? match : `url(${quote}#${next}${quote})`;
  });
  if (withUrls.startsWith("#") && renamed.has(withUrls.slice(1))) {
    return `#${renamed.get(withUrls.slice(1))}`;
  }
  return withUrls;
}
function prepareRoot(root) {
  const width = root.getAttribute("width");
  const height = root.getAttribute("height");
  if (root.getAttribute("viewBox") === null && width !== null && height !== null) {
    const w = Number.parseFloat(width);
    const h = Number.parseFloat(height);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      root.setAttribute("viewBox", `0 0 ${w} ${h}`);
    }
  }
  root.removeAttribute("width");
  root.removeAttribute("height");
  root.setAttribute("preserveAspectRatio", "xMidYMid meet");
  root.setAttribute("role", "img");
  root.setAttribute("class", mergeClass(root.getAttribute("class"), "dsh-gv-svg"));
}
function mergeClass(current, name) {
  if (current === null || current.trim() === "") return name;
  return current.includes(name) ? current : `${current} ${name}`;
}
function applyThemeColors(root) {
  for (const element of [root, ...root.querySelectorAll("*")]) {
    if (element.localName === "text" || element.localName === "tspan" || element.localName === "textPath") {
      const fill = element.getAttribute("fill");
      if (fill !== null && !isBlack(fill)) continue;
      const background = nearestFill(element);
      const onLight = background !== null && luminance(background) > 0.6;
      setStyle(element, "fill", onLight ? "#111827" : "var(--dsw-alias-label-primary, #111827)");
      continue;
    }
    if (isBlack(element.getAttribute("fill"))) {
      setStyle(element, "fill", "var(--dsw-alias-label-primary, #111827)");
    }
    if (isBlack(element.getAttribute("stroke"))) {
      setStyle(element, "stroke", "var(--dsw-alias-label-primary, #111827)");
    }
  }
}
function nearestFill(element) {
  let current = element.parentElement;
  while (current !== null) {
    const fill = current.getAttribute("fill");
    if (fill !== null && fill.trim() !== "" && fill.toLowerCase() !== "none" && fill.toLowerCase() !== "transparent") {
      return normalizeColor(fill);
    }
    current = current.parentElement;
  }
  return null;
}
function isBlack(value) {
  if (value === null) return false;
  const normalized = normalizeColor(value);
  return normalized === "#000000" || normalized === "#111827";
}
function normalizeColor(value) {
  const text = value.trim().toLowerCase();
  if (NAMED_COLORS[text] !== void 0) return NAMED_COLORS[text];
  if (text.startsWith("#")) {
    if (/^#[0-9a-f]{3}$/.test(text)) {
      const [r, g, b] = [text[1], text[2], text[3]];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    if (/^#[0-9a-f]{6}$/.test(text)) return text;
    return text;
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(text);
  if (rgb !== null) {
    const [, r = "0", g = "0", b = "0"] = rgb;
    return `#${Number(r).toString(16).padStart(2, "0")}${Number(g).toString(16).padStart(2, "0")}${Number(b).toString(16).padStart(2, "0")}`;
  }
  return text;
}
function luminance(color) {
  if (!/^#[0-9a-f]{6}$/.test(color)) return 0;
  const r = Number.parseInt(color.slice(1, 3), 16);
  const g = Number.parseInt(color.slice(3, 5), 16);
  const b = Number.parseInt(color.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function setStyle(element, property, value) {
  const existing = element.getAttribute("style") ?? "";
  const without = existing.split(";").filter((part) => part.trim() !== "" && !new RegExp(`^\\s*${property}\\s*:`, "i").test(part)).map((part) => part.trim());
  without.push(`${property}:${value}`);
  element.setAttribute("style", `${without.join(";")};`);
}

// src/client/editor/MonacoEditor.tsx
var import_react = require("react");

// src/client/theme.ts
function detectTheme() {
  if (typeof document === "undefined") return "light";
  if (document.body?.hasAttribute("data-ds-dark-theme")) return "dark";
  const bodyTheme = document.body?.getAttribute("data-theme");
  if (bodyTheme === "dark") return "dark";
  if (document.documentElement.classList.contains("dark")) return "dark";
  const scheme = getComputedStyle(document.body).getPropertyValue("color-scheme").trim();
  return scheme === "dark" ? "dark" : "light";
}
function watchTheme(onChange) {
  const observer = new MutationObserver(() => onChange(detectTheme()));
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "data-ds-dark-theme", "style"]
  });
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "data-ds-dark-theme", "style"]
  });
  return () => observer.disconnect();
}

// src/client/editor/monaco.ts
var MONACO_VERSION = "0.52.2";
var MONACO_BASE = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs`;
var MONACO_TIMEOUT_MS = 15e3;
var loading;
var failedAt;
var dotRegistered = false;
var MONACO_FAILURE_COOLDOWN_MS = 6e4;
function existingMonaco() {
  const scope = window;
  return scope.monaco !== void 0 && typeof scope.monaco.editor?.create === "function" ? scope.monaco : void 0;
}
function loadMonaco() {
  const existing = existingMonaco();
  if (existing !== void 0) {
    registerDotLanguage(existing);
    return Promise.resolve(existing);
  }
  if (loading !== void 0) return loading;
  if (failedAt !== void 0 && Date.now() - failedAt < MONACO_FAILURE_COOLDOWN_MS) {
    return Promise.reject(new Error("Monaco is unavailable after a recent load failure"));
  }
  loading = new Promise((resolve, reject) => {
    const scope = window;
    const settle = (error, value) => {
      window.clearTimeout(timer);
      if (error !== void 0 || value === void 0) {
        loading = void 0;
        failedAt = Date.now();
        reject(error ?? new Error("Monaco loaded without an API"));
        return;
      }
      failedAt = void 0;
      resolve(value);
    };
    const start = () => {
      const amd = scope.require;
      if (amd === void 0) {
        settle(new Error("Monaco AMD loader is unavailable"));
        return;
      }
      amd.config({ paths: { vs: MONACO_BASE } });
      amd(
        ["vs/editor/editor.main"],
        (...values) => {
          const monaco = values[0] ?? existingMonaco();
          if (monaco === void 0 || typeof monaco.editor?.create !== "function") {
            settle(new Error("Monaco loaded without an editor API"));
            return;
          }
          try {
            registerDotLanguage(monaco);
          } catch (error) {
            settle(new Error(`Monaco DOT language registration failed: ${describe(error)}`));
            return;
          }
          settle(void 0, monaco);
        },
        (error) => settle(new Error(`Monaco editor failed: ${describe(error)}`))
      );
    };
    const timer = window.setTimeout(
      () => settle(new Error("Monaco load timed out")),
      MONACO_TIMEOUT_MS
    );
    if (scope.require !== void 0) {
      start();
      return;
    }
    const script = document.createElement("script");
    script.src = `${MONACO_BASE}/loader.js`;
    script.async = true;
    script.onload = start;
    script.onerror = () => settle(new Error("Monaco loader script failed"));
    document.head.appendChild(script);
  });
  return loading;
}
function describe(error) {
  return error instanceof Error ? error.message : String(error);
}
function registerDotLanguage(monaco) {
  if (dotRegistered) return;
  dotRegistered = true;
  monaco.languages.register({ id: "dot" });
  monaco.languages.setMonarchTokensProvider("dot", DOT_LANGUAGE);
  monaco.languages.registerCompletionItemProvider("dot", {
    triggerCharacters: [" ", "=", "[", "\n"],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };
      const snippet = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
      const kinds = monaco.languages.CompletionItemKind;
      const item = (label, insertText, kind, detail) => ({
        label,
        kind,
        insertText,
        insertTextRules: snippet,
        range,
        ...detail === void 0 ? {} : { detail }
      });
      return {
        suggestions: [
          item("digraph", "digraph {\n  $0\n}", kinds.Keyword, "Directed graph"),
          item("graph", "graph {\n  $0\n}", kinds.Keyword, "Undirected graph"),
          item(
            "subgraph",
            'subgraph cluster_${1:name} {\n  label="${2:title}";\n  $0\n}',
            kinds.Keyword,
            "Subgraph"
          ),
          item("label", 'label="${1:text}"', kinds.Property),
          item(
            "shape",
            "shape=${1|box,ellipse,circle,doublecircle,plaintext,cylinder,note,record|}",
            kinds.Property
          ),
          item("style", "style=${1|filled,rounded,dashed,dotted,solid,bold|}", kinds.Property),
          item("color", 'color="${1:#000}"', kinds.Property),
          item("fillcolor", 'fillcolor="${1:#fff}"', kinds.Property),
          item("href", 'href="${1:https://}"', kinds.Property),
          item("target", 'target="${1:_blank}"', kinds.Property),
          item("tooltip", 'tooltip="${1:text}"', kinds.Property),
          item("rankdir", "rankdir=${1|TB,LR,BT,RL|}", kinds.Property),
          item("fontsize", "fontsize=${1:12}", kinds.Property),
          item("penwidth", "penwidth=${1:1}", kinds.Property),
          item("dir", "dir=${1|forward,back,both,none|}", kinds.Property),
          item("arrowhead", "arrowhead=${1|normal,dot,vee,none,empty,box|}", kinds.Property),
          ...["box", "ellipse", "circle", "cylinder", "note", "doublecircle", "filled", "rounded", "dashed", "dotted"].map(
            (label) => ({
              label,
              kind: kinds.Reference,
              insertText: label,
              range
            })
          )
        ]
      };
    }
  });
}
var DOT_LANGUAGE = {
  defaultToken: "",
  tokenPostfix: ".dot",
  keywords: ["digraph", "graph", "subgraph", "strict", "node", "edge"],
  brackets: [
    { open: "{", close: "}", token: "delimiter.curly" },
    { open: "[", close: "]", token: "delimiter.square" },
    { open: "(", close: ")", token: "delimiter.parenthesis" }
  ],
  tokenizer: {
    root: [
      [/\/\/.*$/, "comment"],
      [/\/\*/, "comment", "@comment"],
      [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],
      [/<[^>]*>/, "tag"],
      [
        /\b(label|shape|color|style|fillcolor|fontcolor|fontsize|fontname|href|target|tooltip|rankdir|rank|dir|arrowhead|arrowtail|arrowsize|penwidth|width|height|fixedsize|margin|bgcolor|border|dashed|dotted|solid|bold|filled|rounded|diagonals|plaintext|compound|constraint|headlabel|taillabel|id|class|peripheries|weight|minlen|image|URL)\b/i,
        "attribute"
      ],
      [/\b(digraph|graph|subgraph|strict|node|edge)\b/i, { cases: { "@keywords": "keyword" } }],
      [/\d+(?:\.\d+)?/, "number"],
      [/->|--/, "operator"],
      [/[=;:]/, "delimiter"],
      [/[a-zA-Z_]\w*/, "identifier"]
    ],
    comment: [
      [/[^*/]+/, "comment"],
      [/\*\//, "comment", "@pop"],
      [/[*/]/, "comment"]
    ],
    string: [
      [/[^"\\]+/, "string"],
      [/\\[\\"]/, "string"],
      [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }]
    ]
  }
};

// src/client/editor/MonacoEditor.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function MonacoEditor({ value, onChange, ariaLabel, t }) {
  const hostRef = (0, import_react.useRef)(null);
  const editorRef = (0, import_react.useRef)(null);
  const applyingRef = (0, import_react.useRef)(false);
  const onChangeRef = (0, import_react.useRef)(onChange);
  onChangeRef.current = onChange;
  const [ready, setReady] = (0, import_react.useState)(false);
  const [fallback, setFallback] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    let disposed = false;
    let stopTheme;
    loadMonaco().then((monaco) => {
      if (disposed) return;
      const host = hostRef.current;
      if (host === null) return;
      const editor = monaco.editor.create(host, {
        value,
        language: "dot",
        theme: detectTheme() === "dark" ? "vs-dark" : "vs",
        fontSize: 13,
        fontFamily: "'Fira Code','Cascadia Code','SF Mono',monospace",
        lineNumbers: "on",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        tabSize: 2,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        bracketPairColorization: { enabled: true },
        padding: { top: 10 },
        ariaLabel
      });
      editorRef.current = editor;
      editor.onDidChangeModelContent(() => {
        if (!applyingRef.current) onChangeRef.current(editor.getValue());
      });
      stopTheme = watchTheme((mode) => monaco.editor.setTheme(mode === "dark" ? "vs-dark" : "vs"));
      setReady(true);
    }).catch(() => {
      if (!disposed) setFallback(true);
    });
    return () => {
      disposed = true;
      stopTheme?.();
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);
  (0, import_react.useEffect)(() => {
    const editor = editorRef.current;
    if (editor === null || editor.getValue() === value) return;
    applyingRef.current = true;
    editor.setValue(value);
    applyingRef.current = false;
  }, [value]);
  if (fallback) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gv-editor dsh-gv-editor-fallback", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gv-editor-notice", role: "status", children: translate(t, "editor.fallback") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "textarea",
        {
          className: "dsh-gv-textarea",
          "aria-label": ariaLabel,
          spellCheck: false,
          value,
          onChange: (event) => onChange(event.currentTarget.value),
          onKeyDown: insertSpaces
        }
      )
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-gv-editor", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: hostRef, className: "dsh-gv-monaco", "aria-label": ariaLabel }),
    ready ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-gv-editor-notice", children: translate(t, "editor.loading") })
  ] });
}
function insertSpaces(event) {
  if (event.key !== "Tab") return;
  event.preventDefault();
  const target = event.currentTarget;
  const start = target.selectionStart;
  const end = target.selectionEnd;
  const text = `${target.value.slice(0, start)}  ${target.value.slice(end)}`;
  target.value = text;
  target.selectionStart = start + 2;
  target.selectionEnd = start + 2;
  target.dispatchEvent(new Event("input", { bubbles: true }));
}

// src/client/fence/GraphvizFence.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var RENDER_DEBOUNCE_MS = 250;
var DEFAULT_TB_HEIGHT = 250;
var DEFAULT_LR_PERCENT = 45;
var MIN_PANE_PX = 80;
var MIN_LR_PERCENT = 20;
var MAX_LR_PERCENT = 70;
var instanceSeq = 0;
function nextIdPrefix() {
  instanceSeq += 1;
  return `gv${instanceSeq}-`;
}
function GraphvizFence(props) {
  return props.streaming === true ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: props.children }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(GraphvizPanel, { props });
}
function GraphvizPanel({ props }) {
  const { code, t } = props;
  const [source, setSource] = (0, import_react2.useState)(code);
  const [layout, setLayout] = (0, import_react2.useState)("tb");
  const [split, setSplit] = (0, import_react2.useState)(null);
  const [state, setState] = (0, import_react2.useState)(code.trim() === "" ? { kind: "idle" } : { kind: "loading", engineReady: false });
  const [retryToken, setRetryToken] = (0, import_react2.useState)(0);
  const [idPrefix] = (0, import_react2.useState)(nextIdPrefix);
  const containerRef = (0, import_react2.useRef)(null);
  const text = (key) => translate(t, key);
  (0, import_react2.useEffect)(() => {
    setSource(code);
  }, [code]);
  (0, import_react2.useEffect)(() => {
    const input = source;
    if (input.trim() === "") {
      setState({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setState({ kind: "loading", engineReady: false });
    const timer = window.setTimeout(() => {
      loadEngine().then((chunk) => {
        if (cancelled) return void 0;
        setState({ kind: "loading", engineReady: true });
        return chunk.renderSvg(input);
      }).then((raw) => {
        if (cancelled || raw === void 0) return;
        setState({ kind: "ready", svg: sanitizeSvg(raw, { idPrefix }) });
      }).catch((error) => {
        if (cancelled) return;
        setState({ kind: "error", message: error instanceof Error ? error.message : String(error) });
      });
    }, RENDER_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, retryToken, idPrefix]);
  const showEditor = layout !== "graph";
  const clamp = (value) => {
    if (layout === "lr") return Math.min(MAX_LR_PERCENT, Math.max(MIN_LR_PERCENT, value));
    const height = containerRef.current?.getBoundingClientRect().height ?? 500;
    return Math.min(height - MIN_PANE_PX, Math.max(MIN_PANE_PX, value));
  };
  const beginResize = (event) => {
    event.preventDefault();
    const handle = event.currentTarget;
    const container = containerRef.current;
    if (container === null) return;
    try {
      handle.setPointerCapture(event.pointerId);
    } catch {
    }
    const move = (moveEvent) => {
      const rect = container.getBoundingClientRect();
      if (layout === "lr") {
        setSplit(Math.round((moveEvent.clientX - rect.left) / rect.width * 100));
      } else {
        setSplit(clamp(moveEvent.clientY - rect.top));
      }
    };
    const stop = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", stop);
      handle.removeEventListener("pointercancel", stop);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  };
  const resizeKey = (event) => {
    const horizontal = layout === "lr";
    const current = split ?? (horizontal ? DEFAULT_LR_PERCENT : DEFAULT_TB_HEIGHT);
    const step = event.shiftKey ? 10 : 2;
    let next;
    if (horizontal && event.key === "ArrowLeft") next = current - step;
    else if (horizontal && event.key === "ArrowRight") next = current + step;
    else if (!horizontal && event.key === "ArrowUp") next = current - step * 5;
    else if (!horizontal && event.key === "ArrowDown") next = current + step * 5;
    else if (event.key === "Home") next = horizontal ? MIN_LR_PERCENT : MIN_PANE_PX;
    else if (event.key === "End") next = horizontal ? MAX_LR_PERCENT : 1e3;
    if (next === void 0) return;
    event.preventDefault();
    setSplit(clamp(next));
  };
  const editorStyle = () => {
    if (layout === "lr") return { flexBasis: `${split ?? DEFAULT_LR_PERCENT}%` };
    return { height: `${split ?? DEFAULT_TB_HEIGHT}px` };
  };
  const pane = (() => {
    switch (state.kind) {
      case "loading":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-gv-status", "aria-live": "polite", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsh-gv-spinner", "aria-hidden": "true" }),
          text(state.engineReady ? "status.rendering" : "status.engine")
        ] });
      case "error":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-gv-error", role: "alert", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-gv-error-title", children: text("error.title") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-gv-error-body", children: state.message }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              type: "button",
              className: "dsh-gv-button",
              onClick: () => setRetryToken((value) => value + 1),
              children: text("error.retry")
            }
          )
        ] });
      case "ready":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-gv-canvas", "aria-label": text("graph.aria"), dangerouslySetInnerHTML: { __html: state.svg } });
      case "idle":
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-gv-empty", children: text("empty") });
    }
  })();
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "div",
    {
      ref: containerRef,
      className: "dsh-gv",
      "data-layout": layout,
      "data-testid": "dsh-gv",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-gv-toolbar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsh-gv-brand", children: text("toolbar.label") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsh-gv-spacer" }),
          ["tb", "lr", "graph"].map((mode) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              type: "button",
              className: "dsh-gv-button",
              "data-active": layout === mode,
              "aria-pressed": layout === mode,
              onClick: () => {
                setLayout(mode);
                setSplit(null);
              },
              children: text(`toolbar.${mode}`)
            },
            mode
          ))
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-gv-body", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "div",
            {
              className: "dsh-gv-editor-pane",
              style: showEditor ? editorStyle() : { display: "none" },
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                MonacoEditor,
                {
                  value: source,
                  onChange: setSource,
                  ariaLabel: text("editor.aria"),
                  t
                }
              )
            }
          ),
          showEditor ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "div",
            {
              className: "dsh-gv-splitter",
              role: "separator",
              tabIndex: 0,
              "aria-orientation": layout === "lr" ? "vertical" : "horizontal",
              "aria-label": text("splitter.label"),
              onPointerDown: beginResize,
              onKeyDown: resizeKey
            }
          ) : null,
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-gv-graph", children: pane })
        ] })
      ]
    }
  );
}

// src/client/index.tsx
var inject = ["slots", "locale"];
function installStyles(css) {
  const style = document.createElement("style");
  style.dataset.plugin = PACKAGE_ID;
  style.textContent = css;
  document.head.appendChild(style);
  return () => style.remove();
}
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(LOCALE_NS, dictionaries), "dsh-graphviz: dictionaries");
  ctx.effect(() => installStyles(styles_default), "dsh-graphviz: styles");
  for (const key of FENCE_KEYS) {
    ctx.slots.inject(
      FENCE_SLOT,
      () => ctx.slots.register(
        { name: FENCE_SLOT, key, id: `${PACKAGE_ID}/fence/${key}`, locale: LOCALE_NS },
        GraphvizFence
      )
    );
  }
}

return module.exports;}});
