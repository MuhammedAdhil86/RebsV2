import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import GlowButton from "../components/helpers/glowbutton";
import { toast } from "react-hot-toast";
import { submitUpsertInsuranceType } from "../service/insuranceservice";

const InsuranceTypeModal = ({ isOpen, onClose, initialData, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type_name: "",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          type_name: initialData.type_name || "",
          description: initialData.description || "",
        });
      } else {
        setFormData({ type_name: "", description: "" });
      }
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    setFormData({ type_name: "", description: "" });
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.type_name.trim())
      return toast.error("Please enter a type name");

    setLoading(true);
    try {
      await submitUpsertInsuranceType(formData);
      toast.success("Insurance type processed successfully!");
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
              Manage Insurance Type
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
              Type Name
            </label>
            <input
              type="text"
              value={formData.type_name}
              onChange={(e) =>
                setFormData({ ...formData, type_name: e.target.value })
              }
              placeholder="e.g., Health Insurance"
              className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Description
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Provides medical expense coverage for employees..."
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

export default InsuranceTypeModal;
