import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { AiOutlinePlus } from "react-icons/ai";
import useLeaveStore from "../store/useleaveStore";
// --- ADDED THIS IMPORT ---
import toast from "react-hot-toast";

// ---------- TOAST HELPERS (backend message + reason in one toast) ----------
const showApiToast = (type, message, detail, id) => {
  const detailText =
    detail === null || detail === undefined || detail === ""
      ? ""
      : typeof detail === "object"
        ? JSON.stringify(detail)
        : String(detail);

  const content = (
    <div>
      <div className="">{message}</div>
      {detailText && (
        <div className="mt-1 text-[12px] font-normal text-gray-600">
          {detailText}
        </div>
      )}
    </div>
  );

  toast[type](content, id ? { id } : undefined);
};

// Works whether the store returns the axios response, the body, or nothing
const getApiBody = (res) =>
  res?.data?.message !== undefined || res?.data?.status_code !== undefined
    ? res.data
    : res;

const LeaveRequestApprove = ({ user, onClose }) => {
  const { updateLeaveStatus } = useLeaveStore();
  const [status, setStatus] = useState(null);
  const [note, setNote] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);

  useEffect(() => {
    try {
      const localStorageUser = JSON.parse(localStorage.getItem("user"));
      setCurrentUser(localStorageUser);
    } catch (err) {
      console.error("Error reading user from localStorage:", err);
    }
  }, []);

  // ... (Keep all your existing date logic/helper functions exactly as they are)
  const leaveDates = user.leave_date || [];
  const firstLeaveDate =
    leaveDates.length > 0
      ? new Date(Math.min(...leaveDates.map((l) => new Date(l.date))))
      : null;
  const endLeaveDate =
    leaveDates.length > 0
      ? new Date(Math.max(...leaveDates.map((l) => new Date(l.date))))
      : firstLeaveDate;
  const totalDays = leaveDates.length;

  const isLeaveDay = (date) => {
    const leave = leaveDates.find((l) =>
      dayjs(l.date).isSame(dayjs(date), "day"),
    );
    return !!leave;
  };

  const isHalfDay = (date) => {
    const leave = leaveDates.find((l) =>
      dayjs(l.date).isSame(dayjs(date), "day"),
    );
    return leave && (leave.half_day === "true" || leave.half_day === true);
  };

  const toggleDateSelection = (date) => {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  // UPDATED HANDLE APPROVE
  const handleApprove = async () => {
    if (selectedDates.length === 0) {
      toast.error("Please select at least one date to approve."); // REPLACED ALERT
      return;
    }

    const loadingToast = toast.loading("Updating status...");
    try {
      const res = await updateLeaveStatus({
        leaveRefNo: user.leave_ref_no,
        status: "Approved",
        remarks: note,
        role: currentUser.user_type === "Manager" ? "manager" : "admin",
        dates: selectedDates,
      });
      const body = getApiBody(res);
      showApiToast(
        "success",
        body?.message || "Leave Approved successfully!",
        null,
        loadingToast,
      );
      if (onClose) onClose(); // CLOSE UI ON SUCCESS
    } catch (err) {
      const errBody = err.response?.data;
      showApiToast(
        "error",
        errBody?.message || err.message || "Error approving leave",
        errBody?.data,
        loadingToast,
      );
    }
  };

  // UPDATED HANDLE REJECT
  const handleReject = async () => {
    if (selectedDates.length === 0) {
      toast.error("Please select at least one date to reject."); // REPLACED ALERT
      return;
    }

    const loadingToast = toast.loading("Updating status...");
    try {
      const res = await updateLeaveStatus({
        leaveRefNo: user.leave_ref_no,
        status: "Rejected",
        remarks: note,
        role: currentUser.user_type === "Manager" ? "manager" : "admin",
        dates: selectedDates,
      });
      const body = getApiBody(res);
      showApiToast(
        "success",
        body?.message || "Leave Rejected successfully!",
        null,
        loadingToast,
      );
      if (onClose) onClose(); // CLOSE UI ON SUCCESS
    } catch (err) {
      const errBody = err.response?.data;
      showApiToast(
        "error",
        errBody?.message || err.message || "Error rejecting leave",
        errBody?.data,
        loadingToast,
      );
    }
  };

  const toggleDrawer = (open) => setDrawerOpen(open);

  // Inline note: submit saves the note and hides the input
  const handleNoteSubmit = () => {
    if (noteDraft.trim() === "") {
      toast.error("Please write a note before submitting.");
      return;
    }
    setNote(noteDraft);
    toggleDrawer(false);
  };
  const isSuperAdmin = currentUser && currentUser.user_type === "Super admin";
  const shouldShowApprovalButtons =
    isSuperAdmin ||
    user.manager_approval_status === "Approved" ||
    currentUser?.user_type === "Manager";

  // ... (Keep existing calendar formatting logic)
  const formatDate = (date) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };
  const calendarDates = firstLeaveDate
    ? (function (date) {
        const d = new Date(date);
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const dates = [];
        let curr = new Date(firstDay);
        while (curr <= lastDay) {
          dates.push(new Date(curr));
          curr.setDate(curr.getDate() + 1);
        }
        return dates;
      })(firstLeaveDate)
    : [];

  return (
    <div className="leave-approve-root max-w-md font-poppins mx-auto mt-4">
      {/* Removes border radius from any rounded wrapper (modal/drawer) that contains this component */}
      <style>{`
        [class*="rounded"]:has(.leave-approve-root) {
          border-radius: 0 !important;
        }
      `}</style>
      <h3 className="pb-4 text-[11px] font-normal text-gray-500 uppercase tracking-[0.2em]">
        Leave Request Approval
      </h3>

      <div className="p-6 bg-white border border-gray-400 rounded-none shadow-sm mb-6">
        {/* User Info Section */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-normal text-gray-600">
            {user.name && user.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-normal text-gray-900 leading-tight">
              {user.name}
            </h3>
            <p className="text-xs font-normal text-gray-400">
              {user.type} | {totalDays} day(s)
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#F8F9FA] border border-gray-400 px-4 py-3 rounded-xl">
            <p className="text-[9px] font-normal text-gray-400 uppercase tracking-tighter mb-1">
              Start Date
            </p>
            <p className="text-sm font-normal text-gray-800 tabular-nums">
              {firstLeaveDate ? formatDate(firstLeaveDate) : "N/A"}
            </p>
          </div>
          <div className="bg-[#F8F9FA] border border-gray-400 px-4 py-3 rounded-xl">
            <p className="text-[9px] font-normal text-gray-400 uppercase tracking-tighter mb-1">
              End Date
            </p>
            <p className="text-sm font-normal text-gray-800 tabular-nums">
              {endLeaveDate ? formatDate(endLeaveDate) : "N/A"}
            </p>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-6 bg-[#F8F9FA] border border-gray-400 px-4 py-3 rounded-xl">
          <p className="text-[9px] font-normal text-gray-400 uppercase tracking-tighter mb-1">
            Reason
          </p>
          <p className="text-sm font-normal text-gray-800">{user.reason}</p>
        </div>

        {shouldShowApprovalButtons && (
          <>
            <div className="mb-4">
              <button
                onClick={() => {
                  setNoteDraft(note);
                  toggleDrawer(!drawerOpen);
                }}
                className="w-full py-2.5 px-4 text-[13px] font-normal bg-[#F8F9FA] border border-gray-400 text-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <AiOutlinePlus className="mr-2" /> Add a Note
              </button>

              {/* Inline note input */}
              {drawerOpen && (
                <div className="mt-3">
                  <textarea
                    className="w-full h-24 px-4 py-3 text-sm font-normal text-gray-800 bg-[#F8F9FA] border border-gray-400 rounded-xl focus:outline-none resize-none"
                    placeholder="Type your note here..."
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                  />
                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => toggleDrawer(false)}
                      className="py-2 px-5 text-[13px] font-normal border border-gray-400 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleNoteSubmit}
                      className="py-2 px-5 text-[13px] font-normal bg-gray-800 text-white rounded-xl hover:bg-black transition-colors"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}

              {/* Saved note preview */}
              {!drawerOpen && note && (
                <div className="mt-3 bg-[#F8F9FA] border border-gray-400 px-4 py-3 rounded-xl">
                  <p className="text-[9px] font-normal text-gray-400 uppercase tracking-tighter mb-1">
                    Note
                  </p>
                  <p className="text-sm font-normal text-gray-800 break-words">
                    {note}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 px-4 text-[13px] font-normal border border-[#FF8A8A] text-[#FF8A8A] rounded-xl hover:bg-red-50 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-2.5 px-4 text-[13px] font-normal bg-[#00C582] text-white rounded-xl hover:opacity-90 transition-all shadow-sm"
              >
                Approve
              </button>
              {/* CANCEL BUTTON: Explicitly calls onClose to close UI */}
              <button
                type="button"
                onClick={() => onClose && onClose()}
                className="flex-1 py-2.5 px-4 text-[13px] font-normal border border-gray-400 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      {/* Calendar */}
      <div className="p-6 bg-white border border-gray-400 rounded-none shadow-sm flex">
        <div className="w-3/4 grid grid-cols-7 gap-1">
          {calendarDates.map((date, idx) => {
            const dateStr = dayjs(date).format("YYYY-MM-DD");
            const isSelected = selectedDates.includes(dateStr);
            return (
              <div
                key={idx}
                onClick={() => toggleDateSelection(date)}
                className={`h-8 w-8 flex items-center justify-center rounded-full cursor-pointer text-[11px] font-normal tabular-nums transition-colors
                  ${isSelected ? "bg-[#00C582] text-white" : isHalfDay(date) ? "bg-orange-500 text-white" : isLeaveDay(date) ? "bg-gray-800 text-white" : "bg-[#F8F9FA] text-gray-700 hover:bg-gray-100"}`}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
        <div className="w-1/4 flex flex-col space-y-4 ml-4">
          <div className="bg-[#F8F9FA] border border-gray-400 px-3 py-2 rounded-xl text-center">
            <p className="text-lg font-normal text-gray-800 tabular-nums">
              {totalDays}
            </p>
            <p className="text-[9px] font-normal text-gray-400 uppercase tracking-tighter">
              Total Days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestApprove;
