import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { ChevronDown } from "lucide-react";
import payrollService from "../../../service/payrollService";
import {
  fetchUserPayrollTemplates,
  allocatePayrollTemplate,
} from "../../../service/staffservice";
import useEmployeeStore from "../../../store/employeeStore";
import toast, { Toaster } from "react-hot-toast";

export default function SalarySection({ uuid }) {
  const { selectedEmployee } = useEmployeeStore();

  const [templateName, setTemplateName] = useState("-");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [templates, setTemplates] = useState([]);
  const [showPayrollModal, setShowPayrollModal] = useState(false);

  const [currentTemplateId, setCurrentTemplateId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [payrollFrom, setPayrollFrom] = useState("");
  const [payrollTo, setPayrollTo] = useState("");
  const [saving, setSaving] = useState(false);

  // Template change chosen in the modal, waiting for the header "Save"
  const [pendingChange, setPendingChange] = useState(null);

  // Read-only: comes straight from the staff record (e.g. "Annually")
  const salaryPeriod = selectedEmployee?.salary_period || "-";

  /* Fetch payroll templates */
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await payrollService.getSalaryTemplates();
        setTemplates(data || []);
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to fetch payroll templates",
        );
      }
    };
    fetchTemplates();
  }, []);

  /* Fetch user payroll allocation */
  useEffect(() => {
    if (!uuid) return;

    const fetchPayroll = async () => {
      setIsLoading(true);
      try {
        const templateData = await fetchUserPayrollTemplates(uuid);

        const currentTemplate = templateData?.allocation?.template?.name || "-";
        const templateId = templateData?.allocation?.template?.id || "";

        setTemplateName(currentTemplate);
        setSelectedTemplateId(templateId);
        setCurrentTemplateId(templateId);
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to fetch payroll template",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayroll();
  }, [uuid]);

  const openPayrollModal = () => {
    if (pendingChange) {
      setSelectedTemplateId(pendingChange.templateId);
      setPayrollFrom(pendingChange.from);
      setPayrollTo(pendingChange.to);
    } else {
      setSelectedTemplateId(currentTemplateId);
      setPayrollFrom(new Date().toISOString().split("T")[0]);
      setPayrollTo("");
    }
    setShowPayrollModal(true);
  };

  // Close without applying: restore the last applied / current template
  const closePayrollModal = () => {
    setSelectedTemplateId(pendingChange?.templateId ?? currentTemplateId);
    setShowPayrollModal(false);
  };

  // Modal "Apply": validate and hold the change; nothing is sent yet
  const applyPayrollChange = () => {
    if (!selectedTemplateId || !payrollFrom) {
      toast.error("Please select template and Effective From date.");
      return;
    }
    if (payrollTo && payrollTo < payrollFrom) {
      toast.error("Effective To date cannot be before Effective From date.");
      return;
    }

    const templateObj = templates.find(
      (t) => t.id === Number(selectedTemplateId),
    );
    setPendingChange({
      templateId: Number(selectedTemplateId),
      templateName: templateObj?.name || "-",
      from: payrollFrom,
      to: payrollTo,
    });
    setShowPayrollModal(false);
  };

  // Header "Save": send the pending allocation
  const savePayroll = async () => {
    if (!pendingChange) {
      toast.error("No changes to save.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: uuid,
        template_id: pendingChange.templateId,
        effective_from: new Date(pendingChange.from).toISOString(),
        effective_to: pendingChange.to
          ? new Date(pendingChange.to).toISOString()
          : null,
      };

      const response = await allocatePayrollTemplate(payload);

      const message = response?.data?.message;
      toast.success(message || "Payroll template updated successfully!");

      setTemplateName(pendingChange.templateName);
      setCurrentTemplateId(pendingChange.templateId);
      setSelectedTemplateId(pendingChange.templateId);
      setPendingChange(null);
      setIsEditing(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save payroll");
    } finally {
      setSaving(false);
    }
  };

  // Header "Cancel": discard the pending change and leave edit mode
  const cancelEditing = () => {
    setPendingChange(null);
    setSelectedTemplateId(currentTemplateId);
    setShowPayrollModal(false);
    setIsEditing(false);
  };

  if (isLoading)
    return <div className="text-gray-500 p-4">Loading salary details...</div>;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border w-full">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">Annual CTC</h3>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={savePayroll}
              disabled={saving || !pendingChange}
              className={`text-sm text-blue-600 font-medium hover:underline ${
                saving || !pendingChange ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
          <Icon
            icon="basil:edit-outline"
            className="w-5 h-5 text-gray-400 cursor-pointer"
            onClick={() => (isEditing ? cancelEditing() : setIsEditing(true))}
            title={isEditing ? "Cancel edit" : "Edit"}
          />
        </div>
      </div>

      {/* Salary Details */}
      <div className="space-y-2">
        {/* Salary Period (read-only) */}
        <div className="flex justify-between items-center border-b border-gray-100 py-2">
          <span className="text-gray-500 text-[12px]">Salary Period</span>
          <span className="font-medium text-gray-800 text-[13px]">
            {salaryPeriod}
          </span>
        </div>

        {/* Payroll Template */}
        <div className="flex justify-between items-center border-b border-gray-100 py-2">
          <span className="text-gray-500 text-[12px]">Payroll Template</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 text-[13px]">
              {pendingChange ? pendingChange.templateName : templateName}
            </span>
            {pendingChange && (
              <span className="text-[10px] text-gray-600 bg-slate-100 border border-gray-200 rounded-full px-2 py-0.5">
                Unsaved
              </span>
            )}
            {isEditing && (
              <button
                className={
                  pendingChange
                    ? "text-blue-600 text-[12px] font-medium underline"
                    : "text-blue-600 text-[12px] hover:underline"
                }
                onClick={openPayrollModal}
              >
                Change
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= CHANGE PAYROLL TEMPLATE MODAL ================= */}
      {showPayrollModal && (
        <Modal
          title="Change Payroll Template"
          subtitle="Choose the template and dates, then press Apply and Save above."
          icon="solar:wallet-outline"
          width="460px"
          onClose={closePayrollModal}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closePayrollModal}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-[12px] font-normal text-gray-600 bg-white hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyPayrollChange}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-[12px] font-normal hover:bg-gray-800 transition-all shadow-sm cursor-pointer"
              >
                <Icon icon="solar:check-circle-outline" className="w-4 h-4" />
                Apply
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Current template */}
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
              <span className="text-[11px] text-gray-500">
                Current template
              </span>
              <span className="text-xs text-gray-900 bg-white border border-gray-200 rounded-full px-2.5 py-0.5">
                {templateName !== "-" ? templateName : "Not assigned"}
              </span>
            </div>

            {/* Template select */}
            <div>
              <label className="text-[11px] text-gray-500 block mb-1.5">
                Select target Template
              </label>
              <div className="relative">
                <select
                  value={selectedTemplateId}
                  onChange={(e) =>
                    setSelectedTemplateId(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-xs appearance-none text-gray-700 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
                >
                  <option value="">Choose Payroll Template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={14}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <DateField
                label="From Date"
                value={payrollFrom}
                onChange={setPayrollFrom}
              />
              <DateField
                label="To Date (optional)"
                value={payrollTo}
                min={payrollFrom || undefined}
                onChange={setPayrollTo}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================= Sub-components ================= */
function DateField({ label, value, onChange, min }) {
  const inputRef = useRef(null);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };

  return (
    <div>
      <label className="text-[11px] text-gray-500 block mb-1.5">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          value={value}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          onClick={openPicker}
          className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-xs text-gray-700 cursor-pointer focus:bg-white focus:border-gray-900 focus:outline-none transition-all [&::-webkit-calendar-picker-indicator]:hidden"
        />
        <button
          type="button"
          onClick={openPicker}
          tabIndex={-1}
          aria-label={`Open ${label} calendar`}
          className="absolute right-2.5 top-1/2 -translate-y-1/2"
        >
          <Icon icon="solar:calendar-outline" className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
}

function Modal({
  title,
  subtitle,
  icon,
  onClose,
  width = "340px",
  footer,
  children,
}) {
  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            {icon && (
              <span className="p-2 bg-slate-100 rounded-lg">
                <Icon icon={icon} className="w-5 h-5 text-black" />
              </span>
            )}
            <div>
              <h3 className="text-[16px] text-gray-900">{title}</h3>
              {subtitle && (
                <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="text-gray-400 hover:text-black transition-colors"
            onClick={onClose}
          >
            <Icon icon="material-symbols:close" className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/60 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
