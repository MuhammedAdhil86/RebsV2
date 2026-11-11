import React, { useState } from "react";
import { ChevronLeft, Palmtree, Loader2 } from "lucide-react";
import attendancePolicyService from "../../../service/attendancepolicyService";
import { toast } from "react-toastify";

import BasicInfoCard from "./leavepolicy/basicinfocard";
import AccrualPolicyCard from "./leavepolicy/accrualpolicycard";
import RequestPreferencesCard from "./leavepolicy/requestpreferencecard";
import { Switch, cardClass } from "./createleavepolicymodal";

export const globalFont = "font-['Poppins'] font-normal text-[12px]";

/* ---------- Backend error helpers (same as create) ---------- */

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

// Shows backend "message" (bold) and "data" (below it) in the toast.
// Position, timing and style come only from <ToastContainer /> in App.jsx.
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

const UpdateLeavePolicyTab = ({ onClose, policyData, refreshData }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: policyData?.id || null,
    name: policyData?.name || "",
    code: policyData?.code || "",
    leave_type: policyData?.leave_type || "Paid",
    color: policyData?.color || "#00AEEF",
    description: policyData?.description || "",
    company_default: policyData?.company_default ?? false,
    accrual_method: policyData?.accrual_method || "monthly",
    employee_accrues: policyData?.employee_accrues || 0,
    prorate_for_new_joiners: policyData?.prorate_for_new_joiners ?? true,
    postpone_accrual: policyData?.postpone_accrual ?? false,
    postpone_accrual_value: policyData?.postpone_accrual_value || 0,
    postpone_accrual_period: policyData?.postpone_accrual_period || "days",
    reset_leave_balance: policyData?.reset_leave_balance ?? true,
    reset_leave_period: policyData?.reset_leave_period || "yearly",
    carry_forward: policyData?.carry_forward ?? false,
    carry_forward_limit: policyData?.carry_forward_limit || 0,
    encash_leave: policyData?.encash_leave ?? false,
    encash_limit: policyData?.encash_limit || 0,
    allow_negative_balance: policyData?.allow_negative_balance ?? false,
    // API allowed values: "no limit", "till year end", "unlimited and mark as lop"
    consider_negative_balance:
      policyData?.consider_negative_balance || "no limit",
    allow_past_leave: policyData?.allow_past_leave ?? false,
    past_leave_limit: policyData?.past_leave_limit ?? null,
    allow_future_leave: policyData?.allow_future_leave ?? false,
    future_leave_limit: policyData?.future_leave_limit ?? null,
    is_active: policyData?.is_active ?? policyData?.status === "active",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    if (loading) return;

    if (!formData.id) {
      toast.error("Policy ID is missing.");
      return;
    }
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

      const { id, consider_negative_balance, ...rest } = formData;

      const requestBody = {
        ...rest,
        name: String(formData.name),
        code: String(formData.code),
        company_default: Boolean(formData.company_default),
        employee_accrues: Number(formData.employee_accrues || 0),
        prorate_for_new_joiners: Boolean(formData.prorate_for_new_joiners),
        postpone_accrual: Boolean(formData.postpone_accrual),
        postpone_accrual_value: Number(formData.postpone_accrual_value || 0),
        reset_leave_balance: Boolean(formData.reset_leave_balance),
        carry_forward: Boolean(formData.carry_forward),
        carry_forward_limit: Number(formData.carry_forward_limit || 0),
        encash_leave: Boolean(formData.encash_leave),
        encash_limit: Number(formData.encash_limit || 0),
        allow_negative_balance: Boolean(formData.allow_negative_balance),
        allow_past_leave: Boolean(formData.allow_past_leave),
        past_leave_limit: formData.allow_past_leave
          ? Number(formData.past_leave_limit)
          : null,
        allow_future_leave: Boolean(formData.allow_future_leave),
        future_leave_limit: formData.allow_future_leave
          ? Number(formData.future_leave_limit)
          : null,
        is_active: Boolean(formData.is_active),
        description: formData.description || `${formData.name} policy`,
        // Only send when negative balance is enabled, always a valid value
        ...(formData.allow_negative_balance && {
          consider_negative_balance: consider_negative_balance || "no limit",
        }),
      };

      console.log("-----------------------------------------");
      console.log("FINAL UPDATE PAYLOAD:", requestBody);
      console.log("-----------------------------------------");

      const response = await attendancePolicyService.updateLeavePolicy(
        id,
        requestBody,
      );
      console.log("API RESPONSE:", response);

      // If the backend answers HTTP 200 but the body says it failed
      const failedBody = [response, response?.data].find(
        (b) => b && (b.status_code >= 400 || b.success === false),
      );
      if (failedBody) {
        showBackendError(failedBody, "Failed to update leave policy");
        return;
      }

      toast.success("Leave policy updated successfully");
      if (refreshData) refreshData();
      onClose();
    } catch (error) {
      console.error("❌ Update failed:", error);
      console.error("❌ Backend body:", getErrorBody(error));

      showBackendError(getErrorBody(error), "Failed to update leave policy");
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
        <div className="flex items-center justify-between p-5 bg-white border-b border-gray-200 gap-4">
          <div className="flex items-center gap-4">
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
                  Update leave policy
                </h2>
                <p className="text-[11px] text-gray-500">
                  {formData.name
                    ? `Editing ${formData.name}`
                    : "Change how this leave is earned, used and carried over."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-600">
              {formData.is_active ? "Active" : "Inactive"}
            </span>
            <Switch
              label="Active"
              value={formData.is_active}
              onChange={(v) => handleChange("is_active", v)}
            />
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
            onClick={handleUpdate}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-8 py-2.5 bg-black text-white rounded-xl text-[12px] font-medium hover:bg-zinc-800 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Updating..." : "Update policy"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateLeavePolicyTab;
