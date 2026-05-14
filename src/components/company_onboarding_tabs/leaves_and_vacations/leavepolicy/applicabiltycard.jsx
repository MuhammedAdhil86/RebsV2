import React, { useEffect, useState } from "react";
import { ChevronDown, Plus, X, Users } from "lucide-react";
import payrollService from "../../../../service/payrollService";
import { cardClass, sectionTitle } from "../../../helpers/leavepolicyutils";

const ApplicabilityCard = ({
  onClose,
  handleSubmit,
  criteria,
  setCriteria,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [lookups, setLookups] = useState({
    "Work Locations": [],
    Departments: [],
    Designation: [],
    Gender: [
      { id: "Male", name: "Male" },
      { id: "Female", name: "Female" },
      { id: "Other", name: "Other" },
    ],
  });

  const apiFilterMap = {
    "Work Locations": "branch_id",
    Departments: "department_id",
    Designation: "designation_id",
    Gender: "gender",
  };

  useEffect(() => {
    const loadAllLookups = async () => {
      try {
        const [branchesRes, deptsRes, desigsRes] = await Promise.all([
          payrollService.getPolicyLookupData(apiFilterMap["Work Locations"]),
          payrollService.getPolicyLookupData(apiFilterMap["Departments"]),
          payrollService.getPolicyLookupData(apiFilterMap["Designation"]),
        ]);

        const extractArray = (res) => {
          if (Array.isArray(res)) return res;
          if (res?.data?.lookups && Array.isArray(res.data.lookups))
            return res.data.lookups;
          if (Array.isArray(res?.data)) return res.data;
          return [];
        };

        setLookups((prev) => ({
          ...prev,
          "Work Locations": extractArray(branchesRes),
          Departments: extractArray(deptsRes),
          Designation: extractArray(desigsRes),
        }));
      } catch (error) {
        console.error("Failed to load lookups", error);
      }
    };
    loadAllLookups();
  }, []);

  const handleSelectChange = (label, value) => {
    const apiKey = apiFilterMap[label];
    if (!value) {
      setCriteria({ allocate_all: true });
    } else {
      setCriteria({
        [apiKey]: label === "Gender" ? value : Number(value),
      });
    }
  };

  const getSelectedLabel = (label) => {
    const apiKey = apiFilterMap[label];
    const selectedValue = criteria[apiKey];
    if (!selectedValue) return "Select";
    const found = lookups[label].find(
      (opt) => String(opt.id) === String(selectedValue),
    );
    return found ? found.name : "Select";
  };

  // Check if any specific filter is currently active
  const isSpecificFilterActive = Object.keys(criteria).some(
    (key) => key !== "allocate_all",
  );

  return (
    <div className={cardClass}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={sectionTitle}>Applicability and Validity</h3>
        {!showFilters && !isSpecificFilterActive && (
          <button
            onClick={() => setShowFilters(true)}
            className="p-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all active:scale-90"
          >
            <Plus size={16} />
          </button>
        )}
        {(showFilters || isSpecificFilterActive) && (
          <button
            onClick={() => {
              setShowFilters(false);
              setCriteria({ allocate_all: true });
            }}
            className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Default View: All Employees */}
        {!showFilters && !isSpecificFilterActive ? (
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <Users size={16} />
            </div>
            <div>
              <p className="text-[12px] font-medium text-gray-700">
                All Employees
              </p>
              <p className="text-[10px] text-gray-500">
                This policy will apply to everyone in the company.
              </p>
            </div>
          </div>
        ) : (
          /* Filter Selection View */
          ["Work Locations", "Departments", "Designation", "Gender"].map(
            (label) => (
              <div
                key={label}
                className="flex border border-gray-200 rounded-xl overflow-hidden h-10 shadow-sm animate-in fade-in slide-in-from-top-1"
              >
                <div className="w-1/3 px-4 flex items-center text-[11px] text-gray-600 border-r border-gray-200 bg-gray-50">
                  {label}
                </div>

                <div className="w-2/3 relative bg-white">
                  <select
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    value={criteria[apiFilterMap[label]] || ""}
                    onChange={(e) => handleSelectChange(label, e.target.value)}
                  >
                    <option value="">Select {label}</option>
                    {Array.isArray(lookups[label]) &&
                      lookups[label].map((option, idx) => (
                        <option key={idx} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                  </select>

                  <div className="w-full h-full px-4 flex justify-between items-center text-[11px] text-gray-500">
                    <span
                      className={
                        criteria[apiFilterMap[label]]
                          ? "text-black font-medium"
                          : "text-gray-400"
                      }
                    >
                      {getSelectedLabel(label)}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>
                </div>
              </div>
            ),
          )
        )}
      </div>

      <div className="flex gap-4 mt-10">
        <button
          onClick={onClose}
          className="px-12 py-2.5 border border-gray-300 rounded-xl text-[12px] hover:bg-gray-50 transition-all font-['Poppins']"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          className="px-12 py-2.5 bg-black text-white rounded-xl text-[12px] hover:bg-zinc-800 shadow-lg active:scale-95 transition-all font-['Poppins']"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default ApplicabilityCard;
