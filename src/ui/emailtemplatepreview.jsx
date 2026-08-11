import React from "react";
import {
  FiArrowLeft,
  FiCopy,
  FiCalendar,
  FiTag,
  FiMail,
  FiInfo,
} from "react-icons/fi";

/**
 * EmailTemplatePreview Component
 * Renders an isolated HTML document preview inside an iframe based on template response data.
 *
 * @param {Object} data - The template item object from backend API
 * @param {Function} onBack - Navigation callback to return to the table list
 * @param {Function} onClone - Trigger action when cloning preset templates
 * @param {String} subTab - Current active tab ('presets' or 'my-templates')
 */
const EmailTemplatePreview = ({ data, onBack, onClone, subTab }) => {
  // Format standard ISO backend timestamps
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Raw HTML or fallback text
  const rawHtmlBody =
    data?.body_html ||
    data?.body ||
    '<p style="padding:20px; color:#999; text-align:center;">No template HTML content available.</p>';

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col font-poppins animate-in slide-in-from-bottom-2 duration-300">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between p-5 border-b bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            title="Back to list"
            type="button"
          >
            <FiArrowLeft size={20} />
          </button>

          <div>
            <h2 className="text-[16px] font-semibold text-gray-900 leading-tight">
              {data?.name || "Untitled Template"}
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded border border-gray-100 text-gray-600">
                <FiTag size={10} />
                <span className="capitalize">
                  {data?.purpose ? data.purpose.replace(/_/g, " ") : "General"}
                </span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1">
                <FiCalendar size={12} />
                <span>Created: {formatDate(data?.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {subTab === "presets" && (
            <button
              type="button"
              onClick={() => onClone && onClone(data?.id)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[12px] rounded-xl hover:bg-blue-700 font-medium transition-all shadow-md shadow-blue-100"
            >
              <FiCopy size={14} /> Clone Design
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2 border border-gray-200 text-[12px] rounded-xl hover:bg-gray-50 text-gray-600 font-medium transition-all"
          >
            Close Preview
          </button>
        </div>
      </div>

      {/* --- SUBJECT BAR --- */}
      <div className="px-8 py-3 bg-[#FDFDFD] border-b border-gray-50 flex items-center gap-3">
        <div className="flex items-center gap-2 text-gray-400">
          <FiMail size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Subject:
          </span>
        </div>
        <span className="text-[13px] text-gray-700 font-medium">
          {data?.subject || "No subject provided"}
        </span>
      </div>

      {/* --- CONTENT VIEWPORT --- */}
      <div className="flex-1 bg-[#F8F9FB] p-6 md:p-12 flex justify-center overflow-y-auto min-h-[70vh]">
        <div className="bg-white shadow-xl w-full max-w-[700px] min-h-full rounded-lg overflow-hidden border border-gray-200 flex flex-col">
          <iframe
            title="Email Template Preview"
            className="w-full flex-1 border-none min-h-[750px]"
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <style>
                    body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                    ::-webkit-scrollbar { width: 6px; }
                    ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                  </style>
                </head>
                <body>
                  ${rawHtmlBody}
                </body>
              </html>
            `}
          />
        </div>
      </div>

      {/* --- FOOTER INFO --- */}
      <div className="px-8 py-3 bg-white border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-gray-400 italic">
          <FiInfo size={12} />
          This is a simulated preview of the document design.
        </div>
        <span className="text-[10px] text-gray-300 font-mono uppercase">
          ID: {data?.id || "N/A"}
        </span>
      </div>
    </div>
  );
};

export default EmailTemplatePreview;
