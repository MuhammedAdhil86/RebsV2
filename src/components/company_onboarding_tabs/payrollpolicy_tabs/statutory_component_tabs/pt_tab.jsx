import React, { useState } from "react";
import { FiExternalLink, FiX } from "react-icons/fi";
import UniversalTable from "../../../../ui/universal_table";
import payrollService from "../../../../service/payrollService";

const ProfessionalTaxTab = ({ data, onEdit }) => {
  const [openSlabs, setOpenSlabs] = useState(false);
  const [dynamicSlabs, setDynamicSlabs] = useState([]); // ✅ Stores dynamically fetched slabs
  const [slabsLoading, setSlabsLoading] = useState(false); // ✅ Tracks loading state
  const [errorMessage, setErrorMessage] = useState(""); // ✅ Tracks error state

  // Columns for UniversalTable
  const columns = [
    { label: "Min Salary", key: "min_salary", render: (v) => `₹${v}` },
    {
      label: "Max Salary",
      key: "max_salary",
      render: (v) => (v ? `₹${v}` : "No Limit"),
    },
    { label: "Tax Amount", key: "tax_amount", render: (v) => `₹${v}` },
    { label: "State", key: "state", className: "capitalize" },
    {
      label: "Effective From",
      key: "effective_from",
      render: (v) => (v ? new Date(v).toLocaleDateString() : "N/A"),
    },
    {
      label: "Effective To",
      key: "effective_to",
      render: (v) => (v ? new Date(v).toLocaleDateString() : "N/A"),
    },
    {
      label: "Active",
      key: "is_active",
      render: (v) =>
        v ? (
          <span className="text-green-600 font-medium">Yes</span>
        ) : (
          <span className="text-gray-400">No</span>
        ),
    },
  ];

  // ✅ Trigger dynamic API load based on state string
  const handleOpenSlabs = async () => {
    setOpenSlabs(true);

    if (!data?.state) {
      setErrorMessage(
        "No state configured on this component profile. Cannot fetch slabs.",
      );
      return;
    }

    setSlabsLoading(true);
    setErrorMessage("");
    try {
      // Hits: /api/payroll/statutory/professional-tax/slabs/active?state=kerala
      const res = await payrollService.getActivePTSlabs(data.state);

      // Handle standard response data unpack fallback layers safely
      const items = res?.data || res || [];
      setDynamicSlabs(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error(
        `Failed loading dynamic slabs array metrics for ${data.state}:`,
        err,
      );
      setErrorMessage(
        "Failed to load active statutory tax configuration rules.",
      );
    } finally {
      setSlabsLoading(false);
    }
  };

  // If data is null, show a loading or empty state
  if (!data) {
    return (
      <div className="text-gray-500 text-sm py-10 text-center">
        Loading PT data...
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 md:px-6 font-poppins text-[12px]">
      {/* Title */}
      <h3 className="font-medium text-[14px] sm:text-[15px] text-gray-800 flex items-center gap-1">
        Professional Tax{" "}
        <span className="text-gray-500 font-normal text-[12px]">
          (This tax is levied on an employee's income by the State Government.
          Tax slabs differ in each state)
        </span>
      </h3>

      {/* Info Section */}
      <div className="mt-5 space-y-5 text-gray-700">
        {/* PT Number with Update */}
        <div className="flex gap-3 items-center">
          <span className="font-normal text-gray-600">PT Number</span>
          <span className="text-gray-800 font-medium">
            {data.pt_number || "Not Configured"}
          </span>
          <button
            className="px-4 text-black font-medium underline flex items-center gap-1 hover:text-blue-600 transition text-[12px]"
            onClick={onEdit} // triggers UpsertPT in parent
          >
            Update PT Number
          </button>
        </div>

        {/* State */}
        <div className="flex gap-3">
          <span className="w-[150px] font-normal text-gray-600">State</span>
          <span className="text-gray-800 capitalize">
            {data.state || "N/A"}
          </span>
        </div>

        {/* Deduction Cycle */}
        <div className="flex gap-3">
          <span className="w-[150px] font-normal text-gray-600">
            Deduction Cycle
          </span>
          <span className="text-gray-800 capitalize">
            {data.deduction_cycle || "Monthly"}
          </span>
        </div>

        {/* PT Slabs Trigger */}
        <div className="flex gap-3 items-center">
          <span className="w-[150px] font-normal text-gray-600">PT Slabs</span>
          <button
            className="text-black font-medium underline flex items-center gap-1 hover:text-blue-600 transition text-[12px]"
            onClick={handleOpenSlabs} // ✅ Updated handler
          >
            View Tax Slabs <FiExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* Divider */}
      <hr className="mt-6 border-gray-200" />

      {/* PT Slabs Modal */}
      {openSlabs && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-[800px] p-5 relative animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h4 className="font-semibold text-gray-800 text-[14px] capitalize">
                Active PT Tax Slabs — {data.state}
              </h4>
              <button
                onClick={() => setOpenSlabs(false)}
                className="text-gray-400 hover:text-black transition"
              >
                <FiX size={18} />
              </button>
            </div>

            {errorMessage && (
              <p className="text-red-500 text-xs my-4 text-center">
                {errorMessage}
              </p>
            )}

            {slabsLoading ? (
              <div className="text-center py-12 text-gray-400 italic">
                Fetching configuration slabs breakdown matrix...
              </div>
            ) : (
              <UniversalTable
                columns={columns}
                data={dynamicSlabs}
                rowsPerPage={5}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalTaxTab;
