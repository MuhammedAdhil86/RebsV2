import React from "react";
// Import shared styles and components from your local utils
import {
  cardClass,
  sectionTitle,
  CheckboxRow,
} from "../../../helpers/leavepolicyutils";

// Keeps digits only and drops leading zeros, so the field can only ever hold
// a positive whole number (or be empty while the user is typing).
const toPositiveInt = (raw) =>
  String(raw ?? "")
    .replace(/\D/g, "")
    .replace(/^0+/, "");

const RequestPreferencesCard = ({ formData, handleChange }) => {
  return (
    <div className={cardClass}>
      <h3 className={sectionTitle}>Employee Leave Request Preferences</h3>
      <div className="space-y-6">
        {/* 1. Negative Leave Balance */}
        <div>
          <CheckboxRow
            label="Allow negative leave balance"
            checked={formData.allow_negative_balance || false}
            onChange={(e) =>
              handleChange("allow_negative_balance", e.target.checked)
            }
          />
          {/* Conditional block: Only enabled if checkbox is checked */}
          <div
            className={`ml-6 mt-2 flex items-center bg-[#F4F6F8] border border-gray-200 rounded-xl px-4 py-2 h-10 ${!formData.allow_negative_balance && "opacity-50 pointer-events-none"}`}
          >
            <span className="text-[11px] text-gray-700 flex-1">
              Consider as
            </span>
            <select
              disabled={!formData.allow_negative_balance}
              className="bg-transparent text-[11px] focus:outline-none"
              value={formData.consider_negative_balance || ""}
              onChange={(e) =>
                handleChange("consider_negative_balance", e.target.value)
              }
            >
              <option value="">Select Option</option>
              <option value="no limit">Unpaid Leave (No Limit)</option>
              <option value="till year end">
                Unpaid Leave (Till Year End)
              </option>
              <option value="unlimited and mark as lop">
                Unpaid Leave (Unlimited & Mark as LOP)
              </option>
            </select>
          </div>
        </div>

        {/* 2. Past Date Leave */}
        <div>
          <CheckboxRow
            label="Allow applying for leave on past dates"
            checked={formData.allow_past_leave || false}
            onChange={(e) => handleChange("allow_past_leave", e.target.checked)}
          />
          {formData.allow_past_leave && (
            <div className="ml-6 mt-2">
              <input
                type="text"
                inputMode="numeric"
                className="w-full bg-[#F4F6F8] border border-gray-200 rounded-xl px-3 py-2 text-[11px] focus:outline-none"
                placeholder="days before today"
                value={formData.past_leave_limit ?? ""}
                onChange={(e) =>
                  handleChange(
                    "past_leave_limit",
                    toPositiveInt(e.target.value),
                  )
                }
              />
            </div>
          )}
        </div>

        {/* 3. Future Date Leave */}
        <div>
          <CheckboxRow
            label="Allow applying for leave on future dates"
            checked={formData.allow_future_leave || false}
            onChange={(e) =>
              handleChange("allow_future_leave", e.target.checked)
            }
          />
          {formData.allow_future_leave && (
            <div className="ml-6 mt-2">
              <input
                type="text"
                inputMode="numeric"
                className="w-full bg-[#F4F6F8] border border-gray-200 rounded-xl px-3 py-2 text-[11px] focus:outline-none"
                placeholder="days after today"
                value={formData.future_leave_limit ?? ""}
                onChange={(e) =>
                  handleChange(
                    "future_leave_limit",
                    toPositiveInt(e.target.value),
                  )
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestPreferencesCard;
