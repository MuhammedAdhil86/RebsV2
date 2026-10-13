import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Loader2, Plus } from "lucide-react";

import {
  addEducationDetails,
  updateMultipleEducationDetails,
} from "../../service/educationService";
import useEmployeeStore from "../../store/employeeStore";

/* ---------- HELPERS ---------- */

const EMPTY_ENTRY = {
  institution_name: "",
  degree: "",
  specialisation: "",
  date_of_completion: "",
};

// Extract just the date (YYYY-MM-DD). Splitting by 'T' prevents timezone shifts.
// The API uses 0001-01-01 for "no date", so treat that as empty.
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = String(dateString).split("T")[0];
  return date.startsWith("0001-01-01") ? "" : date;
};

// The service throws the backend's response body, so read it directly.
const getErrorMessage = (err, fallback) =>
  err?.message || err?.error || err?.detail || fallback;

// Stable key for an education record (falls back to index if there is no id)
const entryKey = (edu, index) => String(edu?.id ?? `idx-${index}`);

const inputClass =
  "border border-gray-300 rounded px-2 py-1 text-gray-800 text-[13px] w-full max-w-[160px] focus:outline-none focus:border-gray-500";

/* ---------- ROW COMPONENTS ----------
   Defined at module level (not inside the section) so React doesn't remount
   them on every keystroke, which would make inputs lose focus. */
const ViewRow = ({ label, value, last }) => (
  <div
    className={`flex justify-between items-center py-2 ${
      last ? "" : "border-b border-gray-100"
    }`}
  >
    <span className="text-gray-500 text-[12px]">{label}</span>
    <span className="text-gray-800 text-[13px] flex-1 min-w-0 text-right">
      {value || "-"}
    </span>
  </div>
);

const EditRow = ({ label, last, children }) => (
  <div
    className={`flex justify-between items-center py-2 ${
      last ? "" : "border-b border-gray-100"
    }`}
  >
    <span className="text-gray-500 text-[12px]">{label}</span>
    {children}
  </div>
);

// The four editable fields, shared by the "add" form and the "edit" form
const EducationFields = ({ draft, onChange }) => (
  <>
    <EditRow label="Institution">
      <input
        type="text"
        value={draft.institution_name ?? ""}
        onChange={(e) => onChange("institution_name", e.target.value)}
        placeholder="e.g. University of Calicut"
        className={inputClass}
      />
    </EditRow>

    <EditRow label="Degree/Diploma">
      <input
        type="text"
        value={draft.degree ?? ""}
        onChange={(e) => onChange("degree", e.target.value)}
        placeholder="e.g. Bachelor of Technology"
        className={inputClass}
      />
    </EditRow>

    <EditRow label="Specialization">
      <input
        type="text"
        value={draft.specialisation ?? ""}
        onChange={(e) => onChange("specialisation", e.target.value)}
        placeholder="e.g. Computer Science"
        className={inputClass}
      />
    </EditRow>

    <EditRow label="Date of Completion" last>
      <input
        type="date"
        value={draft.date_of_completion ?? ""}
        onChange={(e) => onChange("date_of_completion", e.target.value)}
        className={inputClass}
      />
    </EditRow>
  </>
);

