import React, { useState, useEffect, useRef } from "react";
import { Drawer } from "@mui/material";
import { FiX, FiCamera, FiPlus, FiCalendar, FiTool } from "react-icons/fi";
import toast from "react-hot-toast";
import { createAsset, assetType, addAsset } from "../../service/assetservice";

const CreateAssetDrawer = ({ open, onClose, onAssetCreated }) => {
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  // States for the Asset Type Modal
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [isAddingType, setIsAddingType] = useState(false);

  const [formData, setFormData] = useState({
    asset_name: "",
    asset_type: "",
    condition: "New",
    purchase_date: "",
    last_maintenance: "",
    asset_status: "available",
    image: null,
  });

  const selectStyle = `
    appearance-none 
    bg-no-repeat 
    bg-[length:16px] 
    bg-[right_10px_center] 
    w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700 font-poppins
  `;

  const arrowIcon = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`;

  // Parse errors from stringified JSON, responseText, or Error instances
  const parseBackendError = (err) => {
    if (!err) return "An unknown error occurred";

    // Direct error thrown from service
    if (err.message && !err.response) {
      return err.message;
    }

    let raw =
      err.response?.data ||
      err.responseText ||
      err.response?.request?.responseText ||
      err.message ||
      err;

    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          raw = JSON.parse(trimmed);
        } catch (e) {
          return trimmed;
        }
      } else {
        return trimmed;
      }
    }

    if (typeof raw === "object" && raw !== null) {
      const msg = raw.message || raw.error || "";
      const detail = raw.data;

      if (msg && detail) {
        const formattedDetail =
          typeof detail === "object" ? JSON.stringify(detail) : detail;
        return `${msg}: ${formattedDetail}`;
      }
      if (msg) return msg;
      if (detail)
        return typeof detail === "object" ? JSON.stringify(detail) : detail;
    }

    return String(raw);
  };

  const loadTypes = async () => {
    try {
      const res = await assetType();
      setAssetTypes(res || []);
    } catch (err) {
      toast.error(parseBackendError(err));
    }
  };

  useEffect(() => {
    if (open) {
      loadTypes();
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === "asset_status" ? value.toLowerCase() : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddAssetType = async (e) => {
    if (e) e.preventDefault();
    if (!newTypeName.trim()) return toast.error("Please enter a type name");

    setIsAddingType(true);
    try {
      await addAsset({ name: newTypeName });
      toast.success("Asset type added successfully");
      setNewTypeName("");
      setIsTypeModalOpen(false);
      await loadTypes();
    } catch (err) {
      toast.error(parseBackendError(err));
    } finally {
      setIsAddingType(false);
    }
  };

  const formatToISO = (dateStr) =>
    dateStr ? new Date(dateStr).toISOString() : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = new FormData();
    payload.append("asset_name", formData.asset_name);
    payload.append("asset_type", formData.asset_type);
    payload.append("asset_status", formData.asset_status);
    payload.append("purchase_date", formatToISO(formData.purchase_date));
    payload.append("condition", formData.condition);
    payload.append("last_maintenance", formatToISO(formData.last_maintenance));

    if (formData.image) payload.append("image", formData.image);

    try {
      const res = await createAsset(payload);

      if (res && (res.status_code >= 400 || res.status >= 400)) {
        const msg = res.message || "Failed to add physical asset";
        const detail = res.data ? `: ${res.data}` : "";
        toast.error(`${msg}${detail}`, { duration: 6000 });
        return;
      }

      toast.success(res?.message || "Physical Asset added successfully");
      onAssetCreated();
      handleClose();
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors) {
        setErrors(errorData.errors);
        Object.values(errorData.errors)
          .flat()
          .forEach((msg) => toast.error(msg, { duration: 6000 }));
      } else {
        const errorMessage = parseBackendError(err);
        toast.error(errorMessage, { duration: 6000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      asset_name: "",
      asset_type: "",
      condition: "New",
      purchase_date: "",
      last_maintenance: "",
      asset_status: "available",
      image: null,
    });
    setErrors({});
    setImagePreview(null);
    onClose();
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        disableEnforceFocus
        PaperProps={{
          className: "w-full max-w-[500px] border-none shadow-2xl",
        }}
      >
        <div className="h-full flex flex-col bg-white font-poppins text-[12px]">
          <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100 bg-white">
            <div>
              <h2 className="text-gray-900 text-[16px] font-regular tracking-tight uppercase">
                New Physical Asset
              </h2>
              <p className="text-gray-400 text-[10px] tracking-wider mt-1 font-regular uppercase">
                Register hardware & equipment
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
            >
              <FiX size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
          >
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-[2rem] bg-gray-50 hover:bg-gray-100 transition-all group relative overflow-hidden h-44">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  className="absolute inset-0 w-full h-full object-cover"
                  alt="preview"
                />
              ) : (
                <div className="text-center">
                  <FiCamera
                    className="mx-auto text-gray-300 group-hover:text-black transition-colors mb-2"
                    size={30}
                  />
                  <p className="text-gray-400 text-[10px] uppercase font-regular tracking-widest">
                    Asset Photo
                  </p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="absolute inset-0 w-full h-full bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center text-transparent group-hover:text-white font-regular"
              >
                Change Image
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-[10px] tracking-widest uppercase font-regular ml-1">
                Asset Name
              </label>
              <input
                required
                name="asset_name"
                value={formData.asset_name}
                onChange={handleChange}
                placeholder="e.g. MacBook Pro M3"
                className={`w-full bg-white border ${errors.asset_name ? "border-red-500" : "border-gray-300"} rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700 font-regular`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-gray-400 text-[10px] tracking-widest uppercase font-regular ml-1">
                  Asset Type
                </label>
                <select
                  required
                  name="asset_type"
                  value={formData.asset_type}
                  onChange={(e) => {
                    if (e.target.value === "ADD_NEW") {
                      setIsTypeModalOpen(true);
                      e.target.value = "";
                    } else {
                      handleChange(e);
                    }
                  }}
                  style={{ backgroundImage: arrowIcon }}
                  className={`${selectStyle} ${errors.asset_type ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Select Type</option>
                  <option
                    value="ADD_NEW"
                    className="text-blue-600 font-regular"
                  >
                    + Add Asset Type
                  </option>
                  {assetTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.asset_type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-gray-400 text-[10px] tracking-widest uppercase font-regular ml-1">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  style={{ backgroundImage: arrowIcon }}
                  className={selectStyle}
                >
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                  <option value="Refurbished">Refurbished</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-[10px] tracking-widest uppercase font-regular ml-1">
                Asset Status
              </label>
              <select
                name="asset_status"
                value={formData.asset_status}
                onChange={handleChange}
                style={{ backgroundImage: arrowIcon }}
                className={selectStyle}
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-gray-400 text-[10px] tracking-widest uppercase font-regular ml-1">
                  Purchase Date
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleChange}
                    className={`w-full bg-white border ${errors.purchase_date ? "border-red-500" : "border-gray-300"} rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700 font-regular`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-gray-400 text-[10px] tracking-widest uppercase font-regular ml-1">
                  Last Maintenance
                </label>
                <div className="relative">
                  <FiTool className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="last_maintenance"
                    value={formData.last_maintenance}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-300 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700 font-regular"
                  />
                </div>
              </div>
            </div>
          </form>

          <div className="p-8 border-t border-gray-100 flex items-center justify-between bg-white sticky bottom-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-10 py-4 bg-white border border-black rounded-2xl text-black hover:bg-gray-50 transition-all font-regular uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-3 bg-black text-white px-10 py-4 rounded-2xl font-regular uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Asset"} <FiPlus />
            </button>
          </div>
        </div>
      </Drawer>

      {/* ASSET TYPE MODAL */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div
            className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl font-poppins"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[14px] uppercase tracking-widest text-gray-900 font-regular">
                  New Asset Type
                </h3>
                <p className="text-gray-400 text-[10px] uppercase mt-1">
                  Define hardware category
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTypeModalOpen(false)}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-gray-400 text-[10px] tracking-widest uppercase ml-1">
                  Category Name
                </label>
                <input
                  type="text"
                  autoFocus
                  name="new_type_input"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="e.g. Laptop, Furniture"
                  className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700 font-regular"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddAssetType();
                  }}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(false)}
                  className="flex-1 py-4 border border-black rounded-2xl text-black uppercase text-[10px] tracking-widest font-regular hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddAssetType}
                  disabled={isAddingType}
                  className="flex-1 py-4 bg-black text-white rounded-2xl uppercase text-[10px] tracking-widest font-regular disabled:opacity-50 hover:bg-gray-800 transition-all shadow-lg"
                >
                  {isAddingType ? "Saving..." : "Save Type"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateAssetDrawer;
