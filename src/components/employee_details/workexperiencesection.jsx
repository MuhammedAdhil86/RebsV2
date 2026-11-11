import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "react-toastify"; // uses the global <ToastContainer /> from App.jsx

import axiosInstance from "../../service/axiosinstance";
import useEmployeeStore from "../../store/employeeStore";

/* ---------- API ENDPOINTS ----------
   Adjust these two if your backend uses different routes. */
const addUrl = (employeeId) => `/staff/addworkexperience/${employeeId}`;
const updateUrl = (experienceId) =>
  `/staff/updateworkexperience/${experienceId}`;

/* ---------- HELPERS ---------- */

const EMPTY_ENTRY = {
  company_name: "",
  job_title: "",
  from_date: "",
  to_date: "",
  is_relavant: "no", // "yes" | "no" (field name matches the API spelling)
  job_description: "",
};

// Date only (YYYY-MM-DD). Splitting by 'T' prevents timezone shifts.
// The API uses 0001-01-01 for "no date", so treat that as empty.
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = String(dateString).split("T")[0];
  return date.startsWith("0001-01-01") ? "" : date;
};

// Accepts true/false, "true"/"false", "yes"/"no", 1/0 -> "yes" | "no"
const toYesNo = (value) => {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  return v === "true" || v === "yes" || v === "1" ? "yes" : "no";
};

const displayYesNo = (value) =>
  value === null || value === undefined || value === ""
    ? "-"
    : toYesNo(value) === "yes"
      ? "Yes"
      : "No";

const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message ||
  err?.message ||
  err?.error ||
  err?.detail ||
  fallback;

// Stable key for an experience record (falls back to index if there is no id)
const entryKey = (exp, index) => String(exp?.id ?? `idx-${index}`);

// Body sent to the API
const buildPayload = (draft) => ({
  company_name: draft.company_name.trim(),
  job_title: draft.job_title.trim(),
  from_date: draft.from_date ? new Date(draft.from_date).toISOString() : null,
  to_date: draft.to_date ? new Date(draft.to_date).toISOString() : null,
  is_relavant: draft.is_relavant === "yes",
  job_description: draft.job_description.trim(),
});

const inputClass =
  "border border-gray-300 rounded px-2 py-1 text-gray-800 text-[13px] w-full max-w-[180px] focus:outline-none focus:border-gray-500";

/* ---------- ROW COMPONENTS ----------
   Defined at module level so React doesn't remount them on every keystroke
   (which would make inputs lose focus). */
const ViewRow = ({ label, value, last }) => (
  <div
    className={`flex justify-between items-center py-3 ${
      last ? "" : "border-b border-gray-100"
    }`}
  >
    <span className="text-[13px] font-medium text-gray-700">{label}</span>
    <span className="text-[13px] text-gray-900 font-medium text-right min-w-0 break-words max-w-[60%]">
      {value || "-"}
    </span>
  </div>
);

const EditRow = ({ label, last, children }) => (
  <div
    className={`flex justify-between items-center py-3 ${
      last ? "" : "border-b border-gray-100"
    }`}
  >
    <span className="text-[13px] font-medium text-gray-700">{label}</span>
    {children}
  </div>
);

// Editable fields, shared by the "add" form and the "edit" form
const ExperienceFields = ({ draft, onChange }) => (
  <>
    <EditRow label="Company Name">
      <input
        type="text"
        value={draft.company_name ?? ""}
        onChange={(e) => onChange("company_name", e.target.value)}
        placeholder="e.g. Acme Pvt Ltd"
        className={inputClass}
      />
    </EditRow>

    <EditRow label="Job Title">
      <input
        type="text"
        value={draft.job_title ?? ""}
        onChange={(e) => onChange("job_title", e.target.value)}
        placeholder="e.g. Software Engineer"
        className={inputClass}
      />
    </EditRow>

    <EditRow label="From Date">
      <input
        type="date"
        value={draft.from_date ?? ""}
        onChange={(e) => onChange("from_date", e.target.value)}
        className={inputClass}
      />
    </EditRow>

    <EditRow label="To Date">
      <input
        type="date"
        value={draft.to_date ?? ""}
        onChange={(e) => onChange("to_date", e.target.value)}
        className={inputClass}
      />
    </EditRow>

    <EditRow label="Is Relevant">
      <select
        value={draft.is_relavant ?? "no"}
        onChange={(e) => onChange("is_relavant", e.target.value)}
        className={inputClass}
      >
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </EditRow>

    <EditRow label="Job Description" last>
      <textarea
        rows={2}
        value={draft.job_description ?? ""}
        onChange={(e) => onChange("job_description", e.target.value)}
        placeholder="Short description"
        className={`${inputClass} resize-none`}
      />
    </EditRow>
  </>
);

