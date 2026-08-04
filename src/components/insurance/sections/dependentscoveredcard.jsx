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

export default function DependentsCoveredCard({
  dependents = [],
  setDependents,
  onSave,
  saving = false,
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [localDependents, setLocalDependents] = useState(dependents);

  useEffect(() => {
    setLocalDependents(dependents);
  }, [dependents]);

  const handleEditClick = () => {
    setLocalDependents(dependents);
    setIsEditMode(true);
  };

  const handleCancelAction = () => {
    setLocalDependents(dependents);
    if (setDependents) setDependents(dependents);
    setIsEditMode(false);
  };

  const handleSaveAction = async () => {
    if (setDependents) setDependents(localDependents);

    if (onSave) {
      const success = await onSave();
      if (success) setIsEditMode(false);
    } else {
      setIsEditMode(false);
    }
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...localDependents];
    updated[index][field] = value;
    setLocalDependents(updated);
    if (setDependents) setDependents(updated);
  };

  const handleAddRow = () => {
    const newDependent = {
      id: 0,
      dependent_name: "",
      relationship: "",
      date_of_birth: "",
      is_covered: true,
    };
    const updated = [...localDependents, newDependent];
    setLocalDependents(updated);
    if (setDependents) setDependents(updated);
  };

  const handleRemoveRow = (index) => {
    const updated = localDependents.filter((_, idx) => idx !== index);
    setLocalDependents(updated);
    if (setDependents) setDependents(updated);
  };

  const formatDateForInput = (rawDate) => {
    if (!rawDate || rawDate.startsWith("0001")) return "";
    return rawDate.split("T")[0];
  };

  const listToRender = isEditMode ? localDependents : dependents;

  return (
    <div
      className={`bg-white shadow-sm rounded-lg p-5 border border-gray-200 space-y-4 font-poppins transition-all duration-300 ${
        isEditMode
          ? "col-span-full w-full ring-2 ring-blue-500/20 shadow-md"
          : "w-full"
      }`}
    >
      {/* Header section with inline actions */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
          Dependents Covered
        </h3>

        <div className="flex items-center gap-1.5">
          {isEditMode ? (
            <>
              {/* Add Dependent Row */}
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all font-medium mr-1 cursor-pointer"
              >
                <Plus size={13} className="stroke-[2.5]" />
                <span>Add Dependent</span>
              </button>

              {/* Cancel Changes */}
              <button
                type="button"
                disabled={saving}
                onClick={handleCancelAction}
                className="p-1.5 rounded-full border bg-white text-gray-500 border-gray-200 hover:bg-gray-50 transition-all shadow-sm cursor-pointer focus:outline-none disabled:opacity-50"
                title="Cancel Changes"
              >
                <X size={15} className="stroke-[2.5]" />
              </button>

              {/* Save Changes */}
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAction}
                className="p-1.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm cursor-pointer focus:outline-none disabled:opacity-50"
                title="Save Dependents"
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
              title="Edit Dependents"
            >
              <Edit2 size={15} className="stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table
          className={`w-full text-left border-collapse text-xs ${
            isEditMode ? "min-w-[600px]" : "min-w-full"
          }`}
        >
          <thead>
            <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <th className="p-3 font-medium text-center w-12">Covered</th>
              <th
                className={`p-3 font-medium ${isEditMode ? "min-w-[160px]" : ""}`}
              >
                Name
              </th>
              <th
                className={`p-3 font-medium ${isEditMode ? "min-w-[130px]" : ""}`}
              >
                Relationship
              </th>
              <th
                className={`p-3 font-medium ${isEditMode ? "min-w-[150px]" : ""}`}
              >
                Date of Birth
              </th>
              {isEditMode && (
                <th className="p-3 font-medium text-center w-16">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {listToRender.length > 0 ? (
              listToRender.map((dep, index) => (
                <tr
                  key={dep.id || index}
                  className="hover:bg-gray-50/50 transition"
                >
                  {/* Is Covered Toggle */}
                  <td className="p-3 text-center align-middle">
                    {isEditMode ? (
                      <input
                        type="checkbox"
                        checked={!!dep.is_covered}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "is_covered",
                            e.target.checked,
                          )
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                      />
                    ) : dep.is_covered ? (
                      <CheckCircle2
                        size={16}
                        className="text-green-500 inline"
                        title="Covered"
                      />
                    ) : (
                      <XCircle
                        size={16}
                        className="text-gray-300 inline"
                        title="Not Covered"
                      />
                    )}
                  </td>

                  {/* Dependent Name */}
                  <td className="p-2.5 align-middle">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={dep.dependent_name}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "dependent_name",
                            e.target.value,
                          )
                        }
                        placeholder="Dependent Name"
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-xs"
                      />
                    ) : (
                      <span className="font-medium">{dep.dependent_name}</span>
                    )}
                  </td>

                  {/* Relationship */}
                  <td className="p-2.5 align-middle">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={dep.relationship}
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
                      <span>{dep.relationship}</span>
                    )}
                  </td>

                  {/* Date of Birth Input */}
                  <td className="p-2.5 align-middle">
                    {isEditMode ? (
                      <input
                        type="date"
                        value={formatDateForInput(dep.date_of_birth)}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "date_of_birth",
                            e.target.value,
                          )
                        }
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-xs"
                      />
                    ) : (
                      <span>
                        {dep.date_of_birth &&
                        !dep.date_of_birth.startsWith("0001")
                          ? new Date(dep.date_of_birth).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "N/A"}
                      </span>
                    )}
                  </td>

                  {/* Remove Row Action */}
                  {isEditMode && (
                    <td className="p-2.5 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Remove Dependent"
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
                  colSpan={isEditMode ? 5 : 4}
                  className="p-4 text-center text-gray-400"
                >
                  No dependents recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
