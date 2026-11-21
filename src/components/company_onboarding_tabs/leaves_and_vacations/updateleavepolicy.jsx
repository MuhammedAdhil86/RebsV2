import React, { useCallback, useState } from "react";
import { ChevronDown, ChevronLeft, Loader2 } from "lucide-react";
import attendancePolicyService from "../../../service/attendancepolicyService";
import ColorPicker from "../../../ui/colorpicker";
import { showApiSuccess, showApiError } from "../../../utils/apiToast";
import {
  LEAVE_TYPES,
  ELIGIBLE_GENDERS,
  ACCRUAL_METHODS,
  RESET_PERIODS,
  NEGATIVE_BALANCE_OPTIONS,
  GENERIC_GENDER,
  globalFont,
  labelClass,
  cardClass,
  inputClass,
  textareaClass,
  buildLeavePayload,
  applyFieldChange,
  Switch,
} from "./createleavepolicymodal";

const CONTROL_HEIGHT = "h-9";

const LABEL_OVERRIDES = { event: "Per event" };

const toLabel = (v) => {
  if (LABEL_OVERRIDES[v]) return LABEL_OVERRIDES[v];
  const s = String(v ?? "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const makeOptions = (values) =>
  values.map((v) => ({ value: v, label: toLabel(v) }));

const LEAVE_TYPE_OPTIONS = makeOptions(LEAVE_TYPES);
const GENDER_OPTIONS = [
  { value: GENERIC_GENDER, label: "Generic" },
  ...makeOptions(ELIGIBLE_GENDERS),
];
const ACCRUAL_OPTIONS = makeOptions(ACCRUAL_METHODS);
const RESET_OPTIONS = makeOptions(RESET_PERIODS);
const NEGATIVE_OPTIONS = makeOptions(NEGATIVE_BALANCE_OPTIONS);

const hideSpinners =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const COLORS = {
  trackBg: "#f3f4f6",
  white: "#ffffff",
  textActive: "#111827",
  textMuted: "#6b7280",
  primary: "#111827",
};

const Segmented = ({ options, value, onChange, label }) => (
  <div
    role="radiogroup"
    aria-label={label}
    className={`flex w-full items-stretch rounded-lg p-0.5 ${CONTROL_HEIGHT}`}
    style={{ backgroundColor: COLORS.trackBg }}
  >
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(opt.value)}
          className="flex flex-1 items-center justify-center rounded-md px-3 text-[12px] transition-all"
          style={{
            backgroundColor: active ? COLORS.white : "transparent",
            color: active ? COLORS.textActive : COLORS.textMuted,
            fontWeight: active ? 500 : 400,
            border: "none",
            boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

const Select = ({ id, value, onChange, options }) => (
  <div className="relative">
    <select
      id={id}
      className={`${inputClass} cursor-pointer pr-9`}
      style={{
        appearance: "none",
        WebkitAppearance: "none",
        backgroundImage: "none",
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <ChevronDown
      size={14}
      aria-hidden="true"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
    />
  </div>
);

const Field = ({ label, htmlFor, children }) => (
  <div className="min-w-0">
    <label htmlFor={htmlFor} className={labelClass}>
      {label}
    </label>
    {children}
  </div>
);

const Section = ({ title, subtitle, children }) => (
  <section className={cardClass}>
    <header className="mb-4">
      <h3 className="font-['Poppins'] text-[13px] font-semibold text-gray-900">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-0.5 text-[11px] text-gray-400">{subtitle}</p>
      )}
    </header>
    {children}
  </section>
);

const Row = ({ title, desc, checked, onChange, children }) => (
  <div className="py-3.5">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] leading-snug text-gray-900">{title}</p>
        {desc && (
          <p className="mt-0.5 text-[11px] leading-snug text-gray-400">
            {desc}
          </p>
        )}
      </div>
      <Switch label={title} value={checked} onChange={onChange} />
    </div>
    {checked && children && <div className="mt-3">{children}</div>}
  </div>
);

const NumberWithUnit = ({ id, value, onChange, unit, placeholder = "0" }) => (
  <div
    className={`flex items-center rounded-lg border border-gray-200 bg-white transition focus-within:border-gray-400 ${CONTROL_HEIGHT}`}
  >
    <input
      id={id}
      type="number"
      min="0"
      placeholder={placeholder}
      className={`h-full min-w-0 flex-1 bg-transparent px-3 text-[12px] text-gray-900 outline-none placeholder:text-gray-400 ${hideSpinners}`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
    <span className="shrink-0 whitespace-nowrap pr-3 text-[11px] text-gray-400">
      {unit}
    </span>
  </div>
);

const toPositiveInt = (raw) =>
  String(raw ?? "")
    .replace(/\D/g, "")
    .replace(/^0+/, "");

const UpdateLeavePolicyTab = ({ onClose, policyData, refreshData }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: policyData?.id || null,
    name: policyData?.name || "",
    code: policyData?.code || "",
    leave_type: policyData?.leave_type || "Paid",
    eligible_gender: policyData?.eligible_gender || GENERIC_GENDER,
    color: policyData?.color || "#00AEEF",
    description: policyData?.description || "",
    company_default: policyData?.company_default ?? false,
    accrual_method: policyData?.accrual_method || "monthly",
    employee_accrues: policyData?.employee_accrues || 0,
    prorate_for_new_joiners: policyData?.prorate_for_new_joiners ?? true,
    postpone_accrual: policyData?.postpone_accrual ?? false,
    postpone_accrual_value: policyData?.postpone_accrual_value || 0,
    postpone_accrual_period: policyData?.postpone_accrual_period || "days",
    reset_leave_balance: policyData?.reset_leave_balance ?? true,
    reset_leave_period: policyData?.reset_leave_period || "yearly",
    carry_forward: policyData?.carry_forward ?? false,
    carry_forward_limit: policyData?.carry_forward_limit || 0,
    encash_leave: policyData?.encash_leave ?? false,
    encash_limit: policyData?.encash_limit || 0,
    allow_negative_balance: policyData?.allow_negative_balance ?? false,
    consider_negative_balance:
      policyData?.consider_negative_balance || "no limit",
    allow_past_leave: policyData?.allow_past_leave ?? false,
    past_leave_limit: policyData?.past_leave_limit || 0,
    is_active: policyData?.is_active ?? policyData?.status === "active",
  });

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => applyFieldChange(prev, field, value));
  }, []);

  const isEvent = formData.accrual_method === "event";

  const handleUpdate = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const { id, ...rest } = formData;
      const requestBody = buildLeavePayload(rest);

      const response = await attendancePolicyService.updateLeavePolicy(
        id,
        requestBody,
      );

      const failedBody = [response, response?.data].find(
        (b) => b && (b.status_code >= 400 || b.success === false),
      );
      if (failedBody) {
        showApiError(
          { response: { data: failedBody } },
          "Failed to update leave policy",
        );
        return;
      }

      showApiSuccess(response, "Leave policy updated successfully");
      if (refreshData) refreshData();
      onClose();
    } catch (error) {
      console.error("Error updating leave policy:", error);
      showApiError(error, "Failed to update leave policy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full rounded-2xl bg-[#F7F8FA] ${globalFont}`}>
      {/* ---------- Header ---------- */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-5 py-4">
        <button
          type="button"
          aria-label="Back"
          onClick={onClose}
          className="transition-colors hover:text-gray-700"
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            color: "#9ca3af",
            cursor: "pointer",
            display: "inline-flex",
          }}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="font-['Poppins'] text-[15px] font-semibold leading-tight text-gray-900">
            Update leave policy
          </h2>
          <p className="text-[11px] text-gray-400">
            Change how this leave is earned, used and carried over.
          </p>
        </div>

        <div className="hidden max-w-[220px] items-center gap-2 sm:flex">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: formData.color }}
          />
          <span className="truncate text-[11px] text-gray-600">
            {formData.name || "Leave name"}
            {formData.code ? ` · ${formData.code}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2.5 border-l border-gray-100 pl-3">
          <span className="text-[11px] text-gray-600">
            {formData.is_active ? "Active" : "Inactive"}
          </span>
          <Switch
            label="Active"
            value={formData.is_active}
            onChange={(v) => handleChange("is_active", v)}
          />
        </div>
      </div>

      {/* ---------- Body ---------- */}
      <div className="custom-scrollbar grid grid-cols-1 items-start gap-4 p-4 lg:grid-cols-2">
        {/* Basic info */}
        <Section
          title="Basic information"
          subtitle="Name, type and who it is for"
        >
          <div className="space-y-4">
            <Field label="Leave name" htmlFor="update-leave-name">
              <input
                id="update-leave-name"
                type="text"
                placeholder="eg: leave Name"
                className={inputClass}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Policy code" htmlFor="update-leave-code">
                <input
                  id="update-leave-code"
                  type="text"
                  placeholder="eg: Code"
                  className={inputClass}
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                />
              </Field>
              <Field label="Policy color">
                <ColorPicker
                  value={formData.color}
                  onChange={(color) => handleChange("color", color)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Leave type">
                <Segmented
                  label="Leave type"
                  options={LEAVE_TYPE_OPTIONS}
                  value={formData.leave_type}
                  onChange={(v) => handleChange("leave_type", v)}
                />
              </Field>
              <Field label="Eligible gender" htmlFor="update-eligible-gender">
                <Select
                  id="update-eligible-gender"
                  options={GENDER_OPTIONS}
                  value={formData.eligible_gender}
                  onChange={(v) => handleChange("eligible_gender", v)}
                />
              </Field>
            </div>

            <Field label="Description" htmlFor="update-leave-description">
              <textarea
                id="update-leave-description"
                placeholder="Short description"
                className={textareaClass}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </Field>

            <div className="border-t border-gray-100">
              <Row
                title="Company default"
                desc="Use as the default leave policy"
                checked={formData.company_default}
                onChange={(v) => handleChange("company_default", v)}
              />
            </div>
          </div>
        </Section>

        {/* Accrual */}
        <Section title="Accrual" subtitle="How many days are earned and when">
          <div className="space-y-4">
            <Field label="Accrual method">
              <Segmented
                label="Accrual method"
                options={ACCRUAL_OPTIONS}
                value={formData.accrual_method}
                onChange={(v) => handleChange("accrual_method", v)}
              />
            </Field>

            <Field label="Employee accrues" htmlFor="update-employee-accrues">
              <NumberWithUnit
                id="update-employee-accrues"
                value={formData.employee_accrues || ""}
                onChange={(v) => handleChange("employee_accrues", v)}
                unit={isEvent ? "days / event" : "days"}
              />
            </Field>

            <div className="divide-y divide-gray-100 border-t border-gray-100">
              <Row
                title="Pro-rate for new joiners"
                desc="Balance counted from the date of joining"
                checked={formData.prorate_for_new_joiners}
                onChange={(v) => handleChange("prorate_for_new_joiners", v)}
              />

              <Row
                title="Postpone accrual"
                desc="Start accruing after a waiting period"
                checked={formData.postpone_accrual}
                onChange={(v) => handleChange("postpone_accrual", v)}
              >
                <NumberWithUnit
                  value={formData.postpone_accrual_value || ""}
                  onChange={(v) => handleChange("postpone_accrual_value", v)}
                  unit="days after joining"
                />
              </Row>

              <Row
                title="Reset leave balance"
                desc="Balances reset on a fixed cycle"
                checked={formData.reset_leave_balance}
                onChange={(v) => handleChange("reset_leave_balance", v)}
              >
                <div className="space-y-3 border-l-2 border-gray-100 pl-4">
                  <Field label="Reset every">
                    <Segmented
                      label="Reset every"
                      options={RESET_OPTIONS}
                      value={formData.reset_leave_period}
                      onChange={(v) => handleChange("reset_leave_period", v)}
                    />
                  </Field>

                  <div className="divide-y divide-gray-100">
                    <Row
                      title="Carry forward unused balance"
                      checked={formData.carry_forward}
                      onChange={(v) => handleChange("carry_forward", v)}
                    >
                      <NumberWithUnit
                        value={formData.carry_forward_limit || ""}
                        onChange={(v) => handleChange("carry_forward_limit", v)}
                        unit="max days"
                      />
                    </Row>
                    <Row
                      title="Encash remaining days"
                      checked={formData.encash_leave}
                      onChange={(v) => handleChange("encash_leave", v)}
                    >
                      <NumberWithUnit
                        value={formData.encash_limit || ""}
                        onChange={(v) => handleChange("encash_limit", v)}
                        unit="max days"
                      />
                    </Row>
                  </div>
                </div>
              </Row>
            </div>
          </div>
        </Section>

        {/* Request preferences */}
        <div className="lg:col-span-2">
          <Section
            title="Leave request preferences"
            subtitle="Negative balance and past-dated requests"
          >
            <div className="grid grid-cols-1 items-start gap-x-8 divide-y divide-gray-100 md:grid-cols-2 md:divide-y-0">
              <Row
                title="Allow negative leave balance"
                desc="Employees can apply beyond their balance"
                checked={formData.allow_negative_balance}
                onChange={(v) => handleChange("allow_negative_balance", v)}
              >
                <Field label="Consider as" htmlFor="update-negative-balance">
                  <Select
                    id="update-negative-balance"
                    value={formData.consider_negative_balance || ""}
                    onChange={(v) =>
                      handleChange("consider_negative_balance", v)
                    }
                    options={NEGATIVE_OPTIONS}
                  />
                </Field>
              </Row>

              <Row
                title="Allow leave on past dates"
                desc="Employees can apply for dates already passed"
                checked={formData.allow_past_leave}
                onChange={(v) => handleChange("allow_past_leave", v)}
              >
                <NumberWithUnit
                  value={formData.past_leave_limit ?? ""}
                  onChange={(v) =>
                    handleChange("past_leave_limit", toPositiveInt(v))
                  }
                  unit="days before today"
                />
              </Row>
            </div>
          </Section>
        </div>
      </div>

      {/* ---------- Footer ---------- */}
      <div className="flex justify-end gap-2 border-t border-gray-100 bg-white px-5 py-3.5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-lg px-5 py-2 text-[12px] font-medium transition-colors hover:bg-gray-100 disabled:opacity-50"
          style={{
            background: "transparent",
            border: "none",
            color: "#4b5563",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleUpdate}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg px-6 py-2 text-[12px] font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            backgroundColor: COLORS.primary,
            color: COLORS.white,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? "Updating..." : "Update policy"}
        </button>
      </div>
    </div>
  );
};

export default UpdateLeavePolicyTab;
