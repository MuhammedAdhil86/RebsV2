import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Paperclip,
  Loader2,
  FileText,
  X,
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
import toast from "react-hot-toast";

import GlowButton from "../components/helpers/glowbutton";
import announceService from "../service/announceService";

/* ================= STATIC CONSTANTS ================= */

const CELEBRATION_TYPES = {
  BIRTHDAY: "BIRTHDAY",
  WORK_ANNIVERSARY: "WORK_ANNIVERSARY",
};

const TYPE_OPTIONS = [
  { label: "Birthday", value: CELEBRATION_TYPES.BIRTHDAY },
  { label: "Work Anniversary", value: CELEBRATION_TYPES.WORK_ANNIVERSARY },
];

const LOGO = "{{.CompanyLogoURL}}";
const PHOTO = "{{.EmployeeImageURL}}";
const NEW_TEXT = "__TEXT__"; // palette item: an empty text box
const BG_ID = "__bg__"; // the template (background) image is selectable too

// Placeholders shown for every type.
const GENERIC_PLACEHOLDERS = [
  LOGO,
  PHOTO,
  "{{.EmployeeName}}",
  "{{.Designation}}",
  "{{.CompanyName}}",
];

// Placeholders shown only for the selected type.
const TYPE_PLACEHOLDERS = {
  [CELEBRATION_TYPES.BIRTHDAY]: ["{{.DateOfBirth}}"],
  [CELEBRATION_TYPES.WORK_ANNIVERSARY]: [
    "{{.AnniversaryYearCount}}",
    "{{.DateOfJoin}}",
  ],
};

const ALL_TOKENS = new Set([
  NEW_TEXT,
  ...GENERIC_PLACEHOLDERS,
  ...Object.values(TYPE_PLACEHOLDERS).flat(),
]);

// "google" is the Google Fonts name; fonts without it are system fonts.
const FONT_OPTIONS = [
  // Classic (system fonts)
  { label: "Arial", value: "Arial, sans-serif", group: "Classic" },
  { label: "Georgia", value: "Georgia, serif", group: "Classic" },
  {
    label: "Times New Roman",
    value: "Times New Roman, serif",
    group: "Classic",
  },
  { label: "Verdana", value: "Verdana, sans-serif", group: "Classic" },
  { label: "Courier New", value: "Courier New, monospace", group: "Classic" },

  // Aesthetic (Google Fonts)
  {
    label: "Playfair Display",
    value: "Playfair Display, serif",
    group: "Aesthetic",
    google: "Playfair+Display:wght@400;700",
  },
  {
    label: "Cormorant Garamond",
    value: "Cormorant Garamond, serif",
    group: "Aesthetic",
    google: "Cormorant+Garamond:wght@400;700",
  },
  {
    label: "Cinzel",
    value: "Cinzel, serif",
    group: "Aesthetic",
    google: "Cinzel:wght@400;700",
  },
  {
    label: "Lora",
    value: "Lora, serif",
    group: "Aesthetic",
    google: "Lora:wght@400;700",
  },
  {
    label: "Abril Fatface",
    value: "Abril Fatface, serif",
    group: "Aesthetic",
    google: "Abril+Fatface",
  },
  {
    label: "Montserrat",
    value: "Montserrat, sans-serif",
    group: "Aesthetic",
    google: "Montserrat:wght@400;700",
  },
  {
    label: "Poppins",
    value: "Poppins, sans-serif",
    group: "Aesthetic",
    google: "Poppins:wght@400;700",
  },
  {
    label: "Raleway",
    value: "Raleway, sans-serif",
    group: "Aesthetic",
    google: "Raleway:wght@400;700",
  },
  {
    label: "Bebas Neue",
    value: "Bebas Neue, sans-serif",
    group: "Aesthetic",
    google: "Bebas+Neue",
  },
  {
    label: "Great Vibes",
    value: "Great Vibes, cursive",
    group: "Aesthetic",
    google: "Great+Vibes",
  },
  {
    label: "Dancing Script",
    value: "Dancing Script, cursive",
    group: "Aesthetic",
    google: "Dancing+Script:wght@400;700",
  },
  {
    label: "Allura",
    value: "Allura, cursive",
    group: "Aesthetic",
    google: "Allura",
  },
  {
    label: "Sacramento",
    value: "Sacramento, cursive",
    group: "Aesthetic",
    google: "Sacramento",
  },
  {
    label: "Satisfy",
    value: "Satisfy, cursive",
    group: "Aesthetic",
    google: "Satisfy",
  },
  {
    label: "Pacifico",
    value: "Pacifico, cursive",
    group: "Aesthetic",
    google: "Pacifico",
  },
  {
    label: "Lobster",
    value: "Lobster, cursive",
    group: "Aesthetic",
    google: "Lobster",
  },
  {
    label: "Caveat",
    value: "Caveat, cursive",
    group: "Aesthetic",
    google: "Caveat:wght@400;700",
  },
];

