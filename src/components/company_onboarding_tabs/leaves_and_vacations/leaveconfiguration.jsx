import React, { useEffect, useState } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import {
  fetchLeaveRequestConfigs,
  saveLeaveRequestConfig,
  removeLeaveRequestConfig,
  fetchEmploymentTypeLeaveConfigs,
  saveEmploymentTypeLeaveConfig,
  removeEmploymentTypeLeaveConfig,
  fetchLeavePolicies,
  fetchBranchOptions,
} from "../../../service/leaveService";
import { fetchEmployeeType } from "../../../service/employeeService";
import DeleteConfirmationModal from "../../../ui/deletemodal";
// ADJUST the path if you save apiToast.jsx somewhere else
import { showApiSuccess, showApiError } from "../../../utils/apiToast";

/* -------------------- CONSTANTS -------------------- */

/* Number fields of the leave request settings */
const REQUEST_NUMBER_FIELDS = [
  { key: "long_leave_advance_days", label: "Long Leave Advance Days" },
  { key: "short_leave_advance_days", label: "Short Leave Advance Days" },
  { key: "long_leave_max_days", label: "Long Leave Maximum Days" },
  { key: "short_leave_max_days", label: "Short Leave Maximum Days" },
  { key: "max_requests_per_period", label: "Maximum Requests Per Period" },
  { key: "min_service_value", label: "Minimum Service Required" },
];

/* value = what the backend expects (lowercase), label = what the user sees */
const REQUEST_LIMIT_PERIODS = [
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "service", label: "Service" },
];

