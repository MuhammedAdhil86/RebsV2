import React, { useState, useEffect, useRef } from "react";
import {
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Type,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "react-toastify";

/* ================= CONSTANTS ================= */

// The canvas is laid out at this width and scaled down to fit its card,
// so saved positions are always in these pixels.
const CANVAS_WIDTH = 600;
const NEW_TEXT = "__TEXT__";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // size of the file you pick
// The backend rejects header/footer HTML over 200 KB, and uploaded images are
// embedded in that HTML. So every upload is shrunk to fit this budget.
const MAX_HTML_BYTES = 200 * 1000;
const IMAGE_BUDGET = 80 * 1000; // max size of one embedded image

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image"));
    };
    img.src = url;
  });

// Scales the image down (and re-encodes it) until it fits IMAGE_BUDGET.
// PNG / WebP / SVG / GIF stay PNG so transparent logos keep their transparency.
const compressImage = async (file) => {
  const img = await loadImage(file);
  const sw = img.naturalWidth || 300;
  const sh = img.naturalHeight || 100;
  const keepAlpha = /png|webp|svg|gif/.test(file.type);
  let max = 480;

  for (;;) {
    const ratio = Math.min(1, max / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * ratio));
    const h = Math.max(1, Math.round(sh * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!keepAlpha) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    const out = keepAlpha
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", 0.85);
    if (out.length <= IMAGE_BUDGET || max <= 80) return out;
    max = Math.round(max * 0.75);
  }
};

// System fonts only: they render the same in email, PDF and the browser.
const FONT_OPTIONS = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Trebuchet MS", value: "Trebuchet MS, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "Times New Roman, serif" },
  { label: "Courier New", value: "Courier New, monospace" },
];

const isLogoKey = (key) => key.toLowerCase().includes("logo");
const tokenOf = (key) => `{{.${key}}}`;

/* ================= SAMPLE IMAGE (editor only) ================= */

const SAMPLE_LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" rx="6" fill="#111827"/><text x="60" y="25" font-size="14" fill="#fff" text-anchor="middle" font-family="Arial">LOGO</text></svg>`,
  );
// Placeholder images ({{.SenderLogoURL}}) show a sample while editing.
const displaySrc = (src) => (src.includes("{{") ? SAMPLE_LOGO : src);

/* ================= ELEMENTS =================
 *  text : { id, type, text, x, y, w, fontSize, color, bold, italic,
 *           underline, align, fontFamily }
 *  image: { id, type, src, x, y, w, h, fit }
 */

const makeElement = (token, id, src) => {
  if (src) {
    return {
      id,
      type: "image",
      src,
      x: 20,
      y: 10,
      w: 150,
      h: 60,
      fit: "contain",
    };
  }
  if (token !== NEW_TEXT && isLogoKey(token)) {
    return {
      id,
      type: "image",
      src: token,
      x: 20,
      y: 10,
      w: 150,
      h: 52,
      fit: "contain",
    };
  }
  return {
    id,
    type: "text",
    text: token === NEW_TEXT ? "New text" : token,
    x: 20,
    y: 20,
    w: 300,
    fontSize: 16,
    color: "#000000",
    bold: false,
    italic: false,
    underline: false,
    align: "left",
    fontFamily: FONT_OPTIONS[0].value,
  };
};

const textInnerStyle = (el) => ({
  fontSize: `${el.fontSize}px`,
  color: el.color,
  fontWeight: el.bold ? "bold" : "normal",
  fontStyle: el.italic ? "italic" : "normal",
  textDecoration: el.underline ? "underline" : "none",
  textAlign: el.align,
  fontFamily: el.fontFamily,
  lineHeight: "1.4",
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
});
const textStyle = (el) => ({
  position: "absolute",
  left: `${el.x}px`,
  top: `${el.y}px`,
  width: `${el.w}px`,
  ...textInnerStyle(el),
});
const imageInnerStyle = (el) => ({ objectFit: el.fit, display: "block" });
const imageStyle = (el) => ({
  position: "absolute",
  left: `${el.x}px`,
  top: `${el.y}px`,
  width: `${el.w}px`,
  height: `${el.h}px`,
  ...imageInnerStyle(el),
});