const FONT_GROUPS = ["Classic", "Aesthetic"];

// One stylesheet link that loads every Google font above.
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?" +
  FONT_OPTIONS.filter((f) => f.google)
    .map((f) => `family=${f.google}`)
    .join("&") +
  "&display=swap";

// The template is laid out at this width. The canvas and the preview are both
// scaled down from it to fit their cards, so saved positions stay correct.
const TEMPLATE_WIDTH = 600;
// Largest scale used. 1 = full size, lower = smaller panels.
const MAX_SCALE = 0.8;
// Canvas height when there is no template image.
const MIN_CANVAS_HEIGHT = 420;

/* ================= PREVIEW SAMPLES ================= */

const svgAvatar = (bg, fg) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="${bg}"/><circle cx="48" cy="38" r="16" fill="${fg}"/><rect x="20" y="62" width="56" height="30" rx="14" fill="${fg}"/></svg>`,
  );

const SAMPLE_IMAGE = svgAvatar("#d1d5db", "#9ca3af");
const SAMPLE_LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" rx="6" fill="#111827"/><text x="60" y="25" font-size="14" fill="#fff" text-anchor="middle" font-family="Arial">LOGO</text></svg>`,
  );

// What an image placeholder looks like while editing.
const displaySrc = (src) =>
  src === LOGO ? SAMPLE_LOGO : src === PHOTO ? SAMPLE_IMAGE : src;

const safeUrl = (url) => {
  if (!url) return "";
  try {
    return encodeURI(decodeURI(url));
  } catch {
    return url;
  }
};

/* ================= ELEMENTS =================
 * The template is a list of elements. Each one is a text box or an image with
 * a position (x, y) and size, all in template pixels (600px wide).
 *
 *  text : { id, type, text, x, y, w, fontSize, color, bold, italic,
 *           underline, align, fontFamily }
 *  image: { id, type, src, x, y, w, h, fit, round }
 */

const makeElement = (token, id) => {
  if (token === LOGO) {
    return {
      id,
      type: "image",
      src: LOGO,
      x: 20,
      y: 18,
      w: 150,
      h: 52,
      fit: "contain",
      round: false,
    };
  }
  if (token === PHOTO) {
    return {
      id,
      type: "image",
      src: PHOTO,
      x: 187,
      y: 120,
      w: 226,
      h: 226,
      fit: "cover",
      round: true,
    };
  }
  return {
    id,
    type: "text",
    text: token === NEW_TEXT ? "New text" : token,
    x: 80,
    y: 100,
    w: 440,
    fontSize: 16,
    color: "#000000",
    bold: false,
    italic: false,
    underline: false,
    align: "left",
    fontFamily: FONT_OPTIONS[0].value,
  };
};

// ---- styles (shared by the editor and the saved HTML) ----

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

const imageInnerStyle = (el) => ({
  objectFit: el.fit,
  borderRadius: el.round ? "50%" : "0",
  display: "block",
});

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