/* ---------- MAIN COMPONENT ---------- */
const EducationalDetailsSection = ({ employee, onSuccess, onError }) => {
  const educationData = employee?.education_details || [];
  const isEmpty = educationData.length === 0;

  const { fetchEmployeeById } = useEmployeeStore();

  // mode: null (view) | "add" (no data yet) | "edit" (data exists)
  const [mode, setMode] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // edit mode: { [entryKey]: { institution_name, degree, specialisation, date_of_completion } }
  const [drafts, setDrafts] = useState({});
  // add mode: a single new record
  const [newEntry, setNewEntry] = useState(EMPTY_ENTRY);

  /* ---------- OPEN / CLOSE ---------- */
  const startAdding = () => {
    setNewEntry(EMPTY_ENTRY);
    setMode("add");
  };

  const startEditing = () => {
    const initial = {};
    educationData.forEach((edu, index) => {
      initial[entryKey(edu, index)] = {
        institution_name: edu.institution_name || "",
        degree: edu.degree || "",
        specialisation: edu.specialisation || "",
        date_of_completion: formatDate(edu.date_of_completion),
      };
    });
    setDrafts(initial);
    setMode("edit");
  };

  const closeForm = () => {
    if (isSaving) return;
    setMode(null);
    setDrafts({});
    setNewEntry(EMPTY_ENTRY);
  };

  const handleDraftChange = (key, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleNewEntryChange = (field, value) => {
    setNewEntry((prev) => ({ ...prev, [field]: value }));
  };

  /* ---------- SAVE: ADD ---------- */
  const saveNew = async () => {
    if (!employee?.id) {
      onError?.("Cannot add: employee id is missing");
      return false;
    }
    if (!newEntry.institution_name.trim() || !newEntry.degree.trim()) {
      onError?.("Institution and Degree are required");
      return false;
    }

    await addEducationDetails(employee.id, newEntry);
    onSuccess?.("Education detail added successfully");
    return true;
  };

  /* ---------- SAVE: UPDATE ---------- */
  const saveUpdates = async () => {
    // Validate every entry before sending anything
    for (let i = 0; i < educationData.length; i++) {
      const edu = educationData[i];
      const draft = drafts[entryKey(edu, i)];

      if (edu.id === undefined || edu.id === null || edu.id === "") {
        onError?.("Cannot update: education record has no id");
        return false;
      }
      if (!draft?.institution_name?.trim() || !draft?.degree?.trim()) {
        onError?.("Institution and Degree are required");
        return false;
      }
    }

    // PUT /staff/updateeducation/{educationId} for each entry
    await updateMultipleEducationDetails(
      educationData.map((edu, index) => ({
        id: edu.id,
        ...drafts[entryKey(edu, index)],
      })),
    );
    onSuccess?.("Educational details updated successfully");
    return true;
  };

  /* ---------- SAVE HANDLER ---------- */
  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const ok = mode === "add" ? await saveNew() : await saveUpdates();
      if (!ok) return;

      // Re-fetch so the profile (GET /staff/get/{id}) shows the saved values
      if (employee?.id) await fetchEmployeeById(employee.id);

      setMode(null);
      setDrafts({});
      setNewEntry(EMPTY_ENTRY);
    } catch (err) {
      console.error("Error saving education:", err);
      onError?.(
        getErrorMessage(
          err,
          mode === "add"
            ? "Failed to add educational details"
            : "Failed to update educational details",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">
          Educational Details
        </h3>

        {/* No data -> "+" to add. Data available -> pencil to update. */}
        {!mode &&
          (isEmpty ? (
            <button
              type="button"
              onClick={startAdding}
              aria-label="Add educational details"
              title="Add educational details"
              className="cursor-pointer"
            >
              <Plus className="w-5 h-5 text-gray-400 hover:text-gray-700 transition-colors" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              aria-label="Edit educational details"
              title="Edit educational details"
              className="cursor-pointer"
            >
              <Icon
                icon="basil:edit-outline"
                className="w-5 h-5 text-gray-400 hover:text-gray-700 transition-colors"
              />
            </button>
          ))}
      </div>

      {/* Body */}
      <div className="space-y-4">
        {mode === "add" ? (
          /* ---------- ADD FORM (no existing data) ---------- */
          <div className="bg-white">
            <EducationFields draft={newEntry} onChange={handleNewEntryChange} />
          </div>
        ) : isEmpty ? (
          <div className="text-gray-500 text-[13px]">
            No educational details available
          </div>
        ) : (
          /* ---------- VIEW / EDIT EXISTING RECORDS ---------- */
          educationData.map((edu, index) => {
            const key = entryKey(edu, index);

            return (
              <div key={key} className="bg-white">
                {/* Education Header if multiple entries */}
                {educationData.length > 1 && (
                  <div className="text-[14px] font-medium text-gray-800 mb-2 border-b border-gray-200 pb-1">
                    Education {index + 1}
                  </div>
                )}

                {mode === "edit" ? (
                  <EducationFields
                    draft={drafts[key] || EMPTY_ENTRY}
                    onChange={(field, value) =>
                      handleDraftChange(key, field, value)
                    }
                  />
                ) : (
                  <>
                    <ViewRow label="Institution" value={edu.institution_name} />
                    <ViewRow label="Degree/Diploma" value={edu.degree} />
                    <ViewRow
                      label="Specialization"
                      value={edu.specialisation}
                    />
                    <ViewRow
                      label="Date of Completion"
                      value={formatDate(edu.date_of_completion)}
                      last
                    />
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Form Actions */}
      {mode && (
        <div className="flex justify-end items-center gap-3 mt-4">
          <button
            type="button"
            onClick={closeForm}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-200 rounded-md text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[#111827] hover:bg-black text-white text-xs rounded-md shadow cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-w-[96px]"
          >
            {isSaving ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : mode === "add" ? (
              "Add"
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default EducationalDetailsSection;
