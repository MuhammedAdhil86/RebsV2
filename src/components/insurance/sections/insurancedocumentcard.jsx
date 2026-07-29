import React, { useRef } from "react";
import { Download, RefreshCw, Trash2 } from "lucide-react";

export default function InsuranceDocumentCard({
  documentData,
  onDownload,
  onReplace,
  onDelete,
}) {
  const fileInputRef = useRef(null);

  const fileName =
    documentData?.file_name || documentData?.name || "insurance_card.pdf";
  const fileSize = documentData?.file_size || "1.2 MB";
  const uploadDate = documentData?.uploaded_on || "01 Apr 2024";
  const fileUrl = documentData?.file_url || documentData?.url;

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload(documentData);
    } else if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onReplace) {
      onReplace(file);
    }
    e.target.value = "";
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-3 border border-gray-200 space-y-6">
      <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
        Insurance Document
      </h3>

      <div className="flex items-center justify-between border border-gray-200 rounded-lg p-2 gap-2">
        {/* Left: Icon & File Info */}
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded bg-red-50 text-red-500 flex items-center justify-center font-bold text-[10px] border border-red-100 flex-shrink-0">
            PDF
          </div>
          <div className="text-xs truncate">
            <span className="font-semibold text-gray-800 block truncate max-w-[140px] sm:max-w-[180px]">
              {fileName}
            </span>
            <span className="text-gray-400 text-[10px]">
              Uploaded on {uploadDate} • {fileSize}
            </span>
          </div>
        </div>

        {/* Right: Compact Action Buttons */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            type="button"
            onClick={handleDownloadClick}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded text-[11px] text-gray-700 hover:bg-gray-50 transition"
            title="Download Document"
          >
            <Download size={11} />
            <span className="hidden sm:inline">Download</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded text-[11px] text-gray-700 hover:bg-gray-50 transition"
            title="Replace Document"
          >
            <RefreshCw size={11} />
            <span className="hidden sm:inline">Replace</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete && onDelete()}
            className="p-1 border border-gray-200 rounded text-red-500 hover:bg-red-50 transition"
            title="Delete Document"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-gray-400">
        Accepted formats: PDF, JPG, PNG (Max 10 MB)
      </p>
    </div>
  );
}
