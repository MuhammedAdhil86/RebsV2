import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  ChevronDown,
  Undo2,
  Redo2,
  ArrowLeft,
  Lock,
  Save,
  Info,
  Mail,
  Search,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import GlowButton from "../components/helpers/glowbutton";
import {
  updateEmailTemplateService,
  fetchEmailPlaceholders,
} from "../service/mainServices";

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

const EditEmailTemplateView = ({
  onBack,
  initialData,
  onSuccess,
  availablePlaceholders = [],
  companyId: propCompanyId,
}) => {
  const quillRef = useRef(null);

  // Check if current user/template belongs to Company 8 (System Admin)
  const isCompany8 = useMemo(() => {
    if (propCompanyId !== undefined && propCompanyId !== null) {
      return Number(propCompanyId) === 8;
    }
    if (
      initialData?.company_id !== undefined &&
      initialData?.company_id !== null
    ) {
      return Number(initialData.company_id) === 8;
    }
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const foundId =
        storedUser?.company_id ||
        storedUser?.companyId ||
        storedUser?.data?.company_id ||
        localStorage.getItem("company_id") ||
        localStorage.getItem("companyId");
      return Number(foundId) === 8;
    } catch {
      return false;
    }
  }, [propCompanyId, initialData]);

  // Form States
  const [templateTitle, setTemplateTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic Placeholders
  const [placeholders, setPlaceholders] = useState([]);
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingPlaceholders, setLoadingPlaceholders] = useState(false);

  // Pre-fill fields from initialData
  useEffect(() => {
    if (initialData) {
      setTemplateTitle(initialData.name || "");
      setSubject(initialData.subject || "");
      setContent(initialData.body_html || initialData.body || "");
      setIsDefault(Boolean(initialData.is_default));
    }
  }, [initialData]);

  // Load placeholders once on mount
  useEffect(() => {
    let isMounted = true;

    if (
      Array.isArray(availablePlaceholders) &&
      availablePlaceholders.length > 0
    ) {
      const parsed = availablePlaceholders
        .map((item) =>
          typeof item === "string"
            ? item
            : item?.placeholder || item?.label || "",
        )
        .filter(Boolean);
      setPlaceholders(parsed);
      return;
    }

    const loadPlaceholders = async () => {
      setLoadingPlaceholders(true);
      try {
        const res = await fetchEmailPlaceholders();
        if (isMounted) {
          const rawList = Array.isArray(res) ? res : res?.data || [];
          const cleanTokens = rawList
            .map((item) =>
              typeof item === "string"
                ? item
                : item?.placeholder || item?.label || "",
            )
            .filter(Boolean);

          setPlaceholders(cleanTokens);
        }
      } catch (err) {
        console.error("Failed to load placeholders:", err);
      } finally {
        if (isMounted) setLoadingPlaceholders(false);
      }
    };

    loadPlaceholders();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUndo = () => quillRef.current?.getEditor().history.undo();
  const handleRedo = () => quillRef.current?.getEditor().history.redo();

  const insertPlaceholder = (placeholderKey) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const range = editor.getSelection(true);
    const insertIndex = range ? range.index : editor.getLength();

    const isLogo =
      placeholderKey.toLowerCase().includes("logo") ||
      (placeholderKey.toLowerCase().endsWith("url") &&
        placeholderKey.toLowerCase().includes("logo"));

    if (isLogo) {
      const logoHtml = `<p><img src="{{.${placeholderKey}}}" alt="${placeholderKey}" style="height:48px; max-width:160px; width:auto; object-fit:contain;" /></p>`;
      editor.clipboard.dangerouslyPasteHTML(insertIndex, logoHtml, "user");
      editor.setSelection(insertIndex + 1);
      toast.success(`Inserted ${placeholderKey}`);
    } else {
      const token = `{{.${placeholderKey}}}`;
      editor.insertText(insertIndex, token, "user");
      editor.setSelection(insertIndex + token.length);
      toast.success(`Inserted ${token}`);
    }

    setShowPlaceholderMenu(false);
  };

  const handleUpdate = async () => {
    if (!templateTitle.trim()) {
      toast.error("Template name is required");
      return;
    }

    const strippedContent = content.replace(/<[^>]*>?/gm, "").trim();
    if (!strippedContent && !content.includes("<img")) {
      toast.error("Template body content cannot be empty");
      return;
    }

    if (!initialData?.purpose) {
      toast.error("Purpose key is missing from template data");
      return;
    }

    setLoading(true);

    const bodyContent = content.trim();
    const finalHtml = bodyContent.startsWith("<html>")
      ? bodyContent
      : `<html><body>${bodyContent}</body></html>`;

    // Exact payload object accepted by updateEmailTemplateService({ purpose, ... })
    const payload = {
      purpose: initialData.purpose,
      name: templateTitle.trim(),
      subject: subject.trim(),
      body_html: finalHtml,
      template_type: "mail",
      is_default: Boolean(isDefault),
    };

    try {
      const response = await updateEmailTemplateService(payload);
      toast.success(
        response?.message || "Email template updated successfully!",
      );

      if (onSuccess) {
        onSuccess(response);
      } else if (onBack) {
        setTimeout(() => onBack(), 800);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update template",
      );
    } finally {
      setLoading(false);
    }
  };

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ font: [] }, { size: ["small", false, "large", "huge"] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: COLOR_PALETTE }, { background: COLOR_PALETTE }],
        [{ script: "sub" }, { script: "super" }],
        [{ header: 1 }, { header: 2 }, "blockquote", "code-block"],
        [
          { list: "ordered" },
          { list: "bullet" },
          { indent: "-1" },
          { indent: "+1" },
        ],
        [{ direction: "rtl" }, { align: [] }],
        ["link", "image", "video"],
        ["clean"],
      ],
      history: {
        delay: 500,
        maxStack: 100,
        userOnly: true,
      },
    }),
    [],
  );

  const formats = [
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
    "code-block",
    "list",
    "bullet",
    "indent",
    "direction",
    "align",
    "link",
    "image",
    "video",
    "clean",
  ];

  const filteredPlaceholders = useMemo(() => {
    return placeholders.filter((p) =>
      String(p).toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [placeholders, searchTerm]);

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col font-poppins animate-in slide-in-from-bottom-2 duration-300">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

            .ql-toolbar.ql-snow {
              border: none !important;
              border-bottom: 1px solid #e5e7eb !important;
              padding: 10px 14px !important;
              background-color: #fafbfc;
              padding-right: 280px !important;
              position: relative;
              z-index: 10;
            }
            .ql-container.ql-snow {
              border: none !important;
              font-family: inherit;
              font-size: 13px;
              min-height: 380px;
            }
            .ql-editor {
              min-height: 380px;
              line-height: 1.6;
              padding: 18px;
            }
            .ql-snow .ql-color, 
            .ql-snow .ql-background {
              display: inline-block !important;
              vertical-align: middle !important;
            }
            .ql-snow .ql-color .ql-picker-label svg,
            .ql-snow .ql-background .ql-picker-label svg {
              width: 18px !important;
              height: 18px !important;
            }
            .ql-snow .ql-color-picker .ql-picker-options {
              width: 172px !important;
              padding: 6px !important;
              border-radius: 10px !important;
              box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
              border: 1px solid #e5e7eb !important;
              background-color: #ffffff !important;
              z-index: 9999 !important;
            }
            .ql-snow .ql-picker.ql-expanded .ql-picker-options {
              display: block !important;
            }
            .ql-snow .ql-color-picker .ql-picker-item {
              width: 18px !important;
              height: 18px !important;
              margin: 2px !important;
              border-radius: 4px !important;
              border: 1px solid rgba(0, 0, 0, 0.12) !important;
              cursor: pointer !important;
              float: left !important;
            }
            .ql-snow .ql-color-picker .ql-picker-item:hover {
              transform: scale(1.15);
              border-color: #000 !important;
            }
          `,
        }}
      />

      {/* --- HEADER --- */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} className="text-gray-500" />
            </button>
          )}
          <div className="flex items-center gap-2 border-l pl-3">
            <h2 className="text-[16px] font-semibold text-gray-800 tracking-tight">
              Edit Email Template
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Company 8 Exclusive Admin Badge */}
          {isCompany8 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-lg border border-amber-200">
              <ShieldCheck size={13} className="text-amber-600" />
              <span className="text-[10px] font-semibold text-amber-800 uppercase">
                System Admin (Company 8)
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
            <Mail size={12} className="text-emerald-600" />
            <span className="text-[10px] font-semibold text-emerald-700 uppercase">
              Email Template
            </span>
          </div>
        </div>
      </div>

      {/* --- FORM BODY --- */}
      <div className="p-8 flex flex-col gap-6 max-h-[78vh] overflow-y-auto no-scrollbar bg-[#FAFBFC]">
        {/* Row 1: Locked Purpose, Name & Company 8 Checkbox */}
        <div
          className={`grid grid-cols-1 ${
            isCompany8 ? "md:grid-cols-3" : "md:grid-cols-2"
          } gap-5`}
        >
          {/* Locked Category / Purpose */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
              Category / Purpose
            </label>
            <div className="w-full px-5 py-3 bg-gray-100 border border-gray-200 rounded-xl text-[12px] text-gray-500 font-medium flex justify-between items-center cursor-not-allowed">
              {initialData?.purpose?.replace(/_/g, " ")}
              <Lock size={14} />
            </div>
          </div>

          {/* Template Title */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Template Name <span className="text-red-500">*</span>
              </label>

              {/* Informational Guidelines Popover */}
              <div className="relative group flex items-center">
                <div className="cursor-pointer p-0.5 rounded-full hover:bg-gray-100 transition-colors">
                  <Info size={15} className="text-blue-500" />
                </div>
                <div className="absolute right-0 top-full mt-2 w-[420px] max-h-[380px] overflow-y-auto no-scrollbar hidden group-hover:block bg-white text-gray-700 text-[12px] font-normal rounded-xl p-5 shadow-2xl border border-gray-200 z-[100] transition-all normal-case tracking-normal">
                  <h3 className="text-[14px] font-semibold text-gray-900 mb-2">
                    Template Placeholder Guidelines
                  </h3>
                  <p className="mb-2 leading-relaxed text-gray-600">
                    When customizing a template, you can use the available
                    placeholders shown in the{" "}
                    <span className="font-semibold text-gray-800 italic">
                      Placeholder
                    </span>{" "}
                    dropdown.
                  </p>
                  <p className="mb-2 leading-relaxed text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <strong className="font-semibold">Important:</strong> The
                    dropdown contains placeholders from all templates available
                    in the system. Please use{" "}
                    <span className="italic font-semibold underline">
                      only the placeholders that are applicable to the specific
                      template you are currently editing
                    </span>
                    .
                  </p>
                  <p className="mb-3 leading-relaxed text-gray-600">
                    Each template has its own set of relevant placeholders, and
                    placeholders are named according to their intended template
                    purpose to help you identify the correct ones.
                  </p>

                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-gray-800 mb-2">
                    How to use placeholders
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 mb-3 text-gray-600">
                    <li>
                      Select a placeholder from the dropdown and insert it into
                      the{" "}
                      <span className="font-semibold text-gray-800 italic">
                        Subject
                      </span>{" "}
                      or{" "}
                      <span className="font-semibold text-gray-800 italic">
                        Body HTML
                      </span>{" "}
                      where required.
                    </li>
                    <li>
                      Use only placeholders relevant to the current template.
                    </li>
                    <li>
                      Do not manually modify the placeholder name or syntax.
                    </li>
                    <li>
                      Placeholders must be used in the format{" "}
                      <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-[11px] text-gray-800">
                        {"{{.PlaceholderName}}"}
                      </code>
                      .
                    </li>
                    <li>
                      Generic placeholders may be available for use across
                      multiple templates where applicable.
                    </li>
                    <li>
                      Using a placeholder that is not supported by the current
                      template may result in the value not being populated
                      correctly when the template is generated or sent.
                    </li>
                  </ul>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 mb-2.5 text-gray-600">
                    <p className="font-semibold text-gray-800 mb-1 text-[11px]">
                      Example:
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      If you are editing an{" "}
                      <span className="font-medium italic text-gray-700">
                        Employee Leave Approval
                      </span>{" "}
                      template, use placeholders provided for leave-related
                      information such as employee name, leave dates, leave
                      type, etc.
                    </p>
                    <p className="text-[11px] leading-relaxed mt-1 text-red-600 font-medium">
                      Do not use placeholders that belong specifically to
                      unrelated templates such as payroll, onboarding,
                      attendance, or other modules.
                    </p>
                  </div>

                  <div className="border-l-2 border-blue-500 pl-2.5 py-0.5 text-gray-600 italic text-[11px] bg-blue-50/50 rounded-r">
                    <span className="font-semibold not-italic text-blue-700">
                      Tip:
                    </span>{" "}
                    Always select placeholders from the dropdown instead of
                    typing them manually. The placeholder name and syntax should
                    remain exactly as provided.
                  </div>
                </div>
              </div>
            </div>

            <input
              type="text"
              placeholder="e.g. Experience Letter"
              className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-[12px] focus:ring-1 focus:ring-black outline-none transition-all"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Company 8 Exclusive Checkbox */}
          {isCompany8 && (
            <div className="flex flex-col justify-center gap-1.5 bg-white border border-amber-200/80 rounded-xl px-4 py-2.5">
              <label className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                System Preset Configuration
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(isDefault)}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black cursor-pointer"
                />
                <span className="text-[12px] text-gray-700 font-medium">
                  Set as Default Template {isDefault ? "true" : "false"}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Row 2: Email Subject */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
            Email Subject
          </label>
          <input
            type="text"
            placeholder="e.g. Experience Letter Notification"
            className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-[12px] focus:ring-1 focus:ring-black outline-none transition-all"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* --- QUILL EDITOR CONTAINER --- */}
        <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="absolute right-3 top-2 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400 border-r border-gray-200 pr-2">
              <button
                type="button"
                onClick={handleUndo}
                title="Undo"
                className="hover:text-gray-700 transition-colors p-1 cursor-pointer"
              >
                <Undo2 size={15} />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                title="Redo"
                className="hover:text-gray-700 transition-colors p-1 cursor-pointer"
              >
                <Redo2 size={15} />
              </button>
            </div>

            {/* Placeholder Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPlaceholderMenu((prev) => !prev)}
                className="flex items-center gap-1 text-[11px] text-gray-700 font-semibold uppercase tracking-tight hover:text-black py-0.5 px-1 cursor-pointer"
              >
                Insert Placeholder <ChevronDown size={14} />
              </button>

              {showPlaceholderMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto no-scrollbar py-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 pb-2 border-b border-gray-50">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                      <Search size={12} className="text-gray-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-[11px] outline-none text-gray-700 font-poppins"
                        autoFocus
                      />
                    </div>
                  </div>

                  {loadingPlaceholders ? (
                    <div className="px-4 py-3 text-[11px] text-gray-400 text-center flex items-center justify-center gap-2">
                      <Loader2 size={12} className="animate-spin" />
                      <span>Loading tags...</span>
                    </div>
                  ) : filteredPlaceholders.length === 0 ? (
                    <div className="px-4 py-3 text-[11px] text-gray-400 text-center">
                      No placeholders found
                    </div>
                  ) : (
                    filteredPlaceholders.map((keyName) => (
                      <button
                        type="button"
                        key={keyName}
                        onClick={() => insertPlaceholder(keyName)}
                        className="w-full text-left px-4 py-2 text-[12px] hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-50 last:border-0 cursor-pointer font-mono"
                      >
                        {`{{.${keyName}}}`}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
          />
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="p-5 bg-white border-t border-gray-100 flex justify-end items-center gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="px-6 py-2.5 text-[12px] font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            Discard Changes
          </button>
        )}
        <GlowButton onClick={handleUpdate} disabled={loading}>
          <div className="flex items-center gap-2">
            <Save size={16} />
            {loading ? "Updating..." : "Save Changes"}
          </div>
        </GlowButton>
      </div>
    </div>
  );
};

export default EditEmailTemplateView;
