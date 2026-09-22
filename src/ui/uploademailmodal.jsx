import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  ArrowLeft,
  UploadCloud,
  FileCode,
  Undo2,
  Redo2,
  ChevronDown,
  Search,
  Loader2,
  Info,
  ShieldCheck,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import {
  fetchEmailPurposes,
  fetchEmailPlaceholders,
} from "../service/mainServices";

// Universal color palette for Quill
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

const UploadEmailTemplateView = ({
  onBack,
  onSuccess,
  companyId: propCompanyId,
}) => {
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);

  // Active Company ID Detection
  const currentCompanyId = useMemo(() => {
    if (propCompanyId !== undefined && propCompanyId !== null) {
      return Number(propCompanyId);
    }
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return Number(
        user?.company_id || localStorage.getItem("company_id") || 0,
      );
    } catch {
      return 0;
    }
  }, [propCompanyId]);

  const isCompany8 = currentCompanyId === 8;

  // Form States
  const [file, setFile] = useState(null);
  const [templateTitle, setTemplateTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isManual, setIsManual] = useState(true);
  const [isDefault, setIsDefault] = useState(isCompany8);

  // Purpose & Placeholders State
  const [emailPurposes, setEmailPurposes] = useState([]);
  const [purposesLoading, setPurposesLoading] = useState(false);
  const [placeholders, setPlaceholders] = useState([]);
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingPlaceholders, setLoadingPlaceholders] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load Purposes & Placeholders
  useEffect(() => {
    const loadData = async () => {
      setPurposesLoading(true);
      setLoadingPlaceholders(true);
      try {
        const [purposesData, placeholdersData] = await Promise.all([
          fetchEmailPurposes(),
          fetchEmailPlaceholders(),
        ]);

        const pList = purposesData || [];
        setEmailPurposes(pList);
        if (pList.length > 0) {
          setPurpose(pList[0]);
        }

        const placeholderList = (placeholdersData || []).map(
          (item) => item.placeholder || item.label || item,
        );
        setPlaceholders(placeholderList);
      } catch (err) {
        console.error("Failed to load template assets:", err);
      } finally {
        setPurposesLoading(false);
        setLoadingPlaceholders(false);
      }
    };

    loadData();
  }, []);

  // File Upload Reader
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (
      !selectedFile.name.endsWith(".html") &&
      !selectedFile.name.endsWith(".htm")
    ) {
      toast.error("Please upload a valid HTML file (.html, .htm)");
      return;
    }

    setFile(selectedFile);
    if (!templateTitle) {
      const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTemplateTitle(fileNameWithoutExt);
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setContent(ev.target.result || "");
      toast.success("File imported into editor!");
    };
    reader.readAsText(selectedFile);
  };

  // Editor Actions
  const handleUndo = () => quillRef.current?.getEditor().history.undo();
  const handleRedo = () => quillRef.current?.getEditor().history.redo();

  const handlePurposeChange = (e) => {
    const rawVal = e.target.value;
    setPurpose(rawVal.replace(/\s+/g, "_").toLowerCase());
  };

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

  // Multipart Submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (
      !templateTitle.trim() ||
      !purpose.trim() ||
      !subject.trim() ||
      !content.trim()
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Uploading email template...");

    try {
      const formData = new FormData();

      // Field: name (text)
      formData.append("name", templateTitle.trim());

      // Field: purpose (text)
      formData.append("purpose", purpose.trim());

      // Field: subject (text)
      formData.append("subject", subject.trim());

      // Field: is_manual (text "true"/"false")
      formData.append("is_manual", isManual ? "true" : "false");

      // Field: is_default (text "true"/"false")
      formData.append(
        "is_default",
        isCompany8 ? (isDefault ? "true" : "false") : "false",
      );

      // Field: file (file binary payload)
      let formattedHtml = content.trim();
      if (!formattedHtml.startsWith("<html>")) {
        formattedHtml = `<html><body>${formattedHtml}</body></html>`;
      }

      const blob = new Blob([formattedHtml], { type: "text/html" });
      const htmlFile = new File(
        [blob],
        file?.name ||
          `${templateTitle.toLowerCase().replace(/\s+/g, "_")}.html`,
        { type: "text/html" },
      );
      formData.append("file", htmlFile);

      await axios.post(
        "https://crossing-fioricet-postcard-jurisdiction.trycloudfare.com/admin/upload/templates",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      toast.success("Email template uploaded successfully!", {
        id: loadingToast,
      });

      if (onSuccess) {
        onSuccess();
      } else if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error("Upload Error:", error);
      const errMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to upload email template. Check tunnel connection.";
      toast.error(errMsg, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const modules = {
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
    history: { delay: 500, maxStack: 100, userOnly: true },
  };

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
      {/* Editor Scoped Styles */}
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
              className="p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-black"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex items-center gap-2 border-l pl-3">
            <h2 className="text-[16px] font-semibold text-gray-800 tracking-tight">
              Upload Email Template
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
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
            <UploadCloud size={12} className="text-emerald-600" />
            <span className="text-[10px] font-semibold text-emerald-700 uppercase">
              Upload Template
            </span>
          </div>
        </div>
      </div>

      {/* --- FORM BODY --- */}
      <div className="p-8 flex flex-col gap-6 max-h-[78vh] overflow-y-auto no-scrollbar bg-[#FAFBFC]">
        {/* Dropzone for File Upload */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
            file
              ? "border-black bg-gray-50/50"
              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center gap-3 text-left w-full justify-between px-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center">
                  <FileCode size={18} />
                </div>
                <div>
                  <p className="text-[12px] font-medium text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB • Loaded into editor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setContent("");
                }}
                className="text-[11px] text-red-500 hover:underline px-2 cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <UploadCloud size={22} className="text-gray-400 mb-1" />
              <p className="text-[12px] font-medium text-gray-700">
                Click to browse or drop an HTML template file
              </p>
              <p className="text-[11px] text-gray-400">
                Accepts standard (.html, .htm) files
              </p>
            </div>
          )}
        </div>

        {/* Row 1: Name & Purpose */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Template Name <span className="text-red-500">*</span>
              </label>

              <div className="relative group flex items-center">
                <div className="cursor-pointer p-0.5 rounded-full hover:bg-gray-100 transition-colors">
                  <Info size={15} className="text-blue-500" />
                </div>
                <div className="absolute right-0 top-full mt-2 w-[340px] max-h-72 overflow-y-auto no-scrollbar hidden group-hover:block bg-white text-black text-[12px] font-normal rounded-xl p-4 shadow-2xl border border-gray-200 z-[100] transition-all normal-case tracking-normal">
                  <div className="text-[13px] font-semibold mb-1 text-black">
                    Placeholder Tokens
                  </div>
                  <p className="text-gray-600 mb-2 leading-relaxed">
                    Insert dynamic variables using the{" "}
                    <em>Insert Placeholder</em> tool in the toolbar.
                  </p>
                  <p className="text-gray-500 font-mono text-[11px]">
                    Format: {"{{.FieldName}}"}
                  </p>
                </div>
              </div>
            </div>

            <input
              type="text"
              placeholder="e.g. Welcome Onboarding Template"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[12px] focus:ring-1 focus:ring-black outline-none transition-all"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
              Category / Purpose Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                list="purposes-datalist"
                placeholder="e.g. user_activation"
                value={purpose}
                onChange={handlePurposeChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[12px] focus:ring-1 focus:ring-black outline-none transition-all"
                disabled={loading || purposesLoading}
              />
              <datalist id="purposes-datalist">
                {emailPurposes.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Row 2: Subject */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
            Email Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Welcome to the Team!"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[12px] focus:ring-1 focus:ring-black outline-none transition-all"
            disabled={loading}
          />
        </div>

        {/* Row 3: Flags Configuration */}
        <div
          className={`grid grid-cols-1 ${
            isCompany8 ? "md:grid-cols-2" : "md:grid-cols-1"
          } gap-4`}
        >
          {/* Default Template Flag - ONLY VISIBLE FOR COMPANY 8 */}
          {isCompany8 && (
            <div className="flex items-center justify-between bg-white border border-amber-100 rounded-xl px-4 py-2.5 shadow-2xs">
              <div>
                <span className="text-[12px] text-amber-900 font-medium block">
                  System Preset Default
                </span>
                <span className="text-[10px] text-gray-400 block">
                  Save as system-wide default (`is_default: "true"`)
                </span>
              </div>
              <input
                type="checkbox"
                id="isDefault"
                checked={Boolean(isDefault)}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black cursor-pointer"
                disabled={loading}
              />
            </div>
          )}

          {/* Manual Template Flag */}
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-2xs">
            <div>
              <span className="text-[12px] text-gray-800 font-medium block">
                Manual Dispatch
              </span>
              <span className="text-[10px] text-gray-400 block">
                Allow manual send triggering (`is_manual: "true"`)
              </span>
            </div>
            <input
              type="checkbox"
              id="isManual"
              checked={Boolean(isManual)}
              onChange={(e) => setIsManual(e.target.checked)}
              className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black cursor-pointer"
              disabled={loading}
            />
          </div>
        </div>

        {/* Quill Editor */}
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
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto no-scrollbar py-2 animate-in fade-in zoom-in-95 duration-100">
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
            onChange={(val) => setContent(val)}
            modules={modules}
            formats={formats}
          />
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="p-5 bg-white border-t border-gray-100 flex justify-end items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="px-6 py-2.5 text-[12px] font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl text-[12px] hover:bg-gray-800 transition-all shadow-sm cursor-pointer disabled:opacity-50 font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Save size={14} />
              <span>Upload Template</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadEmailTemplateView;
