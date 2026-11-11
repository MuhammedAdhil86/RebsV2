import React, { useEffect, useState } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import payrollService from "../../../service/payrollService";
import { fetchEmployeeType } from "../../../service/employeeService";
import DeleteConfirmationModal from "../../../ui/deletemodal";

/* -------------------- CONSTANTS -------------------- */

const REQUEST_CONFIG_FIELDS = [
  {
    key: "long_leave_advance_days",
    label: "Long Leave Advance Days",
  },
  {
    key: "short_leave_advance_days",
    label: "Short Leave Advance Days",
  },
  {
    key: "long_leave_max_days",
    label: "Long Leave Maximum Days",
  },
  {
    key: "short_leave_max_days",
    label: "Short Leave Maximum Days",
  },
];

const DEFAULT_REQUEST_CONFIG = {
  long_leave_advance_days: "",
  short_leave_advance_days: "",
  long_leave_max_days: "",
  short_leave_max_days: "",
};

/* -------------------- REUSABLE STYLES -------------------- */

const cardClass = "rounded-xl border border-gray-200 bg-white p-5 shadow-sm";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200";

/* -------------------- TOGGLE COMPONENT -------------------- */

const Switch = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-black" : "bg-gray-300"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-1"
        }`}
      />
    </button>
  );
};

/* ============================================================
   LEAVE REQUEST CONFIGURATION
============================================================ */

const LeaveRequestConfigCard = () => {
  const [config, setConfig] = useState(DEFAULT_REQUEST_CONFIG);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showDelete, setShowDelete] = useState(false);

  /* GET REQUEST CONFIG */

  const fetchConfig = async () => {
    try {
      setLoading(true);

      const response = await payrollService.getLeaveRequestConfig();

      const data = response?.data ?? response;

      setConfig({
        ...DEFAULT_REQUEST_CONFIG,
        ...(data || {}),
      });
    } catch (error) {
      console.error("Error fetching leave request config:", error);
      toast.error("Failed to load leave request configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  /* INPUT CHANGE */

  const handleChange = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* SAVE CONFIG */

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        long_leave_advance_days: Number(config.long_leave_advance_days),
        short_leave_advance_days: Number(config.short_leave_advance_days),
        long_leave_max_days: Number(config.long_leave_max_days),
        short_leave_max_days: Number(config.short_leave_max_days),
      };

      await payrollService.saveLeaveRequestConfig(payload);

      toast.success("Leave request configuration saved successfully");

      await fetchConfig();
    } catch (error) {
      console.error("Error saving leave request config:", error);
      toast.error("Failed to save leave request configuration");
    } finally {
      setSaving(false);
    }
  };

  /* DELETE CONFIG */

  const handleDelete = async () => {
    try {
      setDeleting(true);

      await payrollService.deleteLeaveRequestConfig();

      toast.success("Leave request configuration deleted successfully");

      setConfig(DEFAULT_REQUEST_CONFIG);
      setShowDelete(false);
    } catch (error) {
      console.error("Error deleting leave request config:", error);
      toast.error("Failed to delete leave request configuration");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={`${cardClass} flex items-center justify-center py-10`}>
        <Loader2 className="animate-spin text-black" size={24} />
      </div>
    );
  }

  return (
    <>
      <div className={cardClass}>
        {/* HEADER */}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Leave Configuration
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Configure advance application and maximum leave limits.
            </p>
          </div>

          {/* DELETE ICON */}

          <button
            type="button"
            onClick={() => setShowDelete(true)}
            disabled={deleting}
            title="Delete leave request configuration"
            aria-label="Delete leave request configuration"
            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* CONFIGURATION FIELDS */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {REQUEST_CONFIG_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="mb-2 block text-xs font-medium text-gray-600">
                {field.label}
              </label>

              <input
                type="number"
                min="0"
                value={config[field.key] ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder="Enter number of days"
                className={inputClass}
              />
            </div>
          ))}
        </div>

        {/* SAVE BUTTON */}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-[12px] font-medium active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save Configuration
          </button>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}

      <DeleteConfirmationModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        itemName="Leave Request Configuration"
      />
    </>
  );
};

/* ============================================================
   EMPLOYMENT TYPE CONFIGURATION
============================================================ */

const EmploymentTypeConfigCard = () => {
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [savedConfigs, setSavedConfigs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  /* GET EMPLOYMENT TYPES AND SAVED CONFIGS */

  const fetchData = async () => {
    try {
      setLoading(true);

      const [typesResponse, configsResponse] = await Promise.all([
        fetchEmployeeType(),
        payrollService.getEmploymentTypeLeaveConfigs(),
      ]);

      const types = Array.isArray(typesResponse) ? typesResponse : [];

      const configsData = configsResponse?.data ?? configsResponse;

      const configs = Array.isArray(configsData) ? configsData : [];

      setEmploymentTypes(types);
      setSavedConfigs(configs);
    } catch (error) {
      console.error("Error fetching employment type configuration:", error);
      toast.error("Failed to load employment type configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* FIND SAVED CONFIG */

  const getSavedConfig = (employmentType) => {
    return savedConfigs.find((item) => {
      if (item.employment_type_id != null) {
        return String(item.employment_type_id) === String(employmentType.id);
      }

      return (
        item.employment_type_name?.toLowerCase() ===
        employmentType.name?.toLowerCase()
      );
    });
  };

  /* TOGGLE CONFIGURATION */

  const handleToggle = async (employmentType, checked) => {
    try {
      setSavingId(employmentType.id);

      const payload = {
        employment_type_id: Number(employmentType.id),
        can_apply_without_leave_allocation: checked,
      };

      await payrollService.saveEmploymentTypeLeaveConfig(payload);

      toast.success("Employment type configuration updated");

      await fetchData();
    } catch (error) {
      console.error("Error updating employment type config:", error);
      toast.error("Failed to update employment type configuration");
    } finally {
      setSavingId(null);
    }
  };

  /* DELETE CONFIGURATION */

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await payrollService.deleteEmploymentTypeLeaveConfig(deleteTarget.id);

      toast.success("Employment type configuration deleted");

      setDeleteTarget(null);

      await fetchData();
    } catch (error) {
      console.error("Error deleting employment type config:", error);
      toast.error("Failed to delete employment type configuration");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={`${cardClass} flex items-center justify-center py-10`}>
        <Loader2 className="animate-spin text-black" size={24} />
      </div>
    );
  }

  return (
    <>
      <div className={cardClass}>
        {/* HEADER */}

        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-800">
            Employment Type Configuration
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Control whether employees can apply for leave without leave
            allocation.
          </p>
        </div>

        {/* EMPLOYMENT TYPE TABLE */}

        {employmentTypes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
            <p className="text-sm text-gray-500">
              No employment types available.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                    Employment Type
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">
                    Apply Without Leave Allocation
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {employmentTypes.map((type) => {
                  const savedConfig = getSavedConfig(type);

                  const enabled =
                    savedConfig?.can_apply_without_leave_allocation ?? false;

                  const isSaving = savingId === type.id;

                  return (
                    <tr
                      key={type.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-gray-700">
                        {type.name}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          {isSaving ? (
                            <Loader2
                              size={18}
                              className="animate-spin text-black"
                            />
                          ) : (
                            <Switch
                              checked={Boolean(enabled)}
                              onChange={(checked) =>
                                handleToggle(type, checked)
                              }
                              disabled={savingId !== null}
                            />
                          )}
                        </div>
                      </td>

                      {/* DELETE ICON */}

                      <td className="px-4 py-4 text-center">
                        {savedConfig && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(type)}
                            disabled={savingId !== null || deleting}
                            title="Delete configuration"
                            aria-label={`Delete ${type.name} configuration`}
                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EMPLOYMENT TYPE DELETE CONFIRMATION MODAL */}

      <DeleteConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget ? `${deleteTarget.name} Configuration` : ""}
      />
    </>
  );
};

/* ============================================================
   MAIN COMPONENT
============================================================ */

const LeaveConfiguration = () => {
  return (
    <div className="w-full space-y-5 font-['Poppins']">
      <LeaveRequestConfigCard />
      <EmploymentTypeConfigCard />
    </div>
  );
};

export default LeaveConfiguration;
