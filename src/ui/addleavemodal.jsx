import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { getAllStaff } from "../service/staffservice";
import useLeaveStore from "../store/useleaveStore";
import GlowButton from "../components/helpers/glowbutton";
import { toast } from "react-hot-toast";

const AdminLeaveModal = ({ isOpen, onClose }) => {
  const { applyLeaveAdmin, loading } = useLeaveStore();
  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    employeeUuid: "",
    reason: "",
    leave_date: [{ date: "", half_day: false, half_day_type: 0 }],
    cc: [],
  });

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

  const addDateRow = () => {
    setFormData((prev) => ({
      ...prev,
      leave_date: [
        ...prev.leave_date,
        { date: "", half_day: false, half_day_type: 0 },
      ],
    }));
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

    try {
      await applyLeaveAdmin(formData.employeeUuid, formData);
      toast.success("Leave applied successfully!");
      handleClose();
    } catch (err) {
      toast.error(err.message, {
        duration: 5000,
        style: {
          background: "#000",
          color: "#fff",
          borderRadius: "12px",
          fontSize: "12px",
          padding: "16px",
          border: "1px solid #333",
        },
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins">
      <div className="bg-white w-[55%] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200 border border-white/20">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-[16px] font-medium uppercase tracking-tight">
              Apply Admin Leave
            </h2>
            <p className="text-[10px] text-gray-400">
              Record staff absence manually
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <Icon icon="heroicons:x-mark-20-solid" className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Employee Selection */}
          <div>
            <label className="block text-[10px] text-gray-400 tracking-widest uppercase mb-2 ml-1">
              Employee
            </label>
            <select
              value={formData.employeeUuid}
              onChange={(e) =>
                setFormData({ ...formData, employeeUuid: e.target.value })
              }
              className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black transition-all text-[12px] appearance-none"
            >
              <option value="">Select Staff Member</option>
              {staffList.map((s) => (
                <option key={s.uuid} value={s.uuid}>
                  {s.full_name || s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dates Section */}
          <div>
            <label className="block text-[10px] text-gray-400 tracking-widest uppercase mb-2 ml-1">
              Leave Dates
            </label>
            <div className="space-y-3">
              {formData.leave_date.map((row, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white border border-gray-300 rounded-2xl"
                >
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => {
                      const newDates = [...formData.leave_date];
                      newDates[index].date = e.target.value;
                      setFormData({ ...formData, leave_date: newDates });
                    }}
                    className="bg-transparent text-[12px] outline-none font-medium"
                  />
                  <label className="flex items-center gap-2 text-[11px] text-gray-500 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-black w-4 h-4 rounded"
                      checked={row.half_day}
                      onChange={(e) => {
                        const newDates = [...formData.leave_date];
                        newDates[index].half_day = e.target.checked;
                        setFormData({ ...formData, leave_date: newDates });
                      }}
                    />
                    Half Day
                  </label>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addDateRow}
              className="mt-3 text-[11px] text-white bg-black px-4 py-2 rounded-xl hover:bg-gray-800 transition-all"
            >
              + Add Row
            </button>
          </div>

          {/* CC Notification Search */}
          <div>
            <label className="block text-[10px] text-gray-400 tracking-widest uppercase mb-2 ml-1">
              CC (Notify Staff)
            </label>
            <input
              type="text"
              placeholder="Search staff..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-3 text-[11px] outline-none mb-3 focus:ring-2 focus:ring-black transition-all"
            />
            <div className="bg-white rounded-2xl max-h-[150px] overflow-y-auto p-2 border border-gray-300">
              {filteredStaff.map((s) => {
                const isSelected = formData.cc.includes(s.uuid);
                return (
                  <div
                    key={s.uuid}
                    onClick={() => toggleCcEmployee(s.uuid)}
                    className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? "bg-gray-50" : ""
                    }`}
                  >
                    <span
                      className={`text-[12px] ${
                        isSelected ? "font-bold text-black" : "text-gray-600"
                      }`}
                    >
                      {s.full_name || s.name}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-black border-black text-white"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <Icon
                          icon="heroicons:check-16-solid"
                          className="w-3.5 h-3.5"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason Section */}
          <div>
            <label className="block text-[10px] text-gray-400 tracking-widest uppercase mb-2 ml-1">
              Reason
            </label>
            <textarea
              rows="3"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="Personal work..."
              className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black transition-all text-[12px] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-gray-100 flex justify-between items-center sticky bottom-0 bg-white">
            <button
              onClick={handleClose}
              className="text-white bg-black text-[12px] px-6 py-3 rounded-xl hover:bg-gray-800 transition-all font-medium"
            >
              Cancel
            </button>
            <GlowButton onClick={handleSubmit} disabled={loading}>
              <span className="text-white">
                {loading ? "Processing..." : "Confirm Leave"}
              </span>
            </GlowButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveModal;
