import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { AiOutlinePlus } from "react-icons/ai";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import useLeaveStore from "../store/useleaveStore";

// ---------- TOAST HELPERS (backend message + reason in one toast) ----------
// If an id is passed (from toast.loading), that loading toast is updated in
// place. Otherwise a new toast of the given type is shown.
const showApiToast = (type, message, detail, id) => {
  const detailText =
    detail === null || detail === undefined || detail === ""
      ? ""
      : typeof detail === "object"
        ? JSON.stringify(detail)
        : String(detail);

  const content = (
    <div>
      <div>{message}</div>
      {detailText && (
        <div className="mt-1 text-[12px] font-normal text-gray-600">
          {detailText}
        </div>
      )}
    </div>
  );

  if (id !== undefined && id !== null) {
    // turn the loading toast into a success / error toast
    toast.update(id, {
      render: content,
      type,
      isLoading: false,
      autoClose: 5000,
      closeOnClick: true,
      closeButton: true,
      draggable: true,
    });
  } else {
    toast[type](content, { autoClose: 5000 });
  }
};

// Works whether the store returns the axios response, the body, or nothing
const getApiBody = (res) =>
  res?.data?.message !== undefined || res?.data?.status_code !== undefined
    ? res.data
    : res;

// Badge colours for approval / leave status (lowercase input)
const getApprovalBadge = (status) => {
  if (status.includes("approved")) return "bg-green-100 text-green-600";
  if (status.includes("pending") || !status)
    return "bg-orange-100 text-orange-600";
  if (status.includes("rejected")) return "bg-red-100 text-red-600";
  return "bg-gray-100 text-gray-600";
};

