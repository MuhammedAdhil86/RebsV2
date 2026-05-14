import React, { useState, useEffect } from "react";
import axiosInstance from "../../../../service/axiosinstance";
import toast, { Toaster } from "react-hot-toast";
import { ChevronLeft, X, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import GlowButton from "../../../helpers/glowbutton";

export default function CreateSalaryTemplate({ onCancel }) {
  // ---------------- STATE ----------------
  const [form, setForm] = useState({
    name: "",
    description: "",
    annual_ctc: "",
    status: "active",
  });

  const [components, setComponents] = useState([]);
  const [mappings, setMappings] = useState([]);

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
        toast.error("Failed to load components");
      }
    };
    fetchComponents();
  }, []);

  // ---------------- SET DEFAULT MAPPINGS (Company ID 0) ----------------
  useEffect(() => {
    if (!components.length) return;

    // Automatically include ALL components where company_id is 0
    const systemDefaults = components
      .filter((c) => c.company_id === 0)
      .map((c) => {
        const nameLower = c.name.toLowerCase();
        return {
          id: uuidv4(),
          component_id: c.id,
          calculation_type: c.calculation_type,
          value: c.value || 0,
          monthly_amount: 0,
          annual_amount: 0,
          isDefault: true, // Cannot be deleted
          // Identify the 'Fixed Allowance' to act as the CTC balancer
          isFixed:
            nameLower.includes("fixed") || nameLower.includes("allowance"),
        };
      });

    setMappings(systemDefaults);
  }, [components]);

  // ---------------- UTILS ----------------
  const round2 = (num) => Number(Number(num).toFixed(2));

  const getBasicAnnual = (arr) => {
    const basic = arr.find((m) => {
      const comp = components.find(
        (c) => String(c.id) === String(m.component_id),
      );
      return comp?.name?.toLowerCase() === "basic";
    });
    return Number(basic?.annual_amount || 0);
  };

  const computeAmounts = (rawMappings, annualCTC) => {
    const ctc = Number(annualCTC) || 0;

    // 1. Calculate non-fixed components (Flat and % of CTC)
    let temp = rawMappings.map((m) => {
      if (m.isFixed) return { ...m, annual_amount: 0, monthly_amount: 0 };

      let annual = 0;
      const val = Number(m.value || 0);

      if (m.calculation_type === "percentage_ctc") {
        annual = (val / 100) * ctc;
      } else if (m.calculation_type === "flat") {
        annual = val * 12;
      }

      return {
        ...m,
        annual_amount: round2(annual),
        monthly_amount: round2(annual / 12),
      };
    });

    // 2. Calculate components based on Basic
    const basicAnnual = getBasicAnnual(temp);
    temp = temp.map((m) => {
      if (m.calculation_type === "percentage_basic") {
        const annual = (Number(m.value || 0) / 100) * basicAnnual;
        return {
          ...m,
          annual_amount: round2(annual),
          monthly_amount: round2(annual / 12),
        };
      }
      return m;
    });

    // 3. Calculate Fixed (Remainder)
    const totalWithoutFixed = temp
      .filter((m) => !m.isFixed)
      .reduce((sum, m) => sum + Number(m.annual_amount || 0), 0);

    let remaining = round2(ctc - totalWithoutFixed);

    // We update the Fixed component with the balance
    temp = temp.map((m) => {
      if (m.isFixed) {
        return {
          ...m,
          value: remaining > 0 ? remaining : 0,
          annual_amount: remaining > 0 ? remaining : 0,
          monthly_amount: remaining > 0 ? round2(remaining / 12) : 0,
        };
      }
      return m;
    });

    return temp;
  };

  // ---------------- HANDLERS ----------------
  const handleTemplateChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMappingChange = async (index, e) => {
    const { name, value } = e.target;

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
            value: data.value,
          };
          return computeAmounts(updated, form.annual_ctc);
        });
      } catch {
        toast.error("Failed to fetch component details");
      }
      return;
    }

    setMappings((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      return computeAmounts(updated, form.annual_ctc);
    });
  };

  const addComponent = () => {
    setMappings((prev) => [
      ...prev,
      {
        id: uuidv4(),
        component_id: "",
        calculation_type: "",
        value: "",
        monthly_amount: 0,
        annual_amount: 0,
        isDefault: false,
      },
    ]);
  };

  const deleteMapping = (id) => {
    setMappings((prev) => {
      // Guard: Never remove a mapping if isDefault is true
      const remaining = prev.filter((m) => m.id !== id || m.isDefault);
      return computeAmounts(remaining, form.annual_ctc);
    });
  };

  useEffect(() => {
    setMappings((prev) => computeAmounts(prev, form.annual_ctc));
  }, [form.annual_ctc]);

  const totalAnnual = mappings.reduce(
    (sum, m) => sum + Number(m.annual_amount || 0),
    0,
  );
  const totalMonthly = round2(totalAnnual / 12);

  // ---------------- SAVE ----------------
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.name || !form.annual_ctc) {
      toast.error("Template name and Annual CTC are required");
      return;
    }

    if (totalAnnual > Number(form.annual_ctc)) {
      toast.error("Total components exceed Annual CTC");
      return;
    }

    const payload = {
      template: {
        name: form.name,
        description: form.description,
        annual_ctc: Number(form.annual_ctc),
        status: form.status,
      },
      mappings: mappings.map((m) => {
        let valueToSend = Number(m.value || 0);
        if (m.calculation_type === "flat") {
          valueToSend = Number((m.annual_amount / 12).toFixed(2));
        }
        return {
          component_id: m.component_id,
          calculation_type: m.calculation_type,
          value: valueToSend,
        };
      }),
    };

    try {
      const res = await axiosInstance.post("/api/payroll/templates", payload);
      toast.success(res.data?.message || "Salary template saved successfully!");
      if (onCancel) onCancel();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save template");
    }
  };

  return (
    <div
      className="min-h-screen bg-white rounded-xl p-6 font-['Poppins'] text-[#111827]"
      style={{ fontSize: "12px" }}
    >
      <Toaster position="top-right" />

      {/* Header */}
      <div
        className="flex items-center gap-2 mb-6 pb-4 cursor-pointer border-b border-gray-200"
        onClick={onCancel}
      >
        <ChevronLeft size={16} />
        <span className="font-medium text-[12px]">New Salary Template</span>
      </div>

      {/* Form Top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-600">Template Name</label>
          <input
            name="name"
            placeholder="e.g. Executive Standard"
            value={form.name}
            onChange={handleTemplateChange}
            className="bg-[#F3F4F6] border-none p-2.5 rounded-lg outline-none text-[12px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-gray-600">Description</label>
          <input
            name="description"
            placeholder="Optional details"
            value={form.description}
            onChange={handleTemplateChange}
            className="bg-[#F3F4F6] border-none p-2.5 rounded-lg outline-none text-[12px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-gray-600">Annual CTC</label>
          <div className="relative flex items-center bg-[#F3F4F6] rounded-lg px-3">
            <span className="text-gray-500 mr-2">₹</span>
            <input
              name="annual_ctc"
              type="number"
              value={form.annual_ctc}
              onChange={handleTemplateChange}
              className="bg-transparent border-none py-2.5 w-full outline-none text-[12px]"
            />
            <span className="text-gray-400 ml-2 whitespace-nowrap">
              per year
            </span>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-1 mb-4 font-semibold text-gray-500 uppercase border-t border-b py-3">
        <div className="col-span-4">Salary Components</div>
        <div className="col-span-3">Calculation Type / Value</div>
        <div className="col-span-2 text-center">Monthly</div>
        <div className="col-span-2 text-center">Annual</div>
        <div className="col-span-1"></div>
      </div>

      {/* Components List */}
      <div className="space-y-4">
        <div className="font-bold text-gray-400 px-1 tracking-wider">
          EARNINGS
        </div>
        {mappings.map((m, index) => (
          <div
            key={m.id}
            className="grid grid-cols-12 gap-4 items-center animate-in fade-in duration-300"
          >
            {/* Component Name */}
            <div className="col-span-4">
              {m.isDefault ? (
                <div className="p-2.5 bg-gray-50 border border-transparent rounded-lg text-gray-800 font-medium flex items-center gap-2">
                  {components.find((c) => c.id === m.component_id)?.name ||
                    "System Component"}
                  <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase">
                    Default
                  </span>
                </div>
              ) : (
                <select
                  name="component_id"
                  value={m.component_id}
                  onChange={(e) => handleMappingChange(index, e)}
                  className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-[12px] outline-blue-500"
                >
                  <option value="">Select Component</option>
                  {components
                    .filter((c) => c.company_id !== 0) // Only show user-created components in dropdown
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              )}
            </div>

            {/* Calculation & Value */}
            <div className="col-span-3">
              <div className="flex rounded-lg bg-[#F3F4F6] overflow-hidden border border-transparent focus-within:border-blue-300">
                <input
                  type="number"
                  name="value"
                  value={m.value}
                  onChange={(e) => handleMappingChange(index, e)}
                  disabled={m.isFixed}
                  placeholder="0"
                  className={`w-1/2 p-2.5 text-center bg-transparent outline-none ${m.isFixed ? "text-gray-400 italic" : ""}`}
                />
                <div className="w-1/2 p-2.5 text-[9px] text-gray-500 flex items-center justify-center border-l border-gray-200 bg-gray-100/50 uppercase font-medium">
                  {m.calculation_type?.split("_").join(" ") || "Fixed"}
                </div>
              </div>
            </div>

            {/* Monthly Amount */}
            <div className="col-span-2 text-center font-medium py-2.5">
              ₹ {m.monthly_amount.toLocaleString("en-IN")}
            </div>

            {/* Annual Amount */}
            <div className="col-span-2 text-center font-bold text-gray-700 py-2.5">
              ₹ {m.annual_amount.toLocaleString("en-IN")}
            </div>

            {/* Actions */}
            <div className="col-span-1 flex justify-center">
              {!m.isDefault && (
                <button
                  onClick={() => deleteMapping(m.id)}
                  className="p-2 hover:bg-red-50 rounded-full transition-colors group"
                >
                  <X
                    size={14}
                    className="text-gray-400 group-hover:text-red-500"
                  />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Component Action */}
      <button
        type="button"
        className="mt-6 flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-all group"
        onClick={addComponent}
      >
        <div className="p-1 bg-blue-50 rounded group-hover:bg-blue-100">
          <Plus size={14} />
        </div>
        <span className="border-b border-transparent group-hover:border-blue-700">
          Add Custom Component
        </span>
      </button>

      {/* Summary Footer */}
      <div className="mt-12 bg-gray-200 rounded-xl p-3 text-black flex justify-between items-center ">
        <div>
          <div className=" text-[10px] uppercase  tracking-widest">
            Total Template Cost
          </div>
          <div className="text-md">Cost to Company (CTC)</div>
        </div>
        <div className="flex gap-12 items-center">
          <div className="text-right">
            <div className=" text-[10px]">MONTHLY</div>
            <div className="text-lg">
              ₹ {totalMonthly.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="text-right border-l border-gray-700 pl-12">
            <div className=" text-[10px]">ANNUAL</div>
            <div className="text-xl ">
              ₹ {totalAnnual.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* Final Actions */}
      <div className="flex justify-end gap-4 mt-8">
        <button
          className="px-8 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <GlowButton onClick={handleSave}>Save</GlowButton>
      </div>
    </div>
  );
}
