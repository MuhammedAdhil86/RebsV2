import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react"; // Added Info and X icons
import {
  getPayrollTdsDeductionSections,
  getTdsActiveFinancialYear,
} from "../service/payrollother";

const UpdateDeclarationModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
  selectedRow,
}) => {
  const [sections, setSections] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false); // State for info visibility

  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        setLoading(true);
        try {
          const [sec, fyResponse] = await Promise.all([
            getPayrollTdsDeductionSections(),
            getTdsActiveFinancialYear(),
          ]);
          setSections(Array.isArray(sec) ? sec : []);
          const activeYear = fyResponse?.data || fyResponse;
          setYears(activeYear ? [activeYear] : []);
          if (activeYear?.id) {
            setFormData((prev) => ({
              ...prev,
              financial_year_id: activeYear.id,
            }));
          }
        } catch (err) {
          console.error("Failed to load modal options", err);
        } finally {
          setLoading(false);
        }
      };
      loadOptions();
    }
  }, [isOpen]);

  const handleStatusChange = (newStatus) => {
    setFormData((prev) => ({
      ...prev,
      status: newStatus,
      approved_amount: newStatus === "approved" ? prev.approved_amount : "",
    }));
  };

  const handleSave = () => {
    onSave({
      declaration: {
        user_id: String(selectedRow?.user_id),
        financial_year_id: Number(formData.financial_year_id),
        section_code_id: Number(formData.section_code_id),
        approved_amount:
          formData.status === "approved"
            ? Number(formData.approved_amount || 0)
            : 0,
        status: formData.status,
        remarks: formData.remarks,
      },
    });
  };

  if (!isOpen) return null;

  const FieldRow = ({ label, original, form }) => (
    <div className="grid grid-cols-2 gap-8 items-center py-2 border-b border-gray-100">
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400">{label}</span>
        <span className="text-xs text-gray-700">{original}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 mb-1">{label}</span>
        {form}
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl relative">
        <h3 className="text-sm font-normal mb-6 border-b pb-3 flex items-center gap-2">
          Update Declaration
          {/* Info Icon */}
          <Info
            size={14}
            className="text-blue-500 cursor-pointer"
            onClick={() => setShowInfo(true)}
          />
        </h3>

        {/* Info Box (Lorem Ipsum) */}
        {showInfo && (
          <div className="absolute top-12 left-6 right-6 bg-blue-50 border border-blue-200 p-4 rounded-lg z-10 shadow-lg">
            <button
              className="absolute top-2 right-2 text-gray-400"
              onClick={() => setShowInfo(false)}
            >
              <X size={14} />
            </button>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              <strong>Submission Guidelines:</strong> Please ensure the
              Financial Year and Section Code are correctly mapped to the
              employee's declaration. Both fields are mandatory to process the
              update. Incomplete information will result in a validation error.
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-xs text-center py-4">Loading...</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-8 mb-4">
              <h4 className="text-[10px] text-gray-400 uppercase tracking-wider">
                Original Data
              </h4>
              <h4 className="text-[10px] text-gray-400 uppercase tracking-wider">
                Update Form
              </h4>
            </div>

            <FieldRow
              label="Financial Year"
              original={selectedRow?.financial_year}
              form={
                <select
                  className="w-full border rounded p-1.5 text-xs"
                  value={formData.financial_year_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      financial_year_id: Number(e.target.value),
                    })
                  }
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              }
            />

            <FieldRow
              label="Section"
              original={selectedRow?.section_code}
              form={
                <select
                  className="w-full border rounded p-1.5 text-xs"
                  value={formData.section_code_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_code_id: Number(e.target.value),
                    })
                  }
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.section_code} - {s.description}
                    </option>
                  ))}
                </select>
              }
            />

            <FieldRow
              label="Status"
              original={selectedRow?.status}
              form={
                <select
                  className="w-full border rounded p-1.5 text-xs"
                  value={formData.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              }
            />

            <FieldRow
              label="Approved Amount"
              original={selectedRow?.declared_amount}
              form={
                <input
                  type="text"
                  disabled={formData.status !== "approved"}
                  className={`w-full border rounded p-1.5 text-xs outline-none transition-colors ${
                    formData.status === "approved"
                      ? "bg-blue-50 border-blue-200 focus:ring-1 focus:ring-blue-500"
                      : "bg-gray-100 border-gray-200 cursor-not-allowed"
                  }`}
                  value={formData.approved_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      approved_amount: e.target.value,
                    })
                  }
                />
              }
            />

            <div className="pt-2">
              <span className="text-[10px] text-gray-400 block mb-1">
                Remarks
              </span>
              <textarea
                className="w-full border rounded p-2 text-xs focus:ring-1 focus:ring-gray-300 outline-none"
                rows={2}
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs border rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-xs bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default UpdateDeclarationModal;
