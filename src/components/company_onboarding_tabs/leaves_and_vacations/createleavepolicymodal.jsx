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

/* ---------- Allowed dropdown values (must match backend exactly) ---------- */

export const LEAVE_TYPES = ["Paid", "Unpaid"];
export const ACCRUAL_METHODS = ["yearly", "monthly"];
export const NEGATIVE_BALANCE_OPTIONS = [
  "no limit",
  "till year end",
  "unlimited and mark as lop",
];

/* ---------- Payload builder ---------- */

// Every dependent field is always present (never undefined) and follows the
// recommended disabled convention. Validation is left to the backend.
export const buildLeavePayload = (f) => ({
  ...f,
  company_default: Boolean(f.company_default),
  employee_accrues: Number(f.employee_accrues || 0),
  description: f.description || `${f.name} policy`,

  // Enabled: value | Disabled: 0
  postpone_accrual_value: f.postpone_accrual
    ? Number(f.postpone_accrual_value)
    : 0,
  carry_forward_limit: f.carry_forward ? Number(f.carry_forward_limit) : 0,
  encash_limit: f.encash_leave ? Number(f.encash_limit) : 0,

  // Enabled: selected value | Disabled: ""
  consider_negative_balance: f.allow_negative_balance
    ? f.consider_negative_balance
    : "",

  // Enabled: positive integer | Disabled: 0
  allow_past_leave: Boolean(f.allow_past_leave),
  past_leave_limit: f.allow_past_leave ? Number(f.past_leave_limit) : 0,
  allow_future_leave: Boolean(f.allow_future_leave),
  future_leave_limit: f.allow_future_leave ? Number(f.future_leave_limit) : 0,
});

/* ---------- Field change handler (shared by create + update) ---------- */

// Toggling a flag also fixes up its dependent field so the state always
// follows the convention: enabled -> valid value, disabled -> 0 / "" / null.
const DEPENDENTS = {
  postpone_accrual: {
    field: "postpone_accrual_value",
    onEnable: (cur) => (Number(cur) > 0 ? cur : 1),
    onDisable: () => 0,
  },
  carry_forward: {
    field: "carry_forward_limit",
    onEnable: (cur) => cur ?? 0,
    onDisable: () => 0,
  },
  encash_leave: {
    field: "encash_limit",
    onEnable: (cur) => cur ?? 0,
    onDisable: () => 0,
  },
  allow_negative_balance: {
    field: "consider_negative_balance",
    onEnable: (cur) =>
      NEGATIVE_BALANCE_OPTIONS.includes(cur)
        ? cur
        : NEGATIVE_BALANCE_OPTIONS[0],
    onDisable: () => "",
  },
  allow_past_leave: {
    field: "past_leave_limit",
    onEnable: (cur) => (Number(cur) > 0 ? cur : 1),
    onDisable: () => 0,
  },
  allow_future_leave: {
    field: "future_leave_limit",
    onEnable: (cur) => (Number(cur) > 0 ? cur : 1),
    onDisable: () => 0,
  },
};

export const applyFieldChange = (prev, field, value) => {
  const next = { ...prev, [field]: value };
  const dep = DEPENDENTS[field];
  if (dep) {
    next[dep.field] = value ? dep.onEnable(prev[dep.field]) : dep.onDisable();
  }
  return next;
};

/* ---------- Backend error helpers ---------- */

// Finds the backend body ({ status_code, message, data }) from any error shape:
// 1. normal axios error      -> error.response.data
// 2. service threw the body  -> error itself ({ message, data })
export const getErrorBody = (error) => {
  if (error?.response?.data) return error.response.data;
  if (error && typeof error === "object" && error.data !== undefined) {
    return error;
  }
  return null;
};

// Shows ONLY the backend "message" (bold) and "data" (below it) in the toast
export const showBackendError = (body, fallback) => {
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
    past_leave_limit: 0,
    allow_future_leave: false,
    future_leave_limit: 0,
    is_active: true,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => applyFieldChange(prev, field, value));
  };

  const handleSubmit = async () => {
    if (loading) return;

    try {
      setLoading(true);

      // 1. Prepare the final payload
      const requestBody = buildLeavePayload(formData);

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
