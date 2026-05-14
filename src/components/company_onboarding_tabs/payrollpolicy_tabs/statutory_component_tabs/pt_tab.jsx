import React, { useState } from "react";
import { FiExternalLink } from "react-icons/fi";
import UniversalTable from "../../../../ui/universal_table";
import UpsertPT from "./upsertpt"; // import the UpsertPT component

const ProfessionalTaxTab = ({ data, onEdit }) => {
  const [openSlabs, setOpenSlabs] = useState(false);

  const ptSlabs = data?.pt_slabs || [];

  // Columns for UniversalTable
  const columns = [
    { label: "Min Salary", key: "min_salary" },
    { label: "Max Salary", key: "max_salary", render: (v) => v ?? "No Limit" },
    { label: "Tax Amount", key: "tax_amount" },
    { label: "State", key: "state" },
    {
      label: "Effective From",
      key: "effective_from",
      render: (v) => new Date(v).toLocaleDateString(),
    },
    {
      label: "Effective To",
      key: "effective_to",
      render: (v) => (v ? new Date(v).toLocaleDateString() : "N/A"),
    },
    {
      label: "Active",
      key: "is_active",
      render: (v) => (v ? "Yes" : "No"),
    },
  ];

  // If data is null, show a loading or empty state
  if (!data) {
    return <div className="text-gray-500 text-sm py-10 text-center">Loading PT data...</div>;
  }

  return (
    <div className="px-2 sm:px-4 md:px-6 font-poppins text-[12px]">

      {/* Title */}
      <h3 className="font-medium text-[14px] sm:text-[15px] text-gray-800 flex items-center gap-1">
        Professional Tax{" "}
        <span className="text-gray-500 font-normal text-[12px]">
          (This tax is levied on an employee's income by the State Government. Tax slabs differ in each state)
        </span>
      </h3>

      {/* Info Section */}
      <div className="mt-5 space-y-5 text-gray-700">

        {/* PT Number with Update */}
        <div className="flex gap-3 items-center">
          <span className="font-normal text-gray-600">PT Number</span>
          <span className="text-gray-800">{data.pt_number}</span>
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
          <span className="text-gray-800">{data.state}</span>
        </div>

        {/* Deduction Cycle */}
        <div className="flex gap-3">
          <span className="w-[150px] font-normal text-gray-600">Deduction Cycle</span>
          <span className="text-gray-800">{data.deduction_cycle}</span>
        </div>

        {/* PT Slabs */}
        <div className="flex gap-3 items-center">
          <span className="w-[150px] font-normal text-gray-600">PT Slabs</span>
          <button
            className="text-black font-medium underline flex items-center gap-1 hover:text-blue-600 transition text-[12px]"
            onClick={() => setOpenSlabs(true)}
          >
            View Tax Slabs <FiExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* Divider */}
      <hr className="mt-6 border-gray-200" />

      {/* PT Slabs Modal */}
      {openSlabs && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-[800px] p-5 relative">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-800 text-[14px]">PT Tax Slabs</h4>
              <button onClick={() => setOpenSlabs(false)}>
                <FiExternalLink size={22} />
              </button>
            </div>
            <UniversalTable columns={columns} data={ptSlabs} rowsPerPage={5} />
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfessionalTaxTab;