// Elements -> the HTML that is saved and sent.
const elementsToHtml = (list) =>
  list
    .map((el) =>
      el.type === "image"
        ? `<img data-el="image" src="${el.src}" style="${toCss(imageStyle(el))}">`
        : `<div data-el="text" style="${toCss(textStyle(el))}">${escapeHtml(el.text)}</div>`,
    )
    .join("");

// ---- reading saved HTML back into elements ----

const px = (value, fallback) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
};

const toHex = (c) => {
  if (!c) return "#000000";
  if (c.startsWith("#")) {
    return c.length === 4
      ? "#" + [...c.slice(1)].map((x) => x + x).join("")
      : c;
  }
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
    x: px(s.left, 0),
    y: px(s.top, 0),
    w: px(s.width, 150),
    h: px(s.height, 52),
    fit: s.objectFit === "contain" ? "contain" : "cover",
    round: (s.borderRadius || "").includes("50%"),
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
    x: px(s.left, 0),
    y: px(s.top, 0),
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

// Saved HTML -> elements. HTML saved by this editor comes back exactly. Older
// HTML (from the previous editors) is converted: images are kept and the text
// becomes one text box.
const parseTemplate = (html, newId) => {
  if (!html || !html.trim()) return [];

  const prepared = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|div|li)>/gi, "$&\n");
  const doc = new DOMParser().parseFromString(prepared, "text/html");

  const tagged = [...doc.body.querySelectorAll("[data-el]")];
  if (tagged.length) {
    return tagged.map((node) =>
      node.dataset.el === "image"
        ? parseImage(node, newId())
        : parseText(node, newId()),
    );
  }

  const images = [...doc.body.querySelectorAll("img")];
  const elements = images.map((img) => parseImage(img, newId()));
  images.forEach((img) => img.remove());

  const text = (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  if (text) {
    elements.push({
      ...makeElement(NEW_TEXT, newId()),
      text,
      y: 100,
    });
  }
  return elements;
};

// Same look in the preview as in the canvas: text and images are laid over the
// template image at their saved positions.
const PREVIEW_CSS = `
  html, body { margin: 0; background: #fff; }
  .tpl { position: relative; width: ${TEMPLATE_WIDTH}px; }
  .tpl img.bg { display: block; width: 100%; }
  .tpl .body { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
`;

/* ================= SMALL UI PIECES ================= */

const NumField = ({ label, value, onChange, min }) => (
  <label className="flex items-center gap-1">
    <span className="text-gray-500">{label}</span>
    <input
      type="number"
      value={Math.round(value)}
      min={min}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-14 border border-gray-200 rounded px-1 py-0.5"
    />
  </label>
);

const ToggleButton = ({ active, onClick, label, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`p-1.5 rounded border transition-colors ${
      active
        ? "bg-black text-white border-black"
        : "border-gray-200 text-gray-600 hover:bg-gray-50"
    }`}
  >
    {children}
  </button>
);

/**
 * CelebrationForm: the create / edit celebration page.
 *
 * A drag-and-drop canvas: drag items from the list onto the canvas, then drag
 * to move and use the corner handle to resize. Everything (text, logo, photo)
 * is positioned the same way. The preview on the right shows sample values.
 *
 * Props:
 *  - initialType: "BIRTHDAY" | "WORK_ANNIVERSARY" (optional)
 *  - isEdit: lock the type to initialType
 *  - onCancel: go back to the list
 *  - onSaved: called after a successful save
 */
