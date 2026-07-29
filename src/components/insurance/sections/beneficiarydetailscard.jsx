import React from "react";
import { ChevronDown } from "lucide-react";

export default function BeneficiaryDetailsCard({ formData, handleChange }) {
  return (
    <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 space-y-4">
      <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
        Beneficiary Details
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Beneficiary Name */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Beneficiary Name
          </label>
          <input
            type="text"
            name="beneficiaryName"
            value={formData.beneficiaryName}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
          />
        </div>

        {/* Relationship Dropdown */}
        <div className="relative">
          <label className="block text-gray-600 font-medium mb-1">
            Relationship
          </label>
          <div className="relative flex items-center">
            <select
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 pr-8 cursor-pointer"
            >
              <option value="">Select Relationship</option>
              <option value="Spouse">Spouse</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Son">Son</option>
              <option value="Daughter">Daughter</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Contact Number
          </label>
          <input
            type="text"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
          />
        </div>
      </div>
    </div>
  );
}
