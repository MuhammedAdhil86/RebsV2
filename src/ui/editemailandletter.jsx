import React, { useState, useRef, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  Mail,
  ChevronDown,
  Undo2,
  Redo2,
  ArrowLeft,
  Lock,
  Save,
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
  const [templateTitle, setTemplateTitle] = useState(initialData?.name || "");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [content, setContent] = useState(initialData?.body || "");
  const [loading, setLoading] = useState(false);
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);

  const handleUndo = () => quillRef.current?.getEditor().history.undo();
  const handleRedo = () => quillRef.current?.getEditor().history.redo();

  const insertPlaceholder = (placeholder) => {
    const editor = quillRef.current?.getEditor();
    const range = editor.getSelection(true);
    const token = `{{.${placeholder}}}`;
    editor.insertText(range?.index || 0, token, "user");
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
        purpose: initialData?.purpose, // Using original purpose (Immutable)
        name: templateTitle,
        subject: subject,
        body_html: content,
      });
      toast.success("Template updated successfully!");
      setTimeout(() => onBack(), 1000); // Back to list
    } catch (err) {
      toast.error(err.message || "Failed to update template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col font-poppins animate-in slide-in-from-bottom-2 duration-300">
      <Toaster position="top-right" />

      {/* --- HEADER --- */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
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
      <div className="p-8 flex flex-col gap-6 max-h-[75vh] overflow-y-auto bg-[#FAFBFC]">
        {/* Row 1: Read-Only Purpose Display */}
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
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
              Template Name
            </label>
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

        {/* --- EDITOR --- */}
        <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="absolute right-4 top-[10px] z-10 flex items-center gap-3 bg-white px-2 rounded-lg py-1 border border-gray-50 shadow-sm">
            <div className="flex items-center gap-3 text-gray-300 border-r pr-3">
              <Undo2
                size={16}
                className="cursor-pointer hover:text-black transition-colors"
                onClick={handleUndo}
              />
              <Redo2
                size={16}
                className="cursor-pointer hover:text-black transition-colors"
                onClick={handleRedo}
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowPlaceholderMenu(!showPlaceholderMenu)}
                className="flex items-center gap-1 text-[11px] text-gray-600 font-semibold uppercase tracking-tight"
              >
                Insert Placeholder <ChevronDown size={14} />
              </button>
              {showPlaceholderMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto py-2">
                  {availablePlaceholders.map((item) => (
                    <button
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
            className="min-h-[350px] text-[13px]"
          />
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="p-5 bg-white border-t border-gray-100 flex justify-end items-center gap-4">
        <button
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
