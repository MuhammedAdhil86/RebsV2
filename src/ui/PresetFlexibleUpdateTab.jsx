import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Lock } from "lucide-react";
import { updatePresetTemplate } from "../service/companyService";
import toast from "react-hot-toast";

const PresetFlexibleUpdateTab = ({ initialData, onClose }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    policy_name: "",
    policy_code: "",
    policy_colour: "#000000",
    start_time: "00:00:00",
    end_time: "00:00:00",
    working_hours: "",
    delay: "00:00:00",
    delay_unpaid_count: 0,
    late: "00:00:00",
    late_unpaid_count: 0,
    delay_action_type: "",
    delay_fine_amount: null,
    delay_fine_source: null,
    late_action_type: "",
    late_fine_amount: null,
    late_fine_source: null,
    half_day: "00:00:00",
    break_time_from: "00:00:00",
    break_time_to: "00:00:00",
    lunch_break_from: "00:00:00",
    lunch_break_to: "00:00:00",
    work_from_home: false,
    over_time_benefit: false,
    over_time_pay: "",
    regularisation_limit: 0,
    regularisation_type: "Monthly",
    start_date: "",
    end_date: "",
    overtime_cap_limit: "00:00:00",
    overtime_cap_period: "Monthly",
    consider_as_halfday: false,
    policy_halfday_type: "",
    for_weekly_off: false,
  });

  // -----------------------------
  // UTILS
  // -----------------------------

  const formatTimeForInput = (timeString) => {
    if (!timeString) return "00:00:00";
    if (typeof timeString === "string" && timeString.includes("T")) {
      return timeString.split("T")[1].split(".")[0];
    }
    return timeString;
  };

  const ensureSeconds = (t) => {
    if (!t) return "00:00:00";
    const parts = String(t).split(":");
    if (parts.length === 2) {
      return `${t}:00`;
    }
    return t;
  };

  // -----------------------------
  // INITIAL DATA
  // -----------------------------

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        start_date: initialData.start_date?.split("T")[0] || "",
        end_date: initialData.end_date?.split("T")[0] || "",
        start_time: formatTimeForInput(initialData.start_time),
        end_time: formatTimeForInput(initialData.end_time),
        delay: formatTimeForInput(initialData.delay),
        late: formatTimeForInput(initialData.late),
        half_day: formatTimeForInput(initialData.half_day),
        lunch_break_from: formatTimeForInput(initialData.lunch_break_from),
        lunch_break_to: formatTimeForInput(initialData.lunch_break_to),
        break_time_from: formatTimeForInput(initialData.break_time_from),
        break_time_to: formatTimeForInput(initialData.break_time_to),
        overtime_cap_limit: formatTimeForInput(initialData.overtime_cap_limit),
      });
    }
  }, [initialData]);

  // -----------------------------
  // UPDATE LOGIC
  // -----------------------------

  const handleUpdate = async () => {
    setLoading(true);
    const toastId = toast.loading("Processing update...");

    try {
      const {
        id,
        _id,
        created_at,
        updated_at,
        company,
        is_active,
        policy_name,
        for_weekly_off,
        consider_as_halfday,
        policy_halfday_type,
        ...changeableData
      } = formData;

      const payload = {
        ...changeableData,
        working_hours: parseFloat(formData.working_hours) || 0,
        delay_unpaid_count: parseInt(formData.delay_unpaid_count) || 0,
        late_unpaid_count: parseInt(formData.late_unpaid_count) || 0,
        over_time_pay: parseFloat(formData.over_time_pay) || 0.0,
        regularisation_limit: parseInt(formData.regularisation_limit) || 0,
        start_time: ensureSeconds(formData.start_time),
        end_time: ensureSeconds(formData.end_time),
        delay: ensureSeconds(formData.delay),
        late: ensureSeconds(formData.late),
        half_day: ensureSeconds(formData.half_day),
        lunch_break_from: ensureSeconds(formData.lunch_break_from),
        lunch_break_to: ensureSeconds(formData.lunch_break_to),
        break_time_from: ensureSeconds(formData.break_time_from),
        break_time_to: ensureSeconds(formData.break_time_to),
        overtime_cap_limit: ensureSeconds(formData.overtime_cap_limit),
      };

      const finalId = initialData.id || initialData._id;

      const response = await updatePresetTemplate(finalId, payload);

      toast.success(response?.data?.message || "Preset Updated Successfully!", {
        id: toastId,
      });

      onClose();
    } catch (error) {
      console.error("Update Error Object:", error.response);

      // --- ENHANCED ERROR HANDLING ---
      // This checks every possible nesting level where the backend might send the error string
      const backendErrorMsg =
        error.response?.data?.data ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Update Failed (Internal Server Error)";

      toast.error(backendErrorMsg, {
        id: toastId,
        duration: 5000, // Error stays longer so the user can read it
      });

      // NOTE: We do NOT call onClose() here so the user can fix data and try again
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // STYLES
  // -----------------------------

  const readOnlyClass =
    "w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-[12px] text-gray-500 cursor-not-allowed outline-none font-['Poppins']";

  const labelClass =
    "text-[12px] font-medium text-gray-700 mb-1.5 block font-['Poppins']";

  const iconWrapper =
    "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none";

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 space-y-6 overflow-y-auto font-['Poppins'] max-h-[90vh]">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-2 rounded-lg">
            <Lock size={18} className="text-black" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-gray-900">
              Flexible Preset
            </h2>
            <p className="text-[11px] text-gray-500 uppercase tracking-tight">
              Read Only Configuration
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="flex gap-6">
        {/* LEFT COLUMN */}
        <div className="w-[32%] space-y-4 border-r pr-6 border-gray-50">
          <div>
            <label className={labelClass}>Template Name</label>
            <input
              type="text"
              className={readOnlyClass}
              value={formData.policy_name}
              readOnly
            />
          </div>
          <div>
            <label className={labelClass}>Policy Code</label>
            <input
              type="text"
              className={readOnlyClass}
              value={formData.policy_code}
              readOnly
            />
          </div>
          <div>
            <label className={labelClass}>Effective From</label>
            <input
              type="text"
              className={readOnlyClass}
              value={formData.start_date || "N/A"}
              readOnly
            />
          </div>
          <div>
            <label className={labelClass}>Effective To</label>
            <input
              type="text"
              className={readOnlyClass}
              value={formData.end_date || "N/A"}
              readOnly
            />
          </div>
          <div>
            <label className={labelClass}>Working Hours</label>
            <input
              type="text"
              className={readOnlyClass}
              value={`${formData.working_hours} Hrs`}
              readOnly
            />
          </div>
          <div>
            <label className={labelClass}>Regularisation</label>
            <input
              type="text"
              className={readOnlyClass}
              value={`${formData.regularisation_limit} / ${formData.regularisation_type}`}
              readOnly
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-[68%] space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-2 gap-x-10 gap-y-4">
            {[
              { label: "Check in Time", field: "start_time" },
              { label: "Check out Time", field: "end_time" },
              { label: "Lunch From", field: "lunch_break_from" },
              { label: "Lunch To", field: "lunch_break_to" },
              { label: "Short Break From", field: "break_time_from" },
              { label: "Short Break To", field: "break_time_to" },
              { label: "Half Day Start", field: "half_day" },
              { label: "Late Limit", field: "late" },
              { label: "Delay Limit", field: "delay" },
            ].map((item, idx) => (
              <div key={idx}>
                <label className={labelClass}>{item.label}</label>
                <div className="relative">
                  <input
                    type="text"
                    className={readOnlyClass}
                    value={formData[item.field] || ""}
                    readOnly
                  />
                  <Clock className={iconWrapper} size={14} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* DELAY BOX */}
            <div className="bg-[#FFF6E9] border border-[#FDE3C3] rounded-2xl p-5">
              <span className="text-[13px] font-semibold text-orange-800 uppercase tracking-tight">
                Delay Logic
              </span>
              <div className="mt-4 space-y-3">
                <div className={readOnlyClass}>
                  {formData.delay_unpaid_count || 0} Count
                </div>
                <div className={readOnlyClass}>
                  {formData.delay_action_type || "N/A"}
                </div>
              </div>
            </div>

            {/* LATE BOX */}
            <div className="bg-[#FFEBF3] border border-[#FFD2E5] rounded-2xl p-5">
              <span className="text-[13px] font-semibold text-pink-800 uppercase tracking-tight">
                Late Logic
              </span>
              <div className="mt-4 space-y-3">
                <div className={readOnlyClass}>
                  {formData.late_unpaid_count || 0} Count
                </div>
                <div className={readOnlyClass}>
                  {formData.late_action_type || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-10 py-2.5 border border-gray-300 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="px-12 py-2.5 bg-black text-white rounded-xl text-[13px] font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-lg active:scale-95"
        >
          {loading ? "Processing..." : "Use Preset"}
        </button>
      </div>
    </div>
  );
};

export default PresetFlexibleUpdateTab;
