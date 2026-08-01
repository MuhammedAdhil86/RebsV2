import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import GlowButton from "../components/helpers/glowbutton";
import { toast } from "react-hot-toast";
import { submitUpsertCoverageType } from "../service/insuranceservice";

const CoverageTypeModal = ({ isOpen, onClose, initialData, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    coverage_name: "",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          coverage_name: initialData.coverage_name || "",
          description: initialData.description || "",
        });
      } else {
        setFormData({ coverage_name: "", description: "" });
      }
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    setFormData({ coverage_name: "", description: "" });
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.coverage_name.trim())
      return toast.error("Please enter a coverage title");

    setLoading(true);
    try {
      await submitUpsertCoverageType(formData);
      toast.success("Coverage tier saved successfully!");
      if (onRefresh) onRefresh();
      handleClose();
    } catch (err) {
      toast.error(err.message || "Something went wrong", {
        duration: 5000,
        style: {
          background: "#000",
          color: "#fff",
          borderRadius: "12px",
          fontSize: "12px",
          padding: "16px",
          border: "1px solid #333",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins">
      <div className="bg-white w-[50%] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Configure Coverage Types
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <Icon icon="heroicons:x-mark-20-solid" className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar text-xs">
          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Coverage Scope Name
            </label>
            <input
              type="text"
              value={formData.coverage_name}
              onChange={(e) =>
                setFormData({ ...formData, coverage_name: e.target.value })
              }
              placeholder="e.g., Family Floater"
              className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Scope Parameters / Description
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Provides health insurance coverage for the employee and family members..."
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-gray-800"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-gray-100 flex justify-end items-center gap-3 sticky bottom-0 bg-white">
            <button
              onClick={handleClose}
              className="bg-white text-gray-800 text-xs px-6 py-2.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <GlowButton onClick={handleSubmit} disabled={loading}>
              <span className="text-white text-xs px-2">
                {loading ? "Processing..." : "Save"}
              </span>
            </GlowButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverageTypeModal;