/* ---------- MAIN COMPONENT ---------- */
const WorkExperienceSection = ({ employee, onSuccess, onError }) => {
  // Use the parent's handlers if they are passed; otherwise fall back to
  // react-toastify (shown by the global <ToastContainer /> in App.jsx).
  const notifySuccess = (msg) =>
    onSuccess ? onSuccess(msg) : toast.success(msg);
  const notifyError = (msg) => (onError ? onError(msg) : toast.error(msg));

  const workData = employee?.work_experience || [];
  const isEmpty = workData.length === 0;

  const { fetchEmployeeById } = useEmployeeStore();

  // mode: null (view) | "add" (new record) | "edit" (existing records)
  const [mode, setMode] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // edit mode: { [entryKey]: draft }
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
    workData.forEach((exp, index) => {
      initial[entryKey(exp, index)] = {
        company_name: exp.company_name || "",
        job_title: exp.job_title || "",
        from_date: formatDate(exp.from_date),
        to_date: formatDate(exp.to_date),
        is_relavant: toYesNo(exp.is_relavant),
        job_description: exp.job_description || "",
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

  /* ---------- VALIDATION ---------- */
  // Returns an error message, or "" when the draft is valid
  const validate = (draft) => {
    if (!draft.company_name.trim() || !draft.job_title.trim()) {
      return "Company name and Job title are required";
    }
    if (
      draft.from_date &&
      draft.to_date &&
      new Date(draft.to_date) < new Date(draft.from_date)
    ) {
      return "To date cannot be before From date";
    }
    return "";
  };

  /* ---------- SAVE: ADD ---------- */
  const saveNew = async () => {
    if (!employee?.id) {
      notifyError("Cannot add: employee id is missing");
      return false;
    }
    const problem = validate(newEntry);
    if (problem) {
      notifyError(problem);
      return false;
    }

    await axiosInstance.post(addUrl(employee.id), buildPayload(newEntry));
    notifySuccess("Work experience added successfully");
    return true;
  };

  /* ---------- SAVE: UPDATE ---------- */
  const saveUpdates = async () => {
    // Validate every entry before sending anything
    for (let i = 0; i < workData.length; i++) {
      const exp = workData[i];
      const draft = drafts[entryKey(exp, i)];

      if (exp.id === undefined || exp.id === null || exp.id === "") {
        notifyError("Cannot update: work experience record has no id");
        return false;
      }
      const problem = draft ? validate(draft) : "Missing form data";
      if (problem) {
        notifyError(problem);
        return false;
      }
    }

    await Promise.all(
      workData.map((exp, index) =>
        axiosInstance.put(
          updateUrl(exp.id),
          buildPayload(drafts[entryKey(exp, index)]),
        ),
      ),
    );
    notifySuccess("Work experience updated successfully");
    return true;
  };

  /* ---------- SAVE HANDLER ---------- */
  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const ok = mode === "add" ? await saveNew() : await saveUpdates();
      if (!ok) return;

      // Re-fetch so the profile shows the saved values
      if (employee?.id) await fetchEmployeeById(employee.id);

      setMode(null);
      setDrafts({});
      setNewEntry(EMPTY_ENTRY);
    } catch (err) {
      console.error("Error saving work experience:", err);
      notifyError(
        getErrorMessage(
          err,
          mode === "add"
            ? "Failed to add work experience"
            : "Failed to update work experience",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-800">Work Experience</h3>

        {!mode && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startAdding}
              aria-label="Add work experience"
              title="Add work experience"
              className="cursor-pointer"
            >
              <Plus className="w-5 h-5 text-gray-400 hover:text-gray-700 transition-colors" />
            </button>
            {!isEmpty && (
              <button
                type="button"
                onClick={startEditing}
                aria-label="Edit work experience"
                title="Edit work experience"
                className="cursor-pointer"
              >
                <Icon
                  icon="basil:edit-outline"
                  className="w-5 h-5 text-gray-400 hover:text-gray-700 transition-colors"
                />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="space-y-6">
        {mode === "add" ? (
          /* ---------- ADD FORM ---------- */
          <div className="bg-white rounded-lg">
            <ExperienceFields
              draft={newEntry}
              onChange={handleNewEntryChange}
            />
          </div>
        ) : isEmpty ? (
          <div className="text-gray-500 text-sm">
            No work experience available
          </div>
        ) : (
          /* ---------- VIEW / EDIT EXISTING RECORDS ---------- */
          workData.map((exp, index) => {
            const key = entryKey(exp, index);

            return (
              <div key={key} className="bg-white rounded-lg">
                {workData.length > 1 && (
                  <div className="text-sm font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                    Experience {index + 1}
                  </div>
                )}

                {mode === "edit" ? (
                  <ExperienceFields
                    draft={drafts[key] || EMPTY_ENTRY}
                    onChange={(field, value) =>
                      handleDraftChange(key, field, value)
                    }
                  />
                ) : (
                  <>
                    <ViewRow label="Company Name" value={exp.company_name} />
                    <ViewRow label="Job Title" value={exp.job_title} />
                    <ViewRow
                      label="From Date"
                      value={formatDate(exp.from_date)}
                    />
                    <ViewRow label="To Date" value={formatDate(exp.to_date)} />
                    <ViewRow
                      label="Is Relevant"
                      value={displayYesNo(exp.is_relavant)}
                    />
                    <ViewRow
                      label="Job Description"
                      value={exp.job_description}
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

export default WorkExperienceSection;
