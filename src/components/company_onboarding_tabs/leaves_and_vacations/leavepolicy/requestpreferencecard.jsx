import React, { useState, useEffect } from "react";
// Import shared styles and components from your local utils
import {
  cardClass,
  sectionTitle,
  CheckboxRow,
  RadioRow,
} from "../../../helpers/leavepolicyutils";

const RequestPreferencesCard = ({ formData, handleChange }) => {
  // Local state for radio button toggles
  // Defaulting to "none" or null to ensure nothing is pre-selected
  const [pastLimitType, setPastLimitType] = useState(null);
  const [futureLimitType, setFutureLimitType] = useState(null);

  // Sync local radio state if formData already has values (useful for edits)
  useEffect(() => {
    if (formData.past_leave_limit) setPastLimitType("set");
    if (formData.future_leave_limit) setFutureLimitType("set");
  }, []);

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
            onChange={(e) => {
              handleChange("allow_past_leave", e.target.checked);
              if (!e.target.checked) setPastLimitType(null); // Reset radio on uncheck
            }}
          />
          <div
            className={`ml-6 space-y-3 mt-2 ${!formData.allow_past_leave && "opacity-50 pointer-events-none"}`}
          >
            <RadioRow
              label="No limit on past dates"
              checked={pastLimitType === "none"}
              onClick={() => {
                if (!formData.allow_past_leave) return;
                setPastLimitType("none");
                handleChange("past_leave_limit", null);
              }}
            />
            <div className="flex items-center gap-4">
              <RadioRow
                label="Set Limit"
                checked={pastLimitType === "set"}
                onClick={() =>
                  formData.allow_past_leave && setPastLimitType("set")
                }
              />
              <input
                type="number"
                disabled={pastLimitType !== "set" || !formData.allow_past_leave}
                className="flex-1 bg-[#F4F6F8] border border-gray-200 rounded-xl px-3 py-1 text-[11px] focus:outline-none"
                placeholder="days before today"
                value={formData.past_leave_limit || ""}
                onChange={(e) =>
                  handleChange("past_leave_limit", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* 3. Future Date Leave */}
        <div>
          <CheckboxRow
            label="Allow applying for leave on future dates"
            checked={formData.allow_future_leave || false}
            onChange={(e) => {
              handleChange("allow_future_leave", e.target.checked);
              if (!e.target.checked) setFutureLimitType(null); // Reset radio on uncheck
            }}
          />
          <div
            className={`ml-6 space-y-3 mt-2 ${!formData.allow_future_leave && "opacity-50 pointer-events-none"}`}
          >
            <RadioRow
              label="No limit on future dates"
              checked={futureLimitType === "none"}
              onClick={() => {
                if (!formData.allow_future_leave) return;
                setFutureLimitType("none");
                handleChange("future_leave_limit", null);
              }}
            />
            <div className="flex items-center gap-4">
              <RadioRow
                label="Set Limit"
                checked={futureLimitType === "set"}
                onClick={() =>
                  formData.allow_future_leave && setFutureLimitType("set")
                }
              />
              <input
                type="number"
                disabled={
                  futureLimitType !== "set" || !formData.allow_future_leave
                }
                className="flex-1 bg-[#F4F6F8] border border-gray-200 rounded-xl px-3 py-1 text-[11px] focus:outline-none"
                placeholder="days after today"
                value={formData.future_leave_limit || ""}
                onChange={(e) =>
                  handleChange("future_leave_limit", e.target.value)
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestPreferencesCard;
