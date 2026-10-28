import React, { useState } from "react";
import { ChevronLeft, Palmtree } from "lucide-react";
import payrollService from "../../../service/payrollService";
import toast from "react-hot-toast";

import BasicInfoCard from "./leavepolicy/basicinfocard";
import AccrualPolicyCard from "./leavepolicy/accrualpolicycard";
import RequestPreferencesCard from "./leavepolicy/requestpreferencecard";
import ApplicabilityCard from "./leavepolicy/applicabiltycard";

export const globalFont = "font-['Poppins'] font-normal text-[12px]";
export const labelClass = `${globalFont} text-gray-700 mb-1.5 block`;
export const inputClass = `w-full px-4 py-2 bg-[#F4F6F8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all`;
export const cardClass =
  "bg-white p-5 rounded-2xl border border-gray-200 shadow-sm";
export const sectionTitle = `${globalFont} text-gray-800 mb-4 uppercase tracking-wide`;

export const CheckboxRow = ({ label, checked, onChange }) => (
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="accent-black w-4 h-4 rounded border-gray-200 cursor-pointer"
    />
    <span className="text-[11px] text-gray-700 font-normal">{label}</span>
  </div>
);

export const RadioRow = ({ label, checked, onClick }) => (
  <div className="flex items-center gap-2 cursor-pointer" onClick={onClick}>
    <div
      className={`w-3.5 h-3.5 border rounded-full flex items-center justify-center ${checked ? "border-black" : "border-gray-300"}`}
    >
      {checked && <div className="w-2 h-2 bg-black rounded-full" />}
    </div>
    <span
      className={`text-[11px] font-normal ${checked ? "text-gray-900" : "text-gray-500"}`}
    >
      {label}
    </span>
  </div>
);

/* ---------- Backend error helpers ---------- */

// Finds the backend body ({ status_code, message, data }) from any error shape:
// 1. normal axios error      -> error.response.data
// 2. service threw the body  -> error itself ({ message, data })
const getErrorBody = (error) => {
  if (error?.response?.data) return error.response.data;
  if (error && typeof error === "object" && error.data !== undefined) {
    return error;
  }
  return null;
};

// Shows backend "message" (bold) and "data" (below it) in the toast
const showBackendError = (body, fallback) => {
  const message = body?.message || body?.error || fallback;
  const data = body?.data;

  toast.error(
    <div>
      <div style={{ fontWeight: 600 }}>{message}</div>
      {data && (
        <div style={{ marginTop: 4, opacity: 0.8 }}>
          {typeof data === "string" ? data : JSON.stringify(data)}
        </div>
      )}
    </div>,
    { duration: 6000 },
  );
};

const CreateLeavePolicyTab = ({ onClose }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    leave_type: "Paid",
    color: "#00AEEF",
    description: "",
    accrual_method: "monthly",
    employee_accrues: 0,
    prorate_for_new_joiners: true,
    postpone_accrual: false,
    postpone_accrual_value: 0,
    postpone_accrual_period: "days",
    reset_leave_balance: true,
    reset_leave_period: "yearly",
    carry_forward: false,
    carry_forward_limit: 0,
    encash_leave: false,
    encash_limit: 0,
    allow_negative_balance: false,
    // API allowed values: "no limit", "till year end", "unlimited and mark as lop"
    consider_negative_balance: "no limit",
    allow_past_leave: false,
    past_leave_limit: null,
    allow_future_leave: false,
    future_leave_limit: null,
    is_active: true,
    Criteria: { allocate_all: true },
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCriteriaChange = (newCriteria) => {
    setFormData((prev) => ({ ...prev, Criteria: newCriteria }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // 1. Prepare the final payload
      const { consider_negative_balance, ...rest } = formData;

      const requestBody = {
        ...rest,
        employee_accrues: Number(formData.employee_accrues || 0),
        postpone_accrual_value: Number(formData.postpone_accrual_value || 0),
        carry_forward_limit: Number(formData.carry_forward_limit || 0),
        encash_limit: Number(formData.encash_limit || 0),
        past_leave_limit: formData.allow_past_leave
          ? Number(formData.past_leave_limit)
          : null,
        future_leave_limit: formData.allow_future_leave
          ? Number(formData.future_leave_limit)
          : null,
        description: formData.description || `${formData.name} policy`,
        // Only send when negative balance is enabled, always a valid value
        ...(formData.allow_negative_balance && {
          consider_negative_balance: consider_negative_balance || "no limit",
        }),
      };

      // 2. LOG THE PAYLOAD
      console.log("-----------------------------------------");
      console.log("FINAL PAYLOAD TO SEND:", requestBody);
      console.log("CRITERIA DETAILS:", requestBody.Criteria);
      console.log("-----------------------------------------");

      // 3. Send to API
      const response = await payrollService.addLeavePolicy(requestBody);
      console.log("API RESPONSE:", response);

      // If the backend answers HTTP 200 but the body says it failed
      const failedBody = [response, response?.data].find(
        (b) => b && (b.status_code >= 400 || b.success === false),
      );
      if (failedBody) {
        showBackendError(failedBody, "Failed to create leave policy");
        return;
      }

      toast.success("Leave policy created successfully");
      onClose();
    } catch (error) {
      console.error("❌ Create failed:", error);
      console.error("❌ Backend body:", getErrorBody(error));

      showBackendError(getErrorBody(error), "Failed to create leave policy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full bg-[#F9FAFB] rounded-2xl shadow-inner ${globalFont}`}
    >
      <div className="bg-[#F9FAFB] w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col ">
        <div className="flex items-center p-5 bg-white border-b border-gray-200 gap-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Palmtree className="text-gray-800" size={20} />
            <h2 className={`${globalFont} text-gray-800`}>
              Create a leave policy
            </h2>
          </div>
        </div>

        <div className="p-3 overflow-y-auto grid grid-cols-2 gap-3 custom-scrollbar">
          <BasicInfoCard formData={formData} handleChange={handleChange} />
          <AccrualPolicyCard formData={formData} handleChange={handleChange} />
          <RequestPreferencesCard
            formData={formData}
            handleChange={handleChange}
          />
          <ApplicabilityCard
            criteria={formData.Criteria}
            setCriteria={handleCriteriaChange}
            onClose={onClose}
            handleSubmit={handleSubmit}
            isUpdate={false}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateLeavePolicyTab;
