import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  ArrowLeft,
  Mail,
  ChevronDown,
  Undo2,
  Redo2,
  Search,
  Loader2,
  Info,
  ShieldCheck,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import GlowButton from "../components/helpers/glowbutton";
import {
  fetchEmailPurposes,
  fetchEmailPlaceholders,
  updateEmailTemplateService,
} from "../service/mainServices";
import useEmailTemplateStore from "../store/emailtemplateStore";

// Universal color palette
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
  templateData,
  initialData,
  onBack,
  onSuccess,
  companyId: propCompanyId,
}) => {
  const currentData = templateData || initialData;
  const quillRef = useRef(null);
  const { loadTemplates } = useEmailTemplateStore();

  // Robust detection for Company 8 (System Admin)
  const isCompany8 = useMemo(() => {
    if (
      propCompanyId !== undefined &&
      propCompanyId !== null &&
      Number(propCompanyId) > 0
    ) {
      return Number(propCompanyId) === 8;
    }
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : {};

      const candidateId =
        user?.company_id ??
        user?.companyId ??
        user?.company?.id ??
        user?.data?.company_id ??
        localStorage.getItem("company_id") ??
        localStorage.getItem("companyId") ??
        sessionStorage.getItem("company_id") ??
        0;

      return Number(candidateId) === 8;
    } catch {
      return false;
    }
  }, [propCompanyId]);

  // Form Fields pre-filled from template to edit
  const [templateTitle, setTemplateTitle] = useState(currentData?.name || "");
  const [purpose, setPurpose] = useState(currentData?.purpose || "");
  const [subject, setSubject] = useState(currentData?.subject || "");
  const [content, setContent] = useState(currentData?.body_html || "");
  const [isManual, setIsManual] = useState(Boolean(currentData?.is_manual));
  const [isDefault, setIsDefault] = useState(Boolean(currentData?.is_default));

  // Dropdowns & Placeholders
  const [emailPurposes, setEmailPurposes] = useState([]);
  const [purposesLoading, setPurposesLoading] = useState(false);
  const [placeholders, setPlaceholders] = useState([]);
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingPlaceholders, setLoadingPlaceholders] = useState(false);

  const [loading, setLoading] = useState(false);

  // Sync state when template prop updates
  useEffect(() => {
    if (currentData) {
      setTemplateTitle(currentData.name || "");
      setPurpose(currentData.purpose || "");
      setSubject(currentData.subject || "");
      setContent(currentData.body_html || "");
      setIsManual(Boolean(currentData.is_manual));
      setIsDefault(Boolean(currentData.is_default));
    }
  }, [currentData]);

  // ---------------- Load Purposes & Placeholders ----------------
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setPurposesLoading(true);
      setLoadingPlaceholders(true);

      try {
        const [purposesData, placeholdersData] = await Promise.all([
          fetchEmailPurposes(),
          fetchEmailPlaceholders(),
        ]);

        if (isMounted) {
          const rawPurposes = Array.isArray(purposesData)
            ? purposesData
            : purposesData?.data || [];
          setEmailPurposes(rawPurposes);

          const rawPlaceholders = Array.isArray(placeholdersData)
            ? placeholdersData
            : placeholdersData?.data || [];

          const placeholderList = rawPlaceholders
            .map((item) =>
              typeof item === "string"
                ? item
                : item?.placeholder || item?.label || "",
            )
            .filter(Boolean);

          setPlaceholders(placeholderList);
        }
      } catch (error) {
        console.error("Failed to load dependencies:", error);
      } finally {
        if (isMounted) {
          setPurposesLoading(false);
          setLoadingPlaceholders(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ---------------- Editor & Placeholder Handlers ----------------
  const handleUndo = () => quillRef.current?.getEditor().history.undo();
  const handleRedo = () => quillRef.current?.getEditor().history.redo();

  // Insert placeholder (handles text vs. logo tag intelligently)
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

  // ---------------- Handle Submit ----------------
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

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
    const loadingToast = toast.loading("Updating email template...");

    const trimmedContent = content.trim();
    const finalHtml = trimmedContent.startsWith("<html>")
      ? trimmedContent
      : `<html><body>${trimmedContent}</body></html>`;

    const payload = {
      id: currentData?.id,
      name: templateTitle.trim(),
      purpose: purpose.trim(),
      subject: subject.trim(),
      body_html: finalHtml,
      template_type: "mail",
      is_manual: Boolean(isManual),
      is_default: isCompany8 ? Boolean(isDefault) : false,
    };

    try {
      const response = await updateEmailTemplateService(payload);
      toast.success(
        response?.message ||
          response?.data?.message ||
          "Email template updated successfully!",
        { id: loadingToast },
      );

      if (loadTemplates) await loadTemplates();

      if (onSuccess) {
        onSuccess(response);
      } else if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error("Error updating email template:", error);
      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update email template.",
        { id: loadingToast },
      );
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
    String(p).toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col font-poppins animate-in slide-in-from-bottom-2 duration-300">
      {/* Editor Styles */}
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
              padding-right: 250px !important;
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
            .ql-editor img {
              display: inline-block;
              vertical-align: middle;
              border-radius: 4px;
              transition: all 0.2s ease;
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
              Mail Template
            </span>
          </div>
        </div>
      </div>

      {/* --- FORM BODY --- */}
      <div className="p-8 flex flex-col gap-6 max-h-[78vh] overflow-y-auto no-scrollbar bg-[#FAFBFC]">
        {/* Row 1: Name & Purpose */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              placeholder="e.g. User Activation Template"
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
                value={purpose}
                readOnly
                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-[12px] text-gray-500 cursor-not-allowed outline-none font-mono"
              />
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
            placeholder="e.g. Activate Your Account"
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
            <div className="flex items-center justify-between bg-white border border-amber-200/80 rounded-xl px-4 py-2.5 shadow-2xs">
              <div>
                <span className="text-[12px] text-amber-900 font-medium block">
                  System Preset Default
                </span>
                <span className="text-[10px] text-gray-400 block">
                  Save as default template: {isDefault ? "true" : "false"}
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
                Allow manual send triggering
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

        {/* --- QUILL EDITOR CONTAINER --- */}
        <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Action Tools Overlay on Quill Toolbar */}
          <div className="absolute right-3 top-2 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
            {/* History undo/redo */}
            <div className="flex items-center gap-1.5 text-gray-400 border-r border-gray-200 pr-2">
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

            {/* --- PLACEHOLDER MENU --- */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPlaceholderMenu((prev) => !prev)}
                className="flex items-center gap-1 text-[11px] text-gray-700 font-semibold uppercase tracking-tight hover:text-black py-0.5 px-1 cursor-pointer"
              >
                Insert Placeholder <ChevronDown size={14} />
              </button>

              {showPlaceholderMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto no-scrollbar py-2 animate-in fade-in zoom-in-95 duration-100">
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
                    filteredPlaceholders.map((keyName) => {
                      const isLogo = keyName.toLowerCase().includes("logo");
                      return (
                        <button
                          type="button"
                          key={keyName}
                          onClick={() => insertPlaceholder(keyName)}
                          className="w-full flex items-center justify-between px-4 py-2 text-[12px] hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-50 last:border-0 cursor-pointer font-mono"
                        >
                          <span className="truncate">{`{{.${keyName}}}`}</span>
                          {isLogo && (
                            <span className="text-[9px] font-sans font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0 ml-2">
                              Logo
                            </span>
                          )}
                        </button>
                      );
                    })
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

      {/* --- FOOTER WITH GLOWBUTTON --- */}
      <div className="p-5 bg-white border-t border-gray-100 flex justify-end items-center gap-4">
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
        <GlowButton onClick={handleSubmit} disabled={loading}>
          <div className="flex items-center gap-2">
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Update Template</span>
              </>
            )}
          </div>
        </GlowButton>
      </div>
    </div>
  );
};

export default EditEmailTemplateView;
