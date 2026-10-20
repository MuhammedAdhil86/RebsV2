import React, { useEffect, useState, useMemo } from "react";
import { X, MailPlus, Plus } from "lucide-react";
import { Icon } from "@iconify/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isValid } from "date-fns";
import toast from "react-hot-toast";

import axiosInstance from "../service/axiosinstance";
import { getStaffDetails } from "../service/employeeService";
import { getShiftPolicyById } from "../service/companyService";
import GlowButton from "../components/helpers/glowbutton";

function AddRegularizeModal({ open, data, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [shiftName, setShiftName] = useState("Not Allocated");
  const [showCcBox, setShowCcBox] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [form, setForm] = useState({
    staffId: "",
    date: null,
    checkIn: "",
    checkOut: "",
    remarks: "",
  });

  const [ccList, setCcList] = useState([""]);

  /* ================= FETCH STAFF ================= */
  useEffect(() => {
    if (!open) return;

    const fetchStaff = async () => {
      try {
        const staff = await getStaffDetails();
        setStaffList(staff || []);
      } catch (err) {
        console.error("Failed to fetch staff", err);
      }
    };

    fetchStaff();
  }, [open]);

  /* ================= PREFILL DATA ================= */
  useEffect(() => {
    if (!open) return;

    if (!data) {
      setForm({
        staffId: "",
        date: null,
        checkIn: "",
        checkOut: "",
        remarks: "",
      });
      setCcList([""]);
      setShowCcBox(false);
      return;
    }

    setForm({
      staffId: data.userId || "",
      date: data.date ? new Date(data.date) : null,
      checkIn:
        data.checkIn && data.checkIn !== "--" ? data.checkIn.slice(0, 5) : "",
      checkOut:
        data.checkOut && data.checkOut !== "--"
          ? data.checkOut.slice(0, 5)
          : "",
      remarks: data.remarks || "",
    });

    if (data.cc && data.cc.length > 0) {
      setCcList(data.cc);
      setShowCcBox(true);
    } else {
      setCcList([""]);
      setShowCcBox(false);
    }
  }, [data, open]);

  /* ================= FETCH SHIFT ================= */
  useEffect(() => {
    if (!open || !form.staffId) {
      setShiftName("Not Allocated");
      return;
    }

    const loadShift = async () => {
      try {
        const shiftInfo = await getShiftPolicyById(form.staffId);
        setShiftName(shiftInfo?.shift_name || "Not Allocated");
      } catch (err) {
        console.error("Error loading shift policy:", err);
        setShiftName("Not Allocated");
      }
    };

    loadShift();
  }, [form.staffId, open]);

  if (!open) return null;

  /* ================= HELPERS ================= */
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const buildDateTimeISO = (date, time) => {
    if (!date || !time) return null;

    const dateString = format(date, "yyyy-MM-dd");
    return `${dateString} ${time}:00`;
  };

  /* ================= DYNAMIC CC ACTIONS ================= */
  const handleCcChange = (index, value) => {
    setCcList((prev) => prev.map((email, i) => (i === index ? value : email)));
  };

  const addCcField = () => {
    setCcList((prev) => [...prev, ""]);
  };

  const removeCcField = (index) => {
    setCcList((prev) =>
      prev.length === 1 ? [""] : prev.filter((_, i) => i !== index),
    );
  };

  /* ================= WORK HOURS CALCULATION ================= */
  const workHours = useMemo(() => {
    if (!form.date || !form.checkIn || !form.checkOut) {
      return "--";
    }

    const [inH, inM] = form.checkIn.split(":").map(Number);
    const [outH, outM] = form.checkOut.split(":").map(Number);

    const start = new Date(form.date);
    start.setHours(inH, inM, 0, 0);

    const end = new Date(form.date);
    end.setHours(outH, outM, 0, 0);

    if (end <= start) return "--";

    const diffMs = end - start;
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);

    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0",
    )}:00`;
  }, [form.date, form.checkIn, form.checkOut]);

  /* ================= SUBMIT LOGIC ================= */
  const handleSubmit = async () => {
    if (!form.staffId || !form.date) {
      toast.error("Please select Staff and Date");
      return;
    }

    if (!form.checkIn && !form.checkOut) {
      toast.error("Please provide at least a Check-In or Check-Out time");
      return;
    }

    const processedCcArray = ccList
      .map((email) => email.trim())
      .filter(Boolean);

    const payload = {
      user_id: String(form.staffId),
      remarks: form.remarks?.trim() || "",
      cc: processedCcArray,
    };

    if (form.checkIn) {
      payload.in = buildDateTimeISO(form.date, form.checkIn);
    }

    if (form.checkOut) {
      payload.out = buildDateTimeISO(form.date, form.checkOut);
    }

    try {
      setLoading(true);

      await axiosInstance.post("/admin/attendance/regularize/request", payload);

      toast.success("Attendance regularized successfully!");
      onSuccess?.();
      onClose(true);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to submit regularization";

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px]">
      <div className="bg-white w-[95%] max-w-[500px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        {/* Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-gray-50 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <Icon
              icon="solar:calendar-outline"
              className="w-5 h-5 text-black"
            />

            <div>
              <h2 className="text-gray-900 text-[16px] font-medium uppercase">
                Attendance Regularization
              </h2>
              <p className="text-gray-400 text-[10px]">
                Record missed check-in or check-out
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCcBox((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 font-medium ${
                showCcBox
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
              }`}
            >
              <MailPlus size={14} />
              <span>{showCcBox ? "Remove CC" : "Add CC"}</span>
            </button>

            <button
              type="button"
              onClick={() => onClose(false)}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-8 grid grid-cols-2 gap-x-4 gap-y-5 overflow-y-auto grow">
          {/* Staff Select */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Staff
            </label>

            <div className="relative">
              <select
                name="staffId"
                value={form.staffId}
                onChange={handleChange}
                className="w-full appearance-none border border-gray-200 bg-white p-3 pr-10 rounded-2xl outline-none focus:border-gray-400 cursor-pointer"
              >
                <option value="">Select Staff</option>

                {staffList.map((s) => (
                  <option key={s.uuid} value={s.uuid}>
                    {`${s.first_name || ""} ${s.last_name || ""}`.trim()}
                  </option>
                ))}
              </select>

              {/* Standard centered dropdown arrow */}
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                <Icon icon="lucide:chevron-down" className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Date Picker */}
          <div className="relative">
            <label className="block mb-1 font-medium text-gray-700">Date</label>

            <div
              onClick={() => setShowDatePicker((prev) => !prev)}
              className="w-full border border-gray-200 p-3 rounded-2xl cursor-pointer flex justify-between items-center"
            >
              <span>
                {form.date && isValid(form.date)
                  ? format(form.date, "dd/MM/yyyy")
                  : "Select Date"}
              </span>

              <Icon
                icon="solar:calendar-outline"
                className="w-4 h-4 text-black"
              />
            </div>

            {showDatePicker && (
              <div className="absolute z-50 top-full mt-1">
                <DatePicker
                  selected={form.date}
                  onChange={(date) => {
                    setForm((prev) => ({ ...prev, date }));
                    setShowDatePicker(false);
                  }}
                  inline
                />
              </div>
            )}
          </div>

          {/* Check In */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Check In
            </label>

            <input
              type="time"
              value={form.checkIn}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  checkIn: e.target.value,
                }))
              }
              className="w-full border border-gray-200 p-3 rounded-2xl outline-none focus:border-gray-400"
            />
          </div>

          {/* Check Out */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Check Out
            </label>

            <input
              type="time"
              value={form.checkOut}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  checkOut: e.target.value,
                }))
              }
              className="w-full border border-gray-200 p-3 rounded-2xl outline-none focus:border-gray-400"
            />
          </div>

          {/* Shift Read Only */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Shift
            </label>

            <input
              readOnly
              value={shiftName}
              className="w-full border border-gray-200 p-3 rounded-2xl bg-gray-50 text-gray-600 outline-none"
            />
          </div>

          {/* Work Hours Read Only */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Work Hours
            </label>

            <input
              readOnly
              value={workHours}
              className="w-full border border-gray-200 p-3 rounded-2xl bg-gray-50 text-gray-600 font-medium outline-none"
            />
          </div>

          {/* Dynamic CC Fields */}
          {showCcBox && (
            <div className="col-span-2 space-y-2">
              <label className="block mb-1 font-medium text-gray-700">
                CC Recipients
              </label>

              {ccList.map((emailValue, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => handleCcChange(index, e.target.value)}
                    placeholder="recipient@company.com"
                    className="flex-1 min-w-0 border border-gray-200 p-3 rounded-2xl outline-none focus:border-gray-400"
                  />

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={addCcField}
                      className="p-2.5 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200"
                      title="Add recipient box"
                      aria-label="Add recipient"
                    >
                      <Plus size={16} />
                    </button>

                    {ccList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCcField(index)}
                        aria-label="Delete recipient"
                        title="Delete"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Icon
                          icon="solar:trash-bin-trash-outline"
                          className="w-4 h-4"
                        />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Remarks */}
          <div className="col-span-2">
            <label className="block mb-1 font-medium text-gray-700">
              Remarks
            </label>

            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              rows={3}
              placeholder="Reason for regularization..."
              className="w-full border border-gray-200 p-3 rounded-2xl outline-none focus:border-gray-400 resize-y"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 px-8 py-4 border-t border-gray-50 shrink-0">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>

          <GlowButton disabled={loading} onClick={handleSubmit}>
            {loading ? "Submitting..." : "Apply"}
          </GlowButton>
        </div>
      </div>
    </div>
  );
}

export default AddRegularizeModal;
