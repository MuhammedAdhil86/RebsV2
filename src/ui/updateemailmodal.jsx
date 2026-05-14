import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { X, Mail, ChevronDown, Undo2, Redo2 } from "lucide-react";
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
    // Using the same format as Create modal: {{.placeholder}}
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
        body_html: content, // Sending content directly with {{.tokens}}
      });

      // Show backend success message if available
      toast.success(
        response?.data?.message || "Email template updated successfully!",
      );
      await loadTemplates();
      onClose();
    } catch (error) {
      console.error("Error updating email template:", error);
      // Capture and show specific backend error message
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
    "w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all";

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      {/* Custom Styles for Quill */}
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
            }
          `,
        }}
      />

      <div className="bg-[#F9FAFB] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Mail className="text-gray-700" size={20} />
            <h2 className="text-[16px] font-semibold text-gray-800">
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

        {/* Body */}
        <div className="p-8 overflow-y-auto flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 ml-1">
              Template Name
            </label>
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
              <label className="text-xs font-semibold text-gray-500 ml-1">
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
              <label className="text-xs font-semibold text-gray-500 ml-1">
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
                  className="flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:text-gray-700"
                >
                  Placeholder <ChevronDown size={14} />
                </button>

                {showPlaceholderMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto z-50">
                    {placeholders.map((item) => (
                      <button
                        key={item.placeholder}
                        onClick={() => insertPlaceholder(item.placeholder)}
                        className="w-full text-left px-4 py-2 text-[13px] hover:bg-gray-100 border-b border-gray-50 last:border-none"
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
            className="px-10 py-2.5 border border-gray-300 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="px-12 py-2.5 bg-black text-white rounded-xl text-[14px] font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all"
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
