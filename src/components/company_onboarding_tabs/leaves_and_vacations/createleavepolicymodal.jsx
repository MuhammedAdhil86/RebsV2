import React, { useCallback, useState } from "react";
import { ChevronDown, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import payrollService from "../../../service/payrollService";
// ADJUST these paths to match where the file lives
import ColorPicker from "../../../ui/colorpicker";
import { showApiSuccess, showApiError } from "../../../utils/apiToast";

/* ====================== OPTIONS ======================
   value  = lowercase, exactly what the backend expects
   label  = auto-generated, first letter capital only
======================================================== */

export const LEAVE_TYPES = ["Paid", "Unpaid"]; // backend expects these exact capitalised values
export const ELIGIBLE_GENDERS = ["male", "female"];
export const ACCRUAL_METHODS = ["monthly", "yearly", "event"];
export const RESET_PERIODS = ["yearly", "monthly"];
export const NEGATIVE_BALANCE_OPTIONS = [
  "no limit",
  "till year end",
  "unlimited and mark as lop",
];

const LABEL_OVERRIDES = { event: "Per event" };

const toLabel = (v) => {
  if (LABEL_OVERRIDES[v]) return LABEL_OVERRIDES[v];
  const s = String(v ?? "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const makeOptions = (values) =>
  values.map((v) => ({ value: v, label: toLabel(v) }));

const LEAVE_TYPE_OPTIONS = makeOptions(LEAVE_TYPES);
/* "Generic" = open to everyone. The backend expects an empty value for it. */
export const GENERIC_GENDER = "";
const GENDER_OPTIONS = [
  { value: GENERIC_GENDER, label: "Generic" },
  ...makeOptions(ELIGIBLE_GENDERS),
];
const ACCRUAL_OPTIONS = makeOptions(ACCRUAL_METHODS);
const RESET_OPTIONS = makeOptions(RESET_PERIODS);
const NEGATIVE_OPTIONS = makeOptions(NEGATIVE_BALANCE_OPTIONS);

/* ====================== STYLES ====================== */

/* One shared control height keeps inputs, selects, number fields and
   segmented controls perfectly aligned on every row. */
const CONTROL_HEIGHT = "h-9";

export const globalFont = "font-['Poppins'] font-normal text-[12px]";
export const labelClass = "mb-1.5 block text-[11px] font-medium text-gray-500";
export const cardClass = "rounded-2xl border border-gray-100 bg-white p-5";

const controlBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3 text-[12px] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-gray-400";

export const inputClass = `${controlBase} ${CONTROL_HEIGHT}`;
export const textareaClass = `${controlBase} min-h-[72px] resize-none py-2`;

/* Hides the native up/down spinners so number fields look like text fields */
const hideSpinners =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/* Inline colours: a global `button { background: ... }` rule cannot override these */
const COLORS = {
  switchOn: "#000000",
  switchOff: "#d1d5db", // gray-300
  trackBg: "#f3f4f6", // gray-100
  white: "#ffffff",
  textActive: "#111827", // gray-900
  textMuted: "#6b7280", // gray-500
  primary: "#111827", // gray-900
};

/* ====================== PAYLOAD BUILDER ====================== */

export const buildLeavePayload = (f) => {
  const name = f.name?.trim() ?? "";

  const payload = {
    name,
    code: f.code?.trim() ?? "",
    leave_type: f.leave_type,
    eligible_gender: f.eligible_gender || GENERIC_GENDER, // "" = Generic (use null here if the backend wants null)
    color: f.color,
    description: f.description?.trim() || `${name} policy`,
    accrual_method: f.accrual_method,
    employee_accrues: Number(f.employee_accrues || 0),
    prorate_for_new_joiners: Boolean(f.prorate_for_new_joiners),
    postpone_accrual: Boolean(f.postpone_accrual),
    reset_leave_balance: Boolean(f.reset_leave_balance),
    carry_forward: Boolean(f.carry_forward),
    encash_leave: Boolean(f.encash_leave),
    allow_negative_balance: Boolean(f.allow_negative_balance),
    allow_past_leave: Boolean(f.allow_past_leave),
    company_default: Boolean(f.company_default),
  };

  if (f.is_active !== undefined) payload.is_active = Boolean(f.is_active);

  if (f.postpone_accrual) {
    payload.postpone_accrual_value = Number(f.postpone_accrual_value);
    payload.postpone_accrual_period = f.postpone_accrual_period;
  }
  if (f.reset_leave_balance) payload.reset_leave_period = f.reset_leave_period;
  if (f.carry_forward)
    payload.carry_forward_limit = Number(f.carry_forward_limit);
  if (f.encash_leave) payload.encash_limit = Number(f.encash_limit);
  if (f.allow_negative_balance)
    payload.consider_negative_balance = f.consider_negative_balance;
  if (f.allow_past_leave) payload.past_leave_limit = Number(f.past_leave_limit);

  return payload;
};

/* ====================== FIELD CHANGE HANDLER ====================== */

const DEPENDENTS = {
  postpone_accrual: {
    field: "postpone_accrual_value",
    onEnable: (cur) => (Number(cur) > 0 ? cur : 1),
    onDisable: () => 0,
  },
  carry_forward: {
    field: "carry_forward_limit",
    onEnable: (cur) => cur ?? 0,
    onDisable: () => 0,
  },
  encash_leave: {
    field: "encash_limit",
    onEnable: (cur) => cur ?? 0,
    onDisable: () => 0,
  },
  allow_negative_balance: {
    field: "consider_negative_balance",
    onEnable: (cur) =>
      NEGATIVE_BALANCE_OPTIONS.includes(cur)
        ? cur
        : NEGATIVE_BALANCE_OPTIONS[0],
    onDisable: () => "",
  },
  allow_past_leave: {
    field: "past_leave_limit",
    onEnable: (cur) => (Number(cur) > 0 ? cur : 1),
    onDisable: () => 0,
  },
};

export const applyFieldChange = (prev, field, value) => {
  const next = { ...prev, [field]: value };
  const dep = DEPENDENTS[field];
  if (dep) {
    next[dep.field] = value ? dep.onEnable(prev[dep.field]) : dep.onDisable();
  }

  /* Carry forward and encashment only make sense while reset is on */
  if (field === "reset_leave_balance" && !value) {
    next.carry_forward = false;
    next.carry_forward_limit = 0;
    next.encash_leave = false;
    next.encash_limit = 0;
  }

  /* Event-based leave (e.g. maternity) has no recurring reset / pro-rating */
  if (field === "accrual_method" && value === "event") {
    next.prorate_for_new_joiners = false;
    next.reset_leave_balance = false;
    next.carry_forward = false;
    next.carry_forward_limit = 0;
    next.encash_leave = false;
    next.encash_limit = 0;
  }
  return next;
};

/* ====================== BACKEND ERROR HELPERS ====================== */

export const getErrorBody = (error) => {
  if (error?.response?.data) return error.response.data;
  if (error && typeof error === "object" && error.data !== undefined) {
    return error;
  }
  return null;
};

export const showBackendError = (body, fallback) => {
  const message = body?.message || body?.error || fallback;
  const data = body?.data;

  toast.error(
    <div>
      <div style={{ fontWeight: 600 }}>{message}</div>
      {data && (
        <div style={{ marginTop: 4, opacity: 0.8 }}>
          {typeof data === "string" ? data : JSON.stringify(data)}
        </div>
      )}
    </div>,
  );
};

/* ====================== SMALL UI PIECES ====================== */

/* Toggle switch. Colours, size and the knob are inline so no global
   button styling can override them. */
export const Switch = ({ value, onChange, label, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={value}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!value)}
    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1"
    style={{
      backgroundColor: value ? COLORS.switchOn : COLORS.switchOff,
      border: "none",
      padding: 0,
      margin: 0,
      appearance: "none",
      WebkitAppearance: "none",
      width: 40,
      height: 22,
      borderRadius: 9999,
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      flexShrink: 0,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "background-color 200ms ease",
    }}
  >
    <span
      style={{
        position: "absolute",
        top: 2,
        left: 2,
        width: 18,
        height: 18,
        borderRadius: 9999,
        backgroundColor: COLORS.white,
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        transform: value ? "translateX(18px)" : "translateX(0)",
        transition: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    />
  </button>
);

/* Light pill control for choosing one value */
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

/* Native select with a custom, vertically centred chevron.
   The browser arrow is removed so every select looks identical. */
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

/* Flat row: title + hint on the left, switch on the right.
   Extra fields appear underneath only when switched on. */
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

/* ====================== INITIAL STATE ====================== */

const INITIAL_FORM = {
  name: "",
  code: "",
  leave_type: "Paid",
  eligible_gender: GENERIC_GENDER, // default Generic; user can pick Male or Female
  color: "#00AEEF",
  description: "",
  company_default: false,
  accrual_method: "monthly",
  employee_accrues: 0,
  prorate_for_new_joiners: true,
  postpone_accrual: false,
  postpone_accrual_value: 0,
  postpone_accrual_period: "days",
  reset_leave_balance: true,
  reset_leave_period: "yearly",
  carry_forward: false,
  carry_forward_limit: 0,
  encash_leave: false,
  encash_limit: 0,
  allow_negative_balance: false,
  consider_negative_balance: "no limit",
  allow_past_leave: false,
  past_leave_limit: 0,
};

/* ====================== MAIN PAGE ====================== */

const CreateLeavePolicyTab = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => applyFieldChange(prev, field, value));
  }, []);

  const isEvent = formData.accrual_method === "event";

  const handleSubmit = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const requestBody = buildLeavePayload(formData);
      const response = await payrollService.addLeavePolicy(requestBody);

      const failedBody = [response, response?.data].find(
        (b) => b && (b.status_code >= 400 || b.success === false),
      );
      if (failedBody) {
        showApiError(
          { response: { data: failedBody } },
          "Failed to create leave policy",
        );
        return;
      }

      showApiSuccess(response, "Leave policy created successfully");
      onClose();
    } catch (error) {
      console.error("Error creating leave policy:", error);
      showApiError(error, "Failed to create leave policy");
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
            Create leave policy
          </h2>
          <p className="text-[11px] text-gray-400">
            Set how this leave is earned, used and carried over.
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
      </div>

      {/* ---------- Body ---------- */}
      <div className="custom-scrollbar grid grid-cols-1 items-start gap-4 p-4 lg:grid-cols-2">
        {/* Basic info */}
        <Section
          title="Basic information"
          subtitle="Name, type and who it is for"
        >
          <div className="space-y-4">
            <Field label="Leave name" htmlFor="leave-name">
              <input
                id="leave-name"
                type="text"
                placeholder="eg: leave Name"
                className={inputClass}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Policy code" htmlFor="leave-code">
                <input
                  id="leave-code"
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
              <Field label="Eligible gender" htmlFor="eligible-gender">
                <Select
                  id="eligible-gender"
                  options={GENDER_OPTIONS}
                  value={formData.eligible_gender}
                  onChange={(v) => handleChange("eligible_gender", v)}
                />
              </Field>
            </div>

            <Field label="Description" htmlFor="leave-description">
              <textarea
                id="leave-description"
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

            <Field label="Employee accrues" htmlFor="employee-accrues">
              <NumberWithUnit
                id="employee-accrues"
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
                <Field label="Consider as" htmlFor="negative-balance">
                  <Select
                    id="negative-balance"
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
          onClick={handleSubmit}
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
          {loading ? "Creating..." : "Create policy"}
        </button>
      </div>
    </div>
  );
};

export default CreateLeavePolicyTab;
