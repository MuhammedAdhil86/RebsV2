import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import GlowButton from "../components/helpers/glowbutton";
import { toast } from "react-hot-toast";
import { submitUpsertInsuranceProvider } from "../service/insuranceservice";

const InsuranceProviderModal = ({
  isOpen,
  onClose,
  initialData,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ id: 0, provider_name: "" });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          id: initialData.id || 0,
          provider_name: initialData.provider_name || "",
        });
      } else {
        setFormData({ id: 0, provider_name: "" });
      }
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    setFormData({ id: 0, provider_name: "" });
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.provider_name.trim())
      return toast.error("Please enter a provider name");

    setLoading(true);
    try {
      const payload = { provider_name: formData.provider_name.trim() };
      if (formData.id !== 0) {
        payload.id = formData.id;
      }

      await submitUpsertInsuranceProvider(payload);
      toast.success(
        formData.id === 0
          ? "Provider added successfully!"
          : "Provider updated successfully!",
      );
      if (onRefresh) onRefresh();
      handleClose();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Something went wrong";
      toast.error(errorMsg, {
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
      <div className="bg-white w-[40%] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20">
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {formData.id === 0
                ? "Add Insurance Provider"
                : "Edit Insurance Provider"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <Icon icon="heroicons:x-mark-20-solid" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar text-xs">
          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Provider Name
            </label>
            <input
              type="text"
              value={formData.provider_name}
              onChange={(e) =>
                setFormData({ ...formData, provider_name: e.target.value })
              }
              placeholder="e.g., ICICI Lombard"
              className="w-full border border-gray-300 rounded-md p-2 bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
            />
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end items-center gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
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

export default InsuranceProviderModal;
