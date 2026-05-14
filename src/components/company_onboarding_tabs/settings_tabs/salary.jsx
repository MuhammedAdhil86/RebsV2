import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import payrollService from "../../../service/payrollService";
import {
  fetchUserPayrollTemplates,
  allocatePayrollTemplate,
} from "../../../service/staffservice";
import toast, { Toaster } from "react-hot-toast";

export default function SalarySection({ uuid }) {
  const [templateName, setTemplateName] = useState("-");
  const [salaryCycle, setSalaryCycle] = useState("Week 1");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [templates, setTemplates] = useState([]);
  const [showPayrollModal, setShowPayrollModal] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [payrollFrom, setPayrollFrom] = useState("");
  const [payrollTo, setPayrollTo] = useState("");

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
        const currentTemplateId = templateData?.allocation?.template?.id || "";

        setTemplateName(currentTemplate);
        setSelectedTemplateId(currentTemplateId);
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

  /* Save payroll allocation */
  const savePayroll = async () => {
    if (!selectedTemplateId || !payrollFrom) {
      toast.error("Please select template and Effective From date.");
      return;
    }

    if (payrollTo && payrollFrom > payrollTo) {
      toast.error("Effective To date cannot be before Effective From date.");
      return;
    }

    try {
      const payload = {
        user_id: uuid,
        template_id: selectedTemplateId,
        effective_from: new Date(payrollFrom).toISOString(),
        effective_to: payrollTo ? new Date(payrollTo).toISOString() : null,
      };

      const response = await allocatePayrollTemplate(payload);

      const message = response?.data?.message;
      if (message) toast.success(message);

      const templateObj = templates.find(
        (t) => t.id === Number(selectedTemplateId),
      );
      setTemplateName(templateObj?.name || "-");

      setShowPayrollModal(false);
      setIsEditing(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save payroll");
    }
  };

  if (isLoading)
    return <div className="text-gray-500 p-4">Loading salary details...</div>;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border w-full">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">Salary</h3>
        {!isEditing && (
          <Icon
            icon="basil:edit-outline"
            className="w-5 h-5 text-gray-400 cursor-pointer"
            onClick={() => setIsEditing(true)}
          />
        )}
      </div>

      {/* Salary Details */}
      <div className="space-y-2">
        <div className="flex justify-between items-center border-b border-gray-100 py-2">
          <span className="text-gray-500 text-[12px]">Payroll Template</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 text-[13px]">
              {templateName}
            </span>
            {isEditing && (
              <button
                className="text-blue-600 text-[12px] hover:underline"
                onClick={() => {
                  setPayrollFrom(new Date().toISOString().split("T")[0]);
                  setPayrollTo("");
                  setShowPayrollModal(true);
                }}
              >
                Change
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showPayrollModal && (
        <Modal
          title="Change Payroll Template"
          onClose={() => setShowPayrollModal(false)}
        >
          <div className="flex flex-col gap-2 font-['Poppins'] text-[12px] relative z-50">
            {/* Native Select */}
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
              className="border rounded px-2 py-1 h-[30px] text-[12px] font-['Poppins'] bg-white z-50"
            >
              <option value="">Select Template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={payrollFrom}
              onChange={(e) => setPayrollFrom(e.target.value)}
              className="border rounded px-2 py-1 h-[30px] text-[12px] font-['Poppins']"
            />

            <input
              type="date"
              value={payrollTo}
              onChange={(e) => setPayrollTo(e.target.value)}
              className="border rounded px-2 py-1 h-[30px] text-[12px] font-['Poppins']"
            />

            <button
              className="bg-black text-white px-4 py-1 rounded mt-2 text-[12px] font-['Poppins']"
              onClick={savePayroll}
            >
              Save Payroll
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------
   Modal Component
-------------------------- */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-4 w-[300px] space-y-3 font-['Poppins'] text-[12px] overflow-visible">
        <div className="flex justify-between items-center">
          <h3 className="font-normal text-[12px]">{title}</h3>
          <button className="text-gray-500 text-[12px]" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="relative z-50">{children}</div>
      </div>
    </div>
  );
}