const toCss = (obj) =>
  Object.entries(obj)
    .map(
      ([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}:${v}`,
    )
    .join(";");
const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Elements -> the HTML that is saved (header_html / footer_html).
// Empty canvas -> "" so the "required" check still works.
const elementsToHtml = (list, height) => {
  if (!list.length) return "";
  const inner = list
    .map((el) =>
      el.type === "image"
        ? `<img data-el="image" src="${el.src}" style="${toCss(imageStyle(el))}">`
        : `<div data-el="text" style="${toCss(textStyle(el))}">${escapeHtml(el.text)}</div>`,
    )
    .join("");
  return `<div data-layout-canvas="1" style="position:relative;width:${CANVAS_WIDTH}px;height:${height}px;margin:0 auto;overflow:hidden">${inner}</div>`;
};

/* ---- saved HTML -> elements ---- */

const px = (v, fb) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fb;
};
const toHex = (c) => {
  if (!c) return "#000000";
  if (c.startsWith("#"))
    return c.length === 4
      ? "#" + [...c.slice(1)].map((x) => x + x).join("")
      : c;
  const m = c.match(/\d+/g);
  if (!m || m.length < 3) return "#000000";
  return (
    "#" +
    m
      .slice(0, 3)
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join("")
  );
};
const parseImage = (node, id) => {
  const s = node.style;
  return {
    id,
    type: "image",
    src: node.getAttribute("src") || "",
    x: px(s.left, 20),
    y: px(s.top, 10),
    w: px(s.width, 150),
    h: px(s.height, 52),
    fit: s.objectFit === "cover" ? "cover" : "contain",
  };
};
const parseText = (node, id) => {
  const s = node.style;
  const family = (s.fontFamily || "").toLowerCase();
  const font =
    FONT_OPTIONS.find((o) => family.includes(o.label.toLowerCase())) ||
    FONT_OPTIONS[0];
  return {
    id,
    type: "text",
    text: node.textContent || "",
    x: px(s.left, 20),
    y: px(s.top, 20),
    w: px(s.width, 300),
    fontSize: px(s.fontSize, 16),
    color: toHex(s.color),
    bold: s.fontWeight === "bold" || px(s.fontWeight, 400) >= 600,
    italic: s.fontStyle === "italic",
    underline: (s.textDecoration || "").includes("underline"),
    align: s.textAlign || "left",
    fontFamily: font.value,
  };
};

// HTML saved by this canvas comes back exactly. Old HTML (from the Quill
// editor) is converted: images are kept and all text becomes one text box.
const parseTemplate = (html, newId) => {
  if (!html || !html.trim()) return { elements: [], height: null };
  const doc = new DOMParser().parseFromString(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|h[1-6]|div|li)>/gi, "$&\n"),
    "text/html",
  );

  const wrapper = doc.body.querySelector("[data-layout-canvas]");
  if (wrapper) {
    return {
      height: px(wrapper.style.height, null),
      elements: [...wrapper.querySelectorAll("[data-el]")].map((n) =>
        n.dataset.el === "image"
          ? parseImage(n, newId())
          : parseText(n, newId()),
      ),
    };
  }

  const images = [...doc.body.querySelectorAll("img")];
  const elements = images.map((img, i) => ({
    ...parseImage(img, newId()),
    y: 10 + i * 4,
  }));
  images.forEach((img) => img.remove());
  const text = (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  if (text) elements.push({ ...makeElement(NEW_TEXT, newId()), text, x: 200 });
  return { elements, height: null };
};

/* ================= SMALL UI ================= */

const NumField = ({ label, value, onChange, min }) => (
  <label className="flex items-center gap-1">
    <span className="text-gray-500">{label}</span>
    <input
      type="number"
      value={Math.round(value)}
      min={min}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-14 border border-gray-200 rounded px-1 py-0.5 bg-white"
    />
  </label>
);

const ToggleButton = ({ active, onClick, label, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`p-1.5 rounded border transition-colors cursor-pointer ${
      active
        ? "bg-black text-white border-black"
        : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
    }`}
  >
    {children}
  </button>
);

/**
 * LayoutCanvas - one drag-and-drop canvas (used for the header and the footer).
 *
 * Props:
 *  - label          heading above the canvas
 *  - value          saved HTML (read once, when the canvas mounts)
 *  - onChange(html) called with the new HTML after every edit
 *  - placeholders   keys like ["SenderLogoURL"] shown as draggable chips
 *  - defaultHeight  canvas height in px when nothing is saved yet
 *  - fixedHeight    when set, the height is controlled from outside (letters
 *                   derive it from header_height_mm / footer_height_mm)
 *  - disabled       lock editing while saving
 */
const LayoutCanvas = ({
  label,
  value,
  onChange,
  placeholders = [],
  defaultHeight = 120,
  fixedHeight,
  disabled = false,
}) => {
  const idRef = useRef(1);
  const newId = () => `el${idRef.current++}`;

  const parsedRef = useRef(null);
  if (parsedRef.current === null)
    parsedRef.current = parseTemplate(value, newId);

  const [elements, setElements] = useState(parsedRef.current.elements);
  const [ownHeight, setOwnHeight] = useState(
    parsedRef.current.height || defaultHeight,
  );
  const height = fixedHeight ?? ownHeight;

  const [selectedId, setSelectedId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const boxRef = useRef(null);
  const textInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const selected = elements.find((el) => el.id === selectedId) || null;
  const htmlSize = elementsToHtml(elements, height).length;
  const overLimit = htmlSize > MAX_HTML_BYTES;

  // ----- scale to the card width -----
  const [boxWidth, setBoxWidth] = useState(0);
  const scale = boxWidth ? Math.min(1, boxWidth / CANVAS_WIDTH) : 1;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  useEffect(() => {
    if (typeof ResizeObserver === "undefined" || !boxRef.current)
      return undefined;
    const ro = new ResizeObserver(([e]) => setBoxWidth(e.contentRect.width));
    ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, []);

  // ----- tell the parent about every edit (not on first mount) -----
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    onChangeRef.current?.(elementsToHtml(elements, height));
  }, [elements, height]);

  /* ---------- canvas actions ---------- */

  const updateEl = (id, patch) =>
    setElements((list) =>
      list.map((el) => (el.id === id ? { ...el, ...patch } : el)),
    );

  const addItem = (token, x, y, src) => {
    if (disabled) return;
    const base = makeElement(token, newId(), src);
    const el = { ...base, x: x ?? base.x, y: y ?? base.y };
    setElements((list) => [...list, el]);
    setSelectedId(el.id);
  };

  const removeSelected = () => {
    if (!selected) return;
    setElements((list) => list.filter((el) => el.id !== selected.id));
    setSelectedId(null);
  };

  const centerSelected = () => {
    if (!selected) return;
    updateEl(selected.id, { x: Math.round((CANVAS_WIDTH - selected.w) / 2) });
  };

  const readImageFile = async (file, x, y) => {
    if (!file?.type?.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Image is too large (max 5 MB).");
      return;
    }
    try {
      const src = await compressImage(file);
      addItem(NEW_TEXT, x, y, src);
    } catch (err) {
      toast.error(err?.message || "Could not process this image");
    }
  };

  const allowed = new Set([NEW_TEXT, ...placeholders.map(tokenOf)]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.round((e.clientX - rect.left) / scaleRef.current - 10),
    );
    const y = Math.max(
      0,
      Math.round((e.clientY - rect.top) / scaleRef.current - 10),
    );

    const file = e.dataTransfer.files?.[0];
    if (file) return readImageFile(file, x, y);

    const token = e.dataTransfer.getData("text/plain");
    if (allowed.has(token)) addItem(token, x, y);
  };

  // move / resize (drag state lives in a ref; listeners stay attached)
  const dragRef = useRef(null);
  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = (e.clientX - d.startX) / scaleRef.current;
      const dy = (e.clientY - d.startY) / scaleRef.current;
      if (d.mode === "move") {
        updateEl(d.id, {
          x: Math.max(0, Math.round(d.ox + dx)),
          y: Math.max(0, Math.round(d.oy + dy)),
        });
      } else if (d.type === "text") {
        updateEl(d.id, { w: Math.max(40, Math.round(d.ow + dx)) });
      } else {
        updateEl(d.id, {
          w: Math.max(16, Math.round(d.ow + dx)),
          h: Math.max(16, Math.round(d.oh + dy)),
        });
      }
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const startDrag = (e, el, mode) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(el.id);
    wrapRef.current?.focus();
    dragRef.current = {
      id: el.id,
      mode,
      type: el.type,
      startX: e.clientX,
      startY: e.clientY,
      ox: el.x,
      oy: el.y,
      ow: el.w,
      oh: el.h,
    };
  };

  const handleKeyDown = (e) => {
    if (!selected || disabled) return;
    const step = e.shiftKey ? 10 : 1;
    const moves = {
      ArrowLeft: { x: selected.x - step },
      ArrowRight: { x: selected.x + step },
      ArrowUp: { y: selected.y - step },
      ArrowDown: { y: selected.y + step },
    };
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      removeSelected();
    } else if (moves[e.key]) {
      e.preventDefault();
      const p = moves[e.key];
      updateEl(selected.id, {
        ...(p.x !== undefined && { x: Math.max(0, p.x) }),
        ...(p.y !== undefined && { y: Math.max(0, p.y) }),
      });
    }
  };

  const chipDrag = (token) => (e) => {
    e.dataTransfer.setData("text/plain", token);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="space-y-3 text-[12px]">
      <div className="flex items-center justify-between">
        <label className="block text-[12px] font-medium text-gray-600">
          {label}
        </label>
        {fixedHeight === undefined && (
          <NumField
            label="Height (px)"
            min={40}
            value={ownHeight}
            onChange={(v) => setOwnHeight(Math.max(40, v))}
          />
        )}
      </div>

      {/* Items */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          draggable={!disabled}
          onDragStart={chipDrag(NEW_TEXT)}
          onClick={() => addItem(NEW_TEXT)}
          disabled={disabled}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-black text-white text-[11px] cursor-grab active:cursor-grabbing disabled:opacity-50"
        >
          <Type size={12} /> Text box
        </button>
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center gap-1 px-2 py-1 rounded-md border border-gray-300 bg-white text-[11px] text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
        >
          <ImageIcon size={12} /> Upload image
        </button>
        {placeholders.map((key) => (
          <button
            key={key}
            type="button"
            draggable={!disabled}
            onDragStart={chipDrag(tokenOf(key))}
            onClick={() => addItem(tokenOf(key))}
            disabled={disabled}
            className="px-2 py-1 rounded-md border border-gray-200 bg-white text-[11px] font-mono text-gray-700 cursor-grab active:cursor-grabbing hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50"
          >
            {tokenOf(key)}
            {isLogoKey(key) && (
              <span className="ml-1.5 text-[9px] font-sans font-semibold uppercase px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Logo
              </span>
            )}
          </button>
        ))}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            readImageFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {/* Canvas */}
      <div ref={boxRef} className="w-full">
        <div
          className="mx-auto"
          style={{ width: CANVAS_WIDTH * scale, height: height * scale }}
        >
          <div
            ref={wrapRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="outline-none"
            style={{
              width: CANVAS_WIDTH,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div
              ref={canvasRef}
              onPointerDown={() => setSelectedId(null)}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`relative bg-white select-none overflow-hidden border ${
                isDragOver
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-300"
              }`}
              style={{ width: CANVAS_WIDTH, height, touchAction: "none" }}
            >
              {elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-[15px] text-gray-300 pointer-events-none">
                  Drag items here
                </div>
              )}

              {elements.map((el) => {
                const isSelected = el.id === selectedId;
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => startDrag(e, el, "move")}
                    onDoubleClick={() => {
                      if (el.type === "text")
                        setTimeout(() => textInputRef.current?.focus(), 0);
                    }}
                    style={{
                      position: "absolute",
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.w}px`,
                      ...(el.type === "image" && { height: `${el.h}px` }),
                      cursor: "move",
                      outline: isSelected
                        ? "2px solid #2563eb"
                        : "1px dashed #d1d5db",
                      outlineOffset: "2px",
                    }}
                  >
                    {el.type === "image" ? (
                      <img
                        src={displaySrc(el.src)}
                        alt=""
                        draggable={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          ...imageInnerStyle(el),
                        }}
                      />
                    ) : (
                      <div style={textInnerStyle(el)}>
                        {el.text || "\u00a0"}
                      </div>
                    )}

                    {isSelected && (
                      <span
                        onPointerDown={(e) => startDrag(e, el, "resize")}
                        className="absolute bg-blue-600 border border-white rounded-sm"
                        style={{
                          width: 12,
                          height: 12,
                          right: -8,
                          bottom: -8,
                          cursor: "nwse-resize",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-gray-400">
        Drag to move, blue corner to resize, arrow keys nudge (Shift = 10px),
        Delete removes. Double-click a text box to edit it.{" "}
        <span className={overLimit ? "text-red-500 font-medium" : ""}>
          Size: {Math.round(htmlSize / 1000)} KB / 200 KB
          {overLimit && " (too large, remove or shrink an image)"}
        </span>
      </p>

      {/* Selected item */}
      {selected && (
        <div className="border border-gray-200 rounded-xl p-3 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">
              {selected.type === "image" ? "Image" : "Text box"}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={centerSelected}
                className="text-[11px] text-gray-600 hover:text-black underline cursor-pointer"
              >
                Center horizontally
              </button>
              <button
                type="button"
                onClick={removeSelected}
                className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700 cursor-pointer"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>

          {selected.type === "text" && (
            <>
              <textarea
                ref={textInputRef}
                rows={2}
                value={selected.text}
                onChange={(e) =>
                  updateEl(selected.id, { text: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg p-2 text-[12px] bg-white"
                placeholder="Type your text, e.g. Company name, address, {{.CompanyName}}"
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selected.fontFamily}
                  onChange={(e) =>
                    updateEl(selected.id, { fontFamily: e.target.value })
                  }
                  className="border border-gray-200 rounded px-1 py-1 bg-white"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option
                      key={f.value}
                      value={f.value}
                      style={{ fontFamily: f.value }}
                    >
                      {f.label}
                    </option>
                  ))}
                </select>
                <NumField
                  label="Size"
                  min={8}
                  value={selected.fontSize}
                  onChange={(v) =>
                    updateEl(selected.id, { fontSize: Math.max(8, v) })
                  }
                />
                <input
                  type="color"
                  value={selected.color}
                  onChange={(e) =>
                    updateEl(selected.id, { color: e.target.value })
                  }
                  className="w-8 h-7 border border-gray-200 rounded cursor-pointer bg-white"
                  aria-label="Text color"
                />
                <ToggleButton
                  label="Bold"
                  active={selected.bold}
                  onClick={() =>
                    updateEl(selected.id, { bold: !selected.bold })
                  }
                >
                  <Bold size={13} />
                </ToggleButton>
                <ToggleButton
                  label="Italic"
                  active={selected.italic}
                  onClick={() =>
                    updateEl(selected.id, { italic: !selected.italic })
                  }
                >
                  <Italic size={13} />
                </ToggleButton>
                <ToggleButton
                  label="Underline"
                  active={selected.underline}
                  onClick={() =>
                    updateEl(selected.id, { underline: !selected.underline })
                  }
                >
                  <Underline size={13} />
                </ToggleButton>
                <span className="w-px h-5 bg-gray-200" />
                <ToggleButton
                  label="Align left"
                  active={selected.align === "left"}
                  onClick={() => updateEl(selected.id, { align: "left" })}
                >
                  <AlignLeft size={13} />
                </ToggleButton>
                <ToggleButton
                  label="Align center"
                  active={selected.align === "center"}
                  onClick={() => updateEl(selected.id, { align: "center" })}
                >
                  <AlignCenter size={13} />
                </ToggleButton>
                <ToggleButton
                  label="Align right"
                  active={selected.align === "right"}
                  onClick={() => updateEl(selected.id, { align: "right" })}
                >
                  <AlignRight size={13} />
                </ToggleButton>
              </div>
            </>
          )}

          {selected.type === "image" && (
            <select
              value={selected.fit}
              onChange={(e) => updateEl(selected.id, { fit: e.target.value })}
              className="border border-gray-200 rounded px-1 py-1 bg-white"
            >
              <option value="contain">Fit (no crop)</option>
              <option value="cover">Fill (crop)</option>
            </select>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <NumField
              label="X"
              min={0}
              value={selected.x}
              onChange={(v) => updateEl(selected.id, { x: Math.max(0, v) })}
            />
            <NumField
              label="Y"
              min={0}
              value={selected.y}
              onChange={(v) => updateEl(selected.id, { y: Math.max(0, v) })}
            />
            <NumField
              label="W"
              min={16}
              value={selected.w}
              onChange={(v) => updateEl(selected.id, { w: Math.max(16, v) })}
            />
            {selected.type === "image" && (
              <NumField
                label="H"
                min={16}
                value={selected.h}
                onChange={(v) => updateEl(selected.id, { h: Math.max(16, v) })}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutCanvas;
