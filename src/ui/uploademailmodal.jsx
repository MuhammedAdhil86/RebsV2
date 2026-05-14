import React, { useState, useRef, useEffect } from "react";
import { X, Upload, Undo2, Redo2, ChevronDown } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { fetchEmailPurposes, fetchEmailPlaceholders } from "../service/mainServices";

const UploadEmailTemplateModal = ({ isOpen, onClose, onSuccess }) => {
  const quillRef = useRef(null);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("adhil"); // Default from your Postman
  const [subject, setSubject] = useState("hello"); // Default from your Postman
  const [content, setContent] = useState("");
  const [isManual, setIsManual] = useState(true);

  const [emailPurposes, setEmailPurposes] = useState([]);
  const [selectedPurpose, setSelectedPurpose] = useState("hy_hyhy"); // Default from your Postman
  const [customPurpose, setCustomPurpose] = useState("");
  const [placeholders, setPlaceholders] = useState([]);
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      const [purposes, items] = await Promise.all([
        fetchEmailPurposes(),
        fetchEmailPlaceholders()
      ]);
      setEmailPurposes(purposes || []);
      setPlaceholders(items || []);
    };
    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (ev) => setContent(ev.target.result);
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    const finalPurpose = selectedPurpose === "custom" ? customPurpose : selectedPurpose;

    if (!templateTitle || !subject || !content) {
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create the Multipart Form Data
      const formData = new FormData();
      
      // 2. Add keys EXACTLY as they appear in your Postman screenshot
      formData.append("name", templateTitle);
      formData.append("purpose", finalPurpose);
      formData.append("subject", subject);
      formData.append("is_manual", String(isManual)); // Sends "true" as string

      // 3. Convert Quill HTML content into a physical 'index.html' file
      const blob = new Blob([content], { type: "text/html" });
      const htmlFile = new File([blob], "index.html", { type: "text/html" });
      formData.append("file", htmlFile);

      // 4. Execute the request
      await axios.post(
        "https://crossing-fioricet-postcard-jurisdiction.trycloudfare.com/admin/upload/templates",
        formData,
        { 
          headers: { "Content-Type": "multipart/form-data" } 
        }
      );

      toast.success("Template uploaded successfully!");
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("CORS or Network Error:", error);
      toast.error("Network Error. Check CORS or Cloudflare tunnel status.");
    } finally {
      setLoading(false);
    }
  };

  const modules = {
    toolbar: [
      [{ font: [] }, { size: [] }],
      ["bold", "italic", "underline"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#F9FAFB] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        <Toaster position="top-right" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-white border-b">
          <h2 className="text-lg font-bold">Upload Email Template</h2>
          <button onClick={onClose}><X size={22} /></button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <input 
              className="p-3 border rounded-xl outline-none" 
              placeholder="Name" value={templateTitle} onChange={e => setTemplateTitle(e.target.value)} 
            />
            <input 
              className="p-3 border rounded-xl outline-none" 
              placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select 
              className="p-3 border rounded-xl outline-none"
              value={selectedPurpose} onChange={e => setSelectedPurpose(e.target.value)}
            >
              <option value="hy_hyhy">hy_hyhy</option>
              {emailPurposes.map(p => <option key={p} value={p}>{p}</option>)}
              <option value="custom">Custom</option>
            </select>
            
            <div className="flex items-center gap-2 px-3 border rounded-xl bg-white">
              <input type="checkbox" checked={isManual} onChange={e => setIsManual(e.target.checked)} />
              <label className="text-sm font-medium">Is Manual</label>
            </div>
          </div>

          <input type="file" accept=".html" onChange={handleFileChange} className="w-full text-sm" />

          {/* Editor */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <ReactQuill 
              ref={quillRef} theme="snow" value={content} 
              onChange={setContent} modules={modules} style={{ height: "250px" }} 
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border rounded-lg">Cancel</button>
          <button 
            onClick={handleUpload} disabled={loading}
            className="px-10 py-2 bg-black text-white rounded-lg disabled:bg-gray-400"
          >
            {loading ? "Uploading..." : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadEmailTemplateModal;