import React, { useState, useRef, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  ArrowLeft,
  ChevronDown,
  Undo2,
  Redo2,
  Search,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { updateCompanyLayout } from "../../../service/companyService";

const inputClass =
  "w-full px-3 py-2 border border-gray-200 bg-[#f9f9f9] rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-black font-['Poppins']";
const labelClass = "block text-[12px] font-medium text-gray-600 mb-1";

/* ---------------- Background option lists ----------------
   If the backend ever changes its accepted values, edit ONLY these lists.
   The first item of each list is used as the default. */
const BACKGROUND_POSITIONS = [
  { value: "center", label: "Center" },
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

const BACKGROUND_SIZES = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
  { value: "auto", label: "Auto" },
];

const BACKGROUND_REPEATS = [
  { value: "no-repeat", label: "No Repeat" },
  { value: "repeat", label: "Repeat" },
  { value: "repeat-x", label: "Repeat X" },
  { value: "repeat-y", label: "Repeat Y" },
];

const DEFAULT_POSITION = BACKGROUND_POSITIONS[0].value;

// Converts any legacy / CSS-style value ("center center", "top left",
// "Top_Right", ...) into the format the API accepts. Unknown values fall
// back to the default so a stale record can never block saving.
const normalizePosition = (raw) => {
  if (raw === null || raw === undefined) return DEFAULT_POSITION;
  const cleaned = String(raw)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  if (cleaned === "center-center" || cleaned === "centre") {
    return DEFAULT_POSITION;
  }
  const match = BACKGROUND_POSITIONS.find((p) => p.value === cleaned);
  return match ? match.value : DEFAULT_POSITION;
};

/* ---------------- Quill config (module-level so it stays stable) ---------------- */
const COLOR_PALETTE = [
  "",
  "#000000",
  "#e60000",
  "#ff9900",
  "#ffff00",
  "#008a00",
  "#0066cc",
  "#9933ff",
  "#ffffff",
  "#facccc",
  "#ffebcc",
  "#ffffcc",
  "#cce8cc",
  "#cce0f5",
  "#ebd6ff",
  "#bbbbbb",
  "#f06666",
  "#ffc266",
  "#ffff66",
  "#66b966",
  "#66a3e0",
  "#c285ff",
  "#888888",
  "#a10000",
  "#b26b00",
  "#b2b200",
  "#006100",
  "#0047b2",
  "#6b24b2",
  "#444444",
  "#5c0000",
  "#663d00",
  "#666600",
  "#003700",
  "#002966",
  "#3d1466",
];

const QUILL_MODULES = {
  toolbar: [
    [{ font: [] }, { size: ["small", false, "large", "huge"] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: COLOR_PALETTE }, { background: COLOR_PALETTE }],
    [{ script: "sub" }, { script: "super" }],
    ["blockquote"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    [{ align: [] }],
    ["link", "image"],
    ["clean"],
  ],
  history: { delay: 500, maxStack: 100, userOnly: true },
};

const QUILL_FORMATS = [
  "font",
  "size",
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "script",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "align",
  "link",
  "image",
];

const EDITOR_STYLES = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .layout-editor .ql-toolbar.ql-snow {
    border: none !important;
    border-bottom: 1px solid #e5e7eb !important;
    padding: 8px 12px !important;
    background-color: #fafbfc;
  }
  .layout-editor .ql-container.ql-snow {
    border: none !important;
    font-family: inherit;
    font-size: 13px;
  }
  .layout-editor .ql-editor { min-height: 200px; line-height: 1.6; padding: 14px; }
  .layout-editor .ql-editor img { display: inline-block; vertical-align: middle; border-radius: 4px; }
  .layout-editor .ql-snow .ql-color-picker .ql-picker-options {
    width: 172px !important; padding: 6px !important; border-radius: 10px !important;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
    border: 1px solid #e5e7eb !important; background-color: #fff !important; z-index: 9999 !important;
  }
  .layout-editor .ql-snow .ql-color-picker .ql-picker-item {
    width: 18px !important; height: 18px !important; margin: 2px !important;
    border-radius: 4px !important; border: 1px solid rgba(0,0,0,0.12) !important;
    cursor: pointer !important; float: left !important;
  }
`;

/* ---------------- helpers ---------------- */
// Quill returns "<p><br></p>" for an empty editor, so strip tags before checking
const isBlankHtml = (html) => {
  if (!html) return true;
  if (/<img\b/i.test(html)) return false;
  return !html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
};

// Static placeholders (no API call)
const LAYOUT_PLACEHOLDERS = ["RebsLogoURL", "ReceiverLogoURL"];

const isLogoKey = (key) => key.toLowerCase().includes("logo");

/* ---------------- Demo previews (shown only while the editor is empty) ---------------- */
const DemoOverlay = ({ children }) => (
  <div className="absolute left-0 right-0 top-[46px] px-4 py-3 pointer-events-none select-none z-[1]">
    <div className="opacity-50">{children}</div>
    <p className="mt-3 text-[11px] italic text-gray-400">
      Sample preview. Click or start typing to create your own.
    </p>
  </div>
);

const HeaderDemo = () => (
  <DemoOverlay>
    <div className="flex items-center justify-between py-2">
      <div className="h-10 w-28 rounded border border-dashed border-gray-400 flex items-center justify-center text-[10px] font-semibold text-gray-500">
        YOUR LOGO
      </div>
      <div className="text-[16px] font-bold text-gray-700">Company Name</div>
    </div>
    <div className="h-[2px] bg-blue-600" />
  </DemoOverlay>
);

const FooterDemo = () => (
  <DemoOverlay>
    <div className="bg-gray-100 rounded py-3 text-center text-[12px] leading-5 text-gray-600">
      <strong className="text-gray-800">Company Name</strong>
      <br />
      Address &bull; Phone &bull; support@example.com
    </div>
  </DemoOverlay>
);

/* ---------------- Rich HTML editor (Visual + HTML source) ---------------- */
const LayoutHtmlEditor = ({ label, value, onChange, disabled, demo }) => {
  const quillRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  // The demo is only a visual hint: it is never part of `value`, so it can't be saved.
  const [demoDismissed, setDemoDismissed] = useState(false);
  const showDemo = Boolean(demo) && !demoDismissed && isBlankHtml(value);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(
    () =>
      LAYOUT_PLACEHOLDERS.filter((p) =>
        p.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [searchTerm],
  );

  const insertPlaceholder = (key) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true);
    const index = range ? range.index : editor.getLength();

    if (isLogoKey(key)) {
      const html = `<p><img src="{{.${key}}}" alt="${key}" style="height:48px; max-width:160px; width:auto; object-fit:contain;" /></p>`;
      editor.clipboard.dangerouslyPasteHTML(index, html, "user");
      editor.setSelection(index + 1);
    } else {
      const token = `{{.${key}}}`;
      editor.insertText(index, token, "user");
      editor.setSelection(index + token.length);
    }

    toast.success(`Inserted ${key}`);
    setShowMenu(false);
    setSearchTerm("");
  };

  const undo = () => quillRef.current?.getEditor().history.undo();
  const redo = () => quillRef.current?.getEditor().history.redo();

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className={labelClass + " mb-0"}>{label}</label>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-gray-400">
            <button
              type="button"
              onClick={undo}
              title="Undo"
              className="p-1 hover:text-gray-700 cursor-pointer"
            >
              <Undo2 size={15} />
            </button>
            <button
              type="button"
              onClick={redo}
              title="Redo"
              className="p-1 hover:text-gray-700 cursor-pointer"
            >
              <Redo2 size={15} />
            </button>
          </div>

          {/* Insert Placeholder menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((p) => !p)}
              className="flex items-center gap-1 text-[11px] text-gray-700 font-semibold uppercase tracking-tight hover:text-black py-0.5 px-1 cursor-pointer"
            >
              Insert Placeholder <ChevronDown size={14} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto no-scrollbar py-2">
                <div className="px-3 pb-2 border-b border-gray-50">
                  <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                    <Search size={12} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-transparent text-[11px] outline-none text-gray-700"
                      autoFocus
                    />
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="px-4 py-3 text-[11px] text-gray-400 text-center">
                    No placeholders found
                  </div>
                ) : (
                  filtered.map((key) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => insertPlaceholder(key)}
                      className="w-full flex items-center justify-between px-4 py-2 text-[12px] hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-50 last:border-0 cursor-pointer font-mono"
                    >
                      <span className="truncate">{`{{.${key}}}`}</span>
                      {isLogoKey(key) && (
                        <span className="text-[9px] font-sans font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0 ml-2">
                          Logo
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="layout-editor relative bg-white rounded-xl border border-gray-200 shadow-sm">
        {showDemo && demo}
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={QUILL_MODULES}
          formats={QUILL_FORMATS}
          readOnly={disabled}
          onFocus={() => setDemoDismissed(true)}
          onKeyDown={() => setDemoDismissed(true)}
          onBlur={() => {
            // Bring the demo back if the person left the editor empty
            if (isBlankHtml(value)) setDemoDismissed(false);
          }}
        />
      </div>
    </div>
  );
};

/* ---------------- Defaults & form ---------------- */
const emailDefaults = {
  name: "",
  header_html: "",
  footer_html: "",
};

const letterDefaults = {
  name: "",
  header_html: "",
  footer_html: "",
  background_size: BACKGROUND_SIZES[0].value,
  background_position: DEFAULT_POSITION,
  background_repeat: BACKGROUND_REPEATS[0].value,
  page_margin_top_mm: "20",
  page_margin_bottom_mm: "20",
  page_margin_left_mm: "15",
  page_margin_right_mm: "15",
  header_height_mm: "25",
  footer_height_mm: "20",
  show_on_first_page_only: "false",
  remove_background_image: "false",
};

const Field = ({ label, children }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {children}
  </div>
);

// Merge API data over defaults; null values keep the default
const buildInitialForm = (defaults, data) => {
  const next = { ...defaults };
  if (data) {
    Object.keys(defaults).forEach((key) => {
      const value = data[key];
      if (value !== null && value !== undefined) next[key] = String(value);
    });
  }
  // Old records may hold values like "center center"; convert them so the
  // API never receives a position it rejects.
  if ("background_position" in next) {
    next.background_position = normalizePosition(next.background_position);
  }
  return next;
};

// UPDATE view for BOTH layout types ("email" and "letter").
// Pre-filled form -> updateCompanyLayout(layoutType, formData)
const UpdateLayout = ({ layoutType, layout: initialData, onClose }) => {
  const isLetter = layoutType === "letter";
  const [form, setForm] = useState(() =>
    buildInitialForm(isLetter ? letterDefaults : emailDefaults, initialData),
  );
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const setHtml = (key) => (html) =>
    setForm((prev) => ({ ...prev, [key]: html }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // header_html / footer_html are marked required in the API
    if (isBlankHtml(form.header_html) || isBlankHtml(form.footer_html)) {
      toast.error("Header and footer HTML are required");
      return;
    }

    const payload = { ...form };
    if (isLetter) {
      payload.background_position = normalizePosition(
        payload.background_position,
      );
    }

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    if (isLetter && backgroundImage) {
      formData.append("background_image", backgroundImage);
    }

    setSaving(true);
    const toastId = toast.loading("Updating layout...");
    try {
      const body = await updateCompanyLayout(layoutType, formData);
      // body = { status_code, message, data: { id, background_image_url } }
      toast.success(body?.message || "Saved", { id: toastId });
      setBackgroundImage(null);
      if (onClose) onClose();
    } catch (error) {
      console.error("SAVE ERROR:", error);
      // normalizeError in companyService already put the backend message
      // into error.message
      toast.error(error?.message || "Failed to save layout", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = isLetter ? "Letter" : "Email";

  return (
    <div className="w-full bg-white rounded-xl">
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />

      <div className="flex items-center gap-3 border-b border-gray-100 mb-5 px-2 pb-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-black"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <h2 className="text-[16px] font-semibold font-['Poppins']">
          Edit {typeLabel} Layout
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 px-2 pb-6">
        <Field label="Layout Name">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={
              isLetter ? "Company Letterhead" : "Corporate Email Layout"
            }
            className={inputClass}
            disabled={saving}
          />
        </Field>

        <LayoutHtmlEditor
          label="Header *"
          value={form.header_html}
          onChange={setHtml("header_html")}
          demo={<HeaderDemo />}
          disabled={saving}
        />

        <LayoutHtmlEditor
          label="Footer *"
          value={form.footer_html}
          onChange={setHtml("footer_html")}
          demo={<FooterDemo />}
          disabled={saving}
        />

        {isLetter && (
          <>
            <h3 className="text-[13px] font-semibold text-gray-800 pt-2">
              Page Settings
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ["page_margin_top_mm", "Top Margin (mm)"],
                ["page_margin_bottom_mm", "Bottom Margin (mm)"],
                ["page_margin_left_mm", "Left Margin (mm)"],
                ["page_margin_right_mm", "Right Margin (mm)"],
                ["header_height_mm", "Header Height (mm)"],
                ["footer_height_mm", "Footer Height (mm)"],
              ].map(([name, label]) => (
                <Field key={name} label={label}>
                  <input
                    type="number"
                    min="0"
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </Field>
              ))}
            </div>

            <h3 className="text-[13px] font-semibold text-gray-800 pt-2">
              Background
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Background Size">
                <select
                  name="background_size"
                  value={form.background_size}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {BACKGROUND_SIZES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Background Position">
                <select
                  name="background_position"
                  value={form.background_position}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {BACKGROUND_POSITIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Background Repeat">
                <select
                  name="background_repeat"
                  value={form.background_repeat}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {BACKGROUND_REPEATS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Background Image">
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setBackgroundImage(e.target.files?.[0] || null)
                }
                className="text-[12px]"
              />
              {initialData?.background_image_url && (
                <img
                  src={initialData.background_image_url}
                  alt="Current background"
                  className="mt-2 h-24 rounded-lg border border-gray-200 object-cover"
                />
              )}
            </Field>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-[12px] text-gray-700">
                <input
                  type="checkbox"
                  checked={form.show_on_first_page_only === "true"}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      show_on_first_page_only: String(e.target.checked),
                    }))
                  }
                />
                Show on first page only
              </label>
              <label className="flex items-center gap-2 text-[12px] text-gray-700">
                <input
                  type="checkbox"
                  checked={form.remove_background_image === "true"}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      remove_background_image: String(e.target.checked),
                    }))
                  }
                />
                Remove existing background image
              </label>
            </div>
          </>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-lg text-[12px] font-medium active:scale-95 transition-transform disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Updating..." : "Update Layout"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateLayout;
