import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Icon } from "@iconify/react";
import axiosInstance from "../../../service/axiosinstance";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// ----------------------------------------------------
// ✔ Toggle Component (Updated to Green)
// ----------------------------------------------------
const Toggle = ({ enabled, onToggle, disabled }) => {
  return (
    <div
      onClick={() => !disabled && onToggle()}
      className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition 
        ${enabled ? "bg-green-500" : "bg-gray-300"} 
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
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
  // ✔ Fetch attendanceRequired from baseURL2 (ngrok)
  // ----------------------------------------------------
  useEffect(() => {
    const fetchAttendanceRule = async () => {
      try {
        const response = await axiosInstance.get(
          `master/shift-attendance-user-type/${uuid}`,
        );

        const data = response.data?.data;
        if (data) {
          setPreferences((prev) => ({
            ...prev,
            attendanceRequired:
              data.is_attendance_required === true ||
              data.is_attendance_required === "true",
          }));
        }
      } catch (error) {
        // Check if it's the specific "no shift" error
        const serverMessage = error.response?.data?.data;

        if (serverMessage === "no shift allocated for the user so far") {
          console.warn(
            "User has no shift allocated; defaulting attendance to false.",
          );
          setPreferences((prev) => ({ ...prev, attendanceRequired: false }));
        } else {
          // Only show toast for actual connection/server issues
          toast.error("Failed to load attendance settings");
        }
      }
    };

    fetchAttendanceRule();
  }, [uuid]);

  // ----------------------------------------------------
  // ✔ Initialize From Backend initialPreferences
  // ----------------------------------------------------
  useEffect(() => {
    if (initialPreferences) {
      const mapped = {
        attendanceRequired: preferences.attendanceRequired, // keep fetched value
        userActive:
          initialPreferences.is_active === true ||
          initialPreferences.is_active === "true",
        deleteUser: false,
      };

      setPreferences(mapped);
      setOriginalPref(mapped);
    }
  }, [initialPreferences, preferences.attendanceRequired]);

  // ----------------------------------------------------
  // ✔ Local Toggle (NO API CALL)
  // ----------------------------------------------------
  const handleToggle = (key) => {
    if (!isEditing) return;
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ----------------------------------------------------
  // ✔ Save — Backend Call Happens Only on Save
  // ----------------------------------------------------
  const handleSave = async () => {
    setSaving(true);
    try {
      let backendMessage = "";

      if (preferences.userActive !== originalPref.userActive) {
        const response = await axiosInstance.put(
          `staff/toggle-activate/${uuid}?activate=${preferences.userActive}`,
        );
        backendMessage =
          response.data?.message || "User status updated successfully";
      }

      toast.success(backendMessage || "Preferences saved");

      setOriginalPref(preferences);
      setPreferences({ ...preferences });

      setIsEditing(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to save changes. Try again later.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------
  // ✔ Delete — Call Backend API with toast & redirect
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
        error.response?.data?.message ||
          "Failed to delete employee. Try again later.",
      );
    } finally {
      setDeleting(false);
    }
  };

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
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm text-blue-600 font-medium hover:underline disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        ) : (
          <Icon
            icon="basil:edit-outline"
            className="w-5 h-5 text-gray-400 cursor-pointer"
            onClick={() => setIsEditing(true)}
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
            enabled={preferences.attendanceRequired}
            onToggle={() => handleToggle("attendanceRequired")}
            disabled={!isEditing}
          />
        </div>

        {/* Activation */}
        <div className="flex justify-between items-center border-b border-gray-100 py-2">
          <span className="text-gray-500 text-[12px] flex items-center gap-1">
            Activate / Deactivate User
            {saving && (
              <span className="text-gray-400 text-[10px]">(Saving...)</span>
            )}
          </span>

          <Toggle
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
              enabled={preferences.deleteUser}
              onToggle={() => handleToggle("deleteUser")}
              disabled={!isEditing}
            />
          </div>

          {/* Delete Reason Input */}
          {preferences.deleteUser && (
            <div className="mt-2 flex flex-col gap-1">
              <textarea
                className="w-full border rounded-md p-2 text-sm"
                rows={2}
                placeholder="Reason for deletion..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                disabled={deleting}
              />
              <button
                onClick={handleDelete}
                disabled={deleting || !deleteReason.trim()}
                className="self-end px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
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
