import React, { useState, useEffect } from "react";

const formatDate = (dateStr) => {
  if (!dateStr || String(dateStr).startsWith("0001")) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Photo if available, otherwise first letter of the first name
const EmployeeAvatar = ({ name, src }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const firstName = (name || "").trim().split(/\s+/)[0] || "";
  const initial = firstName.charAt(0).toUpperCase() || "?";

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || "Employee Avatar"}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-700 text-[22px] font-semibold">
      {initial}
    </div>
  );
};

export default function EmployeeInfoCard({
  uuid,
  employeeInfo,
  listEmployee,
  finalImageSrc,
}) {
  // Prefer data from the Manage Insurance list, fall back to the details API
  const name =
    listEmployee?.name ||
    employeeInfo?.employee_name ||
    `${employeeInfo?.first_name || ""} ${employeeInfo?.last_name || ""}`.trim() ||
    "";

  const designation =
    listEmployee?.designation_name || employeeInfo?.designation || "";

  const department =
    listEmployee?.department_name || employeeInfo?.department || "";

  const dateOfJoin = listEmployee?.date_of_join || employeeInfo?.date_of_join;

  const employeeId =
    listEmployee?.uuid || employeeInfo?.employee_id || employeeInfo?.id || uuid;

  // The light list only contains active users
  const isActive = listEmployee
    ? true
    : employeeInfo?.is_active === true || employeeInfo?.is_active === "true";

  return (
    <div className="bg-white shadow-sm rounded-lg p-5 w-full border border-gray-200">
      <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-4">
        Employee Information
      </h3>
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-300">
          <EmployeeAvatar name={name} src={finalImageSrc} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-8 text-xs w-full">
          <div>
            <span className="text-gray-400 block">Employee Name</span>
            <span className="font-semibold text-gray-800 text-[13px] capitalize">
              {name || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Designation</span>
            <span className="font-semibold text-gray-800 text-[13px]">
              {designation || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Status</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border mt-0.5 ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  isActive ? "bg-emerald-500" : "bg-gray-400"
                }`}
              ></span>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Date of Joining</span>
            <span className="font-semibold text-gray-800 text-[13px]">
              {formatDate(dateOfJoin)}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Employee ID</span>
            <span className="font-semibold text-gray-800 text-[13px]">
              {employeeId || "N/A"}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block">Department</span>
            <span className="font-semibold text-gray-800 text-[13px]">
              {department || "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
