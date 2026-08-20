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

  // ✅ Keep state in sync with initialData whenever it populates/changes
  useEffect(() => {
    if (initialData) {
      setTemplateTitle(initialData.name || "");
      setSubject(initialData.subject || "");
      // Handles both body_html (from API response) and body (fallback)
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
    // Move cursor past inserted placeholder
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
        purpose: initialData?.purpose, // Original immutable purpose
        name: templateTitle,
        subject: subject,
        body_html: content,
      });
      toast.success("Template updated successfully!");
      setTimeout(() => onBack(), 1000); // Navigate back to list view
    } catch (err) {
      toast.error(err.message || "Failed to update template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col font-poppins animate-in slide-in-from-bottom-2 duration-300">
      <Toaster position="top-right" />

      {/* Hidden Scrollbar Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
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
      <div className="p-8 flex flex-col gap-6 max-h-[75vh] overflow-y-auto no-scrollbar bg-[#FAFBFC]">
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
          {/* Template Title with Info Icon */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Template Name
              </label>

              {/* Info Icon with Bouncing Animation and Hover Tooltip */}
              <div className="relative group flex items-center">
                <div className="cursor-pointer p-0.5 rounded-full hover:bg-gray-100 transition-colors animate-bounce">
                  <Info size={16} className="text-blue-500" />
                </div>

                {/* Tooltip Content */}
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
                    all templates available in the system. Please use{" "}
                    <em>
                      only the placeholders that are applicable to the specific
                      template you are currently editing
                    </em>
                    .
                  </p>
                  <p className="text-black mb-3 leading-relaxed font-normal">
                    Each template has its own set of relevant placeholders, and
                    placeholders are named according to their intended template
                    purpose to help you identify the correct ones.
                  </p>

                  <div className="text-[14px] font-normal mt-3 mb-2 text-black">
                    How to use placeholders
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-black font-normal mb-3 leading-relaxed">
                    <li>
                      Select a placeholder from the dropdown and insert it into
                      the <em>Subject/Function</em> or <em>Body HTML</em> where
                      required.
                    </li>
                    <li>
                      Use only placeholders relevant to the current template.
                    </li>
                    <li>
                      Do not manually modify the placeholder name or syntax.
                    </li>
                    <li>
                      Placeholders must be used in the format{" "}
                      <span>{"{{.PlaceholderName}}"}</span>.
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

                  <div className="text-black font-normal mt-2 mb-1">
                    <em>Example:</em>
                  </div>
                  <p className="text-black mb-2 leading-relaxed font-normal">
                    If you are editing an <em>Employee Leave Approval</em>{" "}
                    template, use placeholders provided for leave-related
                    information such as employee name, leave dates, leave type,
                    etc.
                  </p>
                  <p className="text-black mb-3 leading-relaxed font-normal">
                    Do not use placeholders that belong specifically to
                    unrelated templates such as payroll, onboarding, attendance,
                    or other modules.
                  </p>

                  <div className="border-l-2 border-gray-300 pl-3 py-1 bg-gray-50 rounded-r-md text-black font-normal text-[12px] leading-relaxed">
                    <em>Tip:</em> Always select placeholders from the dropdown
                    instead of typing them manually. The placeholder name and
                    syntax should remain exactly as provided.
                  </div>
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
                type="button"
                onClick={() => setShowPlaceholderMenu(!showPlaceholderMenu)}
                className="flex items-center gap-1 text-[11px] text-gray-600 font-semibold uppercase tracking-tight"
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
            className="min-h-[350px] text-[13px]"
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
