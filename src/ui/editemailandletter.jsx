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
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { updateEmailTemplateService } from "../service/mainServices";
import GlowButton from "../components/helpers/glowbutton";

const EditEmailTemplateView = ({
  onBack,
  initialData,
  availablePlaceholders = [],
}) => {
  const quillRef = useRef(null);

  // --- Form States ---
  const [templateTitle, setTemplateTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTemplateTitle(initialData.name || "");
      setSubject(initialData.subject || "");
      setContent(initialData.body_html || initialData.body || "");
    }
  }, [initialData]);

  const handleUndo = () => quillRef.current?.getEditor().history.undo();
  const handleRedo = () => quillRef.current?.getEditor().history.redo();

  const insertPlaceholder = (placeholder) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const range = editor.getSelection(true);
    const token = `{{.${placeholder}}}`;
    const insertIndex = range ? range.index : editor.getLength();

    editor.insertText(insertIndex, token, "user");
    editor.setSelection(insertIndex + token.length);
    setShowPlaceholderMenu(false);
  };

  const handleUpdate = async () => {
    if (!templateTitle || !subject) {
      toast.error("Template name and subject are required");
      return;
    }

    setLoading(true);
    try {
      await updateEmailTemplateService({
        id: initialData?.id,
        purpose: initialData?.purpose,
        name: templateTitle,
        subject: subject,
        body_html: content,
      });
      toast.success("Template updated successfully!");
      setTimeout(() => onBack(), 1000);
    } catch (err) {
      toast.error(err.message || "Failed to update template");
    } finally {
      setLoading(false);
    }
  };

  // --- Complete Quill Toolbar Configuration ---
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ font: [] }, { size: ["small", false, "large", "huge"] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        // Empty array [] generates full spectrum color pickers
        [{ color: [] }, { background: [] }],
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

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col font-poppins animate-in slide-in-from-bottom-2 duration-300">
      <Toaster position="top-right" />

      {/* Editor & Scrollbar Polish */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            
            /* Quill Layout Tuning */
            .ql-toolbar.ql-snow {
              border: none !important;
              border-bottom: 1px solid #e5e7eb !important;
              padding: 10px 14px !important;
              background-color: #fafbfc;
              padding-right: 280px !important; /* Leaves breathing room for custom toolbar actions */
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
          `,
        }}
      />

      {/* --- HEADER --- */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div className="flex items-center gap-2 border-l pl-3">
            <h2 className="text-[16px] font-semibold text-gray-800 tracking-tight">
              Edit Email Template
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">
          <Lock size={12} className="text-amber-600" />
          <span className="text-[10px] font-semibold text-amber-700 uppercase">
            Purpose Locked
          </span>
        </div>
      </div>

      {/* --- FORM BODY --- */}
      <div className="p-8 flex flex-col gap-6 max-h-[78vh] overflow-y-auto no-scrollbar bg-[#FAFBFC]">
        {/* Row 1: Purpose */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
            Category / Purpose
          </label>
          <div className="w-full px-5 py-3 bg-gray-100 border border-gray-200 rounded-xl text-[12px] text-gray-500 font-medium flex justify-between items-center cursor-not-allowed">
            {initialData?.purpose?.replace(/_/g, " ")}
            <Lock size={14} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Template Title */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Template Name
              </label>

              <div className="relative group flex items-center">
                <div className="cursor-pointer p-0.5 rounded-full hover:bg-gray-100 transition-colors animate-bounce">
                  <Info size={16} className="text-blue-500" />
                </div>
                <div className="absolute right-0 top-full mt-2 w-[420px] max-h-96 overflow-y-auto no-scrollbar hidden group-hover:block bg-white text-black text-[13px] font-normal rounded-xl p-5 shadow-2xl border border-gray-200 z-[100] transition-all normal-case tracking-normal">
                  <div className="text-[15px] font-normal mb-2 text-black">
                    Template Placeholder Guidelines
                  </div>
                  <p className="text-black mb-2.5 leading-relaxed font-normal">
                    When customizing a template, you can use the available
                    placeholders shown in the <em>Placeholder</em> dropdown.
                  </p>
                  <p className="text-black mb-2.5 leading-relaxed font-normal">
                    <em>Important:</em> The dropdown contains placeholders from
                    all templates. Use only relevant keys in the format{" "}
                    <code>{"{{.PlaceholderName}}"}</code>.
                  </p>
                </div>
              </div>
            </div>

            <input
              type="text"
              className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-[12px] focus:ring-1 focus:ring-black outline-none transition-all"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
            />
          </div>

          {/* Subject Line */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
              Email Subject
            </label>
            <input
              type="text"
              className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-[12px] focus:ring-1 focus:ring-black outline-none transition-all"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        </div>

        {/* --- EDITOR CONTAINER --- */}
        <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Custom Action Group Mounted Over Toolbar Top-Right */}
          <div className="absolute right-3 top-2 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400 border-r border-gray-200 pr-2">
              <button
                type="button"
                onClick={handleUndo}
                title="Undo"
                className="hover:text-gray-700 transition-colors p-1"
              >
                <Undo2 size={15} />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                title="Redo"
                className="hover:text-gray-700 transition-colors p-1"
              >
                <Redo2 size={15} />
              </button>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPlaceholderMenu(!showPlaceholderMenu)}
                className="flex items-center gap-1 text-[11px] text-gray-700 font-semibold uppercase tracking-tight hover:text-black py-0.5 px-1"
              >
                Insert Placeholder <ChevronDown size={14} />
              </button>
              {showPlaceholderMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto no-scrollbar py-2">
                  {availablePlaceholders.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => insertPlaceholder(item)}
                      className="w-full text-left px-4 py-2 text-[12px] hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-50 last:border-0"
                    >
                      {`{{.${item}}}`}
                    </button>
                  ))}
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
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 text-[12px] font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          Discard Changes
        </button>
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