const LeaveRequestApprove = ({ user, onClose }) => {
  const { updateLeaveStatus } = useLeaveStore();
  const [note, setNote] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const localStorageUser = JSON.parse(localStorage.getItem("user"));
      setCurrentUser(localStorageUser);
    } catch (err) {
      console.error("Error reading user from localStorage:", err);
    }
  }, []);

  const handleClose = () => {
    if (!submitting && onClose) onClose();
  };

  // Close with the Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !submitting && onClose) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting]);

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
    setSelectedDates((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr],
    );
  };

  // Shared approve / reject flow
  const submitStatus = async (nextStatus) => {
    if (submitting) return;
    const verb = nextStatus === "Approved" ? "approve" : "reject";

    if (selectedDates.length === 0) {
      toast.error(`Please select at least one date to ${verb}.`);
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("Updating status...");
    try {
      const res = await updateLeaveStatus({
        leaveRefNo: user.leave_ref_no,
        status: nextStatus,
        remarks: note,
        role: currentUser?.user_type === "Manager" ? "manager" : "admin",
        dates: selectedDates,
      });
      const body = getApiBody(res);
      showApiToast(
        "success",
        body?.message || `Leave ${nextStatus} successfully!`,
        null,
        loadingToast,
      );
      setSubmitting(false);
      if (onClose) onClose(); // close modal on success
    } catch (err) {
      const errBody = err.response?.data;
      showApiToast(
        "error",
        errBody?.message || err.message || `Error trying to ${verb} leave`,
        errBody?.data,
        loadingToast,
      );
      setSubmitting(false);
    }
  };

  const handleApprove = () => submitStatus("Approved");
  const handleReject = () => submitStatus("Rejected");

  // Inline note: submit saves the note and hides the input
  const handleNoteSubmit = () => {
    if (noteDraft.trim() === "") {
      toast.error("Please write a note before submitting.");
      return;
    }
    setNote(noteDraft);
    setNoteOpen(false);
  };

  // Approved -> only Reject; Rejected -> only Approve; anything else (pending) -> both
  const leaveStatus = String(user.status ?? "").toLowerCase();
  const showApproveButton = leaveStatus !== "approved";
  const showRejectButton = leaveStatus !== "rejected";

  const isSuperAdmin = currentUser && currentUser.user_type === "Super admin";
  const managerApproval = String(user.manager_approval_status ?? "")
    .trim()
    .toLowerCase();
  // Buttons show when the manager has approved OR the request is still pending
  // with the manager, plus the super admin / manager roles as before.
  const shouldShowApprovalButtons =
    isSuperAdmin ||
    managerApproval === "approved" ||
    managerApproval === "pending" ||
    currentUser?.user_type === "Manager";

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

  const labelCls =
    "text-[9px] font-normal text-gray-400 uppercase tracking-tighter mb-1";
  const boxCls = "bg-[#F8F9FA] border border-gray-200 px-4 py-3 rounded-2xl";

  const spinner = (
    <span className="inline-block w-3.5 h-3.5 mr-2 align-middle border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm font-poppins text-[12px]"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-[640px] max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-8 py-4 flex items-center justify-between border-b border-gray-50 bg-white">
          <div>
            <h2 className="text-gray-900 text-[16px] font-medium uppercase">
              Leave Request Approval
            </h2>
            <p className="text-gray-400 text-[10px]">
              Review the leave dates and update the request status
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            disabled={submitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="px-8 py-5 space-y-4 overflow-y-auto">
          {/* User Info */}
          <div className="flex items-center gap-3">
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
          <div className="grid grid-cols-2 gap-3">
            <div className={boxCls}>
              <p className={labelCls}>Start Date</p>
              <p className="text-sm font-normal text-gray-800 tabular-nums">
                {firstLeaveDate ? formatDate(firstLeaveDate) : "N/A"}
              </p>
            </div>
            <div className={boxCls}>
              <p className={labelCls}>End Date</p>
              <p className="text-sm font-normal text-gray-800 tabular-nums">
                {endLeaveDate ? formatDate(endLeaveDate) : "N/A"}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className={boxCls}>
            <p className={labelCls}>Reason</p>
            <p className="text-sm font-normal text-gray-800 break-words">
              {user.reason}
            </p>
          </div>

          {/* Manager approval info */}
          {managerApproval && (
            <>
              {managerApproval === "pending" && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl">
                  <span className="mt-1 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium">
                      Pending for manager approval
                    </p>
                    <p className="text-[11px] text-amber-700">
                      The manager has not yet responded to this leave request.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className={boxCls}>
                  <p className={labelCls}>Manager Approval</p>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-normal inline-block capitalize ${getApprovalBadge(managerApproval)}`}
                  >
                    {managerApproval}
                  </span>
                </div>
                <div className={boxCls}>
                  <p className={labelCls}>Leave Status</p>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-normal inline-block capitalize ${getApprovalBadge(leaveStatus)}`}
                  >
                    {leaveStatus || "pending"}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Calendar */}
          <div className="border border-gray-200 rounded-2xl p-4 flex">
            <div className="w-3/4">
              {firstLeaveDate && (
                <p className="text-[11px] font-medium text-gray-600 mb-2">
                  {dayjs(firstLeaveDate).format("MMMM YYYY")}
                </p>
              )}
              <div className="grid grid-cols-7 gap-1">
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
            </div>
            <div className="w-1/4 flex flex-col space-y-4 ml-4">
              <div className="bg-[#F8F9FA] border border-gray-200 px-3 py-2 rounded-2xl text-center">
                <p className="text-lg font-normal text-gray-800 tabular-nums">
                  {totalDays}
                </p>
                <p className={labelCls}>Total Days</p>
              </div>
            </div>
          </div>

          {/* Note */}
          {shouldShowApprovalButtons && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setNoteDraft(note);
                  setNoteOpen((o) => !o);
                }}
                className="w-full py-2.5 px-4 text-[13px] font-normal bg-[#F8F9FA] border border-gray-200 text-gray-800 rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <AiOutlinePlus className="mr-2" /> Add a Note
              </button>

              {noteOpen && (
                <div className="mt-3">
                  <textarea
                    className="w-full h-24 px-4 py-3 text-sm font-normal text-gray-800 bg-[#F8F9FA] border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-900 resize-none"
                    placeholder="Type your note here..."
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                  />
                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setNoteOpen(false)}
                      className="py-2 px-5 text-[13px] font-normal border border-gray-200 text-gray-500 rounded-2xl hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleNoteSubmit}
                      className="py-2 px-5 text-[13px] font-normal bg-gray-800 text-white rounded-2xl hover:bg-black transition-colors"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}

              {!noteOpen && note && (
                <div className={`mt-3 ${boxCls}`}>
                  <p className={labelCls}>Note</p>
                  <p className="text-sm font-normal text-gray-800 break-words">
                    {note}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-8 py-4 border-t border-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-2xl disabled:opacity-60 transition-colors"
          >
            {shouldShowApprovalButtons ? "Cancel" : "Close"}
          </button>

          {shouldShowApprovalButtons && showRejectButton && (
            <button
              type="button"
              onClick={handleReject}
              disabled={submitting}
              className="px-6 py-2.5 border border-[#FF8A8A] text-[#FF8A8A] hover:bg-red-50 rounded-2xl disabled:opacity-60 transition-colors"
            >
              Reject
            </button>
          )}

          {shouldShowApprovalButtons && showApproveButton && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={submitting}
              className="px-6 py-2.5 bg-[#00C582] text-white hover:opacity-90 rounded-2xl shadow-sm disabled:opacity-60 transition-all"
            >
              {submitting && spinner}
              Approve
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestApprove;
