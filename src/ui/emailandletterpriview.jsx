import React, { useMemo, useState, useCallback } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiTag,
  FiCopy,
  FiFileText,
  FiCheckCircle,
  FiMail,
  FiUser,
  FiLayers,
  FiClock,
  FiExternalLink,
  FiPrinter,
} from "react-icons/fi";

// -----------------------------------------------------------------------------
// DISPLAY HELPERS
// -----------------------------------------------------------------------------
const ACRONYMS = new Set(["pdf", "hr", "id", "ctc", "otp", "sms", "pf", "esi"]);

const formatPurpose = (value) => {
  if (!value || typeof value !== "string") return "-";

  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();

      return ACRONYMS.has(lower)
        ? lower.toUpperCase()
        : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatEmailTime = (dateString) => {
  const date = dateString ? new Date(dateString) : new Date();

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// -----------------------------------------------------------------------------
// SAMPLE DATA FOR GO-TEMPLATE PREVIEW
// -----------------------------------------------------------------------------
const SAMPLE_DATA = {
  SenderLogoURL: "yes",
  ReceiverLogoURL: "",
  EmployeeName: "John Doe",
  Designation: "Software Engineer",
  Department: "Engineering",
  CompanyName: "Teqbae",
  CompanyEmail: "hr@teqbae.com",
  ReportingManager: "Jane Smith",
  Salary: "₹ 6,00,000",
  JoiningDate: "01 Nov 2026",
  Status: "Approved",
  RegularizationReqStatus: "Approved",
  InDate: "09:30 AM",
  OutDate: "06:30 PM",
  Remarks: "Forgot to punch in.",
};

// -----------------------------------------------------------------------------
// GO-TEMPLATE PARSER
// Supports: {{.Variable}}, {{if .Variable}}, {{else if}}, {{else}}, {{end}}
// -----------------------------------------------------------------------------
const parseTemplate = (src) => {
  const tokens = String(src || "").split(/(\{\{[\s\S]*?\}\})/g);
  const root = [];
  const stack = [];
  let current = root;

  const lastChildren = (node) =>
    node.branches[node.branches.length - 1].children;

  tokens.forEach((token) => {
    const match = token.match(/^\{\{-?\s*([\s\S]*?)\s*-?\}\}$/);

    if (!match) {
      if (token) current.push({ t: "text", v: token });
      return;
    }

    const expression = match[1].trim();

    if (expression.startsWith("if ")) {
      const node = {
        t: "if",
        branches: [
          {
            cond: expression.slice(3).trim(),
            children: [],
          },
        ],
      };

      current.push(node);
      stack.push(node);
      current = node.branches[0].children;
    } else if (expression.startsWith("else if ")) {
      const node = stack[stack.length - 1];

      if (!node) return;

      node.branches.push({
        cond: expression.slice(8).trim(),
        children: [],
      });

      current = lastChildren(node);
    } else if (expression === "else") {
      const node = stack[stack.length - 1];

      if (!node) return;

      node.branches.push({
        cond: null,
        children: [],
      });

      current = lastChildren(node);
    } else if (expression === "end") {
      stack.pop();

      const parent = stack[stack.length - 1];
      current = parent ? lastChildren(parent) : root;
    } else {
      const variable = expression.match(/^\.(\w+)$/);

      if (variable) {
        current.push({
          t: "var",
          name: variable[1],
        });
      }

      // Other actions, such as range and with, are ignored in this preview.
    }
  });

  return root;
};

// -----------------------------------------------------------------------------
// GO-TEMPLATE CONDITION EVALUATOR
// -----------------------------------------------------------------------------
const evalCond = (condition, context) => {
  let match = condition.match(/^eq\s+\.(\w+)\s+"([^"]*)"$/);

  if (match) {
    return String(context[match[1]] ?? "") === match[2];
  }

  match = condition.match(/^ne\s+\.(\w+)\s+"([^"]*)"$/);

  if (match) {
    return String(context[match[1]] ?? "") !== match[2];
  }

  match = condition.match(/^not\s+\.(\w+)$/);

  if (match) {
    return !context[match[1]];
  }

  match = condition.match(/^\.(\w+)$/);

  if (match) {
    return Boolean(context[match[1]]);
  }

  return false;
};

