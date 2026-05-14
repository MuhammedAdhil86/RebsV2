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

const CreateLeavePolicyTab = ({ onClose }) => {
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
    consider_negative_balance: "",
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
      // 1. Prepare the final payload
      const requestBody = {
        ...formData,
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
      };

      // 🔥 2. LOG THE PAYLOAD HERE 🔥
      console.log("-----------------------------------------");
      console.log("FINAL PAYLOAD TO SEND:", requestBody);
      console.log("CRITERIA DETAILS:", requestBody.Criteria);
      console.log("-----------------------------------------");

      // 3. Send to API
      await payrollService.addLeavePolicy(requestBody);
      toast.success("Leave policy created successfully");
      onClose();
    } catch (error) {
      console.error("API ERROR DETAILS:", error.response?.data);
      toast.error(
        error.response?.data?.message || "Failed to create leave policy",
      );
    }
  };

  return (
    <div
      className={`w-full bg-[#F9FAFB] rounded-2xl shadow-inner ${globalFont}`}
    >
      <div className="bg-[#F9FAFB] w-full max-w6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col ">
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
          />
        </div>
      </div>
    </div>
  );
};

export default CreateLeavePolicyTab;
