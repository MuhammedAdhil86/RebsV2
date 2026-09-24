import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  Check,
  Loader2,
  Send,
  FileText,
  Layers,
  Plus,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { getActiveUsersLight } from "../service/employeeService";
import {
  fetchLetterPurposes,
  sendLetterService,
} from "../service/mainServices";
import { generateLetterService } from "../service/cloudflareLetterServices";

const LetterActionModal = ({
  isOpen,
  onClose,
  onExecute,
  onSuccess,
  activeTab,
}) => {
  const [staff, setStaff] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purposesLoading, setPurposesLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Form States - purpose strictly stored as a string
  const [purpose, setPurpose] = useState("");
  const [cc, setCc] = useState([]);
  const [bcc, setBcc] = useState([]);
  const [tempCc, setTempCc] = useState("");
  const [tempBcc, setTempBcc] = useState("");

  // Fetch Staff and Letter Purposes
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      setPurposesLoading(true);

      try {
        const [staffRes, rawPurposesData] = await Promise.all([
          getActiveUsersLight(),
          fetchLetterPurposes(),
        ]);

        // 1. Process Staff List
        const staffList = Array.isArray(staffRes)
          ? staffRes
          : staffRes?.data?.data || staffRes?.data || [];
        setStaff(staffList);

        // 2. Process Letter Purposes from /letter/list-purposes
        const parsedPurposes = Array.isArray(rawPurposesData)
          ? rawPurposesData
          : rawPurposesData?.data || [];

        const cleanPurposes = parsedPurposes
          .map((item) =>
            typeof item === "string"
              ? item.trim()
              : item?.purpose || String(item),
          )
          .filter(Boolean);

        setPurposes(cleanPurposes);
      } catch (err) {
        toast.error("Failed to load details");
      } finally {
        setLoading(false);
        setPurposesLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  // Adapt purposes list based on activeTab
  const filteredPurposes = useMemo(() => {
    if (purposes.length === 0) return [];

    if (activeTab === "pdf") {
      // If endpoint provides explicit _pdf items, prioritize them
      const explicitPdf = purposes.filter(
        (p) => p.endsWith("_pdf") || p.includes("pdf"),
      );
      if (explicitPdf.length > 0) return explicitPdf;

      // Otherwise dynamically convert _mail suffixes to _pdf
      return purposes.map((p) => p.replace(/_mail$/, "_pdf"));
    }

    // Default to mail/email items
    return purposes.filter(
      (p) => p.endsWith("_mail") || p.includes("mail") || p.includes("email"),
    );
  }, [purposes, activeTab]);

  // Synchronize default selected purpose on tab or data change
  useEffect(() => {
    if (filteredPurposes.length > 0) {
      if (!purpose || !filteredPurposes.includes(purpose)) {
        setPurpose(filteredPurposes[0]);
      }
    } else {
      setPurpose("");
    }
  }, [filteredPurposes, purpose]);

  // Filter staff by name or uuid
  const filteredStaff = useMemo(() => {
    return staff.filter((emp) => {
      const fullName = (
        emp.name || `${emp.first_name || ""} ${emp.last_name || ""}`
      ).toLowerCase();
      const uuid = String(emp.uuid || "").toLowerCase();
      return (
        fullName.includes(searchTerm.toLowerCase()) ||
        uuid.includes(searchTerm.toLowerCase())
      );
    });
  }, [staff, searchTerm]);

  // Handle purpose selection change
  const handlePurposeChange = (e) => {
    const value = String(e.target.value || "").trim();
    setPurpose(value);
  };

  const handleAddEmail = (type) => {
    const val = type === "cc" ? tempCc.trim() : tempBcc.trim();
    if (val && !(type === "cc" ? cc : bcc).includes(val)) {
      if (type === "cc") {
        setCc([...cc, val]);
        setTempCc("");
      } else {
        setBcc([...bcc, val]);
        setTempBcc("");
      }
    }
  };

  const handleClose = () => {
    if (processing) return;
    setSearchTerm("");
    setSelectedEmp(null);
    setCc([]);
    setBcc([]);
    setPurpose("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!selectedEmp) {
      return toast.error("Please select an employee");
    }

    const finalPurpose = String(purpose || filteredPurposes[0] || "").trim();
    if (!finalPurpose) {
      return toast.error("Please select a valid document purpose");
    }

    const empUuid = selectedEmp.uuid || selectedEmp.user_id || selectedEmp.id;
    const userId = String(empUuid).trim();

    setProcessing(true);
    const toastId = toast.loading(
      activeTab === "pdf" ? "Generating PDF..." : "Sending email...",
    );

    try {
      if (activeTab === "pdf") {
        const res = await generateLetterService(userId, finalPurpose);
        toast.success(res?.message || "Successfully generated letter", {
          id: toastId,
        });

        const fileUrl = res?.data?.file_url || res?.file_url;
        if (fileUrl) {
          window.open(fileUrl, "_blank", "noopener,noreferrer");
        }

        if (onSuccess) onSuccess(res);
      } else {
        const emailPayload = {
          user_id: userId,
          purpose: finalPurpose,
          cc: cc.length > 0 ? cc : [""],
          bcc: bcc.length > 0 ? bcc : [""],
        };

        const res = await sendLetterService(emailPayload);
        toast.success(res?.message || "Email letter sent successfully!", {
          id: toastId,
        });

        if (onSuccess) onSuccess(res);
      }

      if (onExecute) {
        onExecute({
          user_id: userId,
          userId,
          purpose: finalPurpose,
          cc: cc.length > 0 ? cc : [""],
          bcc: bcc.length > 0 ? bcc : [""],
        });
      }

      handleClose();
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to process letter request";
      toast.error(errMsg, { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  const inputBaseClass =
    "w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 outline-none focus:border-black text-[12px] transition-all text-black placeholder:text-gray-400 font-poppins font-normal";

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px]">
      <Toaster position="top-center" />

      <div className="bg-white w-[95%] max-w-[450px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200 border border-gray-100">
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-50 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gray-50 text-black border border-gray-100">
              {activeTab === "pdf" ? (
                <FileText size={20} />
              ) : (
                <Send size={20} />
              )}
            </div>
            <div>
              <h2 className="text-black text-[15px] font-normal uppercase tracking-tight">
                {activeTab === "pdf" ? "Generate PDF" : "Send Email"}
              </h2>
              <p className="text-black/50 text-[9px] tracking-widest uppercase">
                Select employee & letter purpose
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={processing}
            className="p-2 hover:bg-gray-100 rounded-full text-black transition-colors cursor-pointer disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Employee Selection */}
          <div className="space-y-3">
            <label className="block text-black ml-1 text-[10px] font-normal tracking-widest uppercase">
              SELECT EMPLOYEE
            </label>
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
                size={14}
              />
              <input
                type="text"
                placeholder="Search name or ID..."
                className={`${inputBaseClass} pl-10`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={processing}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 max-h-[160px] overflow-y-auto p-2 shadow-inner">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-black" />
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-xs">
                  No employee found
                </div>
              ) : (
                filteredStaff.map((emp) => {
                  const fullName =
                    emp.name ||
                    `${emp.first_name || ""} ${emp.last_name || ""}`;
                  const isSelected =
                    (emp.uuid && selectedEmp?.uuid === emp.uuid) ||
                    (emp.id && selectedEmp?.id === emp.id);

                  return (
                    <div
                      key={emp.uuid || emp.id}
                      onClick={() => !processing && setSelectedEmp(emp)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all mb-1 ${
                        isSelected
                          ? "bg-gray-50 border border-gray-100 shadow-sm"
                          : "hover:bg-gray-50/50"
                      } ${processing ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        {emp.image ? (
                          <img
                            src={emp.image}
                            alt={fullName}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-[10px] font-normal text-white uppercase shrink-0">
                            {fullName.charAt(0)}
                          </div>
                        )}
                        <div className="flex flex-col text-left">
                          <span
                            className={`font-normal text-[12px] leading-tight ${
                              isSelected
                                ? "text-black font-medium"
                                : "text-black/70"
                            }`}
                          >
                            {fullName}
                          </span>
                          {emp.uuid && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              #{emp.uuid}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                          isSelected
                            ? "bg-black border-black text-white"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Dynamic Purpose Dropdown */}
          <div className="space-y-2">
            <label className="block text-black ml-1 text-[10px] font-normal tracking-widest uppercase">
              DOCUMENT PURPOSE
            </label>
            <div className="relative">
              <Layers
                className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
                size={14}
              />
              <select
                className={`${inputBaseClass} pl-10 appearance-none cursor-pointer font-mono`}
                value={purpose}
                onChange={handlePurposeChange}
                disabled={purposesLoading || processing}
              >
                {purposesLoading ? (
                  <option value="">Loading purposes...</option>
                ) : filteredPurposes.length === 0 ? (
                  <option value="">No templates available</option>
                ) : (
                  filteredPurposes.map((p) => (
                    <option key={p} value={p} className="text-black font-mono">
                      {p}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Email Specific Settings */}
          {activeTab === "email" && (
            <div className="space-y-5 pt-4 border-t border-gray-100">
              {["cc", "bcc"].map((field) => (
                <div key={field} className="space-y-2">
                  <label className="block text-black ml-1 text-[10px] font-normal tracking-widest uppercase">
                    {field}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      className={inputBaseClass}
                      placeholder={`Enter ${field} email...`}
                      value={field === "cc" ? tempCc : tempBcc}
                      disabled={processing}
                      onChange={(e) =>
                        field === "cc"
                          ? setTempCc(e.target.value)
                          : setTempBcc(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddEmail(field);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddEmail(field)}
                      disabled={processing}
                      className="p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(field === "cc" ? cc : bcc).map((email, i) => (
                      <span
                        key={i}
                        className="bg-white border border-black text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-2 text-black"
                      >
                        {email}
                        {!processing && (
                          <X
                            size={12}
                            className="cursor-pointer hover:text-red-600"
                            onClick={() => {
                              if (field === "cc")
                                setCc(cc.filter((_, idx) => idx !== i));
                              else setBcc(bcc.filter((_, idx) => idx !== i));
                            }}
                          />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-white border-t border-gray-50 flex items-center gap-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={processing}
            className="flex-1 py-4 text-black font-normal hover:bg-gray-50 rounded-2xl transition-colors uppercase tracking-widest text-[11px] cursor-pointer disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="flex-[2] bg-black text-white py-4 rounded-2xl hover:bg-gray-900 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 font-normal uppercase tracking-widest cursor-pointer disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span className="text-[12px]">Processing...</span>
              </>
            ) : (
              <>
                <span className="text-[12px]">
                  {activeTab === "pdf" ? "Process PDF" : "Send Email"}
                </span>
                {activeTab === "pdf" ? (
                  <FileText size={16} />
                ) : (
                  <Send size={16} />
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LetterActionModal;
