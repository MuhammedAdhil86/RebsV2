import React from "react";

const ShiftPolicyDetails = ({ policy }) => {
  if (!policy) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-[14px] text-gray-800 font-normal">
          Shift Policy Details
        </h3>
        <p className="text-[12px] text-gray-400 mt-4">
          Select a shift to view policy details
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h3 className="text-[14px] text-gray-800 border-b border-gray-50 pb-4 mb-4 font-normal">
        {policy.policy_name || "Morning Shift Policy Details"}
      </h3>

      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-gray-500">Total Work hours</span>
          <span className="text-[12px] text-gray-800">
            {policy.total_hours || "08:00:00"} hrs
          </span>
        </div>

        <div className="bg-[#F2FBF6] rounded-xl p-4 space-y-3 border border-[#E1F5EA]">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#10B981]">IN</span>
            <span className="text-[12px] text-gray-700">
              {policy.in_time || "09:00 AM"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#EF4444]">OUT</span>
            <span className="text-[12px] text-gray-700">
              {policy.out_time || "06:00 PM"}
            </span>
          </div>
        </div>

        <div className="space-y-3 px-1">
          <div className="flex justify-between">
            <span className="text-[12px] text-gray-800">Break</span>
            <span className="text-[12px] text-gray-800">
              {policy.break_time || "01:00 PM - 01:30 PM"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[12px] text-[#10B981]">Delay</span>
            <span className="text-[12px] text-gray-800">
              {policy.delay_time || "09:01 AM"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[12px] text-[#F59E0B]">Late</span>
            <span className="text-[12px] text-gray-800">
              {policy.late_time || "10:01 AM"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[12px] text-[#EF4444]">Half Day</span>
            <span className="text-[12px] text-gray-800">
              {policy.half_day_time || "12:01 PM"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftPolicyDetails;
