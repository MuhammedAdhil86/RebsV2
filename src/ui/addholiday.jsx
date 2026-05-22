import React, { useState, useEffect, useRef } from "react";
import { X, Upload, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { getBranchData } from "../service/companyService";

const HolidayModal = ({ isOpen, onClose, onSubmitAction, editData = null }) => {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    selectedBranches: [],
    image: null,
  });

  const dropdownRef = useRef(null);
  const isEditMode = !!editData;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const loadBranches = async () => {
        try {
          const data = await getBranchData();
          if (data) setBranches(data);
        } catch (error) {
          toast.error(
            "Failed to load branches. Please check your network connection.",
          );
        }
      };
      loadBranches();
      setDropdownOpen(false);

      if (editData) {
        const formattedDate = editData.date
          ? new Date(editData.date).toISOString().split("T")[0]
          : "";
        let initialBranches = [];
        if (editData.branch) {
          initialBranches = Array.isArray(editData.branch)
            ? editData.branch.map(String)
            : [String(editData.branch)];
        } else {
          initialBranches = ["0"];
        }

        setFormData({
          title: editData.Reason || editData.title || "",
          date: formattedDate,
          selectedBranches: initialBranches,
          image: null,
        });
      } else {
        setFormData({
          title: "",
          date: "",
          selectedBranches: ["0"],
          image: null,
        });
      }
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const handleBranchToggle = (branchId) => {
    const stringId = String(branchId).trim();
    setFormData((prev) => {
      if (stringId === "0") {
        return {
          ...prev,
          selectedBranches: prev.selectedBranches.includes("0") ? [] : ["0"],
        };
      }
      const filtered = prev.selectedBranches.filter((id) => id !== "0");
      if (filtered.includes(stringId)) {
        return {
          ...prev,
          selectedBranches: filtered.filter((id) => id !== stringId),
        };
      } else {
        return { ...prev, selectedBranches: [...filtered, stringId] };
      }
    });
  };

  const getDropdownLabel = () => {
    if (formData.selectedBranches.includes("0")) return "All Branches";
    if (formData.selectedBranches.length === 0) return "Select Branches...";
    if (formData.selectedBranches.length === 1) {
      return (
        branches.find((b) => String(b.id) === formData.selectedBranches[0])
          ?.name || "1 Branch Selected"
      );
    }
    return `${formData.selectedBranches.length} Branches Selected`;
  };

  const internalHandleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (formData.selectedBranches.length === 0) {
      toast.error("Please select at least one target branch.");
      return;
    }

    setLoading(true);
    try {
      // Execute proxy event action handed down from context parent wrapper
      await onSubmitAction(formData, isEditMode, editData?.id);
    } catch (error) {
      // Keep state open so inputs are not wiped if error message displays
      console.error(
        "Component handled presentation layer error blocking:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  const isAllSelected = formData.selectedBranches.includes("0");

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={!loading ? onClose : undefined}
      />
      <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-black/5 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-black">
            {isEditMode ? "Edit Holiday" : "Add New Holiday"}
          </h2>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="p-1.5 hover:bg-black/5 rounded-full transition-colors disabled:opacity-30"
          >
            <X size={20} className="text-black/50" />
          </button>
        </div>
        <form onSubmit={internalHandleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest block mb-1.5">
              Holiday Title
            </label>
            <input
              type="text"
              required
              disabled={loading}
              value={formData.title}
              className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors disabled:bg-gray-50"
              placeholder="e.g. Independence Day"
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest block mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                disabled={loading}
                value={formData.date}
                className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div className="relative" ref={dropdownRef}>
              <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest block mb-1.5">
                Branch
              </label>
              <button
                type="button"
                disabled={loading}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm text-left bg-white focus:outline-none flex justify-between items-center select-none"
              >
                <span className="truncate pr-2 text-black/80">
                  {getDropdownLabel()}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-black/40 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/10 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer select-none hover:bg-black/[0.03]">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={() => handleBranchToggle("0")}
                      className="rounded border-black/20 text-black focus:ring-black accent-black"
                    />
                    <span>All Branches</span>
                  </label>
                  <div className="border-t border-black/5 my-1" />
                  {branches.map((b) => {
                    const stringId = String(b.id).trim();
                    const isChecked =
                      isAllSelected ||
                      formData.selectedBranches.includes(stringId);
                    return (
                      <label
                        key={b.id}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs select-none hover:bg-black/[0.03] ${isAllSelected ? "cursor-not-allowed opacity-50 text-black/40" : "cursor-pointer text-black/80"}`}
                      >
                        <input
                          type="checkbox"
                          disabled={isAllSelected}
                          checked={isChecked}
                          onChange={() => handleBranchToggle(stringId)}
                          className="rounded border-black/20 text-black focus:ring-black accent-black"
                        />
                        <span className="truncate">{b.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest block mb-1.5">
              {isEditMode ? "Replace Image (Optional)" : "Holiday Image"}
            </label>
            <div className="relative border-2 border-dashed border-black/5 rounded-xl p-6 text-center hover:bg-black/[0.02] transition-colors cursor-pointer">
              <input
                type="file"
                disabled={loading}
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.files[0] })
                }
              />
              <Upload size={24} className="mx-auto text-black/20 mb-2" />
              <p className="text-xs text-black/40 font-light truncate px-2">
                {formData.image ? formData.image.name : "Choose a file..."}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 py-3 text-sm font-medium border border-black/10 rounded-xl hover:bg-black/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 text-sm font-bold bg-black text-white rounded-xl hover:bg-black/90 disabled:bg-zinc-600"
            >
              {loading
                ? "Processing..."
                : isEditMode
                  ? "Update Changes"
                  : "Save Holiday"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HolidayModal;
