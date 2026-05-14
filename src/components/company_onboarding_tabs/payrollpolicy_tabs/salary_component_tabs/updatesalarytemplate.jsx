import React, { useState, useEffect } from "react";
import axiosInstance from "../../../../service/axiosinstance";
import toast, { Toaster } from "react-hot-toast";
import { ChevronLeft, AlignLeft } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import GlowButton from "../../../helpers/glowbutton";

export default function UpdateSalaryTemplate({ data, onCancel }) {
  if (!data || !data.id) return null;

  // ---------------- STATE ----------------
  const [form, setForm] = useState({
    name: data.name || "",
    description: data.description || "",
    annual_ctc: data.annual_ctc || 0,
    status: data.status?.toLowerCase() === "active" ? "active" : "inactive",
  });

  const [components, setComponents] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------- CALCULATION LOGIC (UNTOUCHED) ----------------
  const round2 = (num) => Number(Math.round(num + "e2") + "e-2");

  const computeAmounts = (rawMappings, annualCTC, masterComps) => {
    const totalCTC = Number(annualCTC) || 0;

    const basicMapping = rawMappings.find((m) => {
      const comp = masterComps.find(
        (c) => Number(c.id) === Number(m.component_id),
      );
      return comp?.name?.toLowerCase().includes("basic");
    });

    let basicAnnual = 0;
    if (basicMapping) {
      if (basicMapping.calculation_type === "percentage_ctc") {
        basicAnnual = (Number(basicMapping.value) / 100) * totalCTC;
      } else if (basicMapping.calculation_type === "flat") {
        basicAnnual = Number(basicMapping.value) * 12;
      }
    }

    let temp = rawMappings.map((m) => {
      const comp = masterComps.find(
        (c) => Number(c.id) === Number(m.component_id),
      );
      const nameLower = (comp?.name || "").toLowerCase();

      const isResidual =
        nameLower.includes("special allowance") || nameLower.includes("fixed");

      if (isResidual)
        return { ...m, isResidual: true, annual_amount: 0, monthly_amount: 0 };

      let annual = 0;
      if (m.calculation_type === "percentage_ctc") {
        annual = (Number(m.value) / 100) * totalCTC;
      } else if (m.calculation_type === "percentage_basic") {
        annual = (Number(m.value) / 100) * basicAnnual;
      } else if (m.calculation_type === "flat") {
        annual = Number(m.value) * 12;
      }

      return {
        ...m,
        isResidual: false,
        annual_amount: round2(annual),
        monthly_amount: round2(annual / 12),
      };
    });

    const consumed = temp
      .filter((m) => !m.isResidual)
      .reduce((sum, m) => sum + m.annual_amount, 0);

    const balance = round2(totalCTC - consumed);

    return temp.map((m) =>
      m.isResidual
        ? {
            ...m,
            value: balance > 0 ? round2(balance / 12) : 0,
            annual_amount: balance > 0 ? balance : 0,
            monthly_amount: balance > 0 ? round2(balance / 12) : 0,
          }
        : m,
    );
  };

  // ---------------- INITIALIZATION (UNTOUCHED) ----------------
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        const compRes = await axiosInstance.get(
          "api/payroll/components?limit=100",
        );
        const masterItems = compRes.data?.data?.items || [];
        setComponents(masterItems);

        if (data.mappings) {
          const initialMappings = data.mappings.map((m) => ({
            id: uuidv4(),
            component_id: Number(m.component_id),
            calculation_type: m.calculation_type,
            value: Number(m.value),
            is_taxable: m.is_taxable ?? true,
          }));

          setMappings(
            computeAmounts(initialMappings, data.annual_ctc, masterItems),
          );
        }
      } catch (err) {
        toast.error("Failed to load components");
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, [data]);

  useEffect(() => {
    if (!isLoading && components.length > 0) {
      setMappings((prev) => computeAmounts(prev, form.annual_ctc, components));
    }
  }, [form.annual_ctc]);

  const handleUpdate = async () => {
    setIsSubmitting(true);
    const payload = {
      template: {
        name: form.name,
        annual_ctc: Number(form.annual_ctc),
        description: form.description,
        status: form.status,
      },
      mappings: mappings.map((m) => ({
        component_id: Number(m.component_id),
        calculation_type: m.calculation_type,
        value: Number(m.value),
        is_taxable: m.is_taxable,
      })),
    };

    try {
      const response = await axiosInstance.put(
        `api/payroll/templates/${data.id}`,
        payload,
      );
      if (response.status === 200 || response.data.success) {
        toast.success("Template updated successfully!");
        onCancel();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-20 text-center text-gray-400 uppercase tracking-widest font-poppins text-[12px]">
        Syncing Salary Data...
      </div>
    );

  return (
    <div className="min-h-screen bg-white rounded-xl p-6 font-poppins text-[12px] text-gray-700">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={onCancel}
        >
          <ChevronLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="uppercase tracking-widest text-gray-400">
            Back to List
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active-check"
            className="w-4 h-4 cursor-pointer"
            checked={form.status === "active"}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.checked ? "active" : "inactive",
              })
            }
          />
          <label
            htmlFor="active-check"
            className={`px-3 py-1 rounded-full text-[10px] border cursor-pointer transition-colors ${
              form.status === "active"
                ? "bg-green-50 text-green-600 border-green-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {form.status.toUpperCase()}
          </label>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 uppercase text-[10px] tracking-wider">
            Template Name
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-gray-50 p-3 rounded-xl border border-gray-100 outline-none focus:border-gray-200"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 uppercase text-[10px] tracking-wider">
            Annual CTC (₹)
          </label>
          <input
            type="number"
            value={form.annual_ctc}
            onChange={(e) => setForm({ ...form, annual_ctc: e.target.value })}
            className="bg-gray-50 p-3 rounded-xl border border-gray-100 outline-none focus:border-gray-200 text-gray-800"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mb-8">
        <label className="text-gray-400 uppercase text-[10px] tracking-wider flex items-center gap-1">
          <AlignLeft size={12} /> Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="bg-gray-50 p-3 rounded-xl border border-gray-100 outline-none focus:border-gray-200 resize-none text-gray-600"
        />
      </div>

      {/* Breakdown Table */}
      <div className="grid grid-cols-12 gap-4 px-1 mb-4 text-black uppercase border-y py-4 tracking-widest">
        <div className="col-span-6">Salary Component</div>
        <div className="col-span-3 text-center">Monthly (₹)</div>
        <div className="col-span-3 text-center">Annual (₹)</div>
      </div>

      <div className="space-y-3 mb-8">
        {mappings.map((m) => {
          const compDetail = components.find(
            (c) => Number(c.id) === Number(m.component_id),
          );
          return (
            <div key={m.id} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-6 p-3.5 bg-gray-50 rounded-xl flex justify-between items-center border border-gray-100">
                <div>
                  <div className="text-gray-800">
                    {compDetail?.name || `ID: ${m.component_id}`}
                  </div>
                  <div className="text-[9px] text-gray-400 uppercase mt-1">
                    {m.calculation_type.replace("_", " ")}{" "}
                    {m.isResidual
                      ? ""
                      : `(${m.value}${m.calculation_type.includes("percentage") ? "%" : ""})`}
                  </div>
                </div>
              </div>
              <div className="col-span-3 text-center text-gray-500">
                {m.monthly_amount.toLocaleString("en-IN")}
              </div>
              <div className="col-span-3 text-center text-gray-700">
                {m.annual_amount.toLocaleString("en-IN")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-xl text-black border border-gray-100 mb-12">
        <div className="col-span-6  uppercase tracking-tighter">
          Total CTC Check
        </div>
        <div className="col-span-3 text-center ">
          ₹{round2(form.annual_ctc / 12).toLocaleString("en-IN")}
        </div>
        <div className="col-span-3 text-center ">
          ₹{Number(form.annual_ctc).toLocaleString("en-IN")}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
        <button
          className="px-8 py-3 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 transition-all"
          onClick={onCancel}
        >
          CANCEL
        </button>
        <GlowButton onClick={handleUpdate} disabled={isSubmitting}>
          {isSubmitting ? "SAVING..." : "UPDATE TEMPLATE"}
        </GlowButton>
      </div>
    </div>
  );
}
