import React, { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import toast, { Toaster } from "react-hot-toast";
import useEmployeeStore from "../../store/employeeStore";
import axiosInstance from "../../service/axiosinstance";
import {
  getBranchData,
  getDepartmentData,
  getDesignationData,
} from "../../service/companyService";
import { fetchEmployeeStatus, fetchEmployeeType } from "../../service/employeeService";

export default function WorkInfoSection() {
  const { selectedEmployee, setSelectedEmployee } = useEmployeeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
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
    sourceOfHiring: "",
    employmentStatusId: "",
    employmentStatus: "",
    employeeTypeId: "",
    employeeType: "",
    totalExperience: "",
    joiningDate: "",
  });

  // Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const b = await getBranchData();
        const d = await getDepartmentData();
        const g = await getDesignationData();
        const s = await fetchEmployeeStatus();
        const t = await fetchEmployeeType();
        const normalize = (res) =>
          res?.data?.data || (Array.isArray(res) ? res : []);
        setBranches(normalize(b));
        setDepartments(normalize(d));
        setDesignations(normalize(g));
        setEmploymentStatusList(normalize(s));
        setEmploymentTypeList(normalize(t));
      } catch (err) {
        console.error("Failed to fetch dropdowns:", err);
        toast.error("Failed to load dropdowns");
      }
    };
    fetchDropdowns();
  }, []);

  // Initialize localEdits
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
      sourceOfHiring: selectedEmployee.source_of_hiring || "",
      employmentStatusId: selectedEmployee.employment_status_id || "",
      employmentStatus: selectedEmployee.employment_status || "",
      employeeTypeId: selectedEmployee.employee_type_id || "",
      employeeType: selectedEmployee.employee_type || "",
      totalExperience: selectedEmployee.total_experience || "",
      joiningDate: selectedEmployee.date_of_join
        ? selectedEmployee.date_of_join.split("T")[0]
        : "",
    });
  }, [selectedEmployee]);

  const setField = useCallback((field, value) => {
    setLocalEdits((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSelectChange = useCallback(
    (fieldId, fieldName, list, value) => {
      const selected = list.find((item) => String(item.id) === String(value));
      setLocalEdits((prev) => ({
        ...prev,
        [fieldId]: value,
        [fieldName]: selected ? selected.name : "",
      }));
    },
    []
  );

  const getStaffId = () =>
    selectedEmployee?.staff_id || selectedEmployee?.id || null;

  const handleSave = async () => {
    const staffId = getStaffId();
    if (!staffId) return toast.error("No valid staff ID found.");

    const payload = {
      company: localEdits.companyId || null,
      branch_id: localEdits.branchId || null,
      department_id: localEdits.departmentId || null,
      location: "",
      role: localEdits.designationName || "",
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
          branches.find(
            (b) => String(b.id) === String(payload.branch_id)
          )?.name || "Head Office",
        department:
          departments.find(
            (d) => String(d.id) === String(payload.department_id)
          )?.name || "",
        designation:
          designations.find(
            (d) => String(d.id) === String(payload.designation_id)
          )?.name || "",
        employment_status:
          employmentStatusList.find(
            (s) => String(s.id) === String(payload.employment_status_id)
          )?.name || "",
        employee_type:
          employmentTypeList.find(
            (t) => String(t.id) === String(payload.employee_type_id)
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
        sourceOfHiring: updatedEmployee.source_of_hiring,
        employmentStatusId: updatedEmployee.employment_status_id,
        employmentStatus: updatedEmployee.employment_status,
        employeeTypeId: updatedEmployee.employee_type_id,
        employeeType: updatedEmployee.employee_type,
        totalExperience: updatedEmployee.total_experience,
        joiningDate: updatedEmployee.date_of_join
          ? updatedEmployee.date_of_join.split("T")[0]
          : "",
      });

      toast.success("Work information updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Update failed:", err);
      const msg =
        err?.response?.data?.message || "Failed to update work information.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const display = (val) =>
    val === "" || val === null || val === undefined || String(val) === "0"
      ? "N/A"
      : val;

  // Data structure for rendering
  const fields = [
    { label: "Employee Reference", key: "employeeRef", type: "text" },
    { label: "Branch", key: "branchId", type: "select", list: branches, nameField: "branchName" },
    { label: "Department", key: "departmentId", type: "select", list: departments, nameField: "departmentName" },
    { label: "Designation / Role", key: "designationId", type: "select", list: designations, nameField: "designationName" },
    { label: "Source of Hiring", key: "sourceOfHiring", type: "text" },
    { label: "Employment Status", key: "employmentStatusId", type: "select", list: employmentStatusList, nameField: "employmentStatus" },
    { label: "Employment Type", key: "employeeTypeId", type: "select", list: employmentTypeList, nameField: "employeeType" },
    { label: "Total Experience", key: "totalExperience", type: "number" },
    { label: "Date of Joining", key: "joiningDate", type: "date" },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full">
      {/* Header */}
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

      {/* Fields aligned top-to-bottom, left-right */}
      <div className="space-y-2 text-sm">
        {fields.map((field) => (
          <div
            key={field.key}
            className="flex justify-between items-center border-b border-gray-100 py-2"
          >
            {/* Label left */}
            <span className="text-gray-500 text-[12px]">{field.label}</span>

            {/* Value/Input right */}
            <span className="font-medium text-gray-800 text-right min-w-[160px] break-words text-[13px]">
              {isEditing ? (
                field.type === "select" ? (
                  <select
                    value={localEdits[field.key] || ""}
                    onChange={(e) =>
                      handleSelectChange(
                        field.key,
                        field.nameField,
                        field.list,
                        e.target.value
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
                    value={localEdits[field.key]}
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

      <Toaster />
    </div>
  );
}
