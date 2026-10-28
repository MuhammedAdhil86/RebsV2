import React, { useState } from "react";
import { ArrowLeft, Save, Info } from "lucide-react";

const FinalizePayroll = ({ data, onBack, onLocalSave }) => {
  // Local state for the specific employee
  const [formData, setFormData] = useState({
    ...data,
    components: data.components || [],
    statutory: {
      epf_employee: data.statutory?.epf_employee || 0,
      esi_employee: data.statutory?.esi_employee || 0,
      pt: data.statutory?.pt || 0,
      lwf_employee: data.statutory?.lwf_employee || 0,
    },
  });

  const handleComponentChange = (index, value) => {
    const updatedComponents = [...formData.components];
    const monthly = parseFloat(value) || 0;
    updatedComponents[index] = {
      ...updatedComponents[index],
      monthly_amount: monthly,
      annual_amount: monthly * 12,
    };
    setFormData({ ...formData, components: updatedComponents });
  };

  const handleStatutoryChange = (field, value) => {
    setFormData({
      ...formData,
      statutory: { ...formData.statutory, [field]: parseFloat(value) || 0 },
    });
  };

  // ================= UI HELPERS (display only) =================
  const statutoryKeys = ["epf_employee", "esi_employee", "pt", "lwf_employee"];
  const maxRows = Math.max(formData.components.length, statutoryKeys.length);

  return (
    <div className="font-poppins min-h-screen flex flex-col items-center bg-gray-100 py-6 animate-in fade-in slide-in-from-right-4">
      {/* ================= TOPBAR ================= */}
      <div className="w-full max-w-5xl bg-white px-8 pt-4 shadow-lg border border-gray-200 border-b-0">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
              title="Return without Saving"
            >
              <ArrowLeft size={16} className="text-gray-600" />
            </button>
            <h1 className="text-lg text-gray-800 font-medium">
              Finalize Payroll
            </h1>
          </div>

          <button
            onClick={() => onLocalSave(formData)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors active:scale-95"
          >
            <Save size={15} />
            Apply Changes Locally
          </button>
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div className="w-full max-w-5xl bg-white px-8 py-6 shadow-lg border border-gray-200 border-t-0">
        {/* ================= EMPLOYEE SUMMARY ================= */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400">
              Employee Summary
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 grid grid-cols-2 gap-y-3 text-sm content-start">
              <span className="text-gray-500">Employee Name</span>
              <span className="text-gray-800">
                : {formData.full_name || "N/A"}
              </span>

              <span className="text-gray-500">Employee ID</span>
              <span className="text-gray-800">: {formData.user_id}</span>

              <span className="text-gray-500">Employee Code</span>
              <span className="text-gray-800">
                : {formData.employee_ref_no || "N/A"}
              </span>
            </div>

            <div className="w-full lg:w-80 bg-green-50 border border-green-200 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-widest text-green-700">
                Attendance
              </p>

              <div className="mt-5 pt-5 border-t border-green-200 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid Days</span>
                  <span className="">
                    {formData.consolidated_summary?.paid_days || 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">LOP Days</span>
                  <span className="">
                    {formData.consolidated_summary?.lop_days || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= NOTE ================= */}
        <div className="mb-8 flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs font-medium">
          <Info size={15} className="text-amber-600 shrink-0" />
          <p>
            Changes made here are stored in memory. You must click "Finalize All
            Staff" on the main page to commit updates to the database.
          </p>
        </div>

        {/* ================= TABLE ================= */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-[25%] px-2 py-4 text-center text-gray-700 uppercase">
                  Earnings
                </th>
                <th className="w-[25%] px-2 py-4 text-center text-gray-700 uppercase">
                  Amount
                </th>
                <th className="w-[25%] px-2 py-4 text-center text-gray-700 uppercase border-l">
                  Statutory Deductions
                </th>
                <th className="w-[25%] px-2 py-4 text-center text-gray-700 uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {[...Array(maxRows)].map((_, idx) => {
                const comp = formData.components[idx];
                const key = statutoryKeys[idx];

                return (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="px-2 py-3 text-center text-gray-700 truncate">
                      {comp?.name || ""}
                    </td>
                    <td className="px-2 py-3 text-center">
                      {comp && (
                        <div className="relative mx-auto w-32 border-b border-gray-200 focus-within:border-indigo-600 transition-all">
                          <span className="absolute left-0 bottom-2 text-gray-400 text-[13px]">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={comp.monthly_amount}
                            onChange={(e) =>
                              handleComponentChange(idx, e.target.value)
                            }
                            className="w-full pl-5 py-1.5 bg-transparent outline-none text-center text-gray-800"
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3 text-center border-l text-gray-700 truncate">
                      {key ? key.replace("_", " ") : ""}
                    </td>
                    <td className="px-2 py-3 text-center">
                      {key && (
                        <div className="relative mx-auto w-32 border-b border-gray-200 focus-within:border-indigo-600 transition-all">
                          <span className="absolute left-0 bottom-2 text-gray-400 text-[13px]">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={formData.statutory[key]}
                            onChange={(e) =>
                              handleStatutoryChange(key, e.target.value)
                            }
                            className="w-full pl-5 py-1.5 bg-transparent outline-none text-center text-red-500"
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinalizePayroll;
