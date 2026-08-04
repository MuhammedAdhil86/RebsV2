import React, { useState } from "react";
import {
  ChevronDown,
  Plus,
  Edit2,
  Check,
  X,
  Loader2,
  Info,
  Ban,
} from "lucide-react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

import InsuranceProviderModal from "../../../ui/insuranceprovidermodal";
import InsuranceTypeModal from "../../../ui/insurancetypemodal";
import CoverageTypeModal from "../../../ui/coveragetypemodal";

// Inline Cancel Confirmation Modal to guarantee availability without path resolution errors
const CancelConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <FiAlertTriangle size={24} />
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Confirm Cancellation
          </h3>

          <p className="text-gray-500 text-sm leading-relaxed">
            Are you sure you want to cancel{" "}
            <span className="font-semibold text-gray-800">"{itemName}"</span>?
            This action cannot be undone.
          </p>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Keep
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors"
          >
            Cancel Insurance
          </button>
        </div>
      </div>
    </div>
  );
};

export default function InsuranceDetailsForm({
  formData,
  handleChange,
  providers = [],
  insuranceTypes = [],
  coverageTypes = [],
  onRefreshDropdowns,
  onSave,
  onCancelPolicy,
  saving,
}) {
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [isInsuranceTypeOpen, setIsInsuranceTypeOpen] = useState(false);
  const [isCoverageTypeOpen, setIsCoverageTypeOpen] = useState(false);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const currentPremiumPaidBy = formData.premiumPaidBy || "";

  // Helper function to strip out currency symbols or non-numeric characters
  const stripCurrency = (val) => String(val || "").replace(/[^0-9.]/g, "");

  // Helper function to calculate exact days between start and end dates
  const calculateCoverageDuration = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return "N/A";

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "N/A";

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Invalid Range";
    return `${diffDays} Days`;
  };

  const handleSaveAction = async () => {
    const success = await onSave();
    if (success) {
      setIsEditMode(false);
    }
  };

  const handleCancelAction = () => {
    setIsEditMode(false);
  };

  const handleConfirmCancelPolicy = async () => {
    if (onCancelPolicy) {
      // Passes policy ID (uses formData.id or formData.insuranceId, fallback to 2 from fetch payload)
      const insuranceId = formData.id || formData.insuranceId || 2;
      await onCancelPolicy(insuranceId);
    }
    setIsCancelModalOpen(false);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 space-y-4 font-poppins relative transition-all duration-300 h-full flex flex-col justify-between">
      <div>
        {/* Header section with inline action controls */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-4">
          <h3 className="text-xs text-blue-600 uppercase tracking-wider font-bold">
            Insurance Details
          </h3>

          <div className="flex items-center gap-1.5">
            {isEditMode ? (
              <>
                {/* Cancel Button (Returns to Read-Only Mode) */}
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCancelAction}
                  className="p-1.5 rounded-full border bg-white text-gray-500 border-gray-200 hover:bg-gray-50 transition-all shadow-sm cursor-pointer focus:outline-none outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cancel Changes"
                >
                  <X size={15} className="stroke-[2.5]" />
                </button>

                {/* Green Save Tick Button */}
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveAction}
                  className="p-1.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm cursor-pointer focus:outline-none outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Save Changes"
                >
                  {saving ? (
                    <Loader2
                      size={15}
                      className="animate-spin text-emerald-600 stroke-[2.5]"
                    />
                  ) : (
                    <Check size={15} className="stroke-[3]" />
                  )}
                </button>
              </>
            ) : (
              /* Pencil Edit Trigger Button */
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="p-1.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 transition-all shadow-sm cursor-pointer focus:outline-none outline-none"
                title="Edit Insurance Fields"
              >
                <Edit2 size={15} className="stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Insurance Provider Lookup */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-gray-600 font-medium">
                Insurance Provider <span className="text-red-500">*</span>
              </label>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => setIsProviderOpen(true)}
                  className="flex items-center gap-0.5 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-[11px] focus:outline-none outline-none"
                >
                  <Plus size={12} className="stroke-[3]" />
                  <span>Add</span>
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <select
                name="insuranceProvider"
                value={formData.insuranceProvider}
                onChange={handleChange}
                disabled={!isEditMode}
                className={`w-full border rounded-md p-2 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 pr-8 transition-colors ${
                  isEditMode
                    ? "border-gray-300 bg-white cursor-pointer"
                    : "border-gray-200 bg-gray-50/70 text-gray-600 cursor-not-allowed"
                }`}
              >
                <option value="">Select Insurance Provider</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.provider_name}
                  </option>
                ))}
              </select>
              {isEditMode && (
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 text-gray-400 pointer-events-none"
                />
              )}
            </div>
          </div>

          {/* Policy Number */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Policy Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="policyNumber"
              value={formData.policyNumber}
              onChange={handleChange}
              disabled={!isEditMode}
              className={`w-full border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                isEditMode
                  ? "border-gray-300 bg-white"
                  : "border-gray-200 bg-gray-50/70 text-gray-600 cursor-not-allowed"
              }`}
            />
          </div>

          {/* Insurance Type Lookup */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-gray-600 font-medium">
                Insurance Type <span className="text-red-500">*</span>
              </label>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => setIsInsuranceTypeOpen(true)}
                  className="flex items-center gap-0.5 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-[11px] focus:outline-none outline-none"
                >
                  <Plus size={12} className="stroke-[3]" />
                  <span>Add</span>
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <select
                name="insuranceType"
                value={formData.insuranceType}
                onChange={handleChange}
                disabled={!isEditMode}
                className={`w-full border rounded-md p-2 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 pr-8 transition-colors ${
                  isEditMode
                    ? "border-gray-300 bg-white cursor-pointer"
                    : "border-gray-200 bg-gray-50/70 text-gray-600 cursor-not-allowed"
                }`}
              >
                <option value="">Select Insurance Type</option>
                {insuranceTypes.map((typeItem) => (
                  <option key={typeItem.id} value={typeItem.id}>
                    {typeItem.type_name}
                  </option>
                ))}
              </select>
              {isEditMode && (
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 text-gray-400 pointer-events-none"
                />
              )}
            </div>
          </div>

          {/* Coverage Type Lookup */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-gray-600 font-medium">
                Coverage Type <span className="text-red-500">*</span>
              </label>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => setIsCoverageTypeOpen(true)}
                  className="flex items-center gap-0.5 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-[11px] focus:outline-none outline-none"
                >
                  <Plus size={12} className="stroke-[3]" />
                  <span>Add</span>
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <select
                name="coverageType"
                value={formData.coverageType}
                onChange={handleChange}
                disabled={!isEditMode}
                className={`w-full border rounded-md p-2 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 pr-8 transition-colors ${
                  isEditMode
                    ? "border-gray-300 bg-white cursor-pointer"
                    : "border-gray-200 bg-gray-50/70 text-gray-600 cursor-not-allowed"
                }`}
              >
                <option value="">Select Coverage Type</option>
                {coverageTypes.map((coverage) => (
                  <option key={coverage.id} value={coverage.id}>
                    {coverage.coverage_name}
                  </option>
                ))}
              </select>
              {isEditMode && (
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 text-gray-400 pointer-events-none"
                />
              )}
            </div>
          </div>

          {/* Sum Insured */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Sum Insured <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="sumInsured"
              value={stripCurrency(formData.sumInsured)}
              onChange={handleChange}
              disabled={!isEditMode}
              className={`w-full border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                isEditMode
                  ? "border-gray-300 bg-white"
                  : "border-gray-200 bg-gray-50/70 text-gray-600 font-semibold cursor-not-allowed"
              }`}
            />
          </div>

          {/* Premium Amount */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Premium Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="premiumAmount"
              value={stripCurrency(formData.premiumAmount)}
              onChange={handleChange}
              disabled={!isEditMode}
              className={`w-full border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                isEditMode
                  ? "border-gray-300 bg-white"
                  : "border-gray-200 bg-gray-50/70 text-gray-600 font-semibold cursor-not-allowed"
              }`}
            />
          </div>

          {/* Premium Paid By Selector */}
          <div className="relative">
            <label className="block text-gray-600 font-medium mb-1">
              Premium Paid By <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <select
                name="premiumPaidBy"
                value={formData.premiumPaidBy}
                onChange={handleChange}
                disabled={!isEditMode}
                className={`w-full border rounded-md p-2 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 pr-8 transition-colors ${
                  isEditMode
                    ? "border-gray-300 bg-white cursor-pointer"
                    : "border-gray-200 bg-gray-50/70 text-gray-600 cursor-not-allowed"
                }`}
              >
                <option value="">Select Premium Paid By</option>
                <option value="Company">Company</option>
                <option value="Employee">Employee</option>
                <option value="Shared">Shared</option>
              </select>
              {isEditMode && (
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 text-gray-400 pointer-events-none"
                />
              )}
            </div>
          </div>

          {/* Conditional Company Contribution Element */}
          {(currentPremiumPaidBy === "Company" ||
            currentPremiumPaidBy === "Shared") && (
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Company Contribution <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="companyContribution"
                value={stripCurrency(formData.companyContribution)}
                onChange={handleChange}
                disabled={!isEditMode}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                  isEditMode
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-50/70 text-gray-600 cursor-not-allowed"
                }`}
              />
            </div>
          )}

          {/* Conditional Employee Contribution Element */}
          {(currentPremiumPaidBy === "Employee" ||
            currentPremiumPaidBy === "Shared") && (
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Employee Contribution <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="employeeContribution"
                value={stripCurrency(formData.employeeContribution)}
                onChange={handleChange}
                disabled={!isEditMode}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                  isEditMode
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-50/70 text-gray-600 cursor-not-allowed"
                }`}
              />
            </div>
          )}

          {/* Policy Start Date */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Policy Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="policyStartDate"
              value={formData.policyStartDate}
              onChange={handleChange}
              disabled={!isEditMode}
              className={`w-full border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                isEditMode
                  ? "border-gray-300 bg-white"
                  : "border-gray-200 bg-gray-50/70 text-gray-600 cursor-not-allowed"
              }`}
            />
          </div>

          {/* Policy End Date */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Policy End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="policyEndDate"
              value={formData.policyEndDate}
              onChange={handleChange}
              disabled={!isEditMode}
              className={`w-full border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                isEditMode
                  ? "border-gray-300 bg-white"
                  : "border-gray-200 bg-gray-50/70 text-gray-600 cursor-not-allowed"
              }`}
            />
          </div>

          {/* Coverage Duration (Calculated dynamically) */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Coverage Duration
            </label>
            <input
              type="text"
              disabled
              value={
                formData.policyStartDate && formData.policyEndDate
                  ? calculateCoverageDuration(
                      formData.policyStartDate,
                      formData.policyEndDate,
                    )
                  : formData.coverageDuration || "365 Days"
              }
              className="w-full border border-gray-200 bg-gray-50 text-gray-700 font-semibold rounded-md p-2 cursor-not-allowed"
            />
          </div>

          {/* Renewal Reminder Threshold Option Menus */}
          <div className="relative">
            <label className="block text-gray-600 font-medium mb-1">
              Renewal Reminder <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <select
                name="renewalReminder"
                value={formData.renewalReminder}
                onChange={handleChange}
                disabled={!isEditMode}
                className={`w-full border rounded-md p-2 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 pr-8 transition-colors ${
                  isEditMode
                    ? "border-gray-300 bg-white cursor-pointer"
                    : "border-gray-200 bg-gray-50/70 text-gray-600 cursor-not-allowed"
                }`}
              >
                <option value="">Select Renewal Reminder</option>
                <option value="7">7 Days</option>
                <option value="15">15 Days</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
              </select>
              {isEditMode && (
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 text-gray-400 pointer-events-none"
                />
              )}
            </div>
          </div>

          {/* Policy Status Badge Information & Actions Context */}
          <div className="md:col-span-2">
            <label className="block text-gray-600 font-medium mb-1">
              Policy Status
            </label>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>{" "}
                {formData.policyStatus || "Active"}
              </span>

              {/* Status Info Tooltip Toggle */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onMouseEnter={() => setShowStatusTooltip(true)}
                  onMouseLeave={() => setShowStatusTooltip(false)}
                  onClick={() => setShowStatusTooltip(!showStatusTooltip)}
                  className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer focus:outline-none p-0.5"
                  title="View policy status details"
                >
                  <Info size={15} />
                </button>

                {/* Information Popover Details */}
                {showStatusTooltip && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 text-white text-[11px] rounded-lg shadow-xl z-50 pointer-events-none leading-relaxed">
                    <p className="font-semibold text-blue-300 mb-1">
                      Policy Metadata
                    </p>
                    <p>
                      • Policy ID: {formData.id || formData.insuranceId || 2}
                    </p>
                    <p>
                      • Policy No: {formData.policyNumber || "SH-2027-0001"}
                    </p>
                    <p>
                      • Renewal Window: {formData.renewalReminder || 30} days
                      prior
                    </p>
                  </div>
                )}
              </div>

              {/* Cancel Policy Action Button (EXCLUSIVELY shown in READ-ONLY mode) */}
              {!isEditMode && (
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors shadow-sm cursor-pointer"
                  title="Cancel Policy"
                >
                  <Ban size={13} className="text-orange-600" />
                  <span>Cancel </span>
                </button>
              )}

              <span className="text-[11px] text-gray-400 ml-auto">
                Status is auto-updated based on policy end date.
              </span>
            </div>
          </div>
        </div>

        {/* Narrative Notes Block Component View */}
        <div className="pt-2 text-xs">
          <label className="block text-gray-600 font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            rows="3"
            value={formData.notes || ""}
            onChange={handleChange}
            disabled={!isEditMode}
            className={`w-full border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
              isEditMode
                ? "border-gray-300 bg-white"
                : "border-gray-200 bg-gray-50/70 text-gray-600 cursor-not-allowed"
            }`}
            maxLength={500}
          ></textarea>
          {isEditMode && (
            <div className="text-right text-[10px] text-gray-400 mt-0.5">
              {formData.notes?.length || 0} / 500
            </div>
          )}
        </div>
      </div>

      {/* Embedded Cancel Confirmation Modal Overlay */}
      <CancelConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancelPolicy}
        itemName={formData.policyNumber || "Star Health Insurance"}
      />

      {/* Configuration modal overlays containers */}
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
