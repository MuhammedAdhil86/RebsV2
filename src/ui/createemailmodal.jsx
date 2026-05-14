import React, { useState, useRef, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { X, Mail, ChevronDown, Undo2, Redo2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  fetchEmailPurposes,
  fetchEmailPlaceholders,
  createEmailTemplate,
} from "../service/mainServices";

const CreateEmailTemplateModal = ({ isOpen, onClose }) => {
  const quillRef = useRef(null);

  const initialStaticContent = `
    <p>{{.CompanyName}}</p>
    <br/>
    <p>Hi {{.EmployeeName}}, Your payslip for {{.PayPeriodMonth}} has been issued.</p>
    <p>You can view your payslip from the employee portal.</p>
    <br/>

    <br/>
    <p>Cheers,</p>
    <p>{{.PrimaryContactName}}</p>
    <p>{{.CompanyName}}</p>
  `;

  const [templateTitle, setTemplateTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState(initialStaticContent);
  const [isFirstEdit, setIsFirstEdit] = useState(true);

  const [emailPurposes, setEmailPurposes] = useState([]);
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");

  const [placeholders, setPlaceholders] = useState([]);
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isManual, setIsManual] = useState(true);

  // ---------------- Load Email Purposes ----------------
  useEffect(() => {
    if (!isOpen) return;

    const loadPurposes = async () => {
      const data = await fetchEmailPurposes();
      setEmailPurposes(data || []);
    };

    loadPurposes();
  }, [isOpen]);

  // ---------------- Load Placeholders ----------------
  useEffect(() => {
    if (!isOpen) return;

    const loadPlaceholders = async () => {
      const data = await fetchEmailPlaceholders();
      setPlaceholders(data || []);
    };

    loadPlaceholders();
  }, [isOpen]);

  if (!isOpen) return null;

  // ---------------- Editor logic ----------------
  const handleChange = (value, delta, source) => {
    if (isFirstEdit && source === "user") {
      setContent("");
      setIsFirstEdit(false);
    } else {
      setContent(value);
    }
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

  // ---------------- Handle Create ----------------
  const handleCreate = async () => {
    const finalPurpose =
      selectedPurpose === "custom" ? customPurpose : selectedPurpose;

    if (!templateTitle || !subject || (!finalPurpose && !isManual)) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (!isManual && selectedPurpose === "custom") {
      toast.error("Non-manual templates must use a default purpose.");
      return;
    }

    setLoading(true);

    try {
      await createEmailTemplate({
        name: templateTitle,
        purpose: finalPurpose,
        subject,
        body_html: content,
        is_manual: isManual,
      });

      toast.success("Email template created successfully!");
      onClose();
    } catch (error) {
      console.error("Error creating email template:", error);
      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Something went wrong while creating template."
      );
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <>
      <Toaster position="top-right" />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-[#F9FAFB] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

          {/* Header */}
          <div className="flex items-center justify-between p-5 bg-white border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Mail className="text-gray-700" size={20} />
              <h2 className="text-[16px] font-semibold text-gray-800">
                Create an Email Template
              </h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={22} />
            </button>
          </div>

          {/* Body */}
          <div className="p-8 overflow-y-auto flex flex-col gap-5">

            <input
              type="text"
              placeholder="Template Title"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              className={inputClass}
            />

            <div className="flex gap-3">
              <select
                value={selectedPurpose}
                onChange={(e) => setSelectedPurpose(e.target.value)}
                className={`${inputClass} w-[35%]`}
              >
                <option value="">Select Purpose</option>
                {emailPurposes.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purpose.replace(/_/g, " ")}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>

              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`${inputClass} w-[65%]`}
              />
            </div>

            {selectedPurpose === "custom" && (
              <input
                type="text"
                placeholder="Enter custom purpose"
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
                className={inputClass}
              />
            )}

            {/* Manual Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isManual"
                checked={isManual}
                onChange={(e) => setIsManual(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isManual" className="text-[14px] font-medium">
                Manual Template
              </label>
            </div>

            {/* Editor */}
            <div className="relative bg-white rounded-xl">

              <div className="absolute right-4 top-[10px] z-10 flex items-center gap-2 bg-white px-2">
                <Undo2 size={14} onClick={handleUndo} className="cursor-pointer" />
                <Redo2 size={14} onClick={handleRedo} className="cursor-pointer" />

                <div className="relative">
                  <button
                    onClick={() => setShowPlaceholderMenu((p) => !p)}
                    className="flex items-center gap-1 text-[12px]"
                  >
                    Placeholder <ChevronDown size={14} />
                  </button>

                  {showPlaceholderMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-xl">
                      {placeholders.map((item) => (
                        <button
                          key={item.placeholder}
                          onClick={() => insertPlaceholder(item.placeholder)}
                          className="w-full text-left px-4 py-2 text-[13px] hover:bg-gray-100"
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
            <button onClick={onClose} className="px-10 py-2.5 border rounded-xl">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="px-12 py-2.5 bg-black text-white rounded-xl"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default CreateEmailTemplateModal;