/* value = what the backend expects (lowercase), label = what the user sees */
const MIN_SERVICE_UNITS = [
  { value: "days", label: "Days" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

const DEFAULT_REQUEST_CONFIG = {
  is_enabled: true,
  long_leave_advance_days: "",
  short_leave_advance_days: "",
  long_leave_max_days: "",
  short_leave_max_days: "",
  max_requests_per_period: "",
  request_limit_period: "month",
  allow_half_day: false,
  document_required: false,
  document_required_after_days: "",
  event_based: false,
  event_apply_window_days: "",
  min_service_value: "",
  min_service_unit: "months",
};

/* -------------------- REUSABLE STYLES -------------------- */

const cardClass = "rounded-xl border border-gray-200 bg-white p-5 shadow-sm";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

/* -------------------- HELPERS -------------------- */

const toArray = (response) => {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : [];
};

const getOptionLabel = (item) =>
  item?.name ??
  item?.policy_name ??
  item?.leave_policy_name ??
  item?.branch_name ??
  `#${item?.id}`;

/* "" (All) -> null, otherwise Number */
const toNullableId = (value) =>
  value === "" || value == null ? null : Number(value);

/* "" -> null, otherwise Number */
const toNumberOrNull = (value) =>
  value === "" || value == null ? null : Number(value);

/* API value -> input value */
const toInputValue = (value) => (value == null ? "" : String(value));

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

/* -------------------- TOGGLE ROW -------------------- */

const ToggleRow = ({ label, checked, onChange, disabled = false }) => (
  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
    <span className="text-xs font-medium text-gray-700">{label}</span>
    <Switch checked={checked} onChange={onChange} disabled={disabled} />
  </div>
);

/* -------------------- SELECT BOX (full width) -------------------- */

const ScopeSelect = ({ label, value, options, onChange, disabled = false }) => {
  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <span className="text-xs font-medium text-gray-600">{label}</span>
      )}

      <div className="relative w-full">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none border border-gray-300 bg-white px-3 py-2 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
          style={{ borderRadius: "6px" }}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={{
                borderBottom: "1px solid #e5e7eb",
                padding: "8px",
              }}
            >
              {opt.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <svg
            className="h-3 w-3 text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

/* -------------------- SCOPE SELECTORS (leave policy + branch) -------------------- */

const ScopeSelectors = ({
  leavePolicies,
  branches,
  leavePolicyId,
  branchId,
  onPolicyChange,
  onBranchChange,
  disabled = false,
}) => {
  const policyId = toNullableId(leavePolicyId);
  const selectedBranchId = toNullableId(branchId);

  const scopeText =
    policyId == null
      ? "Select a leave policy."
      : selectedBranchId == null
        ? "Applies to the selected leave policy across the company."
        : "Applies only to the selected leave policy in the selected branch.";

  return (
    <>
      <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ScopeSelect
          label="Leave Policy"
          value={leavePolicyId}
          onChange={onPolicyChange}
          disabled={disabled}
          options={
            leavePolicies.length === 0
              ? [{ value: "", label: "No leave policies available" }]
              : leavePolicies.map((policy) => ({
                  value: String(policy.id),
                  label: getOptionLabel(policy),
                }))
          }
        />

        <ScopeSelect
          label="Branch"
          value={branchId}
          onChange={onBranchChange}
          disabled={leavePolicyId === "" || disabled}
          options={[
            { value: "", label: "All branches" },
            ...branches.map((branch) => ({
              value: String(branch.id),
              label: getOptionLabel(branch),
            })),
          ]}
        />
      </div>

      <p className="mb-5 text-xs text-gray-500">{scopeText}</p>
    </>
  );
};

/* ============================================================
   LEAVE REQUEST CONFIGURATION
   GET    /leave-policy/company/request-config
   PUT    /leave-policy/company/request-config
   DELETE /leave-policy/company/request-config/{settings_id}

   Request body:
   {
     leave_policy_id, branch_id, is_enabled,
     long_leave_advance_days, short_leave_advance_days,
     long_leave_max_days, short_leave_max_days,
     max_requests_per_period, request_limit_period,
     allow_half_day, document_required, document_required_after_days,
     event_based, event_apply_window_days,
     min_service_value, min_service_unit
   }
============================================================ */

const LeaveRequestConfigCard = ({ leavePolicies, branches }) => {
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [config, setConfig] = useState(DEFAULT_REQUEST_CONFIG);

  /* Selected scope ("" = All) */
  const [leavePolicyId, setLeavePolicyId] = useState("");
  const [branchId, setBranchId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showDelete, setShowDelete] = useState(false);

  const selectedPolicyId = toNullableId(leavePolicyId);
  const selectedBranchId = toNullableId(branchId);

  /* Saved row for the selected scope */
  const savedConfig = savedConfigs.find(
    (item) =>
      (item.leave_policy_id ?? null) === selectedPolicyId &&
      (item.branch_id ?? null) === selectedBranchId,
  );

  /* GET REQUEST CONFIGS */

  const fetchConfig = async () => {
    try {
      setLoading(true);

      const response = await fetchLeaveRequestConfigs();

      setSavedConfigs(toArray(response));
    } catch (error) {
      console.error("Error fetching leave request config:", error);
      showApiError(error, "Failed to load leave request configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  /* FILL THE FORM WHEN THE SCOPE OR SAVED DATA CHANGES */

  useEffect(() => {
    if (!savedConfig) {
      setConfig(DEFAULT_REQUEST_CONFIG);
      return;
    }

    setConfig({
      is_enabled: savedConfig.is_enabled ?? true,
      long_leave_advance_days: toInputValue(
        savedConfig.long_leave_advance_days,
      ),
      short_leave_advance_days: toInputValue(
        savedConfig.short_leave_advance_days,
      ),
      long_leave_max_days: toInputValue(savedConfig.long_leave_max_days),
      short_leave_max_days: toInputValue(savedConfig.short_leave_max_days),
      max_requests_per_period: toInputValue(
        savedConfig.max_requests_per_period,
      ),
      request_limit_period: savedConfig.request_limit_period ?? "month",
      allow_half_day: Boolean(savedConfig.allow_half_day),
      document_required: Boolean(savedConfig.document_required),
      document_required_after_days: toInputValue(
        savedConfig.document_required_after_days,
      ),
      event_based: Boolean(savedConfig.event_based),
      event_apply_window_days: toInputValue(
        savedConfig.event_apply_window_days,
      ),
      min_service_value: toInputValue(savedConfig.min_service_value),
      min_service_unit: savedConfig.min_service_unit ?? "months",
    });
  }, [savedConfig, leavePolicyId, branchId]);

  /* SCOPE CHANGE */

  const handlePolicyChange = (value) => {
    setLeavePolicyId(value);
    setBranchId("");
  };

  /* Select the first leave policy once the list is loaded */
  useEffect(() => {
    if (leavePolicyId === "" && leavePolicies.length > 0) {
      setLeavePolicyId(String(leavePolicies[0].id));
    }
  }, [leavePolicies, leavePolicyId]);

  /* INPUT CHANGE */

  const handleChange = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* SAVE CONFIG */

  const handleSave = async () => {
    if (selectedPolicyId == null) {
      toast.error("Please select a leave policy");
      return;
    }

    try {
      setSaving(true);

      const minServiceValue = toNumberOrNull(config.min_service_value);

      const payload = {
        leave_policy_id: selectedPolicyId,
        branch_id: selectedBranchId,
        is_enabled: config.is_enabled,
        long_leave_advance_days: toNumberOrNull(config.long_leave_advance_days),
        short_leave_advance_days: toNumberOrNull(
          config.short_leave_advance_days,
        ),
        long_leave_max_days: toNumberOrNull(config.long_leave_max_days),
        short_leave_max_days: toNumberOrNull(config.short_leave_max_days),
        max_requests_per_period: toNumberOrNull(config.max_requests_per_period),
        request_limit_period: config.request_limit_period,
        allow_half_day: config.allow_half_day,
        document_required: config.document_required,
        document_required_after_days: config.document_required
          ? toNumberOrNull(config.document_required_after_days)
          : null,
        event_based: config.event_based,
        event_apply_window_days: config.event_based
          ? toNumberOrNull(config.event_apply_window_days)
          : null,
        min_service_value: minServiceValue,
        /* A unit without a value is meaningless, so send both or neither */
        min_service_unit:
          minServiceValue == null ? null : config.min_service_unit,
      };

      const response = await saveLeaveRequestConfig(payload);

      showApiSuccess(
        response,
        "Leave request configuration saved successfully",
      );

      await fetchConfig();
    } catch (error) {
      console.error("Error saving leave request config:", error);
      showApiError(error, "Failed to save leave request configuration");
    } finally {
      setSaving(false);
    }
  };

  /* DELETE CONFIG */

  const handleDelete = async () => {
    if (!savedConfig) return;

    try {
      setDeleting(true);

      const response = await removeLeaveRequestConfig(savedConfig.id);

      showApiSuccess(
        response,
        "Leave request configuration deleted successfully",
      );

      setShowDelete(false);

      await fetchConfig();
    } catch (error) {
      console.error("Error deleting leave request config:", error);
      showApiError(error, "Failed to delete leave request configuration");
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
              Configure advance application, maximum leave limits and request
              rules.
            </p>
          </div>

          {/* DELETE ICON (only when a saved row exists for this scope) */}

          {savedConfig && (
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              disabled={deleting || saving}
              title="Delete leave request configuration"
              aria-label="Delete leave request configuration"
              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {/* SCOPE */}

        <ScopeSelectors
          leavePolicies={leavePolicies}
          branches={branches}
          leavePolicyId={leavePolicyId}
          branchId={branchId}
          onPolicyChange={handlePolicyChange}
          onBranchChange={setBranchId}
          disabled={saving}
        />

        {/* ENABLED */}

        <div className="mb-4">
          <ToggleRow
            label="Enable leave request rules for this scope"
            checked={config.is_enabled}
            onChange={(checked) => handleChange("is_enabled", checked)}
            disabled={saving}
          />
        </div>

        {/* NUMBER FIELDS + PERIOD */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {REQUEST_NUMBER_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="mb-2 block text-xs font-medium text-gray-600">
                {field.label}
              </label>

              <input
                type="number"
                min="0"
                value={config[field.key] ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder="Enter a number"
                disabled={saving}
                className={inputClass}
              />
            </div>
          ))}

          <ScopeSelect
            label="Minimum Service Unit"
            value={config.min_service_unit}
            onChange={(value) => handleChange("min_service_unit", value)}
            disabled={saving}
            options={MIN_SERVICE_UNITS}
          />

          <ScopeSelect
            label="Request Limit Period"
            value={config.request_limit_period}
            onChange={(value) => handleChange("request_limit_period", value)}
            disabled={saving}
            options={REQUEST_LIMIT_PERIODS}
          />
        </div>

        {/* RULE TOGGLES */}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ToggleRow
            label="Allow half day"
            checked={config.allow_half_day}
            onChange={(checked) => handleChange("allow_half_day", checked)}
            disabled={saving}
          />

          <ToggleRow
            label="Document required"
            checked={config.document_required}
            onChange={(checked) => handleChange("document_required", checked)}
            disabled={saving}
          />

          <ToggleRow
            label="Event based leave"
            checked={config.event_based}
            onChange={(checked) => handleChange("event_based", checked)}
            disabled={saving}
          />
        </div>

        {/* CONDITIONAL FIELDS */}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600">
              Document Required After (Days)
            </label>

            <input
              type="number"
              min="0"
              value={config.document_required_after_days ?? ""}
              onChange={(e) =>
                handleChange("document_required_after_days", e.target.value)
              }
              placeholder="Enter number of days"
              disabled={saving || !config.document_required}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600">
              Event Apply Window (Days)
            </label>

            <input
              type="number"
              min="0"
              value={config.event_apply_window_days ?? ""}
              onChange={(e) =>
                handleChange("event_apply_window_days", e.target.value)
              }
              placeholder="Enter number of days"
              disabled={saving || !config.event_based}
              className={inputClass}
            />
          </div>
        </div>

        {/* SAVE BUTTON */}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selectedPolicyId == null}
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
        onClose={() => !deleting && setShowDelete(false)}
        onConfirm={handleDelete}
        itemName="Leave Request Configuration"
      />
    </>
  );
};

/* ============================================================
   EMPLOYMENT TYPE CONFIGURATION
   GET    /leave-policy/company/employement-type-config
   PUT    /leave-policy/company/employement-type-config
   DELETE /leave-policy/company/employement-type-config/{settings_id}

   Request body scopes:
   1. Whole company:           leave_policy_id = null, branch_id = null
   2. One leave policy:        leave_policy_id = 12,   branch_id = null
   3. Policy in one branch:    leave_policy_id = 12,   branch_id = 5
============================================================ */

const EmploymentTypeConfigCard = ({ leavePolicies, branches }) => {
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [savedConfigs, setSavedConfigs] = useState([]);

  /* Selected scope ("" = All) */
  const [leavePolicyId, setLeavePolicyId] = useState("");
  const [branchId, setBranchId] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const selectedPolicyId = toNullableId(leavePolicyId);
  const selectedBranchId = toNullableId(branchId);

  /* GET EMPLOYMENT TYPES AND SAVED CONFIGS */

  const fetchData = async () => {
    try {
      setLoading(true);

      const [typesResponse, configsResponse] = await Promise.all([
        fetchEmployeeType(),
        fetchEmploymentTypeLeaveConfigs(),
      ]);

      setEmploymentTypes(Array.isArray(typesResponse) ? typesResponse : []);
      setSavedConfigs(toArray(configsResponse));
    } catch (error) {
      console.error("Error fetching employment type configuration:", error);
      showApiError(error, "Failed to load employment type configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* SCOPE CHANGE */

  const handlePolicyChange = (value) => {
    setLeavePolicyId(value);
    setBranchId("");
  };

  /* Select the first leave policy once the list is loaded */
  useEffect(() => {
    if (leavePolicyId === "" && leavePolicies.length > 0) {
      setLeavePolicyId(String(leavePolicies[0].id));
    }
  }, [leavePolicies, leavePolicyId]);

  /* FIND SAVED CONFIG FOR THE SELECTED SCOPE */

  const getSavedConfig = (employmentType) => {
    return savedConfigs.find((item) => {
      const sameType =
        item.employment_type_id != null
          ? String(item.employment_type_id) === String(employmentType.id)
          : item.employment_type_name?.toLowerCase() ===
            employmentType.name?.toLowerCase();

      if (!sameType) return false;

      return (
        (item.leave_policy_id ?? null) === selectedPolicyId &&
        (item.branch_id ?? null) === selectedBranchId
      );
    });
  };

  /* TOGGLE CONFIGURATION */

  const handleToggle = async (employmentType, checked) => {
    if (selectedPolicyId == null) {
      toast.error("Please select a leave policy");
      return;
    }

    try {
      setSavingId(employmentType.id);

      const payload = {
        employment_type_id: Number(employmentType.id),
        leave_policy_id: selectedPolicyId,
        branch_id: selectedBranchId,
        can_apply_leave: checked,
      };

      const response = await saveEmploymentTypeLeaveConfig(payload);

      showApiSuccess(response, "Employment type configuration updated");

      await fetchData();
    } catch (error) {
      console.error("Error updating employment type config:", error);
      showApiError(error, "Failed to update employment type configuration");
    } finally {
      setSavingId(null);
    }
  };

  /* DELETE CONFIGURATION */

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      /* deleteTarget.id is the saved settings row id */
      const response = await removeEmploymentTypeLeaveConfig(deleteTarget.id);

      showApiSuccess(response, "Employment type configuration deleted");

      setDeleteTarget(null);

      await fetchData();
    } catch (error) {
      console.error("Error deleting employment type config:", error);
      showApiError(error, "Failed to delete employment type configuration");
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
            Control which employment types can apply for leave.
          </p>
        </div>

        {/* SCOPE */}

        <ScopeSelectors
          leavePolicies={leavePolicies}
          branches={branches}
          leavePolicyId={leavePolicyId}
          branchId={branchId}
          onPolicyChange={handlePolicyChange}
          onBranchChange={setBranchId}
          disabled={savingId !== null}
        />

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
                    Can apply leave
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {employmentTypes.map((type) => {
                  const savedConfig = getSavedConfig(type);

                  /* No saved row for this scope: leave is allowed by default */
                  const enabled = savedConfig?.can_apply_leave ?? true;

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
                              disabled={
                                savingId !== null || selectedPolicyId == null
                              }
                            />
                          )}
                        </div>
                      </td>

                      {/* DELETE ICON */}

                      <td className="px-4 py-4 text-center">
                        {savedConfig && (
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                id: savedConfig.id,
                                name: type.name,
                              })
                            }
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
   Loads leave policies and branches once and shares them with both cards.
============================================================ */

const LeaveConfiguration = () => {
  const [leavePolicies, setLeavePolicies] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchScopeOptions = async () => {
      try {
        const [policiesResponse, branchesResponse] = await Promise.all([
          fetchLeavePolicies(),
          fetchBranchOptions(),
        ]);

        setLeavePolicies(toArray(policiesResponse));
        setBranches(toArray(branchesResponse));
      } catch (error) {
        console.error("Error fetching leave policies / branches:", error);
        showApiError(error, "Failed to load leave policies or branches");
      }
    };

    fetchScopeOptions();
  }, []);

  return (
    <div className="w-full space-y-5 font-['Poppins']">
      <LeaveRequestConfigCard
        leavePolicies={leavePolicies}
        branches={branches}
      />
      <EmploymentTypeConfigCard
        leavePolicies={leavePolicies}
        branches={branches}
      />
    </div>
  );
};

export default LeaveConfiguration;
