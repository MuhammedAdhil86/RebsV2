import React, { useState, useEffect } from "react";
import { X, Upload, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
import { uploadHolidayCSV } from "../service/holidayservices";
import { getBranchData } from "../service/companyService";

const BulkUploadModal = ({ isOpen, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const loadBranches = async () => {
        try {
          const data = await getBranchData();
          if (data) setBranches(data);
        } catch (error) {
          toast.error("Failed to load branches. Please check your connection.");
        }
      };
      loadBranches();
      setSelectedBranches([]);
      setSelectedFile(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBranchCheckboxChange = (branchId) => {
    if (branchId === "0") {
      setSelectedBranches((prev) => (prev.includes("0") ? [] : ["0"]));
      return;
    }
    setSelectedBranches((prev) => {
      const filtered = prev.filter((id) => id !== "0");
      if (filtered.includes(branchId)) {
        return filtered.filter((id) => id !== branchId);
      } else {
        return [...filtered, branchId];
      }
    });
  };

  const handleSelectAll = () => {
    if (
      selectedBranches.length === branches.length &&
      !selectedBranches.includes("0")
    ) {
      setSelectedBranches([]);
    } else {
      setSelectedBranches(branches.map((b) => b.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (selectedBranches.length === 0) {
      toast.error(
        "Please select at least one branch for this holiday dataset.",
      );
      return;
    }

    if (!selectedFile) {
      toast.error("Please provide a valid template CSV file structure.");
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append("file", selectedFile);

    if (selectedBranches.includes("0")) {
      branches.forEach((b) => {
        data.append("branch", String(b.id));
      });
    } else {
      selectedBranches.forEach((branchId) => {
        data.append("branch", String(branchId));
      });
    }

    const action = uploadHolidayCSV(data);

    toast.promise(
      action,
      {
        loading: <b>Uploading holidays database...</b>,
        success: (res) => {
          onRefresh();
          onClose();
          return (
            res?.message || "Bulk holiday database processed successfully!"
          );
        },
        error: (err) => {
          const errorMsg =
            err?.response?.data?.message ||
            err?.message ||
            "Something went wrong processing bulk file.";
          return <b>{errorMsg}</b>;
        },
      },
      {
        style: { minWidth: "250px" },
        success: { duration: 4000, icon: "🎉" },
        error: { duration: 5000 },
      },
    );

    try {
      await action;
    } catch (error) {
      console.error("Bulk Upload Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isAllBranchesSelected = selectedBranches.includes("0");

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={!loading ? onClose : undefined}
      />

      <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-black">
            Bulk Upload Holidays
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

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto flex-1"
        >
          <div>
            <div className="flex justify-between items-end mb-2">
              {/* Wrapped in 'group relative' to safely anchor the hover tooltip box */}
              <div className="flex items-center gap-1.5 relative group">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest block">
                  Target Branches
                </label>

                <div className="text-black/30 hover:text-black transition-colors cursor-help">
                  <HelpCircle size={14} />
                </div>

                {/* Hover Info Tooltip Box */}
                <div className="invisible group-hover:visible absolute left-0 top-6 z-50 w-72 border border-zinc-200 bg-white shadow-xl rounded-xl p-4 text-xs space-y-2 pointer-events-none transition-all duration-150 animate-in fade-in slide-in-from-top-1">
                  <div className="font-bold text-black border-b border-black/5 pb-1">
                    CSV Template Requirements
                  </div>
                  <p className="text-black/70">
                    Your file must be a standard{" "}
                    <strong className="text-black">.csv</strong> using the exact
                    header formatting shown below:
                  </p>
                  <div className="bg-zinc-50 p-2 rounded border border-black/5 font-mono tracking-tight my-1 text-[11px] text-black/80">
                    date, title, image
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-black/60 text-[11px]">
                    <li>
                      <strong className="text-black/80">date:</strong> Required
                      (YYYY-MM-DD)
                    </li>
                    <li>
                      <strong className="text-black/80">title:</strong> Required
                      string text
                    </li>
                    <li>
                      <strong className="text-black/80">image:</strong> Optional
                      column matrix string
                    </li>
                  </ul>
                  <p className="text-[10px] pt-1 text-red-600 font-medium border-t border-black/5">
                    ⚠️ Creation fails automatically if columns or headers are
                    missing.
                  </p>
                </div>
              </div>

              {branches.length > 0 && !isAllBranchesSelected && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSelectAll}
                  className="text-xs text-black/60 hover:text-black hover:underline font-medium focus:outline-none transition-colors"
                >
                  {selectedBranches.length === branches.length
                    ? "Deselect All"
                    : "Select All Branches"}
                </button>
              )}
            </div>

            <div className="border border-black/10 rounded-xl p-3 bg-zinc-50/50 max-h-[220px] overflow-y-auto space-y-2">
              {branches.length === 0 ? (
                <p className="text-xs text-black/30 p-2 text-center font-light">
                  Loading existing branch configurations...
                </p>
              ) : (
                <>
                  <label
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm cursor-pointer transition-all select-none ${
                      isAllBranchesSelected
                        ? "bg-black text-white border-black"
                        : "bg-white text-black/80 border-black/10 hover:bg-black/[0.02]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={loading}
                      checked={isAllBranchesSelected}
                      onChange={() => handleBranchCheckboxChange("0")}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isAllBranchesSelected
                          ? "border-white bg-white text-black"
                          : "border-black/20 bg-white"
                      }`}
                    >
                      {isAllBranchesSelected && (
                        <span className="text-[10px] font-bold leading-none">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-xs tracking-wide truncate">
                      All Branches (General)
                    </span>
                  </label>

                  <div className="border-t border-black/5 my-1" />

                  {branches.map((b) => {
                    const isChecked =
                      isAllBranchesSelected || selectedBranches.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all select-none ${
                          isAllBranchesSelected
                            ? "bg-zinc-100 text-black/40 border-black/5 cursor-not-allowed"
                            : isChecked
                              ? "bg-black text-white border-black cursor-pointer"
                              : "bg-white text-black/80 border-black/10 hover:bg-black/[0.02] cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={loading || isAllBranchesSelected}
                          checked={isChecked}
                          onChange={() => handleBranchCheckboxChange(b.id)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isAllBranchesSelected
                              ? "border-black/10 bg-zinc-200 text-black/30"
                              : isChecked
                                ? "border-white bg-white text-black"
                                : "border-black/20 bg-white"
                          }`}
                        >
                          {isChecked && (
                            <span className="text-[10px] font-bold leading-none">
                              ✓
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-xs tracking-wide truncate">
                          {b.name}
                        </span>
                      </label>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest block mb-1.5">
              Choose CSV File
            </label>
            <div className="relative border-2 border-dashed border-black/5 rounded-xl p-8 text-center hover:bg-black/[0.02] transition-colors cursor-pointer">
              <input
                type="file"
                required
                disabled={loading}
                accept=".csv"
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && !file.name.endsWith(".csv")) {
                    toast.error(
                      "Invalid format file option selected. Please use a .csv layout",
                    );
                    e.target.value = "";
                    return;
                  }
                  setSelectedFile(file);
                }}
              />
              <Upload size={24} className="mx-auto text-black/20 mb-2" />
              <p className="text-xs text-black/70 font-semibold mb-0.5">
                {selectedFile
                  ? selectedFile.name
                  : "Click or drag your document here"}
              </p>
              <p className="text-[11px] text-black/30 font-light">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(2)} KB`
                  : "Supports data standard matrix strings"}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2 bg-white">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 py-3 text-sm font-medium border border-black/10 rounded-xl hover:bg-black/5 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 text-sm font-bold bg-black text-white rounded-xl hover:bg-black/90 disabled:bg-zinc-600 transition-colors"
            >
              {loading ? "Processing File..." : "Process Bulk Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkUploadModal;
