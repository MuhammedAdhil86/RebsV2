import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiEdit2, FiTrash2, FiPlus, FiEye, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

import announceService from "../service/announceService";
import DeleteConfirmationModal from "../ui/deletemodal";
import CelebrationForm from "../ui/CelebrationModal";

const CELEBRATION_LABELS = {
  BIRTHDAY: "Birthday",
  WORK_ANNIVERSARY: "Work Anniversary",
};

// Renders children straight into <body>, above the page header and sidebar, so a
// modal's backdrop (and its blur) always covers the whole screen, top included.
const Overlay = ({ children }) =>
  createPortal(
    <div className="fixed inset-0 z-[100]">{children}</div>,
    document.body,
  );

// Width the template text is positioned against (80px + 440px + 80px).
const TEMPLATE_WIDTH = 600;

// Sample avatar for celebration previews.
const SAMPLE_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#d1d5db"/><circle cx="48" cy="38" r="16" fill="#9ca3af"/><rect x="20" y="62" width="56" height="30" rx="14" fill="#9ca3af"/></svg>`,
  );

// Safely encode URLs.
const safeUrl = (url) => {
  if (!url) return "";
  try {
    return encodeURI(decodeURI(url));
  } catch {
    return url;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Replace the template placeholders with the preview values from the API,
// then lay the text over the template image (the text uses absolute positions).
const buildCelebrationHtml = (celebration) => {
  const text =
    celebration.preview?.celebration_text || celebration.celebration_text || "";

  const values = {
    "{{.CompanyName}}": celebration.preview?.company_name || "Your Company",
    "{{.EmployeeName}}":
      celebration.preview?.employee_name || "Sample Employee",
    "{{.EmployeeImageURL}}":
      celebration.preview?.employee_image_url || SAMPLE_IMAGE,
    "{{.CompanyLogoURL}}":
      celebration.preview?.company_logo_url || SAMPLE_IMAGE,
    "{{.Designation}}": celebration.preview?.designation || "Software Engineer",
    "{{.DateOfBirth}}": celebration.preview?.date_of_birth || "15 Mar 1995",
    "{{.AnniversaryYearCount}}":
      celebration.preview?.anniversary_year_count || "3",
    "{{.DateOfJoin}}": celebration.preview?.date_of_join || "01 Jun 2023",
  };

  const filled = Object.entries(values).reduce(
    (html, [key, value]) => html.replaceAll(key, value),
    text,
  );

  const templateUrl = safeUrl(
    celebration.preview?.template_url || celebration.template_url,
  );

  const background = templateUrl
    ? `<img src="${templateUrl}" style="display:block;width:${TEMPLATE_WIDTH}px" />`
    : "";

  return `<body style="margin:0;padding:24px 0;background:#f3f4f6"><div style="position:relative;width:${TEMPLATE_WIDTH}px;margin:0 auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,0.12)">${background}${filled}</div></body>`;
};

const CelibrationLayout = () => {
  const [celebrations, setCelebrations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create / edit page: null (show the list) or { type, isEdit }.
  const [form, setForm] = useState(null);

  // Delete.
  const [selectedCelebration, setSelectedCelebration] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Full-screen preview.
  const [previewCelebration, setPreviewCelebration] = useState(null);

  // Fetch saved celebration templates (list API filters by type).
  const loadCelebrations = async () => {
    setLoading(true);
    try {
      const [birthdays, anniversaries] = await Promise.all([
        announceService.fetchCelebrations("BIRTHDAY"),
        announceService.fetchCelebrations("WORK_ANNIVERSARY"),
      ]);
      setCelebrations([...birthdays, ...anniversaries]);
    } catch (error) {
      console.error("Failed to load celebrations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Loads every time the layout is shown (it mounts when the view opens).
  useEffect(() => {
    loadCelebrations();
  }, []);

  // Full-screen preview: close on Escape and lock page scroll while open.
  useEffect(() => {
    if (!previewCelebration) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setPreviewCelebration(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewCelebration]);

  const openForm = (type, edit = false) => setForm({ type, isEdit: edit });

  const closeForm = () => setForm(null);

  const handleCloseDelete = () => {
    if (isDeleting) return;
    setSelectedCelebration(null);
  };

  // The delete API works by celebration type
  // (DELETE /employee/celebration/delete/?celebration_type=BIRTHDAY),
  // so the type is sent to the API and the id is only used to update the list.
  const handleConfirmDelete = async () => {
    if (!selectedCelebration || isDeleting) return;

    const { id: celebrationId, celebration_type: celebrationType } =
      selectedCelebration;
    setIsDeleting(true);

    try {
      await announceService.deleteCelebration(celebrationType);
      setCelebrations((prev) => prev.filter((c) => c.id !== celebrationId));
      setSelectedCelebration(null);
      toast.success("Celebration deleted successfully");
    } catch (error) {
      console.error("Failed to delete celebration:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete celebration",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Create / edit page: replaces the list while open.
  if (form) {
    return (
      <CelebrationForm
        initialType={form.type}
        isEdit={form.isEdit}
        onCancel={closeForm}
        onSaved={() => {
          closeForm();
          loadCelebrations();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar: new celebration */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => openForm(undefined, false)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-black border border-gray-200 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
        >
          <FiPlus size={14} />
          <span>New Celebration</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-12 flex justify-center rounded-lg shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      ) : celebrations.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-400">No celebrations yet.</p>
        </div>
      ) : (
        celebrations.map((celebration) => {
          const label =
            CELEBRATION_LABELS[celebration.celebration_type] ||
            celebration.celebration_type;

          return (
            <div
              key={celebration.id}
              className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col ${
                celebration.template_url ? "md:flex-row" : ""
              }`}
            >
              {/* Template image: click to preview full screen */}
              {celebration.template_url && (
                <button
                  type="button"
                  onClick={() => setPreviewCelebration(celebration)}
                  className="w-full md:w-1/3 lg:w-1/4 h-48 md:h-auto bg-gray-50 flex-shrink-0 border-r border-gray-100 cursor-pointer"
                  title="Preview"
                  aria-label={`Preview ${label}`}
                >
                  <img
                    src={safeUrl(celebration.template_url)}
                    alt={label}
                    className="w-full h-full object-cover"
                  />
                </button>
              )}

              {/* Celebration content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-800 bg-gray-100 px-2 py-1 rounded">
                      {celebration.celebration_type === "BIRTHDAY"
                        ? "Birthday"
                        : "Anniversary"}
                    </span>

                    <h2 className="text-[16px] text-gray-900 mt-2 font-semibold break-words">
                      {label}
                    </h2>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap">
                      {formatDate(celebration.updated_at)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewCelebration(celebration)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-black hover:bg-gray-100 px-2.5 py-2 rounded-lg transition-colors"
                        title="Preview celebration"
                        aria-label={`Preview ${label}`}
                      >
                        <FiEye size={15} />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openForm(celebration.celebration_type, true)
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-black hover:bg-gray-100 px-2.5 py-2 rounded-lg transition-colors"
                        title="Edit celebration"
                        aria-label={`Edit ${label}`}
                      >
                        <FiEdit2 size={15} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedCelebration(celebration)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-black hover:bg-gray-100 px-2.5 py-2 rounded-lg transition-colors"
                        title="Delete celebration"
                        aria-label={`Delete ${label}`}
                      >
                        <FiTrash2 size={15} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-[12px] leading-relaxed mt-3">
                  Sent automatically to employees on their{" "}
                  {celebration.celebration_type === "BIRTHDAY"
                    ? "birthday"
                    : "work anniversary"}
                  .
                </p>
              </div>
            </div>
          );
        })
      )}

      {/* Full-screen preview */}
      {previewCelebration && (
        <Overlay>
          <div className="fixed inset-0 bg-white flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <h3 className="text-sm font-semibold text-gray-900">
                {CELEBRATION_LABELS[previewCelebration.celebration_type] ||
                  previewCelebration.celebration_type}{" "}
                preview
              </h3>

              <button
                type="button"
                onClick={() => setPreviewCelebration(null)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-black hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                aria-label="Close preview"
              >
                <FiX size={16} />
                <span>Close</span>
              </button>
            </div>

            {/* Sandboxed preview: scripts cannot run */}
            <iframe
              title={`${previewCelebration.celebration_type} preview`}
              sandbox=""
              srcDoc={buildCelebrationHtml(previewCelebration)}
              className="flex-1 w-full bg-gray-100"
            />
          </div>
        </Overlay>
      )}

      {/* Delete confirmation modal */}
      {selectedCelebration && (
        <Overlay>
          <DeleteConfirmationModal
            isOpen
            onClose={handleCloseDelete}
            onConfirm={handleConfirmDelete}
            itemName={
              CELEBRATION_LABELS[selectedCelebration.celebration_type] ||
              "this celebration"
            }
            isDeleting={isDeleting}
          />
        </Overlay>
      )}
    </div>
  );
};

export default CelibrationLayout;
