import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Icon } from "@iconify/react";
import axiosInstance from "../../../service/axiosinstance";
import { toast } from "react-toastify"; // uses the global <ToastContainer /> from App.jsx
import { useNavigate } from "react-router-dom";

// Exact message from the backend; also appends the `data` detail string if present
const getBackendMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  const main = data?.message || data?.error || data?.detail || "";
  const detail =
    typeof data?.data === "string" && data.data.trim() ? data.data.trim() : "";
  if (main && detail && !main.includes(detail)) return `${main}: ${detail}`;
  return main || detail || fallback;
};

// ----------------------------------------------------
// ✔ Toggle Component (green when on)
// ----------------------------------------------------
const Toggle = ({ enabled, onToggle, disabled, label }) => {
  return (
    <div
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onToggle()}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`w-10 h-5 shrink-0 flex items-center rounded-full p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400
        ${enabled ? "bg-green-500" : "bg-gray-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow transform duration-200
          ${enabled ? "translate-x-5" : "translate-x-0"}`}
      />
    </div>
  );
};

// ----------------------------------------------------
// ✔ Main Component
// ----------------------------------------------------
export default function ManagePreferencesSection({ uuid, initialPreferences }) {
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState({
    attendanceRequired: true,
    userActive: true,
    deleteUser: false,
  });

  const [originalPref, setOriginalPref] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  // ----------------------------------------------------
  // ✔ Fetch attendanceRequired
  // ----------------------------------------------------
  useEffect(() => {
    const fetchAttendanceRule = async () => {
      try {
        const response = await axiosInstance.get(
          `master/shift-attendance-user-type/${uuid}`,
        );

        const data = response.data?.data;
        if (data) {
          const required =
            data.is_attendance_required === true ||
            data.is_attendance_required === "true";
          setPreferences((prev) => ({ ...prev, attendanceRequired: required }));
          setOriginalPref((prev) =>
            prev ? { ...prev, attendanceRequired: required } : prev,
          );
        }
      } catch (error) {
        // The specific "no shift" case is not an error for the user
        const serverMessage = error.response?.data?.data;

        if (serverMessage === "no shift allocated for the user so far") {
          console.warn(
            "User has no shift allocated; defaulting attendance to false.",
          );
          setPreferences((prev) => ({ ...prev, attendanceRequired: false }));
          setOriginalPref((prev) =>
            prev ? { ...prev, attendanceRequired: false } : prev,
          );
        } else {
          toast.error("Failed to load attendance settings");
        }
      }
    };

    fetchAttendanceRule();
  }, [uuid]);

  // ----------------------------------------------------
  // ✔ Initialize from backend initialPreferences
  //   (runs only when the employee data changes, so toggling in edit mode
  //    never resets the other switches)
  // ----------------------------------------------------
  useEffect(() => {
    if (!initialPreferences) return;

    const active =
      initialPreferences.is_active === true ||
      initialPreferences.is_active === "true";

    setPreferences((prev) => ({
      ...prev,
      userActive: active,
      deleteUser: false,
    }));
    setOriginalPref((prev) => ({
      attendanceRequired: prev?.attendanceRequired ?? true,
      userActive: active,
      deleteUser: false,
    }));
  }, [initialPreferences]);

  // Keep originalPref attendance in sync before the first save
  useEffect(() => {
    setOriginalPref((prev) =>
      prev ? prev : { ...preferences, deleteUser: false },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------
  // ✔ Local toggle (no API call)
  // ----------------------------------------------------
  const handleToggle = (key) => {
    if (!isEditing) return;
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Discard edits and leave edit mode
  const cancelEditing = () => {
    if (originalPref) setPreferences({ ...originalPref, deleteUser: false });
    setDeleteReason("");
    setIsEditing(false);
  };

  // ----------------------------------------------------
  // ✔ Save: the backend call happens only here
  // ----------------------------------------------------
  const handleSave = async () => {
    const statusChanged =
      originalPref && preferences.userActive !== originalPref.userActive;

    if (!statusChanged) {
      toast.info("No changes to save");
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const response = await axiosInstance.put(
        `staff/toggle-activate/${uuid}?activate=${preferences.userActive}`,
      );

      toast.success(
        response.data?.message || "User status updated successfully",
      );

      setOriginalPref({ ...preferences, deleteUser: false });
      setIsEditing(false);
    } catch (error) {
      toast.error(
        getBackendMessage(error, "Failed to save changes. Try again later."),
      );
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------
  // ✔ Delete: backend call, toast and redirect
  // ----------------------------------------------------
  const handleDelete = async () => {
    if (!deleteReason.trim()) {
      toast.error("Please provide a reason for deletion");
      return;
    }

    setDeleting(true);

    try {
      const response = await axiosInstance.delete(`staff/delete/${uuid}`, {
        data: { reason: deleteReason },
        headers: { "Content-Type": "application/json" },
      });

      toast.success(response.data?.message || "Employee deleted successfully");

      setTimeout(() => navigate("/manageemployee"), 1000);
    } catch (error) {
      toast.error(
        getBackendMessage(error, "Failed to delete employee. Try again later."),
      );
    } finally {
      setDeleting(false);
    }
  };

  const hasChanges =
    originalPref && preferences.userActive !== originalPref.userActive;

  // ----------------------------------------------------
  // ✔ UI
  // ----------------------------------------------------
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">
          Manage Preferences
        </h3>

        {isEditing ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-sm text-blue-600 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <Icon
            icon="basil:edit-outline"
            className="w-5 h-5 text-gray-400 cursor-pointer"
            onClick={() => setIsEditing(true)}
            title="Edit"
          />
        )}
      </div>

      {/* Preferences List */}
      <div className="text-sm space-y-2">
        {/* Attendance */}
        <div className="flex justify-between items-center border-b border-gray-100 py-2">
          <span className="text-gray-500 text-[12px]">
            Is attendance required?
          </span>
          <Toggle
            label="Is attendance required?"
            enabled={preferences.attendanceRequired}
            onToggle={() => handleToggle("attendanceRequired")}
            disabled={!isEditing}
          />
        </div>

        {/* Activation */}
        <div className="flex justify-between items-center border-b border-gray-100 py-2">
          <span className="text-gray-500 text-[12px] flex items-center gap-2">
            Activate / Deactivate User
            {hasChanges && !saving && (
              <span className="text-[10px] text-gray-600 bg-slate-100 border border-gray-200 rounded-full px-2 py-0.5">
                Unsaved
              </span>
            )}
            {saving && (
              <span className="text-gray-400 text-[10px]">(Saving...)</span>
            )}
          </span>

          <Toggle
            label="Activate or deactivate user"
            enabled={preferences.userActive}
            onToggle={() => handleToggle("userActive")}
            disabled={!isEditing}
          />
        </div>

        {/* Delete */}
        <div className="flex flex-col gap-2 py-2">
          <div className="flex justify-between items-center">
            <span className="text-red-500 text-[12px] flex items-center gap-2">
              <Trash2 size={16} /> Delete User
            </span>
            <Toggle
              label="Delete user"
              enabled={preferences.deleteUser}
              onToggle={() => handleToggle("deleteUser")}
              disabled={!isEditing}
            />
          </div>

          {/* Delete reason */}
          {preferences.deleteUser && (
            <div className="mt-2 flex flex-col gap-2 rounded-lg border border-red-100 bg-red-50/40 p-3">
              <label className="text-[11px] text-gray-500">
                Reason for deletion
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 text-[13px] text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:border-gray-500"
                rows={2}
                placeholder="Reason for deletion..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                disabled={deleting}
              />
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || !deleteReason.trim()}
                className="self-end px-4 py-2 bg-red-600 text-white rounded-md text-[12px] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
