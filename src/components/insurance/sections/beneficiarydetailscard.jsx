import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Plus,
  Edit2,
  Check,
  X,
  Trash2,
  Loader2,
} from "lucide-react";

export default function BeneficiaryDetailsCard({
  beneficiaries = [],
  setBeneficiaries,
  onSave,
  saving = false,
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [localBeneficiaries, setLocalBeneficiaries] = useState(beneficiaries);

  useEffect(() => {
    setLocalBeneficiaries(beneficiaries);
  }, [beneficiaries]);

  const handleEditClick = () => {
    setLocalBeneficiaries(beneficiaries);
    setIsEditMode(true);
  };

  const handleCancelAction = () => {
    setLocalBeneficiaries(beneficiaries);
    if (setBeneficiaries) setBeneficiaries(beneficiaries);
    setIsEditMode(false);
  };

  const handleSaveAction = async () => {
    if (setBeneficiaries) setBeneficiaries(localBeneficiaries);

    if (onSave) {
      const success = await onSave();
      if (success) setIsEditMode(false);
    } else {
      setIsEditMode(false);
    }
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...localBeneficiaries];

    if (field === "allocation_percentage") {
      const numericVal = value.replace(/[^0-9.]/g, "");
      updated[index][field] = numericVal ? Number(numericVal) : "";
    } else if (field === "is_primary") {
      updated.forEach((item, idx) => {
        item.is_primary = idx === index ? value : false;
      });
    } else {
      updated[index][field] = value;
    }

    setLocalBeneficiaries(updated);
    if (setBeneficiaries) setBeneficiaries(updated);
  };

  const handleAddRow = () => {
    const newBeneficiary = {
      id: 0,
      beneficiary_name: "",
      relationship: "",
      contact_number: "",
      email: "",
      allocation_percentage: 0,
      is_primary: localBeneficiaries.length === 0,
    };
    const updated = [...localBeneficiaries, newBeneficiary];
    setLocalBeneficiaries(updated);
    if (setBeneficiaries) setBeneficiaries(updated);
  };

  const handleRemoveRow = (index) => {
    const updated = localBeneficiaries.filter((_, idx) => idx !== index);
    setLocalBeneficiaries(updated);
    if (setBeneficiaries) setBeneficiaries(updated);
  };

  const listToRender = isEditMode ? localBeneficiaries : beneficiaries;

  return (
    <div
      className={`bg-white shadow-sm rounded-lg p-5 border border-gray-200 space-y-4 font-poppins transition-all duration-300 ${
        isEditMode
          ? "col-span-full w-full ring-2 ring-blue-500/20 shadow-md"
          : "w-full"
      }`}
    >
      {/* Header section with inline action buttons */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
          Beneficiary Details
        </h3>

        <div className="flex items-center gap-1.5">
          {isEditMode ? (
            <>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all font-medium mr-1 cursor-pointer"
              >
                <Plus size={13} className="stroke-[2.5]" />
                <span>Add Beneficiary</span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleCancelAction}
                className="p-1.5 rounded-full border bg-white text-gray-500 border-gray-200 hover:bg-gray-50 transition-all shadow-sm cursor-pointer focus:outline-none disabled:opacity-50"
                title="Cancel Changes"
              >
                <X size={15} className="stroke-[2.5]" />
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAction}
                className="p-1.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm cursor-pointer focus:outline-none disabled:opacity-50"
                title="Save Beneficiaries"
              >
                {saving ? (
                  <Loader2
                    size={15}
                    className="animate-spin text-emerald-600 stroke-[2.5]"
                  />
                ) : (
                  <Check size={15} className="stroke-[3]" />
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEditClick}
              className="p-1.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 transition-all shadow-sm cursor-pointer focus:outline-none"
              title="Edit Beneficiaries"
            >
              <Edit2 size={15} className="stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table
          className={`w-full text-left border-collapse text-xs ${
            isEditMode ? "min-w-[700px]" : "min-w-full"
          }`}
        >
          <thead>
            <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <th className="p-3 font-medium text-center w-12">Primary</th>
              <th
                className={`p-3 font-medium ${isEditMode ? "min-w-[160px]" : ""}`}
              >
                Name
              </th>
              <th
                className={`p-3 font-medium ${isEditMode ? "min-w-[130px]" : ""}`}
              >
                Relation
              </th>
              <th
                className={`p-3 font-medium ${isEditMode ? "min-w-[140px]" : ""}`}
              >
                Contact
              </th>
              <th
                className={`p-3 font-medium ${isEditMode ? "min-w-[180px]" : ""}`}
              >
                Email
              </th>
              <th className="p-3 font-medium text-center w-28">
                Allocation (%)
              </th>
              {isEditMode && (
                <th className="p-3 font-medium text-center w-16">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {listToRender.length > 0 ? (
              listToRender.map((b, index) => (
                <tr
                  key={b.id || index}
                  className="hover:bg-gray-50/50 transition"
                >
                  {/* Primary Toggle */}
                  <td className="p-3 text-center align-middle">
                    {isEditMode ? (
                      <input
                        type="checkbox"
                        checked={!!b.is_primary}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "is_primary",
                            e.target.checked,
                          )
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                      />
                    ) : b.is_primary ? (
                      <CheckCircle2
                        size={16}
                        className="text-green-500 inline"
                        title="Primary Beneficiary"
                      />
                    ) : (
                      <XCircle
                        size={16}
                        className="text-gray-300 inline"
                        title="Not Primary"
                      />
                    )}
                  </td>

                  {/* Name */}
                  <td className="p-2.5 align-middle">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={b.beneficiary_name}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "beneficiary_name",
                            e.target.value,
                          )
                        }
                        placeholder="Beneficiary Name"
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-xs"
                      />
                    ) : (
                      <span className="font-medium">{b.beneficiary_name}</span>
                    )}
                  </td>

                  {/* Relationship */}
                  <td className="p-2.5 align-middle">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={b.relationship}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "relationship",
                            e.target.value,
                          )
                        }
                        placeholder="Relationship"
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-xs"
                      />
                    ) : (
                      <span>{b.relationship}</span>
                    )}
                  </td>

                  {/* Contact Number */}
                  <td className="p-2.5 align-middle">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={b.contact_number}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "contact_number",
                            e.target.value,
                          )
                        }
                        placeholder="Contact Number"
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-xs"
                      />
                    ) : (
                      <span>{b.contact_number}</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="p-2.5 align-middle">
                    {isEditMode ? (
                      <input
                        type="email"
                        value={b.email}
                        onChange={(e) =>
                          handleFieldChange(index, "email", e.target.value)
                        }
                        placeholder="Email Address"
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-xs"
                      />
                    ) : (
                      <span>{b.email}</span>
                    )}
                  </td>

                  {/* Allocation Percentage */}
                  <td className="p-2.5 text-center align-middle">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={b.allocation_percentage}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "allocation_percentage",
                            e.target.value,
                          )
                        }
                        placeholder="0"
                        className="w-20 border border-gray-300 rounded px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-semibold text-xs mx-auto block"
                      />
                    ) : (
                      <span className="font-semibold">
                        {b.allocation_percentage}%
                      </span>
                    )}
                  </td>

                  {/* Delete Action */}
                  {isEditMode && (
                    <td className="p-2.5 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Remove Beneficiary"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={isEditMode ? 7 : 6}
                  className="p-4 text-center text-gray-400"
                >
                  No beneficiaries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
