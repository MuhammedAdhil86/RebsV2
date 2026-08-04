import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Plus,
  Edit2,
  Check,
  X,
  Trash2,
  Loader2,
  Upload,
  FileText,
} from "lucide-react";

export default function InsuranceDocumentCard({
  documentData = [],
  onDocumentChange,
  onSave,
  saving = false,
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [localDocs, setLocalDocs] = useState(
    Array.isArray(documentData) ? documentData : [documentData],
  );
  const fileInputRef = useRef(null);

  useEffect(() => {
    setLocalDocs(Array.isArray(documentData) ? documentData : [documentData]);
  }, [documentData]);

  const getFileName = (doc) => {
    if (doc?.document_name) return doc.document_name;
    if (doc?.file_name) return doc.file_name;
    if (doc?.file?.name) return doc.file.name;
    if (doc?.file_url) {
      try {
        const cleanUrl = doc.file_url.split("?")[0];
        return (
          cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1) ||
          "insurance_document.pdf"
        );
      } catch {
        return "insurance_document.pdf";
      }
    }
    return "Insurance Document";
  };

  const getFileExtension = (fileName) => {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString.startsWith("0001")) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const handleEditClick = () => {
    setLocalDocs(Array.isArray(documentData) ? documentData : [documentData]);
    setIsEditMode(true);
  };

  const handleCancelAction = () => {
    const resetDocs = Array.isArray(documentData)
      ? documentData
      : [documentData];
    setLocalDocs(resetDocs);
    if (onDocumentChange) onDocumentChange(resetDocs, []);
    setIsEditMode(false);
  };

  const handleSaveAction = async () => {
    if (onSave) {
      const success = await onSave();
      if (success) setIsEditMode(false);
    } else {
      setIsEditMode(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const newDocs = selectedFiles.map((file) => ({
      id: 0,
      document_name: file.name,
      file_url: "",
      file_size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploaded_at: new Date().toISOString(),
      file: file,
    }));

    const updatedList = [...localDocs, ...newDocs];
    setLocalDocs(updatedList);

    if (onDocumentChange) {
      onDocumentChange(updatedList, selectedFiles);
    }

    e.target.value = "";
  };

  const handleRemoveDoc = (index) => {
    const updatedList = localDocs.filter((_, idx) => idx !== index);
    setLocalDocs(updatedList);

    if (onDocumentChange) {
      onDocumentChange(updatedList, []);
    }
  };

  const handleDownload = (doc) => {
    const targetUrl = doc.file_url || doc.url;
    if (targetUrl) {
      window.open(targetUrl, "_blank");
    }
  };

  const listToRender = isEditMode ? localDocs : documentData;

  return (
    <div
      className={`bg-white shadow-sm rounded-lg p-5 border border-gray-200 space-y-4 font-poppins transition-all duration-300 ${
        isEditMode
          ? "col-span-full w-full ring-2 ring-blue-500/20 shadow-md"
          : "w-full"
      }`}
    >
      {/* Header section */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
          Insurance Documents
        </h3>

        <div className="flex items-center gap-1.5">
          {isEditMode ? (
            <>
              {/* Trigger Hidden File Input */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all font-medium mr-1 cursor-pointer"
              >
                <Plus size={13} className="stroke-[2.5]" />
                <span>Upload Document</span>
              </button>

              {/* Cancel Changes */}
              <button
                type="button"
                disabled={saving}
                onClick={handleCancelAction}
                className="p-1.5 rounded-full border bg-white text-gray-500 border-gray-200 hover:bg-gray-50 transition-all shadow-sm cursor-pointer focus:outline-none disabled:opacity-50"
                title="Cancel Changes"
              >
                <X size={15} className="stroke-[2.5]" />
              </button>

              {/* Save Changes */}
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAction}
                className="p-1.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm cursor-pointer focus:outline-none disabled:opacity-50"
                title="Save Documents"
              >
                {saving ? (
                  <Loader2
                    size={15}
                    className="animate-spin text-emerald-600 stroke-[2.5]"
                  />
                ) : (
                  <Check size={15} className="stroke-[3]" />
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEditClick}
              className="p-1.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 transition-all shadow-sm cursor-pointer focus:outline-none"
              title="Edit Documents"
            >
              <Edit2 size={15} className="stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
      />

      {/* Document List View / Edit Grid */}
      <div className="space-y-2">
        {listToRender && listToRender.length > 0 ? (
          listToRender.map((doc, index) => {
            const name = getFileName(doc);
            const ext = getFileExtension(name);
            const hasUrl = !!(doc.file_url || doc.url);

            return (
              <div
                key={doc.id || index}
                className="flex items-center justify-between border border-gray-200 rounded-lg p-2.5 gap-2 bg-gray-50/50 hover:bg-gray-50 transition"
              >
                {/* Left: Extension Badge + Metadata */}
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div
                    className={`w-9 h-9 rounded flex items-center justify-center font-bold text-[10px] border flex-shrink-0 ${
                      ext === "PDF"
                        ? "bg-red-50 text-red-500 border-red-100"
                        : "bg-blue-50 text-blue-500 border-blue-100"
                    }`}
                  >
                    {ext}
                  </div>
                  <div className="text-xs truncate">
                    <span
                      title={name}
                      className="font-semibold text-gray-800 block truncate max-w-[200px] sm:max-w-[320px]"
                    >
                      {name}
                    </span>
                    <span className="text-gray-400 text-[10px]">
                      {doc.uploaded_at
                        ? `Uploaded ${formatDate(doc.uploaded_at)}`
                        : "Pending Save"}{" "}
                      {doc.file_size ? `• ${doc.file_size}` : ""}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {hasUrl && (
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded text-[11px] text-gray-700 bg-white hover:bg-gray-100 transition"
                      title="Download Document"
                    >
                      <Download size={12} />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  )}

                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(index)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                      title="Remove Document"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-400 space-y-2">
            <FileText size={24} className="mx-auto text-gray-300" />
            <p className="text-xs">No documents attached.</p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-400">
        Accepted formats: PDF, JPG, PNG (Max 10 MB per document)
      </p>
    </div>
  );
}
