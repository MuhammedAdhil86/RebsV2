import React, { useState, useEffect, useMemo } from "react";
import { X, Search, Loader2, Plus } from "lucide-react";

import GlowButton from "../components/helpers/glowbutton";
import { startProgressToast } from "../components/helpers/progressbar"; // keep filename casing
import {
  showApiToast,
  showApiError,
  getApiBody,
  formatDetail,
} from "../utils/apiToast";
import { getActiveUsersLight } from "../service/employeeService";
import {
  fetchLetterPurposes,
  sendLetterService,
} from "../service/mainServices";
import { generateLetterService } from "../service/cloudflareLetterServices";

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const LetterActionModal = ({ isOpen, onClose, onSuccess, activeTab }) => {
  const [staff, setStaff] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purposesLoading, setPurposesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmp, setSelectedEmp] = useState(null);

  const [purpose, setPurpose] = useState("");
  const [cc, setCc] = useState([]);
  const [bcc, setBcc] = useState([]);
  const [tempCc, setTempCc] = useState("");
  const [tempBcc, setTempBcc] = useState("");

  // Fetch staff and letter purposes when the modal opens
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

        const staffList = Array.isArray(staffRes)
          ? staffRes
          : staffRes?.data?.data || staffRes?.data || [];
        setStaff(staffList);

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
        console.error("Failed to load staff/purposes:", err);
        showApiError(err, "Failed to load details");
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
      const explicitPdf = purposes.filter(
        (p) => p.endsWith("_pdf") || p.includes("pdf"),
      );
      if (explicitPdf.length > 0) return explicitPdf;
      return purposes.map((p) => p.replace(/_mail$/, "_pdf"));
    }

    return purposes.filter(
      (p) => p.endsWith("_mail") || p.includes("mail") || p.includes("email"),
    );
  }, [purposes, activeTab]);

  // Keep a valid default purpose selected
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
    const q = searchTerm.toLowerCase();
    return staff.filter((emp) => {
      const fullName = (
        emp.name || `${emp.first_name || ""} ${emp.last_name || ""}`
      ).toLowerCase();
      const uuid = String(emp.uuid || "").toLowerCase();
      return fullName.includes(q) || uuid.includes(q);
    });
  }, [staff, searchTerm]);

  const handleAddEmail = (type) => {
    const val = type === "cc" ? tempCc.trim() : tempBcc.trim();
    if (!val) return;
    if (!isValidEmail(val)) {
      return showApiToast("error", "Enter a valid email address");
    }
    if (!(type === "cc" ? cc : bcc).includes(val)) {
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
    setSearchTerm("");
    setSelectedEmp(null);
    setCc([]);
    setBcc([]);
    setTempCc("");
    setTempBcc("");
    setPurpose("");
    onClose();
  };

  const handleConfirm = (e) => {
    if (e?.preventDefault) e.preventDefault();

    if (!selectedEmp) {
      return showApiToast("error", "Please select an employee");
    }

    const finalPurpose = String(purpose || filteredPurposes[0] || "").trim();
    if (!finalPurpose) {
      return showApiToast("error", "Please select a valid document purpose");
    }

    const userId = String(
      selectedEmp.uuid || selectedEmp.user_id || selectedEmp.id,
    ).trim();

    // Include typed-but-not-added emails so they are not lost
    const pendingCc = tempCc.trim();
    const pendingBcc = tempBcc.trim();

    if (pendingCc && !isValidEmail(pendingCc)) {
      return showApiToast("error", "Enter a valid CC email address");
    }
    if (pendingBcc && !isValidEmail(pendingBcc)) {
      return showApiToast("error", "Enter a valid BCC email address");
    }

    const finalCc =
      pendingCc && !cc.includes(pendingCc) ? [...cc, pendingCc] : cc;
    const finalBcc =
      pendingBcc && !bcc.includes(pendingBcc) ? [...bcc, pendingBcc] : bcc;

    // Body shape: { user_id, purpose, cc: [...emails, ""], bcc: [...emails, ""] }
    const payload = {
      user_id: userId,
      purpose: finalPurpose,
      cc: [...finalCc, ""],
      bcc: [...finalBcc, ""],
    };

    const isPdf = activeTab === "pdf";

    // Progress toast (top-right) keeps running after the modal closes
    const task = startProgressToast({
      label: isPdf ? "Generating PDF" : "Sending email",
      storageKey: isPdf ? "letter_pdf_duration_ms" : "letter_email_duration_ms",
      defaultMs: isPdf ? 6000 : 4000,
    });

    handleClose();

    (async () => {
      try {
        if (isPdf) {
          const res = await generateLetterService(userId, finalPurpose);
          task.finish(
            getApiBody(res)?.message || "Successfully generated letter",
          );

          const fileUrl = res?.data?.file_url || res?.file_url;
          if (fileUrl) {
            const win = window.open(fileUrl, "_blank", "noopener,noreferrer");
            if (!win) {
              showApiToast(
                "info",
                "Letter generated. Allow popups or open it from Generated List.",
              );
            }
          }
          onSuccess?.(res, { userId, purpose: finalPurpose });
        } else {
          const res = await sendLetterService(payload);
          task.finish(
            getApiBody(res)?.message || "Email letter sent successfully!",
          );
          onSuccess?.(res, { userId, purpose: finalPurpose });
        }
      } catch (error) {
        console.error("Letter request failed:", error?.response?.data || error);
        // Same title + data split as the toast helper
        const errBody = error?.response?.data;
        const message =
          errBody?.message ||
          errBody?.error ||
          error?.message ||
          "Failed to process letter request";
        const detail = formatDetail(
          errBody?.data ?? (errBody?.message ? errBody?.error : undefined),
        );
        task.fail(detail ? `${message} — ${detail}` : message);
      }
    })();
  };

  if (!isOpen) return null;

  const emailFields = [
    {
      key: "cc",
      label: "CC",
      temp: tempCc,
      setTemp: setTempCc,
      list: cc,
      setList: setCc,
    },
    {
      key: "bcc",
      label: "BCC",
      temp: tempBcc,
      setTemp: setTempBcc,
      list: bcc,
      setList: setBcc,
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px]">
      <div className="bg-white w-[95%] max-w-[480px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        {/* Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-gray-50 bg-white">
          <div>
            <h2 className="text-gray-900 text-[16px] font-medium uppercase">
              {activeTab === "pdf" ? "Generate PDF" : "Send Email"}
            </h2>
            <p className="text-gray-400 text-[10px]">
              Select employee and letter purpose
            </p>
          </div>
          <button type="button" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-8 overflow-y-auto">
          <div className="space-y-5 min-w-0">
            {/* Employee */}
            <div className="space-y-2">
              <label className="block mb-1 font-medium text-gray-700">
                Employee
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 border p-2.5 rounded-2xl"
                />
              </div>

              <div className="max-h-[180px] overflow-y-auto border rounded-2xl p-2 space-y-1">
                {loading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="animate-spin text-gray-400" size={18} />
                  </div>
                ) : filteredStaff.length === 0 ? (
                  <div className="p-3 text-center text-gray-400">
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
                      <label
                        key={emp.uuid || emp.id}
                        className={`flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-gray-50" : ""
                        }`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-gray-800 truncate">
                            {fullName}
                          </span>
                          {emp.uuid && (
                            <span className="text-gray-400 text-[10px] truncate">
                              {emp.uuid}
                              {emp.designation_name
                                ? ` · ${emp.designation_name}`
                                : ""}
                            </span>
                          )}
                        </div>
                        <input
                          type="radio"
                          name="letter-employee"
                          checked={!!isSelected}
                          onChange={() => setSelectedEmp(emp)}
                          className="accent-black w-4 h-4"
                        />
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Document Purpose
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(String(e.target.value).trim())}
                disabled={purposesLoading}
                className="w-full border p-3 rounded-2xl disabled:bg-gray-50 disabled:text-gray-400"
              >
                {purposesLoading ? (
                  <option value="">Loading purposes...</option>
                ) : filteredPurposes.length === 0 ? (
                  <option value="">No templates available</option>
                ) : (
                  filteredPurposes.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* CC / BCC (email only) */}
            {activeTab === "email" &&
              emailFields.map((f) => (
                <div key={f.key} className="space-y-2">
                  <label className="block mb-1 font-medium text-gray-700">
                    {f.label}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder={`Enter ${f.label} email...`}
                      value={f.temp}
                      onChange={(e) => f.setTemp(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddEmail(f.key);
                        }
                      }}
                      className="w-full border p-2.5 rounded-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddEmail(f.key)}
                      className="px-3 bg-black text-white rounded-2xl hover:bg-gray-800 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {f.list.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {f.list.map((email, i) => (
                        <span
                          key={email}
                          className="border text-[10px] px-2.5 py-1 rounded-full flex items-center gap-2 text-gray-700"
                        >
                          {email}
                          <X
                            size={12}
                            className="cursor-pointer text-gray-400 hover:text-red-500"
                            onClick={() =>
                              f.setList(f.list.filter((_, idx) => idx !== i))
                            }
                          />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>

              <GlowButton onClick={handleConfirm}>
                {activeTab === "pdf" ? "Generate PDF" : "Send Email"}
              </GlowButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LetterActionModal;
