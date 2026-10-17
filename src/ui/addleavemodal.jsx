import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { getAllStaff } from "../service/staffservice";
import useLeaveStore from "../store/useleaveStore";
import GlowButton from "../components/helpers/glowbutton";
import { toast } from "react-hot-toast";

const AdminLeaveModal = ({ isOpen, onClose }) => {
  const {
    applyLeaveAdmin,
    fetchEmployeeLeavePolicies,
    employeeLeavePolicies = [],
    loading,
  } = useLeaveStore();

  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchingPolicies, setFetchingPolicies] = useState(false);

  // Refs to each date input so the calendar icon can open its picker
  const dateInputRefs = useRef([]);

  const [formData, setFormData] = useState({
    employeeUuid: "",
    leave_policy: "",
    reason: "",
    leave_date: [{ date: "", half_day: false, half_day_type: 0 }],
    cc: [],
  });

  // Fetch staff list when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchStaff = async () => {
        try {
          const staff = await getAllStaff();
          setStaffList(Array.isArray(staff) ? staff : []);
        } catch (err) {
          setStaffList([]);
        }
      };
      fetchStaff();
    }
  }, [isOpen]);

  // Handle employee selection and fetch their leave policies
  const handleEmployeeChange = async (employeeId) => {
    setFormData((prev) => ({
      ...prev,
      employeeUuid: employeeId,
      leave_policy: "",
    }));

    if (!employeeId) return;

    setFetchingPolicies(true);
    try {
      const policies = await fetchEmployeeLeavePolicies(employeeId);
      if (Array.isArray(policies) && policies.length > 0) {
        setFormData((prev) => ({
          ...prev,
          leave_policy: policies[0].id,
        }));
      }
    } catch (err) {
      toast.error("Failed to load leave policies for selected employee");
    } finally {
      setFetchingPolicies(false);
    }
  };

  const addDateRow = () => {
    setFormData((prev) => ({
      ...prev,
      leave_date: [
        ...prev.leave_date,
        { date: "", half_day: false, half_day_type: 0 },
      ],
    }));
  };

  // Remove a date row (always keep at least one row)
  const removeDateRow = (index) => {
    setFormData((prev) => {
      if (prev.leave_date.length <= 1) return prev;
      return {
        ...prev,
        leave_date: prev.leave_date.filter((_, i) => i !== index),
      };
    });
  };

  // Open the native date picker for a given row
  const openDatePicker = (index) => {
    const input = dateInputRefs.current[index];
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // fall through to focus/click
      }
    }
    input.focus();
    input.click();
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const fullName = (s.full_name || s.name || "").toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [staffList, searchTerm]);

  const toggleCcEmployee = (uuid) => {
    setFormData((prev) => ({
      ...prev,
      cc: prev.cc.includes(uuid)
        ? prev.cc.filter((id) => id !== uuid)
        : [...prev.cc, uuid],
    }));
  };

  const handleClose = () => {
    setFormData({
      employeeUuid: "",
      leave_policy: "",
      reason: "",
      leave_date: [{ date: "", half_day: false, half_day_type: 0 }],
      cc: [],
    });
    setSearchTerm("");
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.employeeUuid) return toast.error("Please select an employee");
    if (!formData.leave_policy)
      return toast.error("Please select a leave policy");

    const hasInvalidDates = formData.leave_date.some((item) => !item.date);
    if (hasInvalidDates) return toast.error("Please select all leave dates");

    try {
      await applyLeaveAdmin(formData.employeeUuid, {
        leave_date: formData.leave_date,
        reason: formData.reason,
        leave_policy: Number(formData.leave_policy),
        cc: formData.cc,
      });

      toast.success("Leave applied successfully!");
      handleClose();
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to apply leave";
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px]">
      <div className="bg-white w-[95%] max-w-[500px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        {/* Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-gray-50 bg-white">
          <div>
            <h2 className="text-gray-900 text-[16px] font-medium uppercase">
              Apply Admin Leave
            </h2>
            <p className="text-gray-400 text-[10px]">
              Record staff absence manually
            </p>
          </div>
          <button onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto">
          {/* Employee Selection */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Employee
            </label>
            <select
              value={formData.employeeUuid}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full border p-3 rounded-2xl"
            >
              <option value="">Select Staff Member</option>
              {staffList.map((s) => (
                <option key={s.uuid} value={s.uuid}>
                  {s.full_name || s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Leave Policy Selection */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Leave Policy / Type
            </label>
            <select
              value={formData.leave_policy}
              disabled={!formData.employeeUuid || fetchingPolicies}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  leave_policy: Number(e.target.value),
                })
              }
              className="w-full border p-3 rounded-2xl disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">
                {fetchingPolicies
                  ? "Loading policies..."
                  : !formData.employeeUuid
                    ? "Select an employee first"
                    : !employeeLeavePolicies ||
                        employeeLeavePolicies.length === 0
                      ? "No policies found"
                      : "Select Leave Policy"}
              </option>
              {Array.isArray(employeeLeavePolicies) &&
                employeeLeavePolicies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Dates Section */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Leave Dates
            </label>
            <div className="space-y-2">
              {formData.leave_date.map((row, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 border p-3 rounded-2xl"
                >
                  <div className="relative flex items-center gap-2">
                    {/* Calendar icon opens the date picker */}
                    <button
                      type="button"
                      onClick={() => openDatePicker(index)}
                      aria-label="Open date picker"
                      className="p-0.5 rounded hover:bg-gray-100 transition-colors"
                    >
                      <Icon
                        icon="solar:calendar-outline"
                        className="w-4 h-4 text-black"
                      />
                    </button>
                    <input
                      ref={(el) => (dateInputRefs.current[index] = el)}
                      type="date"
                      value={row.date}
                      onClick={(e) => e.target.showPicker?.()}
                      onChange={(e) => {
                        const newDates = [...formData.leave_date];
                        newDates[index].date = e.target.value;
                        setFormData({ ...formData, leave_date: newDates });
                      }}
                      className="bg-transparent outline-none font-medium cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-black w-4 h-4 rounded"
                        checked={row.half_day}
                        onChange={(e) => {
                          const newDates = [...formData.leave_date];
                          newDates[index].half_day = e.target.checked;
                          newDates[index].half_day_type = e.target.checked
                            ? 1
                            : 0;
                          setFormData({ ...formData, leave_date: newDates });
                        }}
                      />
                      Half Day
                    </label>

                    {/* Delete row (hidden when only one row is left) */}
                    {formData.leave_date.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDateRow(index)}
                        aria-label="Delete date row"
                        title="Delete"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Icon
                          icon="solar:trash-bin-trash-outline"
                          className="w-4 h-4"
                        />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addDateRow}
              className="mt-2 w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 p-3 rounded-2xl text-gray-600 hover:bg-gray-50"
            >
              + Add Row
            </button>
          </div>

          {/* CC Notification Search */}
          <div className="space-y-2">
            <label className="block mb-1 font-medium text-gray-700">
              CC (Notify Staff)
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 border p-2.5 rounded-2xl"
              />
            </div>

            <div className="max-h-[180px] overflow-y-auto border rounded-2xl p-2 space-y-1">
              {filteredStaff.length === 0 ? (
                <div className="p-3 text-center text-gray-400">
                  No staff found
                </div>
              ) : (
                filteredStaff.map((s) => (
                  <label
                    key={s.uuid}
                    className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <span className="font-medium text-gray-800">
                      {s.full_name || s.name}
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.cc.includes(s.uuid)}
                      onChange={() => toggleCcEmployee(s.uuid)}
                      className="rounded border-gray-300"
                    />
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Reason Section */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Reason
            </label>
            <textarea
              rows="3"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="Personal work..."
              className="w-full border p-3 rounded-2xl"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>

            <GlowButton
              onClick={handleSubmit}
              disabled={loading || fetchingPolicies}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                "Confirm Leave"
              )}
            </GlowButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLeaveModal;
