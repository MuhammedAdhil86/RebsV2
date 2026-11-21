import React, { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "react-toastify"; // <ToastContainer /> lives in App.jsx
// Backend message / errors / data toasts. Adjust the path to where you saved it.
import { resolveApiSuccess, resolveApiError } from "../../../utils/apiToast";
import { updateCompanyLayout } from "../../../service/companyService";
import LayoutCanvas from "./LayoutCanvas";

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

/* ---------------- helpers ---------------- */

// Empty canvas saves "", but old Quill HTML can be "<p><br></p>", so strip tags.
const isBlankHtml = (html) => {
  if (!html) return true;
  if (/<img\b/i.test(html)) return false;
  return !html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
};

// Placeholders offered on the canvas (no API call).
// NOTE: your old Update file used "RebsLogoURL" instead of "SenderLogoURL".
// Keep only the keys your backend really replaces.
const LAYOUT_PLACEHOLDERS = ["SenderLogoURL", "ReceiverLogoURL"];

// Fixed size for Sender / Receiver logos in header and footer.
// (If LayoutCanvas also needs it, move this to a shared constants file
// and import it in both places to avoid a circular import.)
const LOGO_STYLE =
  "height:65px; max-width:185px; width:auto; object-fit:contain;";

// Forces LOGO_STYLE on every SenderLogoURL / ReceiverLogoURL <img> before saving
const enforceLogoStyle = (html) =>
  (html || "").replace(/<img\b[^>]*>/gi, (tag) => {
    if (!/src="\{\{\.(Sender|Receiver)LogoURL\}\}"/i.test(tag)) return tag;
    const withoutStyle = tag.replace(/\sstyle="[^"]*"/i, "");
    return withoutStyle.replace(/<img/i, `<img style="${LOGO_STYLE}"`);
  });

// Letters: the page is 210mm wide and the canvas is 600px wide.
const MM_TO_PX = 600 / 210;
const mmToPx = (mm) => Math.max(40, Math.round((Number(mm) || 0) * MM_TO_PX));

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
  if ("background_position" in next) {
    next.background_position = normalizePosition(next.background_position);
  }
  return next;
};

/**
 * LayoutForm - shared by CreateLayout and UpdateLayout.
 *  mode: "create" (blank form) | "update" (pre-filled from `layout`)
 * Both save through updateCompanyLayout(layoutType, formData) (upsert).
 */
const LayoutForm = ({ mode, layoutType, layout: initialData, onClose }) => {
  const isUpdate = mode === "update";
  const isLetter = layoutType === "letter";
  const typeLabel = isLetter ? "Letter" : "Email";

  const [form, setForm] = useState(() =>
    buildInitialForm(
      isLetter ? letterDefaults : emailDefaults,
      isUpdate ? initialData : null,
    ),
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
      toast.error(
        "Header and footer are required. Add at least one item to each.",
      );
      return;
    }

    // Always save Sender / Receiver logos with the fixed size
    const payload = {
      ...form,
      header_html: enforceLogoStyle(form.header_html),
      footer_html: enforceLogoStyle(form.footer_html),
    };

    // The API rejects header / footer HTML over 200 KB
    const tooBig = [
      ["Header", payload.header_html],
      ["Footer", payload.footer_html],
    ].find(([, html]) => html.length > 200 * 1000);
    if (tooBig) {
      toast.error(
        `${tooBig[0]} is too large (${Math.round(tooBig[1].length / 1000)} KB, max 200 KB). Remove or shrink an image.`,
      );
      return;
    }

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
    const toastId = toast.loading(
      isUpdate ? "Updating layout..." : "Creating layout...",
    );
    try {
      const body = await updateCompanyLayout(layoutType, formData);
      // body = { status_code, message, data: { id, background_image_url } }
      resolveApiSuccess(toastId, body, "Saved");
      setBackgroundImage(null);
      if (onClose) onClose();
    } catch (error) {
      console.error("SAVE ERROR:", error);
      resolveApiError(toastId, error, "Failed to save layout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl">
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
          {isUpdate ? "Edit" : "Create"} {typeLabel} Layout
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 px-2 pb-6">
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

        <LayoutCanvas
          label="Header *"
          value={form.header_html}
          onChange={setHtml("header_html")}
          placeholders={LAYOUT_PLACEHOLDERS}
          defaultHeight={120}
          fixedHeight={isLetter ? mmToPx(form.header_height_mm) : undefined}
          disabled={saving}
        />

        <LayoutCanvas
          label="Footer *"
          value={form.footer_html}
          onChange={setHtml("footer_html")}
          placeholders={LAYOUT_PLACEHOLDERS}
          defaultHeight={90}
          fixedHeight={isLetter ? mmToPx(form.footer_height_mm) : undefined}
          disabled={saving}
        />

        {isLetter && (
          <>
            <h3 className="text-[13px] font-semibold text-gray-800 pt-2">
              Page Settings
            </h3>
            <p className="text-[11px] text-gray-400 -mt-4">
              Header height and footer height also set the size of the header
              and footer canvases above.
            </p>
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
              {isUpdate && initialData?.background_image_url && (
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
              {isUpdate && (
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
              )}
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
            {saving
              ? isUpdate
                ? "Updating..."
                : "Creating..."
              : isUpdate
                ? "Update Layout"
                : "Create Layout"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LayoutForm;
