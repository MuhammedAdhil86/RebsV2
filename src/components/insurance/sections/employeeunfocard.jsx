import React from "react";

export default function EmployeeInfoCard({
  uuid,
  employeeInfo,
  finalImageSrc,
}) {
  return (
    <div className="bg-white shadow-sm rounded-lg p-5 w-full border border-gray-200">
      <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-4">
        Employee Information
      </h3>
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-300">
          <img
            src={finalImageSrc}
            alt="Employee Avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";
            }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-8 text-xs w-full">
          <div>
            <span className="text-gray-400 block">Employee Name</span>
            <span className="font-semibold text-gray-800 text-[13px]">
              {employeeInfo?.employee_name ||
                `${employeeInfo?.first_name || ""} ${employeeInfo?.last_name || ""}`.trim() ||
                "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Designation</span>
            <span className="font-semibold text-gray-800 text-[13px]">
              {employeeInfo?.designation || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Status</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              {employeeInfo?.is_active === true ||
              employeeInfo?.is_active === "true"
                ? "Active"
                : "Inactive"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Date of Joining</span>
            <span className="font-semibold text-gray-800 text-[13px]">
              {employeeInfo?.date_of_join &&
              !employeeInfo.date_of_join.startsWith("0001")
                ? new Date(employeeInfo.date_of_join).toLocaleDateString(
                    "en-GB",
                  )
                : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Employee ID</span>
            <span className="font-semibold text-gray-800 text-[13px]">
              {employeeInfo?.employee_id || employeeInfo?.id || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Location</span>
            <span className="font-semibold text-gray-800 text-[13px]">
              {employeeInfo?.location || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Department</span>
            <span className="font-semibold text-gray-800 text-[13px]">
              {employeeInfo?.department || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Employment Type</span>
            <span className="font-semibold text-gray-800 text-[13px]">
              {employeeInfo?.employment_type || "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
