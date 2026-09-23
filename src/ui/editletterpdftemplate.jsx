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
  FileText,
  Search,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import GlowButton from "../components/helpers/glowbutton";
import { updateLetterPdfTemplateService } from "../service/companyService";
import { fetchEmailPlaceholders } from "../service/mainServices";

// Quill palette with leading empty string for default color reset
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

const EditLetterPdfTemplateView = ({
  onBack,
  initialData,
  onSuccess,
  companyId: propCompanyId,
}) => {
  const quillRef = useRef(null);

  // Check if current user/template belongs to Company 8
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
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return (
        Number(user?.company_id || localStorage.getItem("company_id") || 0) ===
        8
      );
    } catch {
      return false;
    }
  }, [propCompanyId, initialData]);

  // Form States
  const [templateName, setTemplateName] = useState("");
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
      setTemplateName(initialData.name || "");
      setContent(initialData.body_html || initialData.body || "");
      setIsDefault(Boolean(initialData.is_default));
    }
  }, [initialData]);

  // Fetch Placeholders
  useEffect(() => {
    const loadPlaceholders = async () => {
      setLoadingPlaceholders(true);
      try {
        const data = await fetchEmailPlaceholders();
        const placeholderList = (data || []).map(
          (item) => item.placeholder || item.label || item,
        );
        setPlaceholders(placeholderList);
      } catch (err) {
        console.error("Failed to load placeholders:", err);
      } finally {
        setLoadingPlaceholders(false);
      }
    };
    loadPlaceholders();
  }, []);

  // History operations
  const handleUndo = () => quillRef.current?.getEditor().history.undo();
  const handleRedo = () => quillRef.current?.getEditor().history.redo();

  // Insert placeholder token at current cursor position
  const insertPlaceholder = (placeholderKey) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const range = editor.getSelection(true);
    const token = `{{.${placeholderKey}}}`;
    const insertIndex = range ? range.index : editor.getLength();

    editor.insertText(insertIndex, token, "user");
    editor.setSelection(insertIndex + token.length);
    setShowPlaceholderMenu(false);
    toast.success(`Inserted ${token}`);
  };

  // Submit Update
  const handleUpdate = async () => {
    if (!templateName.trim() || !content.trim()) {
      toast.error("Template name and content are required");
      return;
    }

    if (!initialData?.id) {
      toast.error("Invalid template ID");
      return;
    }

    setLoading(true);

    const bodyContent = content.trim();
    const finalHtml = bodyContent.startsWith("<html>")
      ? bodyContent
      : `<html><body>${bodyContent}</body></html>`;

    // Base payload matching schema
    const payload = {
      name: templateName.trim(),
      purpose: initialData?.purpose || "",
      subject: "",
      body_html: finalHtml,
      template_type: "pdf",
      is_default: isCompany8 ? Boolean(isDefault) : false,
    };

    try {
      const response = await updateLetterPdfTemplateService(
        initialData.id,
        payload,
      );
      toast.success(response?.message || "PDF template updated successfully!");

      if (onSuccess) {
        onSuccess();
      } else if (onBack) {
        setTimeout(() => onBack(), 800);
      }
    } catch (err) {
      toast.error(
        err?.message ||
          err?.error ||
          err?.detail ||
          "Failed to update template",
      );
    } finally {
      setLoading(false);
    }
  };

  // Quill Toolbar Modules
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

  const filteredPlaceholders = placeholders.filter((p) =>
    p.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col font-poppins animate-in slide-in-from-bottom-2 duration-300">
      {/* Quill & Color Picker Dropdown Styles */}
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
              Edit PDF Letter Template
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCompany8 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-lg border border-amber-200">
              <ShieldCheck size={13} className="text-amber-600" />
              <span className="text-[10px] font-semibold text-amber-800 uppercase">
                System Admin (Company 8)
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-100">
            <FileText size={12} className="text-blue-600" />
            <span className="text-[10px] font-semibold text-blue-700 uppercase">
              PDF Template
            </span>
          </div>
        </div>
      </div>

      {/* --- FORM BODY --- */}
      <div className="p-8 flex flex-col gap-6 max-h-[78vh] overflow-y-auto no-scrollbar bg-[#FAFBFC]">
        {/* Row 1: Locked Purpose, Name & Company 8 Toggle */}
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

              <div className="relative group flex items-center">
                <div className="cursor-pointer p-0.5 rounded-full hover:bg-gray-100 transition-colors">
                  <Info size={16} className="text-blue-500" />
                </div>
                <div className="absolute right-0 top-full mt-2 w-[380px] max-h-80 overflow-y-auto no-scrollbar hidden group-hover:block bg-white text-black text-[13px] font-normal rounded-xl p-5 shadow-2xl border border-gray-200 z-[100] transition-all normal-case tracking-normal">
                  <div className="text-[14px] font-semibold mb-2 text-black">
                    Template Placeholder Guidelines
                  </div>
                  <p className="text-gray-600 mb-2 leading-relaxed">
                    Insert dynamic tags using the <em>Insert Placeholder</em>{" "}
                    dropdown. These tokens resolve when generating PDFs.
                  </p>
                  <p className="text-gray-600 leading-relaxed font-mono text-xs">
                    Format: {"{{.PlaceholderName}}"}
                  </p>
                </div>
              </div>
            </div>

            <input
              type="text"
              placeholder="e.g. Experience Letter"
              className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-[12px] focus:ring-1 focus:ring-black outline-none transition-all"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          {/* UI Flag: Rendered EXCLUSIVELY for Company 8 */}
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
                  className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black cursor-pointer"
                />
                <span className="text-[12px] text-gray-700 font-medium">
                  Set as Default Template {isDefault ? "true" : "false"}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* --- QUILL EDITOR CONTAINER --- */}
        <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Action Group Mounted Over Toolbar Top-Right */}
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
                onClick={() => setShowPlaceholderMenu(!showPlaceholderMenu)}
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
                        className="w-full bg-transparent text-[11px] outline-none text-gray-700"
                        autoFocus
                      />
                    </div>
                  </div>

                  {loadingPlaceholders ? (
                    <div className="px-4 py-3 text-[11px] text-gray-400 text-center flex items-center justify-center gap-2">
                      <Loader2 size={12} className="animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : filteredPlaceholders.length === 0 ? (
                    <div className="px-4 py-3 text-[11px] text-gray-400 text-center">
                      No placeholders found
                    </div>
                  ) : (
                    filteredPlaceholders.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => insertPlaceholder(item)}
                        className="w-full text-left px-4 py-2 text-[12px] hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-50 last:border-0 cursor-pointer font-mono"
                      >
                        {`{{.${item}}}`}
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

export default EditLetterPdfTemplateView;