// -----------------------------------------------------------------------------
// TEMPLATE RENDERER
// -----------------------------------------------------------------------------
const renderNodes = (nodes, context) =>
  nodes
    .map((node) => {
      if (node.t === "text") return node.v;

      if (node.t === "var") {
        return context[node.name] ?? `[${node.name}]`;
      }

      if (node.t === "if") {
        for (const branch of node.branches) {
          if (branch.cond === null || evalCond(branch.cond, context)) {
            return renderNodes(branch.children, context);
          }
        }

        return "";
      }

      return "";
    })
    .join("");

const resolveTemplate = (source) =>
  renderNodes(parseTemplate(source), SAMPLE_DATA);

// -----------------------------------------------------------------------------
// REUSABLE DETAILS ROW
// -----------------------------------------------------------------------------
const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <div
      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center
      rounded-lg bg-slate-50 text-slate-500"
    >
      <Icon size={15} />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value || "N/A"}
      </p>
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------
const TemplatePreviewView = ({ data, onBack, onClone, subTab }) => {
  const [iframeHeight, setIframeHeight] = useState(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Only preview_html is used as the template content source.
  const rawPreviewHtml = data?.preview_html || "";
  const hasPreview = rawPreviewHtml.trim().length > 0;

  const previewHtml = useMemo(
    () => (hasPreview ? resolveTemplate(rawPreviewHtml) : ""),
    [rawPreviewHtml, hasPreview],
  );

  const templateSubject = useMemo(
    () =>
      data?.subject ? resolveTemplate(data.subject) : "No subject specified",
    [data?.subject],
  );

  const purposeLabel = data?.purpose_label || formatPurpose(data?.purpose);

  // Preserve existing PDF / letter detection.
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

  const documentType = isPdfDocument ? "PDF / A4" : "Email";
  const documentDescription = isPdfDocument
    ? "Letter document"
    : "Email template";

  // ---------------------------------------------------------------------------
  // DOCUMENT STYLES
  // ---------------------------------------------------------------------------
  const baseStyles = `
    @page {
      size: A4 portrait;
      margin: 0;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    html {
      width: 100%;
      min-height: 100%;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    body {
      width: 100%;
      min-height: 100%;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #1f2937;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
        Roboto, Arial, sans-serif;
      font-size: 13.5px;
      line-height: 1.6;
      overflow-wrap: anywhere;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    table {
      max-width: 100%;
    }

    h1,
    h2,
    h3,
    h4,
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    p,
    blockquote {
      orphans: 3;
      widows: 3;
    }
  `;

  // PDF / letter: use preview_html without adding an email header.
  const pdfDocumentHtml = useMemo(
    () => `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />
          <style>
            ${baseStyles}

            body {
              max-width: 210mm;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          ${previewHtml}
        </body>
      </html>
    `,
    [baseStyles, previewHtml],
  );

  // Email: add a clean email header above the rendered template.
  const emailDocumentHtml = useMemo(
    () => `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />
          <style>
            ${baseStyles}

            .email-container-header {
              display: flex;
              align-items: flex-start;
              gap: 14px;
              padding: 22px 26px 18px;
              border-bottom: 1px solid #e5e7eb;
              background: #ffffff;
            }

            .email-avatar {
              display: flex;
              width: 42px;
              height: 42px;
              min-width: 42px;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              background: #eff6ff;
              color: #2563eb;
              font-size: 14px;
              font-weight: 700;
            }

            .email-meta {
              min-width: 0;
              flex: 1;
              color: #64748b;
              font-size: 12px;
            }

            .email-meta .subject {
              margin-bottom: 8px;
              color: #0f172a;
              font-size: 16px;
              font-weight: 700;
              line-height: 1.45;
              overflow-wrap: anywhere;
            }

            .email-meta-row {
              margin-bottom: 3px;
              overflow-wrap: anywhere;
            }

            .email-meta-row strong {
              color: #475569;
            }

            .email-date {
              color: #94a3b8;
              font-size: 11px;
              white-space: nowrap;
            }

            @media (max-width: 520px) {
              .email-container-header {
                gap: 10px;
                padding: 16px;
              }

              .email-avatar {
                width: 34px;
                height: 34px;
                min-width: 34px;
                font-size: 12px;
              }

              .email-meta .subject {
                font-size: 14px;
              }

              .email-date {
                white-space: normal;
                text-align: right;
              }
            }
          </style>
        </head>

        <body>
          <div class="email-container-header">
            <div class="email-avatar">HR</div>

            <div class="email-meta">
              <div class="subject">${templateSubject}</div>

              <div class="email-meta-row">
                <strong>From:</strong> hr@example.com
              </div>

              <div class="email-meta-row">
                <strong>To:</strong> employee@example.com
              </div>
            </div>

            <div class="email-date">
              ${formatEmailTime(data?.created_at)}
            </div>
          </div>

          ${previewHtml}
        </body>
      </html>
    `,
    [baseStyles, previewHtml, templateSubject, data?.created_at],
  );

  // Measure the iframe content to avoid an unnecessary inner scrollbar.
  const handleIframeLoad = useCallback((event) => {
    try {
      const doc = event.currentTarget.contentDocument;

      if (!doc) return;

      const height = Math.max(
        doc.documentElement?.scrollHeight || 0,
        doc.body?.scrollHeight || 0,
        600,
      );

      setIframeHeight(height);
      setIframeLoaded(true);
    } catch {
      // Keep the default iframe height if measurement is unavailable.
      setIframeLoaded(true);
    }
  }, []);

  // Print only the rendered document inside the preview iframe.
  // This excludes the application header, details panel, and surrounding UI.
  const handlePrint = useCallback(() => {
    const iframe = document.querySelector(
      'iframe[title="Rendered Template Preview"]',
    );
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }, []);

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <div
      className="flex min-h-screen w-full flex-col bg-[#f6f8fb]
      font-poppins text-slate-800"
    >
      {/* COMPACT HEADER */}
      <header
        className="sticky top-0 z-30 border-b border-slate-200/80
        bg-white/95 backdrop-blur-md"
      >
        <div
          className="mx-auto flex w-full max-w-[1600px]
          items-center justify-between gap-3 px-4 py-3 md:px-7"
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              title="Back to templates"
              aria-label="Back to templates"
              className="flex h-9 w-9 shrink-0 items-center justify-center
                rounded-lg border border-slate-200 bg-white text-slate-600
                transition hover:border-slate-300 hover:bg-slate-50
                hover:text-slate-900 focus:outline-none focus:ring-2
                focus:ring-blue-500/30"
            >
              <FiArrowLeft size={17} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1
                  className="truncate text-sm tracking-tight
                  text-slate-900 md:text-base"
                >
                  {data?.name || "Template Preview"}
                </h1>
              </div>

              <p className="mt-0.5 truncate text-xs text-slate-500">
                Templates
                <span className="mx-1.5 text-slate-300">/</span>
                Preview
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className="hidden items-center gap-1.5 rounded-full
              border border-emerald-200 bg-emerald-50 px-2.5 py-1.5
              text-[11px] font-medium text-emerald-700 sm:inline-flex"
            >
              <FiCheckCircle size={12} />
              Preview ready
            </span>

            {subTab === "presets" && onClone && (
              <button
                type="button"
                onClick={() => onClone(data?.id)}
                className="inline-flex h-9 items-center justify-center
                  gap-2 rounded-lg bg-slate-900 px-3 text-xs
                  font-medium text-white shadow-sm transition
                  hover:bg-slate-700 focus:outline-none focus:ring-2
                  focus:ring-slate-400/40 md:px-4 md:text-sm"
              >
                <FiCopy size={14} />
                Clone template
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main
        className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5
        md:px-7 md:py-7"
      >
        {/* PAGE INTRO */}
        <div
          className="mb-6 flex flex-col justify-between gap-3
          sm:flex-row sm:items-end"
        >
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center
                rounded-lg bg-blue-50 text-gray-800"
              >
                <FiFileText size={15} />
              </span>

              <span
                className="text-xs  uppercase
                tracking-[0.12em] text-slate-500"
              >
                Template workspace
              </span>
            </div>

            <h2
              className="text-xl tracking-tight
              text-slate-900 md:text-2xl"
            >
              Document preview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review the rendered template before using it.
            </p>
          </div>

          <div
            className="flex items-center gap-2 self-start
            rounded-lg border border-slate-200 bg-white px-3 py-2
            text-xs font-medium text-slate-600 shadow-sm sm:self-auto"
          >
            <FiFileText size={14} className="text-slate-400" />
            {documentType}
          </div>
        </div>

        {/* RESPONSIVE TWO-COLUMN LAYOUT */}
        <div
          className="grid grid-cols-1 items-start gap-5
          xl:grid-cols-[minmax(0,1fr)_290px] xl:gap-6"
        >
          {/* LEFT: DOCUMENT PREVIEW */}
          <section className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm text-slate-800">
                  {isPdfDocument ? "Letter document" : "Email content"}
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  {isPdfDocument
                    ? "Portrait page layout"
                    : "Rendered email preview"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {hasPreview && iframeLoaded && (
                  <span
                    className="hidden items-center gap-1.5
                    text-xs text-emerald-600 sm:flex"
                  >
                    <FiCheckCircle size={13} />
                    Loaded
                  </span>
                )}

                {hasPreview && isPdfDocument && (
                  <button
                    type="button"
                    onClick={handlePrint}
                    title="Print only the A4 document or save it as PDF"
                    className="inline-flex h-9 items-center justify-center
                      gap-2 rounded-lg border border-slate-200 bg-white px-3
                      text-xs text-slate-700 shadow-sm transition
                      hover:bg-slate-50 focus:outline-none focus:ring-2
                      focus:ring-slate-300 md:px-4 md:text-sm"
                  >
                    <FiPrinter size={14} />
                    Print / Save PDF
                  </button>
                )}
              </div>
            </div>

            {!hasPreview ? (
              <div
                className="flex min-h-[360px] flex-col items-center
                justify-center rounded-xl border border-dashed
                border-slate-300 bg-white px-6 py-12 text-center"
              >
                <div
                  className="mb-4 flex h-14 w-14 items-center
                  justify-center rounded-2xl bg-slate-100 text-slate-400"
                >
                  <FiFileText size={25} />
                </div>

                <h3 className="text-sm  text-slate-800">
                  No preview available
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  This template does not have any preview content yet. Add
                  preview content to display the document here.
                </p>

                <button
                  type="button"
                  onClick={onBack}
                  className="mt-5 rounded-lg border border-slate-200
                    px-4 py-2 text-sm font-medium text-slate-700
                    transition hover:bg-slate-50"
                >
                  Back to templates
                </button>
              </div>
            ) : (
              <>
                {/* PAPER CANVAS */}
                <div
                  className="overflow-hidden rounded-xl border
                  border-slate-200 bg-[#e9edf3] p-2 shadow-sm
                  sm:p-4 md:p-6"
                >
                  <div
                    className="mx-auto w-full max-w-[794px]
                    overflow-hidden bg-white shadow-[0_4px_24px_rgba(15,23,42,0.10)]"
                  >
                    {!iframeLoaded && (
                      <div
                        className="flex h-[600px] flex-col
                        items-center justify-center gap-3 bg-white"
                      >
                        <div
                          className="h-8 w-8 animate-spin
                          rounded-full border-[3px] border-slate-200
                          border-t-blue-600"
                        />

                        <p className="text-xs text-slate-500">
                          Rendering document preview...
                        </p>
                      </div>
                    )}

                    <iframe
                      title="Rendered Template Preview"
                      sandbox="allow-same-origin"
                      srcDoc={
                        isPdfDocument ? pdfDocumentHtml : emailDocumentHtml
                      }
                      onLoad={handleIframeLoad}
                      className="block w-full border-0 bg-white"
                      style={{
                        height: iframeHeight ? `${iframeHeight}px` : "1123px",
                        minHeight: "600px",
                        visibility: iframeLoaded ? "visible" : "hidden",
                        marginTop: iframeLoaded ? 0 : "-600px",
                      }}
                    />
                  </div>
                </div>

                {/* CANVAS FOOTER */}
                <div
                  className="mt-3 flex flex-wrap items-center
                  justify-between gap-2 px-1 text-xs text-slate-400"
                >
                  <span>REBS · System Generated Document</span>

                  <span>
                    {isPdfDocument
                      ? "A4 document preview"
                      : "Email template preview"}
                  </span>
                </div>
              </>
            )}
          </section>

          {/* RIGHT: DETAILS PANEL */}
          <aside className="flex min-w-0 flex-col gap-4">
            {/* TEMPLATE INFORMATION */}
            <section
              className="overflow-hidden rounded-xl border
              border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 px-4 py-4">
                <h3 className="text-sm  text-slate-900">Template details</h3>

                <p className="mt-1 text-xs text-slate-500">
                  Basic template information
                </p>
              </div>

              <div className="divide-y divide-slate-100 px-4">
                <DetailRow
                  icon={FiFileText}
                  label="Template name"
                  value={data?.name || "Untitled template"}
                />

                <DetailRow icon={FiTag} label="Purpose" value={purposeLabel} />

                <DetailRow
                  icon={FiLayers}
                  label="Template type"
                  value={documentDescription}
                />

                <DetailRow
                  icon={FiCalendar}
                  label="Created on"
                  value={formatDate(data?.created_at)}
                />
              </div>
            </section>

            {/* STATUS PANEL */}
            <section
              className="rounded-xl border border-slate-200
              bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center
                  justify-center rounded-xl bg-emerald-50
                  text-emerald-600"
                >
                  <FiCheckCircle size={17} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm text-slate-800">Preview mode</h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Sample employee data is used to render template variables in
                    this preview.
                  </p>
                </div>
              </div>
            </section>

            {/* EMAIL SUBJECT */}
            {!isPdfDocument && (
              <section
                className="rounded-xl border border-slate-200
                bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-2">
                  <FiMail size={15} className="text-slate-500" />

                  <h3 className="text-sm  text-slate-800">Email information</h3>
                </div>

                <p className="text-xs text-slate-500">Subject</p>

                <p
                  className="mt-1 break-words text-sm font-medium
                  leading-6 text-slate-800"
                >
                  {templateSubject}
                </p>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="flex items-start gap-2.5">
                    <FiUser size={14} className="mt-0.5 text-slate-400" />

                    <div>
                      <p className="text-xs text-slate-500">
                        Preview recipient
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        employee@example.com
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* QUICK INFORMATION */}
            <div
              className="rounded-xl border border-slate-200/80
              bg-slate-50 p-4"
            >
              <div className="flex items-start gap-2.5">
                <FiClock
                  size={15}
                  className="mt-0.5 shrink-0
                  text-slate-400"
                />

                <div>
                  <p className="text-xs font-medium text-slate-700">
                    Preview information
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    This is a visual preview. Actual generated content depends
                    on the data supplied when the template is used.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default TemplatePreviewView;
