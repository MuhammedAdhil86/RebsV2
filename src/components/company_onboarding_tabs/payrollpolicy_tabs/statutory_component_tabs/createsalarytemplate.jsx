import React, { useState, useEffect } from "react";
import axiosInstance from "../../../../service/axiosinstance";
import toast from "react-hot-toast";
import { ChevronLeft, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import InfoTooltip, { SALARY_TEMPLATE_INFO } from "../../../../ui/infotooltip"; // adjust path if you saved it elsewhere
import {
  getApiMessage,
  getApiError,
  isApiFailure,
} from "../../../helpers/apiMessage"; // adjust path to where apiMessage.js lives

// ---------------- TOGGLE SWITCH ----------------
function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
        checked ? "bg-black" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// Pass the logged-in company's id as a prop: <CreateSalaryTemplate companyId={...} />
// Falls back to 1 if it is not passed.
export default function CreateSalaryTemplate({ onCancel, companyId = 1 }) {
  // ---------------- STATE ----------------
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
  });

  const [components, setComponents] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [saving, setSaving] = useState(false);

  // ---------------- FETCH COMPONENTS ----------------
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const res = await axiosInstance.get(
          "api/payroll/components?limit=50&offset=0",
        );
        const items = res.data?.data?.items || [];
        // Ensure uniqueness by ID
        const unique = Array.from(
          new Map(items.map((item) => [item.id, item])).values(),
        );
        setComponents(unique);
      } catch (err) {
        toast.error(getApiError(err, "Failed to load components"));
      }
    };
    fetchComponents();
  }, []);

  // ---------------- SET DEFAULT MAPPINGS (Company ID 0) ----------------
  // Only pre-fills the rows. No amounts are calculated.
  useEffect(() => {
    if (!components.length) return;

    const systemDefaults = components
      .filter((c) => c.company_id === 0)
      .map((c) => ({
        id: uuidv4(),
        component_id: c.id,
        calculation_type: c.calculation_type,
        value: String(c.value ?? 0),
        is_balancing_component: false,
        isDefault: true, // Cannot be deleted
      }));

    setMappings(systemDefaults);
  }, [components]);

  // ---------------- HELPERS ----------------
  // Allows digits and one decimal point only, so "0" can always be edited
  const cleanNumber = (raw) => {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    return parts.length > 2
      ? `${parts[0]}.${parts.slice(1).join("")}`
      : cleaned;
  };

  // ---------------- HANDLERS ----------------
  const handleTemplateChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMappingChange = async (index, e) => {
    const { name, value } = e.target;

    // Picking a component pre-fills its calculation type and value
    if (name === "component_id") {
      try {
        const res = await axiosInstance.get(`api/payroll/components/${value}`);
        const data = res.data?.data;
        setMappings((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            component_id: data.id,
            calculation_type: data.calculation_type,
            value: String(data.value ?? 0),
          };
          return updated;
        });
      } catch (err) {
        toast.error(getApiError(err, "Failed to fetch component details"));
      }
      return;
    }

    setMappings((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [name]: name === "value" ? cleanNumber(value) : value,
      };
      return updated;
    });
  };

  // Only one row can be the balancing component at a time
  const handleBalancingToggle = (id) => {
    setMappings((prev) =>
      prev.map((m) => ({
        ...m,
        is_balancing_component: m.id === id ? !m.is_balancing_component : false,
      })),
    );
  };

  const addComponent = () => {
    setMappings((prev) => [
      ...prev,
      {
        id: uuidv4(),
        component_id: "",
        calculation_type: "",
        value: "",
        is_balancing_component: false,
        isDefault: false,
      },
    ]);
  };

  // ---------------- SAVE ----------------
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (saving) return;

    if (!form.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    const payload = {
      template: {
        company_id: Number(companyId),
        name: form.name.trim(),
        annual_ctc: 0, // always posted as 0
        description: form.description,
        status: form.status,
      },
      mappings: mappings
        .filter((m) => m.component_id !== "" && m.component_id != null)
        .map((m) => ({
          component_id: Number(m.component_id),
          calculation_type: m.calculation_type,
          value: Number(m.value || 0),
          is_balancing_component: Boolean(m.is_balancing_component),
        })),
    };

    setSaving(true);
    try {
      const res = await axiosInstance.post("/api/payroll/templates", payload);
      console.log("[create template] success:", res); // DEBUG - remove later

      // Backend may reply 200 with { ok: false, error: "..." }
      if (isApiFailure(res.data)) {
        toast.error(
          getApiError(
            { response: { data: res.data } },
            "Failed to create template",
          ),
        );
        return;
      }

      // Show the backend's own message when it sends one
      toast.success(getApiMessage(res, "Salary template created successfully"));
      if (onCancel) onCancel();
    } catch (err) {
      console.log("[create template] error:", err, err?.response?.data); // DEBUG - remove later
      toast.error(getApiError(err, "Failed to create template"));
    } finally {
      setSaving(false);
    }
  };

  // ---------------- SHARED STYLES ----------------
  const inputBase =
    "w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[12px] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";

  return (
    <div
      className="min-h-screen bg-gray-50 rounded-2xl p-6 font-['Poppins'] font-normal text-[#111827]"
      style={{ fontSize: "12px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-colors"
            aria-label="Back"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="text-[16px] tracking-tight text-gray-900 flex items-center">
              New Salary Template
              <InfoTooltip sections={SALARY_TEMPLATE_INFO} />
            </h1>
            <p className="text-[11px] text-gray-500">
              Define the template details and choose its salary components.
            </p>
          </div>
        </div>
      </div>

      {/* Template Details Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
        <h2 className="text-[13px] text-gray-900 mb-4">Template details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-600">Template Name</label>
            <input
              name="name"
              placeholder="e.g. Executive Standard"
              value={form.name}
              onChange={handleTemplateChange}
              className={inputBase}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-gray-600">Description</label>
            <input
              name="description"
              placeholder="Optional details"
              value={form.description}
              onChange={handleTemplateChange}
              className={inputBase}
            />
          </div>
        </div>
      </div>

      {/* Components Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-[13px] text-gray-900">
            Salary components
            <span className="ml-2 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {mappings.length}
            </span>
          </h2>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-y border-gray-200 text-[11px] text-gray-500 uppercase tracking-wide">
          <div className="col-span-6">Component</div>
          <div className="col-span-4">Calculation Type / Value</div>
          <div className="col-span-2 text-center">Balancing</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {mappings.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-400">
              No components yet. Add a custom component to get started.
            </div>
          )}

          {mappings.map((m, index) => (
            <div
              key={m.id}
              className="grid grid-cols-12 gap-4 items-center px-6 py-3 hover:bg-gray-50/70 transition-colors"
            >
              {/* Component Name */}
              <div className="col-span-6">
                {m.isDefault ? (
                  <div className="px-3 py-2.5 bg-gray-100 rounded-lg text-gray-800 flex items-center gap-2">
                    {components.find((c) => c.id === m.component_id)?.name ||
                      "System Component"}
                    <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Default
                    </span>
                  </div>
                ) : (
                  <select
                    name="component_id"
                    value={m.component_id}
                    onChange={(e) => handleMappingChange(index, e)}
                    className={inputBase}
                  >
                    <option value="">Select Component</option>
                    {components
                      .filter((c) => c.company_id !== 0) // Only user-created components
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Calculation & Value */}
              <div className="col-span-4">
                <div className="flex rounded-lg bg-white border border-gray-200 overflow-hidden transition focus-within:border-black focus-within:ring-2 focus-within:ring-black/10">
                  <input
                    type="text"
                    inputMode="decimal"
                    name="value"
                    value={m.value}
                    onChange={(e) => handleMappingChange(index, e)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className="w-1/2 px-3 py-2.5 text-center bg-transparent outline-none"
                  />
                  <div className="w-1/2 px-3 py-2.5 text-[10px] text-gray-600 flex items-center justify-center border-l border-gray-200 bg-gray-100 uppercase tracking-wide">
                    {m.calculation_type?.split("_").join(" ") || "-"}
                  </div>
                </div>
              </div>

              {/* Balancing Component */}
              <div className="col-span-2 flex justify-center">
                <Toggle
                  checked={m.is_balancing_component}
                  onChange={() => handleBalancingToggle(m.id)}
                  label="Balancing component"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Component Action */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={addComponent}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} />
            Add Custom Component
          </button>
        </div>
      </div>

      {/* Bottom Actions (mobile + convenience) */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          className="px-6 py-2.5 border border-gray-300 bg-white rounded-lg text-gray-800 hover:border-black transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Template"}
        </button>
      </div>

      {/* No <Toaster /> here: the single global one lives in App.jsx */}
    </div>
  );
}
