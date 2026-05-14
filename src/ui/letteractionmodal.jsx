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
import { getStaffDetails } from "../service/employeeService";

const LetterActionModal = ({ isOpen, onClose, onExecute, activeTab }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Form States
  const [category, setCategory] = useState("1");
  const [cc, setCc] = useState([]);
  const [bcc, setBcc] = useState([]);
  const [tempCc, setTempCc] = useState("");
  const [tempBcc, setTempBcc] = useState("");

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await getStaffDetails();
          const staffList =
            res?.data?.data || res?.data || res?.responsedata || res || [];
          setStaff(Array.isArray(staffList) ? staffList : []);
        } catch (err) {
          toast.error("Failed to load staff details");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const filteredStaff = useMemo(() => {
    return staff.filter((emp) => {
      const fullName = (
        emp.name || `${emp.first_name || ""} ${emp.last_name || ""}`
      ).toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [staff, searchTerm]);

  const handleAddEmail = (type) => {
    const val = type === "cc" ? tempCc : tempBcc;
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
    setSearchTerm("");
    setSelectedEmp(null);
    setCc([]);
    setBcc([]);
    onClose();
  };

  const handleConfirm = () => {
    if (!selectedEmp) return toast.error("Please select an employee");
    const empId = selectedEmp.uuid || selectedEmp.id || selectedEmp.user_id;
    onExecute({ userId: empId, letter_category: category, cc, bcc });
  };

  if (!isOpen) return null;

  // Shared class for inputs and placeholders
  const inputBaseClass =
    "w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 outline-none focus:border-black text-[12px] transition-all text-black placeholder:text-black font-poppins font-normal";

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
                Select employee & category
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full text-black transition-colors"
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
                placeholder="Search name..."
                className={`${inputBaseClass} pl-10`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 max-h-[160px] overflow-y-auto p-2 shadow-inner">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-black" />
                </div>
              ) : (
                filteredStaff.map((emp) => {
                  const fullName =
                    emp.name ||
                    `${emp.first_name || ""} ${emp.last_name || ""}`;
                  const isSelected =
                    selectedEmp?.id === emp.id ||
                    selectedEmp?.uuid === emp.uuid;
                  return (
                    <div
                      key={emp.uuid || emp.id}
                      onClick={() => setSelectedEmp(emp)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all mb-1 ${isSelected ? "bg-gray-50 border border-gray-100 shadow-sm" : "hover:bg-gray-50/50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-[10px] font-normal text-white uppercase">
                          {fullName.charAt(0)}
                        </div>
                        <span
                          className={`font-normal text-[12px] ${isSelected ? "text-black" : "text-black/70"}`}
                        >
                          {fullName}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? "bg-black border-black text-white" : "bg-white border-gray-200"}`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="block text-black ml-1 text-[10px] font-normal tracking-widest uppercase">
              LETTER CATEGORY
            </label>
            <div className="relative">
              <Layers
                className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
                size={14}
              />
              <select
                className={`${inputBaseClass} pl-10 appearance-none cursor-pointer`}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="1" className="text-black">
                  Offer Letter
                </option>
                <option value="2" className="text-black">
                  Appointment Letter
                </option>
              </select>
            </div>
          </div>

          {/* Email Settings */}
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
                      onChange={(e) =>
                        field === "cc"
                          ? setTempCc(e.target.value)
                          : setTempBcc(e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => handleAddEmail(field)}
                      className="p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
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
                        <X
                          size={12}
                          className="cursor-pointer hover:text-red-600"
                          onClick={() => {
                            if (field === "cc")
                              setCc(cc.filter((_, idx) => idx !== i));
                            else setBcc(bcc.filter((_, idx) => idx !== i));
                          }}
                        />
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
            onClick={handleClose}
            className="flex-1 py-4 text-black font-normal hover:bg-gray-50 rounded-2xl transition-colors uppercase tracking-widest text-[11px]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-[2] bg-black text-white py-4 rounded-2xl hover:bg-gray-900 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 font-normal uppercase tracking-widest"
          >
            <span className="text-[12px]">
              {activeTab === "pdf" ? "Process PDF" : "Send Email"}
            </span>
            {activeTab === "pdf" ? <FileText size={16} /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LetterActionModal;
