import React, { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import CommonUploadActions from "../../ui/commonupload";
import { addEducationDetails } from "../../service/educationService";

/* ---------- HELPERS ---------- */

const EMPTY_FIELDS = {
  institution_name: "",
  degree: "",
  specialisation: "",
  date_of_completion: "",
};

// Each entry gets a local uid so rows stay stable while adding/removing.
// `saved` marks entries already posted, so a retry never creates duplicates.
const createEntry = () => ({
  uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  saved: false,
  ...EMPTY_FIELDS,
});

const isEntryEmpty = (entry) =>
  !entry.institution_name.trim() &&
  !entry.degree.trim() &&
  !entry.specialisation.trim() &&
  !entry.date_of_completion;

// The service throws the backend's response body, so read it directly.
const getErrorMessage = (err, fallback) =>
  err?.message || err?.error || err?.detail || fallback;

const EducationalDetails = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [entries, setEntries] = useState([createEntry()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** ✅ Handle input changes for one entry */
  const handleChange = (uid, e) => {
    const { name, value } = e.target;
    setEntries((prev) =>
      prev.map((entry) =>
        entry.uid === uid ? { ...entry, [name]: value } : entry,
      ),
    );
  };

  /** ✅ Add / remove entries */
  const addEntry = () => setEntries((prev) => [...prev, createEntry()]);

  const removeEntry = (uid) =>
    setEntries((prev) =>
      prev.length > 1 ? prev.filter((entry) => entry.uid !== uid) : prev,
    );

  /** ✅ Handle form submission */
  const handleSubmit = async () => {
    const employeeId = localStorage.getItem("employeeId");

    if (!employeeId) {
      toast.error("Employee ID missing. Please restart onboarding.");
      return;
    }

    const alreadySaved = entries.filter((entry) => entry.saved);
    const pending = entries.filter(
      (entry) => !entry.saved && !isEntryEmpty(entry),
    );

    // Validate everything before sending anything
    if (pending.length === 0 && alreadySaved.length === 0) {
      toast.error("Please add at least one educational detail.");
      return;
    }

    for (const entry of pending) {
      if (!entry.institution_name.trim() || !entry.degree.trim()) {
        toast.error("Institution and Degree are required.");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Save one by one; mark each as saved so a retry skips it
      for (const entry of pending) {
        const { uid, saved, ...data } = entry;
        await addEducationDetails(Number(employeeId), data);
        setEntries((prev) =>
          prev.map((item) =>
            item.uid === uid ? { ...item, saved: true } : item,
          ),
        );
      }

      toast.success("Educational details saved successfully!");
      localStorage.setItem("educationInfoCompleted", "true");

      if (onStepComplete) onStepComplete();
      else if (goNextStep) goNextStep();
    } catch (error) {
      toast.error(getErrorMessage(error, "Error saving educational details."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-4 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base font-medium text-gray-900">
            Educational Details
          </h2>
          <p className="text-sm text-gray-500">Step 09</p>
        </div>
        <CommonUploadActions />
      </div>

      {/* Main Form Section */}
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div key={entry.uid} className="bg-white rounded-xl shadow-sm p-6">
            {/* Entry header (only when there is more than one) */}
            {entries.length > 1 && (
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                <span className="text-sm font-medium text-gray-800">
                  Education {index + 1}
                  {entry.saved && (
                    <span className="ml-2 text-xs text-green-600">Saved</span>
                  )}
                </span>
                {!entry.saved && (
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.uid)}
                    aria-label={`Remove education ${index + 1}`}
                    title="Remove"
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField
                label="Institution"
                name="institution_name"
                value={entry.institution_name}
                onChange={(e) => handleChange(entry.uid, e)}
                placeholder="e.g. University of Calicut"
                disabled={entry.saved}
              />

              <InputField
                label="Degree/Diploma"
                name="degree"
                value={entry.degree}
                onChange={(e) => handleChange(entry.uid, e)}
                placeholder="e.g. Bachelor of Technology"
                disabled={entry.saved}
              />

              <InputField
                label="Specialization"
                name="specialisation"
                value={entry.specialisation}
                onChange={(e) => handleChange(entry.uid, e)}
                placeholder="e.g. Computer Science"
                disabled={entry.saved}
              />

              <InputField
                label="Date of Completion"
                type="date"
                name="date_of_completion"
                value={entry.date_of_completion}
                onChange={(e) => handleChange(entry.uid, e)}
                disabled={entry.saved}
              />
            </div>
          </div>
        ))}

        {/* Add another education */}
        <button
          type="button"
          onClick={addEntry}
          disabled={isSubmitting}
          className="flex items-center gap-1 text-sm text-gray-700 hover:text-black border border-dashed border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-100 disabled:opacity-50 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Another Education
        </button>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={goPrevStep}
          type="button"
          className="border border-gray-300 text-gray-700 text-sm px-6 py-2 rounded-lg hover:bg-gray-100 transition-all"
        >
          Previous
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          type="button"
          className="bg-gray-900 hover:bg-black text-white text-sm px-6 py-2 rounded-lg shadow disabled:opacity-50 transition-all"
        >
          {isSubmitting ? "Saving..." : "Save & Complete"}
        </button>
      </div>
    </div>
  );
};

/** 🔹 Atomic Input Component */
const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
}) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-700 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 focus:outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
    />
  </div>
);

export default EducationalDetails;
