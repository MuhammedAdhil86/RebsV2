import React from "react";
import { ChevronDown } from "lucide-react";
import ColorPicker from "../../../../ui/colorpicker";
// Import shared styles from your local utils file
import {
  cardClass,
  labelClass,
  inputClass,
} from "../../../helpers/leavepolicyutils";

const BasicInfoCard = ({ formData, handleChange }) => {
  return (
    <div className={cardClass}>
      <div className="space-y-4">
        {/* Leave Name Input */}
        <div>
          <label className={labelClass}>Leave Name</label>
          <input
            type="text"
            placeholder="Enter Leave Name, eg: Casual Leave"
            className={inputClass}
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>

        {/* Policy Code and Color Picker Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Policy Code</label>
            <input
              type="text"
              placeholder="Policy Code (eg: RP)"
              className={inputClass}
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Policy Color</label>
            <ColorPicker
              value={formData.color}
              onChange={(color) => handleChange("color", color)}
            />
          </div>
        </div>

        {/* Leave Type Select */}
        <div>
          <label className={labelClass}>Leave Type</label>
          <div className="relative">
            <select
              className={`${inputClass} appearance-none`}
              value={formData.leave_type}
              onChange={(e) => handleChange("leave_type", e.target.value)}
            >
              <option value="Paid">PAID</option>
              <option value="Unpaid">UNPAID</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none"
              size={14}
            />
          </div>
        </div>

        {/* 🔥 Added Description Field */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            placeholder="Enter policy description (e.g., Annual paid leave)"
            className={`${inputClass} min-h-[80px] py-3 resize-none`}
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoCard;
