import React, { useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCornerUpLeft,
  FiMoreVertical,
  FiCalendar,
  FiTag,
  FiMaximize2,
  FiCode,
  FiPrinter,
  FiCopy,
} from "react-icons/fi";

const TemplatePreviewView = ({ data, onBack, onClone, subTab }) => {
  const [showRawSource, setShowRawSource] = useState(false);

  // Check if current template is designed for PDF letter generation
  const isPdfDocument = useMemo(() => {
    const purpose = String(data?.purpose || "").toLowerCase();
    const name = String(data?.name || "").toLowerCase();
    return Boolean(
      data?.for_letter_generation === true &&
      (purpose.endsWith("_pdf") ||
        purpose.includes("pdf") ||
        name.includes("pdf")),
    );
  }, [data]);

  // Formats date to: "08 Apr 2026"
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Formats date & time for email header: "Apr 8, 2026, 10:24 AM"
  const formatEmailTime = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const templateContent =
    data?.body_html || data?.body || "<p>No content available</p>";
  const templateSubject = data?.subject || "No subject specified";

  // Shared CSS rules for A4 sheet dimensions, print pagination, and clean typography
  const a4BaseStyles = `
    @page { 
      size: A4 portrait; 
      margin: 20mm; 
    }
    *, *::before, *::after { 
      box-sizing: border-box; 
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #1f2937;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 13.5px;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      padding: 20mm;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
    }
    /* Page Break controls for overflow */
    h1, h2, h3, h4, tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    p, blockquote {
      orphans: 3;
      widows: 3;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    img { 
      max-width: 100%; 
      height: auto; 
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 16px 0; 
      page-break-inside: auto;
    }
    tr { 
      page-break-inside: avoid; 
      page-break-after: auto; 
    }
    th, td { 
      padding: 8px 10px; 
      border: 1px solid #d1d5db; 
      text-align: left; 
    }
  `;

  // HTML markup for A4 PDF Document
  const pdfDocumentHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          ${a4BaseStyles}
        </style>
      </head>
      <body>
        ${templateContent}
      </body>
    </html>
  `;

  // HTML markup for A4 Email Document (Embedded Email Client Header + Body)
  const emailDocumentHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          ${a4BaseStyles}
          .email-container-header {
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 16px;
            margin-bottom: 24px;
            display: flex;
            align-items: flex-start;
            gap: 14px;
          }
          .email-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background-color: #3b82f6;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 600;
            flex-shrink: 0;
          }
          .email-meta {
            flex: 1;
            font-size: 12px;
            color: #4b5563;
          }
          .email-meta .subject {
            font-size: 15px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 6px;
          }
          .email-meta-row {
            margin-bottom: 3px;
          }
          .email-meta-row strong {
            color: #374151;
          }
          .email-date {
            font-size: 11px;
            color: #9ca3af;
            white-space: nowrap;
          }
          .email-body {
            font-size: 13.5px;
            color: #1f2937;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="email-container-header">
          <div class="email-avatar">HR</div>
          <div class="email-meta">
            <div class="subject">${templateSubject}</div>
            <div class="email-meta-row"><strong>From:</strong> hr@example.com</div>
            <div class="email-meta-row"><strong>To:</strong> employee@example.com</div>
          </div>
          <div class="email-date">${formatEmailTime(data?.created_at)}</div>
        </div>

        <div class="email-body">
          ${templateContent}
        </div>
      </body>
    </html>
  `;

  return (
    <div className="w-full min-h-[85vh] bg-[#f2f5f8] flex flex-col font-poppins rounded-2xl overflow-hidden shadow-2xl">
      {/* ========================================================================= */}
      {/*                          TOP BAR                                         */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#afb4bf] border-b border-white/5 text-black">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:text-black hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="Back to list"
          >
            <FiArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-[16px] tracking-tight leading-snug font-medium">
              {data?.name || "Template Preview"}
            </h1>
            <div className="flex items-center gap-2 text-[11px] mt-0.5">
              <span className="flex items-center gap-1">
                <FiTag size={11} />
                <span>{isPdfDocument ? "PDF Template" : "Email Template"}</span>
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <FiCalendar size={11} />
                <span>Created: {formatDate(data?.created_at)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Action Icons */}
        <div className="flex items-center gap-3">
          {subTab === "presets" && onClone && (
            <button
              type="button"
              onClick={() => onClone(data?.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-[11px] text-white font-medium transition-colors cursor-pointer mr-2 shadow-sm"
            >
              <FiCopy size={13} /> Clone
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowRawSource((prev) => !prev)}
            title="Toggle Raw Code"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              showRawSource
                ? "text-black bg-white/20"
                : "text-gray-900 hover:text-black hover:bg-white/5"
            }`}
          >
            <FiCode size={16} />
          </button>

          <button
            type="button"
            title="Full Viewport"
            className="p-2 text-gray-900 hover:text-black hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <FiMaximize2 size={16} />
          </button>

          <button
            type="button"
            className="p-2 text-gray-900 hover:text-black hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <FiMoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/*                     MAIN PREVIEW VIEWPORT AREA                            */}
      {/* ========================================================================= */}
      <div className="flex-1 bg-[#cbd1d7] p-6 md:p-10 flex justify-center items-start overflow-y-auto min-h-[75vh]">
        {showRawSource ? (
          <div className="w-full max-w-4xl bg-[#d0dae4] rounded-2xl p-6 border border-white/10 font-mono text-[12px] text-emerald-800 overflow-x-auto shadow-sm">
            <div className="text-gray-600 mb-3 pb-2 border-b border-gray-300 font-sans font-semibold">
              Subject: {templateSubject}
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed">
              {templateContent}
            </pre>
          </div>
        ) : (
          /* Shared A4 Sheet Container */
          <div className="w-full max-w-[210mm] flex flex-col items-center">
            <div
              className="bg-white text-black shadow-2xl w-[210mm] min-h-[297mm] rounded-sm relative flex flex-col border border-gray-300 transition-all"
              style={{ boxSizing: "border-box" }}
            >
              <iframe
                title="A4 Document Preview"
                className="w-[210mm] min-h-[297mm] flex-1 border-none"
                srcDoc={isPdfDocument ? pdfDocumentHtml : emailDocumentHtml}
              />
              <div className="border-t border-gray-100 py-2.5 px-8 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                <span>REBS System Generated Document</span>
                <span>Page 1</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatePreviewView;