const CelebrationForm = ({
  initialType,
  isEdit = false,
  onCancel,
  onSaved,
}) => {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const textInputRef = useRef(null);

  const [celebrationType, setCelebrationType] = useState(
    initialType || CELEBRATION_TYPES.BIRTHDAY,
  );
  const [templateFile, setTemplateFile] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

  // The template content.
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const idRef = useRef(1);
  const newId = () => `el${idRef.current++}`;

  const selected = elements.find((el) => el.id === selectedId) || null;
  const bgSelected = selectedId === BG_ID;

  // Saved template info for the selected type (from the list API).
  const [existingUrl, setExistingUrl] = useState(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [sample, setSample] = useState({
    companyName: "Your Company",
    employeeName: "Sample Employee",
  });

  // Local preview URL for a newly attached image.
  const [templatePreviewUrl, setTemplatePreviewUrl] = useState(null);

  // Canvas and preview are scaled to the width of their cards.
  const canvasBoxRef = useRef(null);
  const [canvasBoxWidth, setCanvasBoxWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(MIN_CANVAS_HEIGHT);
  const canvasScale = canvasBoxWidth
    ? Math.min(MAX_SCALE, canvasBoxWidth / TEMPLATE_WIDTH)
    : MAX_SCALE;
  const scaleRef = useRef(canvasScale);
  scaleRef.current = canvasScale; // read by the drag code

  const previewBoxRef = useRef(null);
  const [previewBoxWidth, setPreviewBoxWidth] = useState(0);
  const [previewHeight, setPreviewHeight] = useState(MIN_CANVAS_HEIGHT);
  const previewScale = previewBoxWidth
    ? Math.min(MAX_SCALE, previewBoxWidth / TEMPLATE_WIDTH)
    : MAX_SCALE;

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return undefined;

    const boxObserver = new ResizeObserver(([entry]) =>
      setCanvasBoxWidth(entry.contentRect.width),
    );
    const heightObserver = new ResizeObserver(([entry]) =>
      setCanvasHeight(entry.contentRect.height),
    );
    const previewObserver = new ResizeObserver(([entry]) =>
      setPreviewBoxWidth(entry.contentRect.width),
    );

    if (canvasBoxRef.current) boxObserver.observe(canvasBoxRef.current);
    if (canvasRef.current) heightObserver.observe(canvasRef.current);
    if (previewBoxRef.current) previewObserver.observe(previewBoxRef.current);

    return () => {
      boxObserver.disconnect();
      heightObserver.disconnect();
      previewObserver.disconnect();
    };
  }, []);

  // Load the Google fonts once, so the canvas shows them.
  useEffect(() => {
    const id = "celebration-google-fonts";
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }, []);

  // Read the rendered height once the preview (and its images) have loaded.
  const handlePreviewLoad = (e) => {
    const doc = e.currentTarget.contentDocument;
    if (doc) setPreviewHeight(doc.documentElement.scrollHeight);
  };

  const typePlaceholders = TYPE_PLACEHOLDERS[celebrationType] || [];

  // Load the saved celebration for the selected type (Save = update).
  // Nothing saved yet: the canvas starts empty.
  useEffect(() => {
    let cancelled = false;

    const loadExisting = async () => {
      setIsLoadingExisting(true);
      setSelectedId(null);
      try {
        const list = await announceService.fetchCelebrations(celebrationType);
        if (cancelled) return;

        const saved = list.find((c) => c.celebration_type === celebrationType);

        // Edit: load the saved layout. Create: start empty.
        setElements(
          isEdit ? parseTemplate(saved?.celebration_text, newId) : [],
        );
        setHasSaved(!!saved);
        setExistingUrl(saved?.template_url || null);
        setTemplateFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        setSample({
          companyName: saved?.preview?.company_name || "Your Company",
          employeeName: saved?.preview?.employee_name || "Sample Employee",
        });
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load celebration:", err);
          toast.error("Failed to load saved celebration");
          setElements([]);
        }
      } finally {
        if (!cancelled) setIsLoadingExisting(false);
      }
    };

    loadExisting();

    return () => {
      cancelled = true;
    };
  }, [celebrationType]);

  // Object URL for a newly attached image, revoked when it changes.
  useEffect(() => {
    if (!templateFile || !templateFile.type?.startsWith("image/")) {
      setTemplatePreviewUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(templateFile);
    setTemplatePreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [templateFile]);

  // Background image for the canvas / preview: the new file, else the saved
  // template.
  const backgroundUrl =
    templatePreviewUrl ||
    (templateFile || !isEdit ? null : safeUrl(existingUrl));

  // Live preview: placeholders replaced by sample values, laid over the
  // template image.
  const previewHtml = useMemo(() => {
    const values = {
      "{{.CompanyLogoURL}}": SAMPLE_LOGO,
      "{{.EmployeeImageURL}}": SAMPLE_IMAGE,
      "{{.EmployeeName}}": sample.employeeName,
      "{{.Designation}}": "Software Engineer",
      "{{.CompanyName}}": sample.companyName,
      "{{.DateOfBirth}}": "15 Mar 1995",
      "{{.AnniversaryYearCount}}": "3",
      "{{.DateOfJoin}}": "01 Jun 2023",
    };

    const filled = Object.entries(values).reduce(
      (html, [key, value]) => html.replaceAll(key, value),
      elementsToHtml(elements),
    );

    const background = backgroundUrl
      ? `<img class="bg" src="${backgroundUrl}" />`
      : "";
    const heightStyle = backgroundUrl ? "" : `height:${canvasHeight}px`;

    return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${GOOGLE_FONTS_URL}"><style>${PREVIEW_CSS}</style></head><body><div class="tpl" style="${heightStyle}">${background}<div class="body">${filled}</div></div></body></html>`;
  }, [elements, sample, backgroundUrl, canvasHeight]);

  /* ---------- Canvas actions ---------- */

  const updateEl = (id, patch) =>
    setElements((list) =>
      list.map((el) => (el.id === id ? { ...el, ...patch } : el)),
    );

  // Add an item. x / y come from where it was dropped (click = default spot).
  const addItem = (token, x, y) => {
    const base = makeElement(token, newId());
    const offset = (elements.length % 6) * 28;
    const el = {
      ...base,
      x: x ?? base.x,
      y: y ?? (base.type === "text" ? base.y + offset : base.y),
    };

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
    updateEl(selected.id, {
      x: Math.round((TEMPLATE_WIDTH - selected.w) / 2),
    });
  };

  // Drag from the list onto the canvas, or drop an image file to use it as
  // the template image.
  const handleCanvasDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setTemplateFile(file);
        setSelectedId(BG_ID);
      } else toast.error("Drop an image file to use it as the template");
      return;
    }

    const token = e.dataTransfer.getData("text/plain");
    if (!ALL_TOKENS.has(token)) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.round((e.clientX - rect.left) / scaleRef.current - 10),
    );
    const y = Math.max(
      0,
      Math.round((e.clientY - rect.top) / scaleRef.current - 10),
    );
    addItem(token, x, y);
  };

  // Move / resize. The drag state lives in a ref; window listeners stay
  // attached for the life of the page.
  const dragRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      const drag = dragRef.current;
      if (!drag) return;

      // Screen pixels -> template pixels (the canvas is scaled down).
      const dx = (e.clientX - drag.startX) / scaleRef.current;
      const dy = (e.clientY - drag.startY) / scaleRef.current;

      if (drag.mode === "move") {
        updateEl(drag.id, {
          x: Math.max(0, Math.round(drag.ox + dx)),
          y: Math.max(0, Math.round(drag.oy + dy)),
        });
      } else if (drag.type === "text") {
        updateEl(drag.id, { w: Math.max(40, Math.round(drag.ow + dx)) });
      } else {
        updateEl(drag.id, {
          w: Math.max(16, Math.round(drag.ow + dx)),
          h: Math.max(16, Math.round(drag.oh + dy)),
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
    e.stopPropagation();
    e.preventDefault();

    setSelectedId(el.id);
    canvasWrapRef.current?.focus();
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

  // Keyboard: arrows nudge (Shift = 10px), Delete removes.
  const handleCanvasKeyDown = (e) => {
    if (!selected) return;

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
      const patch = moves[e.key];
      updateEl(selected.id, {
        ...(patch.x !== undefined && { x: Math.max(0, patch.x) }),
        ...(patch.y !== undefined && { y: Math.max(0, patch.y) }),
      });
    }
  };

  /* ---------- File + submit ---------- */

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setTemplateFile(file);
      if (file.type?.startsWith("image/")) setSelectedId(BG_ID);
    }
  };

  const removeFile = () => {
    setTemplateFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Prevent double submit (button click + form submit).
    if (isSubmitting) return;

    if (elements.length === 0) {
      toast.error("Add at least one item to the template");
      return;
    }

    setIsSubmitting(true);

    try {
      await announceService.upsertCelebration({
        celebration_type: celebrationType,
        celebration_text: elementsToHtml(elements),
        document: templateFile,
      });

      toast.success("Celebration saved successfully!");
      if (onSaved) await onSaved();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Internal Server Error";
      toast.error(`Save Failed: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeLabel = TYPE_OPTIONS.find(
    (o) => o.value === celebrationType,
  )?.label;

  // A draggable (and clickable) item in the list.
  const renderChip = (token, label) => (
    <button
      key={token}
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", token);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => addItem(token)}
      disabled={isLoadingExisting}
      className="px-2 py-1 rounded-md border border-gray-200 bg-white text-[11px] text-gray-700 cursor-grab active:cursor-grabbing hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50"
    >
      {label || token}
    </button>
  );

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        // Enter in a number box should not submit the form.
        if (e.key === "Enter" && e.target.tagName === "INPUT") {
          e.preventDefault();
        }
      }}
      className="space-y-3"
    >
      <div>
        <h3 className="text-[14px] font-semibold text-gray-900">
          {isEdit ? "Edit Celebration" : "New Celebration"}
        </h3>
        <p className="text-[11px] text-gray-400">
          Set the message sent for birthdays and work anniversaries
        </p>
      </div>

      {/* Stacked on small screens; side by side from lg. */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 items-start">
        {/* ================= EDITOR ================= */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4 text-[12px] min-w-0">
          {/* Celebration type */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Celebration Type
            </label>

            {isEdit ? (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-gray-800 bg-gray-100 px-2 py-1 rounded">
                {typeLabel}
              </span>
            ) : (
              <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCelebrationType(opt.value)}
                    disabled={isSubmitting}
                    className={`flex-1 py-2 rounded-lg text-center transition-all ${
                      celebrationType === opt.value
                        ? "bg-black text-white"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items to drag */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Items
            </label>

            {!isEdit && hasSaved && (
              <p className="text-[11px] text-amber-600 mb-2">
                A {typeLabel} celebration already exists. Saving will replace
                it.
              </p>
            )}

            <p className="text-[10px] text-gray-400 mb-2">
              Drag an item onto the canvas (or click it to add).
            </p>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoadingExisting}
                className="flex items-center gap-1 px-2 py-1 rounded-md border border-gray-300 bg-white text-[11px] text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ImageIcon size={12} /> Background image
              </button>
              <button
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", NEW_TEXT);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => addItem(NEW_TEXT)}
                disabled={isLoadingExisting}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-black text-white text-[11px] cursor-grab active:cursor-grabbing disabled:opacity-50"
              >
                <Type size={12} /> Text box
              </button>
              {GENERIC_PLACEHOLDERS.map((ph) => renderChip(ph))}
              {typePlaceholders.map((ph) => renderChip(ph))}
            </div>
          </div>

          {/* Canvas */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Canvas
            </label>

            <div ref={canvasBoxRef} className="w-full">
              <div
                className="mx-auto"
                style={{
                  width: TEMPLATE_WIDTH * canvasScale,
                  height: canvasHeight * canvasScale,
                }}
              >
                <div
                  ref={canvasWrapRef}
                  tabIndex={0}
                  onKeyDown={handleCanvasKeyDown}
                  className="outline-none"
                  style={{
                    width: TEMPLATE_WIDTH,
                    transform: `scale(${canvasScale})`,
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
                    onDrop={handleCanvasDrop}
                    className={`relative bg-white select-none overflow-hidden border ${
                      isDragOver
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-300"
                    }`}
                    style={{
                      width: TEMPLATE_WIDTH,
                      minHeight: MIN_CANVAS_HEIGHT,
                      touchAction: "none",
                    }}
                  >
                    {backgroundUrl && (
                      <img
                        src={backgroundUrl}
                        alt=""
                        draggable={false}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setSelectedId(BG_ID);
                          canvasWrapRef.current?.focus();
                        }}
                        className="block w-full cursor-pointer"
                        style={
                          bgSelected
                            ? {
                                outline: "2px solid #2563eb",
                                outlineOffset: "-2px",
                              }
                            : undefined
                        }
                      />
                    )}

                    {elements.length === 0 && !isLoadingExisting && (
                      <div className="absolute inset-0 flex items-center justify-center text-[16px] text-gray-300 pointer-events-none">
                        Drag items here
                      </div>
                    )}

                    {elements.map((el) => {
                      const isSelected = el.id === selectedId;
                      const frame =
                        el.type === "image"
                          ? {
                              position: "absolute",
                              left: `${el.x}px`,
                              top: `${el.y}px`,
                              width: `${el.w}px`,
                              height: `${el.h}px`,
                            }
                          : {
                              position: "absolute",
                              left: `${el.x}px`,
                              top: `${el.y}px`,
                              width: `${el.w}px`,
                            };

                      return (
                        <div
                          key={el.id}
                          onPointerDown={(e) => startDrag(e, el, "move")}
                          onDoubleClick={() => {
                            if (el.type === "text") {
                              setTimeout(
                                () => textInputRef.current?.focus(),
                                0,
                              );
                            }
                          }}
                          style={{
                            ...frame,
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

            <p className="text-[10px] text-gray-400 mt-1">
              Drag to move, use the blue corner to resize. Arrow keys nudge the
              selected item (Shift = 10px), Delete removes it. Drop an image
              file on the canvas to use it as the template image.
            </p>
          </div>

          {/* Properties of the selected item */}
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
                    className="text-[11px] text-gray-600 hover:text-black underline"
                  >
                    Center horizontally
                  </button>
                  <button
                    type="button"
                    onClick={removeSelected}
                    className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>

              {selected.type === "text" && (
                <>
                  <textarea
                    ref={textInputRef}
                    rows={3}
                    value={selected.text}
                    onChange={(e) =>
                      updateEl(selected.id, { text: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg p-2 text-[12px] bg-white"
                    placeholder="Type your text. Use the items above for placeholders."
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selected.fontFamily}
                      onChange={(e) =>
                        updateEl(selected.id, { fontFamily: e.target.value })
                      }
                      className="border border-gray-200 rounded px-1 py-1 bg-white"
                    >
                      {FONT_GROUPS.map((group) => (
                        <optgroup key={group} label={group}>
                          {FONT_OPTIONS.filter((f) => f.group === group).map(
                            (f) => (
                              <option
                                key={f.value}
                                value={f.value}
                                style={{ fontFamily: f.value }}
                              >
                                {f.label}
                              </option>
                            ),
                          )}
                        </optgroup>
                      ))}
                    </select>

                    <NumField
                      label="Size"
                      min={8}
                      value={selected.fontSize}
                      onChange={(v) =>
                        updateEl(selected.id, {
                          fontSize: Math.max(8, v),
                        })
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
                        updateEl(selected.id, {
                          underline: !selected.underline,
                        })
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
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selected.fit}
                    onChange={(e) =>
                      updateEl(selected.id, { fit: e.target.value })
                    }
                    className="border border-gray-200 rounded px-1 py-1 bg-white"
                  >
                    <option value="cover">Fill (crop)</option>
                    <option value="contain">Fit (no crop)</option>
                  </select>

                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={selected.round}
                      onChange={(e) =>
                        updateEl(selected.id, { round: e.target.checked })
                      }
                    />
                    <span className="text-gray-600">Round</span>
                  </label>
                </div>
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
                  onChange={(v) =>
                    updateEl(selected.id, { w: Math.max(16, v) })
                  }
                />
                {selected.type === "image" && (
                  <NumField
                    label="H"
                    min={16}
                    value={selected.h}
                    onChange={(v) =>
                      updateEl(selected.id, { h: Math.max(16, v) })
                    }
                  />
                )}
              </div>
            </div>
          )}

          {/* Background image: shown when you click the background */}
          {bgSelected && (
            <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
              <span className="font-medium text-gray-700">
                Background image
              </span>

              {backgroundUrl ? (
                <p className="text-[11px] text-gray-500">
                  {templateFile ? templateFile.name : "Saved template image"} is
                  shown behind the items.
                </p>
              ) : (
                <p className="text-[11px] text-gray-500">
                  No image yet. Choose one to show it behind the items.
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] px-2 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                >
                  {backgroundUrl ? "Replace image" : "Choose image"}
                </button>
                {templateFile && (
                  <button
                    type="button"
                    onClick={() => {
                      removeFile();
                      setSelectedId(null);
                    }}
                    className="text-[11px] px-2 py-1 rounded-md border border-red-200 text-red-500 hover:bg-red-50"
                  >
                    Remove new image
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Template image / document */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Template Image / Document
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx"
            />

            {existingUrl && !templateFile && (
              <p className="text-[11px] text-gray-500 mb-2 break-all">
                Current file:{" "}
                <a
                  href={safeUrl(existingUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black underline hover:text-gray-600"
                >
                  {decodeURIComponent(existingUrl.split("/").pop())}
                </a>{" "}
                (attach a new file to replace it)
              </p>
            )}

            {!templateFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 p-3 rounded-xl text-gray-600 hover:bg-gray-50"
              >
                <Paperclip size={16} />
                <span>Attach File (Image, PDF, etc.)</span>
              </button>
            ) : (
              <div className="flex items-center justify-between border p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-2 truncate">
                  <FileText size={18} className="text-gray-500 flex-shrink-0" />
                  <span className="truncate text-gray-700">
                    {templateFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-gray-400 hover:text-red-500 ml-2"
                  aria-label="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= LIVE PREVIEW ================= */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:sticky lg:top-4 min-w-0">
          <label className="block mb-2 text-[12px] font-medium text-gray-700">
            Preview
          </label>

          {/* Scaled to fit the card width (same ratio), so there is no inner
              scrollbar. allow-same-origin without allow-scripts: scripts
              still cannot run. */}
          <div ref={previewBoxRef} className="w-full">
            <div
              className="mx-auto rounded-lg border border-gray-100 bg-white overflow-hidden"
              style={{
                width: TEMPLATE_WIDTH * previewScale,
                height: previewHeight * previewScale,
              }}
            >
              <iframe
                title="Celebration preview"
                sandbox="allow-same-origin"
                srcDoc={previewHtml}
                onLoad={handlePreviewLoad}
                scrolling="no"
                style={{
                  width: TEMPLATE_WIDTH,
                  height: previewHeight,
                  border: 0,
                  display: "block",
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top left",
                }}
              />
            </div>
          </div>

          <p className="text-[10px] text-gray-400 mt-2">
            Sample values are used for the placeholders.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-xs font-medium text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>

        <GlowButton
          onClick={handleSubmit}
          disabled={isSubmitting || isLoadingExisting}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            "Save Celebration"
          )}
        </GlowButton>
      </div>
    </form>
  );
};

export default CelebrationForm;
