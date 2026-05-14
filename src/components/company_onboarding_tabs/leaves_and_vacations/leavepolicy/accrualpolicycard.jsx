import React from "react";
import { ChevronDown, Info } from "lucide-react";
import {
  cardClass,
  labelClass,
  inputClass,
  CheckboxRow,
} from "../../../helpers/leavepolicyutils";

const AccrualPolicyCard = ({ formData, handleChange }) => {
  return (
    <div className={cardClass}>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className={labelClass}>Accrual Method</label>
          <div className="relative">
            <select
              className={`${inputClass} appearance-none`}
              value={formData.accrual_method || "monthly"}
              onChange={(e) => handleChange("accrual_method", e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none"
              size={14}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Employee Accrues</label>
          <div className="flex border border-gray-300 rounded-xl overflow-hidden bg-[#F4F6F8]">
            <input
              type="number"
              className="w-full px-4 py-2 bg-transparent text-[12px] focus:outline-none font-normal"
              value={formData.employee_accrues || ""}
              onChange={(e) => handleChange("employee_accrues", e.target.value)}
            />
            <span className="border-l border-gray-400 px-3 py-2 text-[10px] text-gray-700 flex items-center bg-gray-50">
              DAYS
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. Pro-rate */}
        <CheckboxRow
          label="Pro-rate leave balance for new joinees based on their date of joining"
          checked={formData.prorate_for_new_joiners || false}
          onChange={(e) =>
            handleChange("prorate_for_new_joiners", e.target.checked)
          }
        />

        {/* 2. Postpone Accrual */}
        <div className="flex items-center justify-between">
          <CheckboxRow
            label="Postpone leave accrued for employees"
            checked={formData.postpone_accrual || false}
            onChange={(e) => handleChange("postpone_accrual", e.target.checked)}
          />
          <div
            className={`flex items-center gap-2 transition-opacity ${!formData.postpone_accrual ? "opacity-40 pointer-events-none" : ""}`}
          >
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-[#F4F6F8]">
              <input
                type="number"
                disabled={!formData.postpone_accrual}
                className="w-10 py-1 bg-transparent text-center text-[11px] focus:outline-none"
                value={formData.postpone_accrual_value || ""}
                onChange={(e) =>
                  handleChange("postpone_accrual_value", e.target.value)
                }
              />
              <div className="px-2 py-1 bg-white border-l border-gray-200 text-[10px] flex items-center gap-1">
                DAYS <ChevronDown size={10} />
              </div>
            </div>
            <span className="text-[11px] text-gray-700">After DOJ</span>
            <Info size={14} className="text-gray-300" />
          </div>
        </div>

        {/* 3. Reset Balance */}
        <div className="flex items-center justify-between">
          <CheckboxRow
            label="Reset the leave balances of employees"
            checked={formData.reset_leave_balance || false}
            onChange={(e) =>
              handleChange("reset_leave_balance", e.target.checked)
            }
          />
          <div
            className={`flex items-center gap-2 transition-opacity ${!formData.reset_leave_balance ? "opacity-40 pointer-events-none" : ""}`}
          >
            <span className="text-[11px] text-gray-700">Every</span>
            <div className="relative">
              <select
                disabled={!formData.reset_leave_balance}
                className="bg-[#F4F6F8] border border-gray-200 text-[11px] px-3 py-1 rounded-lg w-28 appearance-none focus:outline-none"
                value={formData.reset_leave_period || "yearly"}
                onChange={(e) =>
                  handleChange("reset_leave_period", e.target.value)
                }
              >
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-700"
                size={12}
              />
            </div>
            <Info size={14} className="text-gray-700" />
          </div>
        </div>

        {/* Nested options for Reset */}
        <div
          className={`ml-8 space-y-3 pt-2 transition-opacity ${!formData.reset_leave_balance ? "opacity-40 pointer-events-none" : ""}`}
        >
          {/* Carry Forward */}
          <div className="flex items-center justify-between">
            <CheckboxRow
              label="Carry forward unused leave balance upon reset?"
              checked={formData.carry_forward || false}
              onChange={(e) => handleChange("carry_forward", e.target.checked)}
            />
            <div
              className={`flex items-center gap-2 transition-opacity ${!formData.carry_forward ? "opacity-40 pointer-events-none" : ""}`}
            >
              <div className="text-[10px] text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg">
                Max days
              </div>
              <input
                type="number"
                disabled={!formData.carry_forward}
                className="w-10 py-1 bg-[#F4F6F8] border border-gray-400 rounded-lg text-center text-[11px] focus:outline-none"
                value={formData.carry_forward_limit || ""}
                onChange={(e) =>
                  handleChange("carry_forward_limit", e.target.value)
                }
              />
            </div>
          </div>

          {/* Encashment */}
          <div className="flex items-center justify-between">
            <CheckboxRow
              label="Encash remaining leave days?"
              checked={formData.encash_leave || false}
              onChange={(e) => handleChange("encash_leave", e.target.checked)}
            />
            <div
              className={`flex items-center gap-2 transition-opacity ${!formData.encash_leave ? "opacity-40 pointer-events-none" : ""}`}
            >
              <div className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg">
                Max days
              </div>
              <input
                type="number"
                disabled={!formData.encash_leave}
                className="w-10 py-1 bg-[#F4F6F8] border border-gray-200 rounded-lg text-center text-[11px] focus:outline-none"
                value={formData.encash_limit || ""}
                onChange={(e) => handleChange("encash_limit", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccrualPolicyCard;
