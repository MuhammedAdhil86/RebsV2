import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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

  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        setLoading(true);
        try {
          const [sec, fy] = await Promise.all([
            getPayrollTdsDeductionSections(),
            getTdsActiveFinancialYear(),
          ]);
          setSections(Array.isArray(sec) ? sec : []);
          setYears(fy ? [fy] : []);
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
      approved_amount: newStatus === "approved" ? prev.approved_amount : 0,
    }));
  };

  const handleSave = () => {
    const payload = {
      declaration: {
        user_id: selectedRow?.user_id,
        financial_year_id: Number(formData.financial_year_id),
        section_code_id: Number(formData.section_code_id),
        approved_amount: Number(formData.approved_amount || 0),
        status: formData.status,
        remarks: formData.remarks,
      },
    };
    onSave(payload);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold mb-6 border-b pb-3">
          Update Declaration
        </h3>

        {loading ? (
          <p className="text-xs text-center py-4">Loading options...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Read-Only Data */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase">
                Original Data
              </h4>
              <div>
                <label className="text-[10px] text-gray-400">User ID</label>
                <div className="text-xs font-medium text-gray-700">
                  {selectedRow?.user_id}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">
                  Section Code
                </label>
                <div className="text-xs font-medium text-gray-700">
                  {selectedRow?.section_code}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">
                  Financial Year
                </label>
                <div className="text-xs font-medium text-gray-700">
                  {selectedRow?.financial_year}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">
                  Declared Amount
                </label>
                <div className="text-xs font-medium text-gray-700">
                  {selectedRow?.declared_amount}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">
                  Current Status
                </label>
                <div className="text-xs font-medium text-gray-700 capitalize">
                  {selectedRow?.status}
                </div>
              </div>
            </div>

            {/* Right Column: Edit Logic */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase">
                Update Form
              </h4>

              <div>
                <label className="text-[11px] text-gray-500">
                  Financial Year
                </label>
                <select
                  className="w-full border rounded p-2 text-xs"
                  value={formData.financial_year_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      financial_year_id: e.target.value,
                    })
                  }
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-500">Status</label>
                <select
                  className="w-full border rounded p-2 text-xs"
                  value={formData.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-500">Section</label>
                <select
                  className="w-full border rounded p-2 text-xs"
                  value={formData.section_code_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_code_id: e.target.value,
                    })
                  }
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.section_code} - {s.description}
                    </option>
                  ))}
                </select>
              </div>

              {formData.status === "approved" && (
                <div>
                  <label className="text-[11px] text-gray-500">
                    Approved Amount
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded p-2 text-xs"
                    value={formData.approved_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        approved_amount: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] text-gray-500">Remarks</label>
                <textarea
                  className="w-full border rounded p-2 text-xs"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8 border-t pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 border rounded-lg text-xs hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-black text-white rounded-lg text-xs hover:bg-gray-800"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default UpdateDeclarationModal;
