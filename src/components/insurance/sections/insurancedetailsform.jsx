import React from "react";

export default function InsuranceDetailsForm({ formData, handleChange }) {
  return (
    <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 space-y-4">
      <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
        Insurance Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Insurance Provider <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="insuranceProvider"
            value={formData.insuranceProvider}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
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
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Insurance Type <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="insuranceType"
            value={formData.insuranceType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Coverage Type <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="coverageType"
            value={formData.coverageType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
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

        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Premium Paid By <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="premiumPaidBy"
            value={formData.premiumPaidBy}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
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

        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Renewal Reminder <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="renewalReminder"
            value={formData.renewalReminder}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
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
    </div>
  );
}
