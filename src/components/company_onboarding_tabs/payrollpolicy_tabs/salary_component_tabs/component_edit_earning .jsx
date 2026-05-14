import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import payrollService from "../../../../service/payrollService";

// ==========================================
// SUB-COMPONENTS (Internal)
// ==========================================
const CustomRadio = ({ label, checked, onClick }) => (
  <label
    className="flex items-center gap-2.5 cursor-pointer group"
    onClick={onClick}
  >
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${checked ? "bg-black border-black" : "bg-white border-gray-300"}`}
    >
      {checked && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="4"
          className="w-3 h-3"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
    </div>
    <span className="text-gray-800 font-medium capitalize">
      {label.replace(/_/g, " ")}
    </span>
  </label>
);

const CheckboxOption = ({ label, checked, onChange, isGreenLabel }) => (
  <div className="flex items-start gap-3">
    <div className="relative flex items-center pt-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded border border-gray-300 transition-all checked:bg-black checked:border-black"
      />
      <svg
        className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
    <label
      className={`leading-tight cursor-pointer font-medium ${isGreenLabel && checked ? "text-green-500" : "text-gray-700"}`}
    >
      {label}
    </label>
  </div>
);

// ==========================================
// MAIN EDIT COMPONENT
// ==========================================
export default function EditSalaryComponent({ data, onCancel }) {
  // Console log to verify data arriving
  useEffect(() => {
    console.log("Edit Component Loaded with Data:", data);
  }, [data]);

  // --- FORM STATE ---
  const [salaryName, setSalaryName] = useState(data?.name || "");
  const [payslipName, setPayslipName] = useState(data?.payslip_name || "");
  const [calculationType, setCalculationType] = useState(
    data?.calculation_type || "percentage_ctc",
  );
  const [value, setValue] = useState(data?.value || 0);

  // --- CONFIGURATION STATE ---
  const [active, setActive] = useState(data?.active ?? true);
  const [taxable, setTaxable] = useState(data?.taxable ?? false);
  const [partSalary, setPartSalary] = useState(
    data?.part_of_salary_structure ?? false,
  );
  const [proRata, setProRata] = useState(data?.pro_rata ?? false);
  const [fbp, setFbp] = useState(data?.flexible_benefit ?? false);
  const [epf, setEpf] = useState(data?.consider_epf ?? false);
  const [esi, setEsi] = useState(data?.consider_esi ?? false);
  const [showPayslip, setShowPayslip] = useState(
    data?.show_in_payslip ?? false,
  );
  const [epfApplicability, setEpfApplicability] = useState(
    data?.epf_applicability || "ALWAYS",
  );

  // --- UPDATE HANDLER ---
  const handleUpdate = async () => {
    // Construct payload strictly following your API requirements
    const payload = {
      name: salaryName,
      internal_name: salaryName.toLowerCase().replace(/\s+/g, "_"),
      payslip_name: payslipName,
      component_type: "earning",
      active,
      taxable,
      consider_epf: epf,
      epf_applicability: epf ? epfApplicability : "",
      consider_esi: esi,
      pro_rata: proRata,
      show_in_payslip: showPayslip,
      flexible_benefit: fbp,
      part_of_salary_structure: partSalary,
      display_order: data?.display_order || 1,
      calculation_type: calculationType,
      value: Number(value),
    };

    console.log(
      "Step 3: Triggering Update for ID:",
      data.id,
      "Payload:",
      payload,
    );

    const loadingToast = toast.loading("Updating salary component...");

    try {
      // Calling update service with dynamic ID
      const res = await payrollService.updateSalaryComponent(data.id, payload);

      toast.dismiss(loadingToast);

      if (res?.ok) {
        toast.success(res.message || "Salary component updated successfully");
        onCancel(); // Switch back to the table view
      } else {
        // Handle specific error message from server if available
        toast.error(res?.message || "Failed to update component");
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error("Update Error:", err);

      // Extracting the best possible error message
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";

      toast.error(errorMessage);
    }
  };

  return (
    <div className="w-full bg-white min-h-screen font-poppins text-[12px] p-3 rounded-md">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900 text-sm">
          Edit Earning
          <span className="text-red-500 font-normal ml-2">
            * Indicates mandatory fields
          </span>
        </h2>
      </div>

      <div className="px-10 py-5 max-w-7xl mx-auto">
        {/* INPUT GRID */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-gray-600">Component name*</label>
            <input
              type="text"
              value={salaryName}
              onChange={(e) => setSalaryName(e.target.value)}
              className="h-11 px-4 bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-black transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-gray-600">
              Name in Payslip*
            </label>
            <input
              type="text"
              value={payslipName}
              onChange={(e) => setPayslipName(e.target.value)}
              className="h-11 px-4 bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-black transition-all"
            />
          </div>
        </div>

        {/* CALCULATION TYPE */}
        <div className="mb-1 py-8 border-y border-gray-100">
          <label className="font-semibold text-gray-700 block mb-6 uppercase tracking-wider">
            Calculation Type*
          </label>
          <div className="flex items-center gap-12">
            {["flat", "percentage_basic", "percentage_ctc"].map((type) => (
              <div className="flex items-center gap-4" key={type}>
                <CustomRadio
                  label={type}
                  checked={calculationType === type}
                  onClick={() => setCalculationType(type)}
                />
                {calculationType === type && (
                  <div className="flex items-center h-10 border border-gray-200 rounded-md bg-white shadow-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className="w-20 px-3 bg-transparent outline-none font-medium text-right"
                    />
                    <span className="bg-gray-100 px-2 h-full flex items-center text-gray-500 border-l border-gray-200">
                      {type === "flat" ? "₹" : "%"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* OTHER CONFIG */}
        <h3 className="font-bold text-gray-900 mb-8 mt-8 text-sm">
          Other Configurations
        </h3>
        <div className="grid grid-cols-2 gap-x-20 gap-y-8 mb-16">
          <div className="space-y-6">
            <CheckboxOption
              label="Mark as Active"
              isGreenLabel
              checked={active}
              onChange={() => setActive(!active)}
            />
            <CheckboxOption
              label="This is a taxable earning"
              checked={taxable}
              onChange={() => setTaxable(!taxable)}
            />
            <CheckboxOption
              label="Make this earning a part of the employee's salary structure"
              checked={partSalary}
              onChange={() => setPartSalary(!partSalary)}
            />
            <CheckboxOption
              label="Calculate on pro-rata basis"
              checked={proRata}
              onChange={() => setProRata(!proRata)}
            />
          </div>
          <div className="space-y-6">
            <CheckboxOption
              label="Include this as a Flexible Benefit Plan component"
              checked={fbp}
              onChange={() => setFbp(!fbp)}
            />
            <div>
              <CheckboxOption
                label="Consider for EPF Contribution"
                checked={epf}
                onChange={() => setEpf(!epf)}
              />
              {epf && (
                <div className="ml-8 mt-4 space-y-3 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <CustomRadio
                    label="Always"
                    checked={epfApplicability === "ALWAYS"}
                    onClick={() => setEpfApplicability("ALWAYS")}
                  />
                  <CustomRadio
                    label="Only when PF Wage is less than ₹ 15,000"
                    checked={epfApplicability === "PF_WAGE_LT_15000"}
                    onClick={() => setEpfApplicability("PF_WAGE_LT_15000")}
                  />
                </div>
              )}
            </div>
            <CheckboxOption
              label="Consider for ESI Contribution"
              checked={esi}
              onChange={() => setEsi(!esi)}
            />
            <CheckboxOption
              label="Show this component in payslip"
              checked={showPayslip}
              onChange={() => setShowPayslip(!showPayslip)}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-4 py-8 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-8 py-2.5 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-10 py-2.5 font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-all active:scale-95"
          >
            Update Earning
          </button>
        </div>
      </div>
    </div>
  );
}
