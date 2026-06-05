import React, { useEffect, useRef, useState, useMemo } from "react";
import { X, Calendar, Clock, MailPlus, Plus, Trash2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isValid } from "date-fns";
import toast from "react-hot-toast";

import axiosInstance from "../service/axiosinstance";
import { getStaffDetails } from "../service/employeeService";
import { getShiftPolicyById } from "../service/companyService";

function AddRegularizeModal({ open, data, onClose, onSuccess }) {
  if (!open) return null;

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

  // Dynamic array state starting with exactly one single discrete column box
  const [ccList, setCcList] = useState([""]);

  /* ================= FETCH STAFF ================= */
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const staff = await getStaffDetails();
        setStaffList(staff || []);
      } catch (err) {
        console.error("Failed to fetch staff", err);
      }
    };
    fetchStaff();
  }, []);

  /* ================= PREFILL DATA ================= */
  useEffect(() => {
    if (!data) return;

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
    }
  }, [data]);

  /* ================= FETCH SHIFT ================= */
  useEffect(() => {
    if (!form.staffId) {
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
  }, [form.staffId]);

  /* ================= HELPERS ================= */
  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  // Formats to exact local text layout string: "YYYY-MM-DD HH:mm:ss"
  const buildDateTimeISO = (date, time) => {
    if (!date || !time) return null;
    const dateString = format(date, "yyyy-MM-dd");
    return `${dateString} ${time}:00`;
  };

  /* ================= DYNAMIC CC ACTIONS ================= */
  const handleCcChange = (index, value) => {
    const updatedCc = [...ccList];
    updatedCc[index] = value;
    setCcList(updatedCc);
  };

  const addCcField = () => {
    setCcList([...ccList, ""]);
  };

  const removeCcField = (index) => {
    if (ccList.length === 1) {
      setCcList([""]);
    } else {
      setCcList(ccList.filter((_, i) => i !== index));
    }
  };

  /* ================= WORK HOURS CALCULATION ================= */
  const workHours = useMemo(() => {
    if (!form.date || !form.checkIn || !form.checkOut) return "--";

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

    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
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

    // Clean structural array mapping
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-sm text-gray-800">
              Attendance Regularization
            </h3>

            <button
              type="button"
              onClick={() => setShowCcBox(!showCcBox)}
              className={`p-1.5 rounded-md border transition-colors flex items-center gap-1.5 text-xs font-medium ${
                showCcBox
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
              }`}
            >
              <MailPlus size={14} />
              <span>{showCcBox ? "Remove CC" : "Add CC"}</span>
            </button>
          </div>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 grid grid-cols-2 gap-6 text-sm overflow-y-auto grow">
          {/* Staff Select */}
          <div>
            <label className="text-gray-500 text-xs font-medium">Staff</label>
            <select
              name="staffId"
              value={form.staffId}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 border rounded-lg bg-gray-50"
            >
              <option value="">Select Staff</option>
              {staffList.map((s) => (
                <option key={s.uuid} value={s.uuid}>
                  {`${s.first_name || ""} ${s.last_name || ""}`.trim()}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="relative">
            <label className="text-gray-500 text-xs font-medium">Date</label>
            <div
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full mt-1 px-4 py-2 border rounded-lg bg-gray-50 cursor-pointer flex justify-between items-center"
            >
              <span>
                {form.date && isValid(form.date)
                  ? format(form.date, "dd/MM/yyyy")
                  : "Select Date"}
              </span>
              <Calendar size={14} className="text-gray-400" />
            </div>
            {showDatePicker && (
              <div className="absolute z-50 top-full mt-1">
                <DatePicker
                  selected={form.date}
                  onChange={(date) => {
                    setForm((p) => ({ ...p, date }));
                    setShowDatePicker(false);
                  }}
                  inline
                />
              </div>
            )}
          </div>

          {/* Check In */}
          <div>
            <label className="text-gray-500 text-xs font-medium">
              Check In
            </label>
            <input
              type="time"
              value={form.checkIn}
              onChange={(e) =>
                setForm((p) => ({ ...p, checkIn: e.target.value }))
              }
              className="w-full mt-1 px-4 py-2 border rounded-lg bg-gray-50"
            />
          </div>

          {/* Check Out */}
          <div>
            <label className="text-gray-500 text-xs font-medium">
              Check Out
            </label>
            <input
              type="time"
              value={form.checkOut}
              onChange={(e) =>
                setForm((p) => ({ ...p, checkOut: e.target.value }))
              }
              className="w-full mt-1 px-4 py-2 border rounded-lg bg-gray-50"
            />
          </div>

          {/* Shift (Read Only) */}
          <div>
            <label className="text-gray-500 text-xs font-medium">Shift</label>
            <input
              readOnly
              value={shiftName}
              className="w-full mt-1 px-4 py-2 border rounded-lg bg-gray-100 text-gray-600"
            />
          </div>

          {/* Work Hours (Read Only) */}
          <div>
            <label className="text-gray-500 text-xs font-medium">
              Work Hours
            </label>
            <input
              readOnly
              value={workHours}
              className="w-full mt-1 px-4 py-2 border rounded-lg bg-gray-100 font-bold text-gray-700"
            />
          </div>

          {/* Dynamic CC Field Segment */}
          {showCcBox && (
            <div className="col-span-2 space-y-2">
              <label className="text-gray-500 text-xs font-medium block">
                CC Recipients
              </label>

              {ccList.map((emailValue, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => handleCcChange(index, e.target.value)}
                    placeholder="recipient@company.com"
                    className="flex-1 px-4 py-2 border rounded-lg bg-gray-50"
                  />

                  {/* Dynamic Action Button Group */}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={addCcField}
                      className="p-2.5 bg-gray-100 text-gray-700 hover:bg-black hover:text-white rounded-lg transition-colors border"
                      title="Add recipient box"
                    >
                      <Plus size={16} />
                    </button>

                    {ccList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCcField(index)}
                        className="p-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors border border-red-100"
                        title="Delete box"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Remarks */}
          <div className="col-span-2">
            <label className="text-gray-500 text-xs font-medium">Remarks</label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              rows={3}
              placeholder="Reason for regularization..."
              className="w-full mt-1 px-4 py-2 border rounded-lg bg-gray-50"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0">
          <button
            onClick={() => onClose(false)}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={handleSubmit}
            className={`px-6 py-2 bg-black text-white rounded-lg transition-opacity ${loading ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
          >
            {loading ? "Submitting..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddRegularizeModal;
