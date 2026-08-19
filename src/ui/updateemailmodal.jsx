import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { X, Mail, ChevronDown, Undo2, Redo2, Info } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchEmailPlaceholders,
  updateEmailTemplateService,
} from "../service/mainServices";
import useEmailTemplateStore from "../store/emailtemplateStore";

const UpdateEmailTemplateModal = ({ isOpen, onClose, templateData }) => {
  const quillRef = useRef(null);
  const { loadTemplates } = useEmailTemplateStore();

  // -------------------- State --------------------
  const [templateTitle, setTemplateTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [placeholders, setPlaceholders] = useState([]);
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  // -------------------- Sync Data with Props --------------------
  useEffect(() => {
    if (isOpen && templateData) {
      setTemplateTitle(templateData.name || "");
      setSubject(templateData.subject || "");
      setContent(templateData.body_html || "");
    }
  }, [isOpen, templateData]);

  // -------------------- Load Placeholders --------------------
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const data = await fetchEmailPlaceholders();
        setPlaceholders(data || []);
      } catch (error) {
        console.error("Error fetching placeholders:", error);
      }
    };
    loadData();
  }, [isOpen]);

  // -------------------- Editor logic --------------------
  const handleChange = (value) => {
    setContent(value);
  };

  const handleUndo = () => quillRef.current?.getEditor().history.undo();
  const handleRedo = () => quillRef.current?.getEditor().history.redo();

  const insertPlaceholder = (placeholder) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const range = editor.getSelection(true);
    const token = `{{.${placeholder}}}`;

    editor.insertText(range?.index || 0, token, "user");
    editor.setSelection((range?.index || 0) + token.length);
    setShowPlaceholderMenu(false);
  };

  // -------------------- Handle Update --------------------
  const handleUpdate = async () => {
    if (!templateTitle || !subject) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await updateEmailTemplateService({
        purpose: templateData.purpose,
        name: templateTitle,
        subject,
        body_html: content,
      });

      toast.success(
        response?.data?.message || "Email template updated successfully!",
      );
      await loadTemplates();
      onClose();
    } catch (error) {
      console.error("Error updating email template:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Something went wrong while updating template.";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !templateData) return null;

  const modules = {
    toolbar: [
      [{ font: [] }, { size: [] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"],
    ],
    history: { delay: 400, maxStack: 200, userOnly: true },
  };

  const inputClass =
    "w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-normal focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all";

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      {/* Custom Styles for Quill & Scrollbar Hiding */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .ql-toolbar.ql-snow {
              border: 1px solid #e5e7eb !important;
              border-top-left-radius: 12px;
              border-top-right-radius: 12px;
              background: #fff;
            }
            .ql-container.ql-snow {
              border: 1px solid #e5e7eb !important;
              border-top: none !important;
              border-bottom-left-radius: 12px;
              border-bottom-right-radius: 12px;
              min-height: 400px;
              font-size: 14px;
              font-weight: 400;
            }
            /* Hide scrollbar for Chrome, Safari and Opera */
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            /* Hide scrollbar for IE, Edge and Firefox */
            .no-scrollbar {
              -ms-overflow-style: none;  /* IE and Edge */
              scrollbar-width: none;  /* Firefox */
            }
          `,
        }}
      />

      <div className="bg-[#F9FAFB] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Mail className="text-gray-700" size={20} />
            <h2 className="text-[16px] font-normal text-gray-800">
              Update Email Template
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body (no-scrollbar added) */}
        <div className="p-8 overflow-y-auto no-scrollbar flex flex-col gap-5">
          {/* Template Name with Constant Jumping Info Icon */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-normal text-gray-500">
                Template Name
              </label>

              {/* Info Icon with Continuous Bounce */}
              <div className="relative group flex items-center">
                <div className="cursor-pointer p-0.5 rounded-full hover:bg-gray-100 transition-colors animate-bounce">
                  <Info size={16} className="text-blue-500" />
                </div>

                {/* Tooltip Content (no-scrollbar added) */}
                <div className="absolute right-0 top-full mt-2 w-[420px] max-h-96 overflow-y-auto no-scrollbar hidden group-hover:block bg-white text-black text-[13px] font-normal rounded-xl p-5 shadow-2xl border border-gray-200 z-[100] transition-all">
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
              placeholder="Template Title"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3">
            <div className="w-[35%] flex flex-col gap-1.5">
              <label className="text-xs font-normal text-gray-500 ml-1">
                Purpose
              </label>
              <input
                type="text"
                value={templateData.purpose}
                readOnly
                className={`${inputClass} bg-gray-100 cursor-not-allowed`}
              />
            </div>
            <div className="w-[65%] flex flex-col gap-1.5">
              <label className="text-xs font-normal text-gray-500 ml-1">
                Subject Line
              </label>
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Editor Container */}
          <div className="relative bg-white rounded-xl mt-2">
            <div className="absolute right-4 top-[10px] z-10 flex items-center gap-2 bg-white px-2">
              <Undo2
                size={14}
                onClick={handleUndo}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              />
              <Redo2
                size={14}
                onClick={handleRedo}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              />

              <div className="relative">
                <button
                  onClick={() => setShowPlaceholderMenu((p) => !p)}
                  className="flex items-center gap-1 text-[12px] font-normal text-gray-500 hover:text-gray-700"
                >
                  Placeholder <ChevronDown size={14} />
                </button>

                {showPlaceholderMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto no-scrollbar z-50">
                    {placeholders.map((item) => (
                      <button
                        key={item.placeholder}
                        onClick={() => insertPlaceholder(item.placeholder)}
                        className="w-full text-left px-4 py-2 text-[13px] font-normal hover:bg-gray-100 border-b border-gray-50 last:border-none"
                      >
                        {`{{.${item.placeholder}}}`}
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
              onChange={handleChange}
              modules={modules}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 bg-white border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-10 py-2.5 border border-gray-300 rounded-xl text-[14px] font-normal text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="px-12 py-2.5 bg-black text-white rounded-xl text-[14px] font-normal hover:bg-zinc-800 disabled:opacity-50 transition-all"
          >
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default UpdateEmailTemplateModal;
