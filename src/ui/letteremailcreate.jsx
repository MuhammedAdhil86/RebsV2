import React, { useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Mail, ChevronDown, Undo2, Redo2, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { createEmailTemplate } from "../service/mainServices";
import GlowButton from "../components/helpers/glowbutton";

const CreateEmailTemplateView = ({
  onBack,
  type,
  availablePurposes,
  availablePlaceholders,
}) => {
  const quillRef = useRef(null);

  // Static content for the demo
  const initialStaticContent = `
    <p>{{.CompanyLogo}}</p>
    <br/>
    <p>Dear {{.FirstName}} {{.LastName}},</p>
    <p>We are pleased to offer you the position of <strong>{{.Designation}}</strong> in the <strong>{{.Department}}</strong> department at <strong>{{.Company}}</strong>.</p>
    <p>Your joining date is scheduled for {{.JoiningDate}}. You will be reporting to {{.ReportingManager}}.</p>
    <p>Your annual salary will be {{.Salary}}.</p>
    <br/>
    <p>Best Regards,</p>
    <p>HR Team</p>
    <p>{{.CompanyEmail}}</p>
  `;

  const [templateTitle, setTemplateTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState(initialStaticContent);
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleSave = async () => {
    if (!templateTitle || !subject || !selectedPurpose) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await createEmailTemplate({
        name: templateTitle,
        purpose: selectedPurpose,
        subject: subject,
        body_html: content,
        is_manual: true,
      });

      toast.success(response?.data?.message || "Template saved successfully!");
      onBack();
    } catch (err) {
      // Enhanced error handling to show backend messages
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to save template";

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-[12px] font-normal focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all font-poppins";

  return (
    <div className="w-full bg-[#F9FAFB] rounded-2xl border border-gray-100 overflow-hidden flex flex-col font-poppins font-normal animate-in fade-in duration-300">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontSize: "12px", fontFamily: "Poppins, sans-serif" },
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2 border-l pl-3">
            <Mail className="text-gray-700" size={18} />
            <h2 className="text-[16px] text-gray-800">Create {type}</h2>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-8 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
        <input
          type="text"
          placeholder="Template Title"
          className={inputClass}
          value={templateTitle}
          onChange={(e) => setTemplateTitle(e.target.value)}
        />

        <div className="flex gap-3">
          <select
            className={`${inputClass} w-[35%] cursor-pointer`}
            value={selectedPurpose}
            onChange={(e) => setSelectedPurpose(e.target.value)}
          >
            <option value="">Select Purpose</option>
            {availablePurposes.map((p) => (
              <option key={p} value={p}>
                {p.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Subject"
            className={`${inputClass} w-[65%]`}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {/* Editor Container */}
        <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="absolute right-4 top-[10px] z-10 flex items-center gap-3 bg-white px-2">
            <div className="flex items-center gap-2 text-gray-400 border-r pr-3">
              <Undo2
                size={14}
                className="cursor-pointer hover:text-black"
                onClick={handleUndo}
              />
              <Redo2
                size={14}
                className="cursor-pointer hover:text-black"
                onClick={handleRedo}
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowPlaceholderMenu(!showPlaceholderMenu)}
                className="flex items-center gap-1 text-[12px] text-gray-600"
              >
                Placeholder <ChevronDown size={14} />
              </button>

              {showPlaceholderMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                  {availablePlaceholders.map((item) => (
                    <button
                      key={item}
                      onClick={() => insertPlaceholder(item)}
                      className="w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 border-b border-gray-50 last:border-0 font-poppins"
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
            className="bg-white rounded-xl text-[12px] font-poppins"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end items-center gap-3 p-6 bg-white border-t border-gray-100">
        <button
          onClick={onBack}
          className="px-8 py-2 border border-gray-200 rounded-xl text-[12px] hover:bg-gray-50 transition-colors font-poppins"
        >
          Cancel
        </button>

        {/* Glow Button for the main Save action */}
        <GlowButton onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Template"}
        </GlowButton>
      </div>
    </div>
  );
};

export default CreateEmailTemplateView;
