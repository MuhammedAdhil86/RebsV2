import React, { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import useEmployeeStore from "../../store/employeeStore";
import axiosInstance from "../../service/axiosinstance";
import {
  getBranchData,
  getDepartmentData,
  getDesignationData,
} from "../../service/companyService";
import {
  fetchEmployeeStatus,
  fetchEmployeeType,
  fetchEmployeeRoles,
} from "../../service/employeeService";

export default function WorkInfoSection({ onSuccess, onError }) {
  // Use the parent's handlers (same global Toaster as the other sections);
  // fall back to react-hot-toast if they are not passed.
  const notifySuccess = (msg) =>
    onSuccess ? onSuccess(msg) : toast.success(msg);
  const notifyError = (msg) => (onError ? onError(msg) : toast.error(msg));

  const { selectedEmployee, setSelectedEmployee } = useEmployeeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employmentStatusList, setEmploymentStatusList] = useState([]);
  const [employmentTypeList, setEmploymentTypeList] = useState([]);

  const [localEdits, setLocalEdits] = useState({
    companyId: "",
    employeeRef: "",
    branchId: "",
    branchName: "Head Office",
    departmentId: "",
    departmentName: "",
    designationId: "",
    designationName: "",
    roleId: "",
    role: "",
    sourceOfHiring: "",
    employmentStatusId: "",
    employmentStatus: "",
    employeeTypeId: "",
    employeeType: "",
    totalExperience: "",
    joiningDate: "",
    location: "Panampilly Nagar",
  });

  // Load dropdown master data
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const b = await getBranchData();
        const d = await getDepartmentData();
        const g = await getDesignationData();
        const r = await fetchEmployeeRoles();
        const s = await fetchEmployeeStatus();
        const t = await fetchEmployeeType();

        const normalize = (res) =>
          res?.data?.data || res?.data || (Array.isArray(res) ? res : []);

        setBranches(normalize(b));
        setDepartments(normalize(d));
        setDesignations(normalize(g));
        setRoles(normalize(r));
        setEmploymentStatusList(normalize(s));
        setEmploymentTypeList(normalize(t));
      } catch (err) {
        console.error("Failed to fetch dropdowns:", err);
        notifyError("Failed to load dropdowns");
      }
    };
    fetchDropdowns();
  }, []);

  // Fill form from selected employee
  useEffect(() => {
    if (!selectedEmployee) return;
    setLocalEdits({
      companyId: selectedEmployee.company_id || "",
      employeeRef: selectedEmployee.employee_ref_no || "",
      branchId: selectedEmployee.branch_id || "",
      branchName: selectedEmployee.branch || "Head Office",
      departmentId: selectedEmployee.department_id || "",
      departmentName: selectedEmployee.department || "",
      designationId: selectedEmployee.designation_id || "",
      designationName: selectedEmployee.designation || "",
      // user_type may come back as an id ("3") or a name ("Employee")
      roleId: /^\d+$/.test(String(selectedEmployee.user_type ?? ""))
        ? String(selectedEmployee.user_type)
        : "",
      role:
        selectedEmployee.role ||
        (/^\d+$/.test(String(selectedEmployee.user_type ?? ""))
          ? ""
          : String(selectedEmployee.user_type || "")),
      sourceOfHiring: selectedEmployee.source_of_hiring || "",
      employmentStatusId: selectedEmployee.employment_status_id || "",
      employmentStatus: selectedEmployee.employment_status || "",
      employeeTypeId: selectedEmployee.employee_type_id || "",
      employeeType: selectedEmployee.employee_type || "",
      totalExperience: selectedEmployee.total_experience || "",
      joiningDate: selectedEmployee.date_of_join
        ? selectedEmployee.date_of_join.split("T")[0]
        : "",
      location: selectedEmployee.location || "Panampilly Nagar",
    });
  }, [selectedEmployee]);

  // If the API only gives the role name, resolve the id once roles are loaded
  useEffect(() => {
    if (!roles.length) return;
    setLocalEdits((prev) => {
      if (prev.roleId || !prev.role) return prev;
      const match = roles.find(
        (r) => String(r.name).toLowerCase() === String(prev.role).toLowerCase(),
      );
      return match ? { ...prev, roleId: String(match.id) } : prev;
    });
  }, [roles, selectedEmployee]);

  const setField = useCallback((field, value) => {
    setLocalEdits((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Sets the id and the display name together
  const handleSelectChange = useCallback((fieldId, fieldName, list, value) => {
    const selected = list.find((item) => String(item.id) === String(value));
    setLocalEdits((prev) => ({
      ...prev,
      [fieldId]: value,
      [fieldName]: selected ? selected.name : "",
    }));
  }, []);

  const getStaffId = () =>
    selectedEmployee?.staff_id || selectedEmployee?.id || null;

  const handleSave = async () => {
    const staffId = getStaffId();
    if (!staffId) {
      notifyError("No valid staff ID found.");
      return;
    }

    // Always send a numeric role id, never the role name
    let roleId = String(localEdits.roleId || "");
    if (!/^\d+$/.test(roleId)) {
      const match = roles.find(
        (r) =>
          String(r.name).toLowerCase() ===
          String(localEdits.role).toLowerCase(),
      );
      roleId = match ? String(match.id) : "";
    }
    if (!roleId) {
      notifyError("Please select a valid role.");
      return;
    }

    const payload = {
      company: localEdits.companyId || null,
      branch_id: localEdits.branchId || null,
      department_id: localEdits.departmentId || null,
      location: localEdits.location || "Panampilly Nagar",
      user_type: roleId, // numeric role id from master roles API
      employee_type_id: localEdits.employeeTypeId || null,
      designation_id: localEdits.designationId || null,
      source_of_hiring: localEdits.sourceOfHiring || "",
      employment_status_id: localEdits.employmentStatusId || null,
      date_of_join: localEdits.joiningDate
        ? new Date(localEdits.joiningDate).toISOString()
        : null,
      total_experience: localEdits.totalExperience
        ? String(localEdits.totalExperience).trim()
        : "",
      employee_ref_no: localEdits.employeeRef || "",
    };

    try {
      setLoading(true);
      await axiosInstance.put(`/staff/updateworkinfo/${staffId}`, payload);

      const updatedEmployee = {
        ...selectedEmployee,
        ...payload,
        branch:
          branches.find((b) => String(b.id) === String(payload.branch_id))
            ?.name || "Head Office",
        department:
          departments.find(
            (d) => String(d.id) === String(payload.department_id),
          )?.name || "",
        designation:
          designations.find(
            (d) => String(d.id) === String(payload.designation_id),
          )?.name || "",
        role:
          roles.find((r) => String(r.id) === String(payload.user_type))?.name ||
          "",
        employment_status:
          employmentStatusList.find(
            (s) => String(s.id) === String(payload.employment_status_id),
          )?.name || "",
        employee_type:
          employmentTypeList.find(
            (t) => String(t.id) === String(payload.employee_type_id),
          )?.name || "",
      };

      setSelectedEmployee(updatedEmployee);
      setLocalEdits({
        companyId: updatedEmployee.company,
        employeeRef: updatedEmployee.employee_ref_no,
        branchId: updatedEmployee.branch_id,
        branchName: updatedEmployee.branch,
        departmentId: updatedEmployee.department_id,
        departmentName: updatedEmployee.department,
        designationId: updatedEmployee.designation_id,
        designationName: updatedEmployee.designation,
        roleId: updatedEmployee.user_type
          ? String(updatedEmployee.user_type)
          : "",
        role: updatedEmployee.role,
        sourceOfHiring: updatedEmployee.source_of_hiring,
        employmentStatusId: updatedEmployee.employment_status_id,
        employmentStatus: updatedEmployee.employment_status,
        employeeTypeId: updatedEmployee.employee_type_id,
        employeeType: updatedEmployee.employee_type,
        totalExperience: updatedEmployee.total_experience,
        joiningDate: updatedEmployee.date_of_join
          ? updatedEmployee.date_of_join.split("T")[0]
          : "",
        location: updatedEmployee.location || "Panampilly Nagar",
      });

      notifySuccess("Work information updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Update failed:", err);
      const msg =
        err?.response?.data?.message || "Failed to update work information.";
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  const display = (val) =>
    val === "" || val === null || val === undefined || String(val) === "0"
      ? "N/A"
      : val;

  const fields = [
    {
      label: "Employee Reference",
      key: "employeeRef",
      type: "text",
      readOnly: true,
    },
    {
      label: "Branch",
      key: "branchId",
      type: "select",
      list: branches,
      nameField: "branchName",
    },
    {
      label: "Department",
      key: "departmentId",
      type: "select",
      list: departments,
      nameField: "departmentName",
    },
    {
      label: "Designation",
      key: "designationId",
      type: "select",
      list: designations,
      nameField: "designationName",
    },
    {
      label: "Role",
      key: "roleId",
      type: "select",
      list: roles,
      nameField: "role",
    },
    { label: "Location", key: "location", type: "text" },
    { label: "Source of Hiring", key: "sourceOfHiring", type: "text" },
    {
      label: "Employment Status",
      key: "employmentStatusId",
      type: "select",
      list: employmentStatusList,
      nameField: "employmentStatus",
    },
    {
      label: "Employment Type",
      key: "employeeTypeId",
      type: "select",
      list: employmentTypeList,
      nameField: "employeeType",
    },
    { label: "Total Experience", key: "totalExperience", type: "number" },
    { label: "Date of Joining", key: "joiningDate", type: "date" },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">
          Work Information
        </h3>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              onClick={handleSave}
              disabled={loading}
              className={`text-sm text-blue-600 font-medium hover:underline ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          )}
          <Icon
            icon="basil:edit-outline"
            className="w-5 h-5 text-gray-400 cursor-pointer"
            onClick={() => setIsEditing((prev) => !prev)}
            title={isEditing ? "Cancel edit" : "Edit"}
          />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {fields.map((field) => (
          <div
            key={field.key}
            className="flex justify-between items-center border-b border-gray-100 py-2"
          >
            <span className="text-gray-500 text-[12px]">{field.label}</span>

            <span className="font-medium text-gray-800 text-right min-w-[160px] break-words text-[13px]">
              {isEditing && !field.readOnly ? (
                field.type === "select" ? (
                  <select
                    value={localEdits[field.key] || ""}
                    onChange={(e) =>
                      handleSelectChange(
                        field.key,
                        field.nameField,
                        field.list,
                        e.target.value,
                      )
                    }
                    className="border border-gray-300 rounded px-2 py-1 text-gray-800 w-full max-w-[160px]"
                  >
                    <option value="">Select {field.label}</option>
                    {(field.list.length
                      ? field.list
                      : [
                          {
                            id: "0",
                            name: field.key.includes("branch")
                              ? "Head Office"
                              : "-",
                          },
                        ]
                    ).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={localEdits[field.key] || ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-gray-800 w-full max-w-[160px]"
                  />
                )
              ) : field.type === "select" ? (
                display(localEdits[field.nameField])
              ) : (
                display(localEdits[field.key])
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
