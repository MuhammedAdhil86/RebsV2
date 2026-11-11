import React, { useState } from "react";
import { ChevronLeft, Palmtree, Loader2 } from "lucide-react";
import payrollService from "../../../service/payrollService";
import { toast } from "react-toastify";

import BasicInfoCard from "./leavepolicy/basicinfocard";
import AccrualPolicyCard from "./leavepolicy/accrualpolicycard";
import RequestPreferencesCard from "./leavepolicy/requestpreferencecard";

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

/* Toggle switch (used for Company Default) */
export const Switch = ({ value, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={value}
    aria-label={label}
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 ${
      value ? "bg-black" : "bg-gray-300"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
        value ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
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
    company_default: false,
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
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!formData.name?.trim()) {
      toast.error("Please enter a policy name");
      return;
    }
    if (!formData.code?.trim()) {
      toast.error("Please enter a policy code");
      return;
    }

    try {
      setLoading(true);

      // 1. Prepare the final payload
      const { consider_negative_balance, ...rest } = formData;

      const requestBody = {
        ...rest,
        company_default: Boolean(formData.company_default),
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
      <div className="bg-[#F9FAFB] w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center p-5 bg-white border-b border-gray-200 gap-4">
          <button
            type="button"
            aria-label="Back"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white">
              <Palmtree size={16} />
            </span>
            <div>
              <h2 className="font-['Poppins'] text-[15px] font-semibold text-gray-900 leading-tight">
                Create a leave policy
              </h2>
              <p className="text-[11px] text-gray-500">
                Set up how this leave is earned, used and carried over.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-4">
          {/* Company default */}
          <div
            className={`${cardClass} flex items-center justify-between gap-4 transition-colors ${
              formData.company_default ? "border-gray-900" : ""
            }`}
          >
            <div>
              <p className="font-['Poppins'] text-[13px] font-medium text-gray-900">
                Company default
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Use this as the default leave policy for the company.
              </p>
            </div>
            <Switch
              label="Company default"
              value={formData.company_default}
              onChange={(v) => handleChange("company_default", v)}
            />
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <BasicInfoCard formData={formData} handleChange={handleChange} />
            <AccrualPolicyCard
              formData={formData}
              handleChange={handleChange}
            />
            <div className="lg:col-span-2">
              <RequestPreferencesCard
                formData={formData}
                handleChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 bg-white border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-8 py-2.5 border border-gray-300 rounded-xl text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-8 py-2.5 bg-black text-white rounded-xl text-[12px] font-medium hover:bg-zinc-800 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Creating..." : "Create policy"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateLeavePolicyTab;
