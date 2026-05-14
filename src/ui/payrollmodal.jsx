import React, { useEffect } from "react";

/* Field Config (no total_deductions_monthly) */
const payrollFieldConfig = [
  { label: "User ID", key: "user_id", readOnly: true, type: "text" },
  { label: "Employee Name", key: "user_name", readOnly: true, type: "text" },
  { label: "Gross Monthly", key: "gross_monthly", type: "number" },
  { label: "Net Monthly", key: "net_monthly", type: "number" },
  { label: "Net Annual", key: "net_annual", type: "number" },
];

export default function PayrollModal({
  selectedEmployee,
  onClose,
  onFieldChange,
  onComponentChange,
  onSave,
}) {
  if (!selectedEmployee) return null;

  // ------------------- Auto-recalculate totals -------------------
  useEffect(() => {
    if (!selectedEmployee.components) return;

    const grossMonthly = selectedEmployee.components.reduce(
      (sum, comp) => sum + Number(comp.monthly_amount || 0),
      0,
    );
    const netAnnual = selectedEmployee.components.reduce(
      (sum, comp) => sum + Number(comp.annual_amount || 0),
      0,
    );

    onFieldChange("gross_monthly", grossMonthly);
    onFieldChange("net_monthly", grossMonthly); // assuming net = gross here; adjust for deductions if needed
    onFieldChange("net_annual", netAnnual);
  }, [selectedEmployee.components]);

  // ------------------- Render UI -------------------
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
        className="bg-white p-6 rounded w-[750px] max-h-[80vh] overflow-y-auto"
        style={{
          fontFamily: "Poppins",
          fontSize: "12px",
          fontWeight: 400,
        }}
      >
        {/* Header */}
        <h2 className="mb-4">Update Payroll - {selectedEmployee.user_name}</h2>

        {/* Main Fields */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {payrollFieldConfig.map((field) => (
            <div key={field.key} className="flex items-center gap-2">
              <label className="w-44">{field.label}</label>
              <input
                type={field.type}
                value={selectedEmployee[field.key] ?? ""}
                readOnly={field.readOnly}
                onChange={(e) => onFieldChange(field.key, e.target.value)}
                className="border p-1 rounded w-full"
              />
            </div>
          ))}
        </div>

        {/* Components */}
        <h3 className="mt-5 mb-3">Components</h3>

        <div className="grid grid-cols-2 gap-4">
          {selectedEmployee.components?.map((comp, index) => (
            <div key={comp.component_id} className="border p-3 rounded">
              <div>Component Name : {comp.name}</div>
              <div>Component Type : {comp.component_type}</div>

              <div className="flex items-center gap-2 mt-2">
                <label className="w-28">Monthly</label>
                <input
                  type="number"
                  value={comp.monthly_amount}
                  onChange={(e) =>
                    onComponentChange(index, "monthly_amount", e.target.value)
                  }
                  className="border p-1 rounded w-full"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <label className="w-28">Annual</label>
                <input
                  type="number"
                  value={comp.annual_amount}
                  onChange={(e) =>
                    onComponentChange(index, "annual_amount", e.target.value)
                  }
                  className="border p-1 rounded w-full"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-1.5 border rounded">
            Cancel
          </button>

          <button
            onClick={onSave}
            className="px-4 py-1.5 bg-green-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
