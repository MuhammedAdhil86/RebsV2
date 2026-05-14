import React, { useState } from "react";
import { ChevronLeft, Palmtree } from "lucide-react";
import attendancePolicyService from "../../../service/attendancepolicyService";
import toast from "react-hot-toast";

import BasicInfoCard from "./leavepolicy/basicinfocard";
import AccrualPolicyCard from "./leavepolicy/accrualpolicycard";
import RequestPreferencesCard from "./leavepolicy/requestpreferencecard";
import ApplicabilityCard from "./leavepolicy/applicabiltycard";

export const globalFont = "font-['Poppins'] font-normal text-[12px]";

const UpdateLeavePolicyTab = ({ onClose, policyData, refreshData }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: policyData?.id || null,
    name: policyData?.name || "",
    code: policyData?.code || "",
    leave_type: policyData?.leave_type || "Paid",
    color: policyData?.color || "#00AEEF",
    description: policyData?.description || "",
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
    // ✅ Ensure this has a default value if empty
    consider_negative_balance:
      policyData?.consider_negative_balance || "Unpaid",
    allow_past_leave: policyData?.allow_past_leave ?? false,
    past_leave_limit: policyData?.past_leave_limit || 0,
    allow_future_leave: policyData?.allow_future_leave ?? false,
    future_leave_limit: policyData?.future_leave_limit || 0,
    is_active: policyData?.is_active ?? true,
    Criteria: policyData?.Criteria || { allocate_all: true },
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCriteriaChange = (newCriteria) => {
    setFormData((prev) => ({ ...prev, Criteria: newCriteria }));
  };

  const handleUpdate = async () => {
    if (!formData.id) {
      toast.error("Policy ID is missing.");
      return;
    }

    try {
      setLoading(true);

      const requestBody = {
        name: String(formData.name),
        code: String(formData.code),
        leave_type: formData.leave_type,
        color: formData.color,
        description: formData.description,
        accrual_method: formData.accrual_method,
        employee_accrues: Number(formData.employee_accrues || 0),
        prorate_for_new_joiners: Boolean(formData.prorate_for_new_joiners),
        postpone_accrual: Boolean(formData.postpone_accrual),
        postpone_accrual_value: Number(formData.postpone_accrual_value || 0),
        postpone_accrual_period: formData.postpone_accrual_period,
        reset_leave_balance: Boolean(formData.reset_leave_balance),
        reset_leave_period: formData.reset_leave_period,
        carry_forward: Boolean(formData.carry_forward),
        carry_forward_limit: Number(formData.carry_forward_limit || 0),
        encash_leave: Boolean(formData.encash_leave),
        encash_limit: Number(formData.encash_limit || 0),
        allow_negative_balance: Boolean(formData.allow_negative_balance),
        // ✅ API FIX: Ensure this field is never an empty string if it's required
        consider_negative_balance:
          formData.consider_negative_balance || "Unpaid",
        allow_past_leave: Boolean(formData.allow_past_leave),
        past_leave_limit: Number(formData.past_leave_limit || 0),
        allow_future_leave: Boolean(formData.allow_future_leave),
        future_leave_limit: Number(formData.future_leave_limit || 0),
        is_active: Boolean(formData.is_active),
        Criteria: formData.Criteria,
      };

      const response = await attendancePolicyService.updateLeavePolicy(
        formData.id,
        requestBody,
      );

      if (
        response.status === 200 ||
        response.status_code === 200 ||
        response.data?.success
      ) {
        toast.success("Leave policy updated successfully");
        if (refreshData) refreshData();
        onClose();
      }
    } catch (error) {
      // ✅ TOAST FIX: Capture and show the exact backend message
      const serverError = error.response?.data;
      console.error("❌ Update failed detail:", serverError);

      const errorText =
        serverError?.message ||
        serverError?.error ||
        "Failed to update leave policy";

      toast.error(errorText, {
        duration: 4000,
        style: {
          background: "#fff",
          color: "#ef4444",
          fontSize: "12px",
          fontFamily: "Poppins",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full bg-[#F9FAFB] rounded-2xl shadow-inner ${globalFont}`}
    >
      <div className="bg-[#F9FAFB] w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Palmtree className="text-gray-800" size={20} />
              <h2 className={`${globalFont} text-gray-800 font-semibold`}>
                Update leave policy:{" "}
                <span className="text-blue-600 font-normal">
                  {formData.name}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50/80">
            <input
              type="checkbox"
              id="is_active_policy"
              checked={formData.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="is_active_policy"
              className="text-gray-600 text-[11px] font-normal cursor-pointer select-none"
            >
              Active
            </label>
          </div>
        </div>

        {/* Content Area */}
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
            handleSubmit={handleUpdate}
            isUpdate={true}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default UpdateLeavePolicyTab;
