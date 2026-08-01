import React, { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

// 🆕 Import the 3 modals built matching your custom theme
import InsuranceProviderModal from "../../../ui/insuranceprovidermodal";
import InsuranceTypeModal from "../../../ui/insurancetypemodal";
import CoverageTypeModal from "../../../ui/coveragetypemodal";

export default function InsuranceDetailsForm({
  formData,
  handleChange,
  providers = [],
  insuranceTypes = [],
  coverageTypes = [],
  // Callback functions to sync/refresh parent data arrays when elements are submitted
  onRefreshDropdowns,
}) {
  // 🆕 Visibility control states for each configurations overlay window
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [isInsuranceTypeOpen, setIsInsuranceTypeOpen] = useState(false);
  const [isCoverageTypeOpen, setIsCoverageTypeOpen] = useState(false);

  // Extract option picker values to dictate conditional grid presentation
  const currentPremiumPaidBy = formData.premiumPaidBy || "";

  return (
    <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 space-y-4 font-poppins">
      <h3 className="text-xs text-blue-600 uppercase tracking-wider font-bold">
        Insurance Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Insurance Provider Dropdown mapped to provider_name */}
        <div className="relative">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-gray-600 font-medium">
              Insurance Provider <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsProviderOpen(true)}
              className="flex items-center gap-0.5 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-[11px]"
            >
              <Plus size={12} className="stroke-[3]" />
              <span>Add</span>
            </button>
          </div>
          <div className="relative flex items-center">
            <select
              name="insuranceProvider"
              value={formData.insuranceProvider}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 pr-8 cursor-pointer"
            >
              <option value="">Select Insurance Provider</option>
              {providers.map((provider) => {
                const name = provider.provider_name;
                return (
                  <option key={provider.id} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Policy Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="policyNumber"
            value={formData.policyNumber}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Insurance Type Dropdown mapped to type_name */}
        <div className="relative">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-gray-600 font-medium">
              Insurance Type <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsInsuranceTypeOpen(true)}
              className="flex items-center gap-0.5 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-[11px]"
            >
              <Plus size={12} className="stroke-[3]" />
              <span>Add</span>
            </button>
          </div>
          <div className="relative flex items-center">
            <select
              name="insuranceType"
              value={formData.insuranceType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 pr-8 cursor-pointer"
            >
              <option value="">Select Insurance Type</option>
              {insuranceTypes.map((typeItem) => {
                const typeName = typeItem.type_name;
                return (
                  <option key={typeItem.id} value={typeName}>
                    {typeName}
                  </option>
                );
              })}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Coverage Type Dropdown mapped to coverage_name */}
        <div className="relative">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-gray-600 font-medium">
              Coverage Type <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsCoverageTypeOpen(true)}
              className="flex items-center gap-0.5 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-[11px]"
            >
              <Plus size={12} className="stroke-[3]" />
              <span>Add</span>
            </button>
          </div>
          <div className="relative flex items-center">
            <select
              name="coverageType"
              value={formData.coverageType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 pr-8 cursor-pointer"
            >
              <option value="">Select Coverage Type</option>
              {coverageTypes.map((coverage) => {
                const coverageName = coverage.coverage_name;
                return (
                  <option key={coverage.id} value={coverageName}>
                    {coverageName}
                  </option>
                );
              })}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Sum Insured <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="sumInsured"
            value={formData.sumInsured}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Premium Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="premiumAmount"
            value={formData.premiumAmount}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Updated Premium Paid By Dropdown Option Menu Selector Block */}
        <div className="relative">
          <label className="block text-gray-600 font-medium mb-1">
            Premium Paid By <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center">
            <select
              name="premiumPaidBy"
              value={formData.premiumPaidBy}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 pr-8 cursor-pointer"
            >
              <option value="">Select Premium Paid By</option>
              <option value="Company">Company</option>
              <option value="Employee">Employee</option>
              <option value="Shared">Shared</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Company Contribution Element: Displays conditionally for "Company" or "Shared" selections */}
        {(currentPremiumPaidBy === "Company" ||
          currentPremiumPaidBy === "Shared") && (
          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Company Contribution <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyContribution"
              value={formData.companyContribution}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Employee Contribution Element: Displays conditionally for "Employee" or "Shared" selections */}
        {(currentPremiumPaidBy === "Employee" ||
          currentPremiumPaidBy === "Shared") && (
          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Employee Contribution <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="employeeContribution"
              value={formData.employeeContribution}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Policy Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="policyStartDate"
            value={formData.policyStartDate}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Policy End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="policyEndDate"
            value={formData.policyEndDate}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Coverage Duration
          </label>
          <input
            type="text"
            disabled
            value={formData.coverageDuration}
            className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-md p-2 cursor-not-allowed"
          />
        </div>

        {/* Updated Renewal Reminder Select Box matching backend expected payload integers */}
        <div className="relative">
          <label className="block text-gray-600 font-medium mb-1">
            Renewal Reminder <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center">
            <select
              name="renewalReminder"
              value={formData.renewalReminder}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 pr-8 cursor-pointer"
            >
              <option value="">Select Renewal Reminder</option>
              <option value="7">7 Days</option>
              <option value="15">15 Days</option>
              <option value="30">30 Days</option>
              <option value="60">60 Days</option>
              <option value="90">90 Days</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-600 font-medium mb-1">
            Policy Status
          </label>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>{" "}
              {formData.policyStatus || "Active"}
            </span>
            <span className="text-[11px] text-gray-400">
              Status is auto-updated based on policy end date.
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2 text-xs">
        <label className="block text-gray-600 font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          rows="3"
          value={formData.notes}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          maxLength={500}
        ></textarea>
        <div className="text-right text-[10px] text-gray-400 mt-0.5">
          {formData.notes?.length || 0} / 500
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🆕 RENDERED CONFIGURATION MODALS INTERFACES                               */}
      {/* ========================================================================= */}
      <InsuranceProviderModal
        isOpen={isProviderOpen}
        onClose={() => setIsProviderOpen(false)}
        onRefresh={onRefreshDropdowns}
      />

      <InsuranceTypeModal
        isOpen={isInsuranceTypeOpen}
        onClose={() => setIsInsuranceTypeOpen(false)}
        onRefresh={onRefreshDropdowns}
      />

      <CoverageTypeModal
        isOpen={isCoverageTypeOpen}
        onClose={() => setIsCoverageTypeOpen(false)}
        onRefresh={onRefreshDropdowns}
      />
    </div>
  );
}
