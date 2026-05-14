import React, { useState } from "react";
import {
  ArrowLeft,
  Save,
  Landmark,
  ShieldCheck,
  User,
  Info,
} from "lucide-react";

const FinalizePayroll = ({ data, onBack, onLocalSave }) => {
  // Local state for the specific employee
  const [formData, setFormData] = useState({
    ...data,
    components: data.components || [],
    statutory: {
      epf_employee: data.statutory?.epf_employee || 0,
      esi_employee: data.statutory?.esi_employee || 0,
      pt: data.statutory?.pt || 0,
      lwf_employee: data.statutory?.lwf_employee || 0,
    },
  });

  const handleComponentChange = (index, value) => {
    const updatedComponents = [...formData.components];
    const monthly = parseFloat(value) || 0;
    updatedComponents[index] = {
      ...updatedComponents[index],
      monthly_amount: monthly,
      annual_amount: monthly * 12,
    };
    setFormData({ ...formData, components: updatedComponents });
  };

  const handleStatutoryChange = (field, value) => {
    setFormData({
      ...formData,
      statutory: { ...formData.statutory, [field]: parseFloat(value) || 0 },
    });
  };

  return (
    <div className="font-poppins font-normal text-black animate-in fade-in slide-in-from-right-4">
      {/* Standard Header */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 text-zinc-500 hover:text-black transition-colors"
        >
          <ArrowLeft size={18} /> <span>Return without Saving</span>
        </button>
        <button
          onClick={() => onLocalSave(formData)}
          className="px-10 py-3 bg-black text-white rounded-xl flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-md active:scale-95"
        >
          <Save size={16} /> <span>Apply Changes Locally</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Profile Info */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-8 border border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="h-16 w-16 bg-zinc-100 border border-black flex items-center justify-center rounded-2xl mb-6">
              <User size={28} />
            </div>
            <h2 className="text-xl uppercase tracking-tighter mb-1">
              {formData.full_name}
            </h2>
            <p className="text-zinc-400 text-[10px] tracking-widest uppercase">
              Employee ID: {formData.user_id}
            </p>
            <div className="mt-8 pt-8 border-t border-zinc-100 space-y-4">
              <div className="flex justify-between text-[11px] uppercase tracking-widest text-zinc-400">
                <span>Paid Days</span>
                <span className="text-black">
                  {formData.consolidated_summary?.paid_days || 0}
                </span>
              </div>
              <div className="flex justify-between text-[11px] uppercase tracking-widest text-zinc-400">
                <span>LOP Days</span>
                <span className="text-black">
                  {formData.consolidated_summary?.lop_days || 0}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-zinc-50 p-6 flex gap-3 items-start border border-zinc-200">
            <Info size={16} className="text-zinc-400 mt-0.5" />
            <p className="text-[10px] text-zinc-500 leading-relaxed italic">
              Changes made here are stored in memory. You must click "Finalize
              All Staff" on the main page to commit updates to the database.
            </p>
          </div>
        </div>

        {/* Data Grid */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Earnings */}
          <div className="bg-white border border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-5 border-b border-black bg-zinc-50 flex items-center gap-3 font-normal uppercase tracking-widest text-[12px]">
              <Landmark size={18} /> Earnings
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {formData.components.map((comp, idx) => (
                <div key={comp.component_id} className="space-y-2 group">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest group-focus-within:text-black transition-colors">
                    {comp.name}
                  </label>
                  <div className="relative border-b border-zinc-200 focus-within:border-black transition-all">
                    <span className="absolute left-0 bottom-2 text-zinc-400 text-[14px]">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={comp.monthly_amount}
                      onChange={(e) =>
                        handleComponentChange(idx, e.target.value)
                      }
                      className="w-full pl-6 py-2 bg-transparent outline-none text-[15px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statutory */}
          <div className="bg-white border border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-5 border-b border-black bg-zinc-50 flex items-center gap-3 font-normal uppercase tracking-widest text-[12px]">
              <ShieldCheck size={18} /> Statutory Deductions
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {["epf_employee", "esi_employee", "pt", "lwf_employee"].map(
                (key) => (
                  <div key={key} className="space-y-2 group">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-widest group-focus-within:text-black transition-colors">
                      {key.replace("_", " ")}
                    </label>
                    <div className="relative border-b border-zinc-200 focus-within:border-black transition-all">
                      <span className="absolute left-0 bottom-2 text-zinc-400 text-[14px]">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={formData.statutory[key]}
                        onChange={(e) =>
                          handleStatutoryChange(key, e.target.value)
                        }
                        className="w-full pl-6 py-2 bg-transparent outline-none text-[15px]"
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalizePayroll;
